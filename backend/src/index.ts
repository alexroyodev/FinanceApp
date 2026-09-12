import express, { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import cors from 'cors';
import 'dotenv/config';
import { ClerkExpressRequireAuth, RequireAuthProp, clerkClient } from '@clerk/clerk-sdk-node';
import { z } from 'zod';

// 👇 ESQUEMAS DE VALIDACIÓN ZOD (La Fortaleza)
const transactionSchema = z.object({
  description: z.string().trim().min(2, "La descripción es muy corta").max(50, "La descripción es muy larga"),
  amount: z.number().positive("La cantidad debe ser mayor que cero"), 
  type: z.enum(['INCOME', 'EXPENSE', 'CONTRIBUTION', 'TRANSFER_OUT']),
  accountId: z.number().int().positive(),
  categoryId: z.number().int().positive().optional(),
  assetId: z.number().int().positive().optional(),
  originAccountId: z.number().int().positive().optional()
});

const accountSchema = z.object({
  name: z.string().trim().min(2, "El nombre debe tener al menos 2 letras").max(30, "El nombre es muy largo"),
  balance: z.number().min(0, "El saldo inicial no puede ser negativo"),
  userId: z.number().int().positive("ID de usuario inválido"),
});

const categorySchema = z.object({
  name: z.string().trim().min(2, "El nombre debe tener al menos 2 letras").max(30, "El nombre de categoría es muy largo"),
});

const assetSchema = z.object({
  name: z.string().trim().min(2, "El nombre del activo es muy corto"),
  symbol: z.string().trim().optional(),
  balance: z.number().min(0, "La inversión inicial no puede ser negativa"),
  accountId: z.number().int().positive("ID de cuenta inválido"),
});

declare global {
  namespace Express {
    interface Request extends RequireAuthProp<any> {}
  }
}

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.get('/health', (req, res) => {
  res.status(200).send('API de Fintracker funcionando correctamente 🐉');
});
app.use(ClerkExpressRequireAuth() as any);

// 1. Ruta de prueba (Health check)
app.get('/', (req: Request, res: Response) => {
  res.json({ message: '🚀 Servidor financiero funcionando correctamente' });
});

// 3. Ruta GET /users/me (Devuelve los datos del usuario logueado o lo crea si no existe)
app.get('/users/me', async (req: Request, res: Response) => {
  try {
    const clerkUserId = req.auth.userId; 

    let user = await prisma.user.findUnique({
      where: { clerkId: clerkUserId },
      include: {
        accounts: {
          include: {
            assets: true,
            transactions: { orderBy: { date: 'desc' }, include: { category: true, asset: true } }
          }
        },
      },
    });

    if (!user) {
      const clerkUser = await clerkClient.users.getUser(clerkUserId);
      const userName = clerkUser.firstName || clerkUser.username || 'Usuario';
      const userEmail = clerkUser.emailAddresses[0].emailAddress;

      user = await prisma.user.create({
        data: {
          clerkId: clerkUserId,
          name: userName,
          email: userEmail,
        },
        include: { accounts: { include: { assets: true, transactions: true } } }
      });
    }

    res.json(user);
  } catch (error) {
    console.error('Error al sincronizar usuario:', error);
    res.status(500).json({ error: 'Error al obtener usuario' });
  }
});

// 4. Ruta para crear una cuenta (Banco, Cripto, etc.) BLINDADA
app.post('/accounts', async (req: Request, res: Response) => {
  try {
    const validData = accountSchema.parse(req.body);

    const newAccount = await prisma.account.create({
      data: {
        name: validData.name,
        balance: validData.balance,
        userId: validData.userId,
      },
    });

    res.status(201).json(newAccount);
  } catch (error: any) {
    if (error instanceof z.ZodError) return res.status(400).json({ error: error.issues[0].message });
    res.status(500).json({ error: 'No se pudo crear la cuenta' });
  }
});

// 5. Ruta para registrar una transacción BLINDADA
app.post('/transactions', async (req: Request, res: Response) => {
  try {
    const validData = transactionSchema.parse(req.body);
    const { amount, type, description, accountId, categoryId, assetId, originAccountId } = validData; 

    let accountBalanceChange = 0;
    if (type === 'INCOME') accountBalanceChange = amount;
    if (type === 'EXPENSE' || type === 'TRANSFER_OUT') accountBalanceChange = -amount;
    
    if (type === 'CONTRIBUTION') {
      if (originAccountId && originAccountId !== accountId) {
        accountBalanceChange = amount; 
      } else {
        accountBalanceChange = 0; 
      }
    }

    const operations: any[] = [];

    if (type === 'CONTRIBUTION' && originAccountId && originAccountId !== accountId) {
      operations.push(
        prisma.transaction.create({
          data: { amount, type: 'TRANSFER_OUT', description: `Traspaso a ${description}`, accountId: originAccountId }
        }),
        prisma.account.update({
          where: { id: originAccountId },
          data: { balance: { increment: -amount } }
        })
      );
    }

    operations.push(
      prisma.transaction.create({
        data: { amount, type, description, accountId, categoryId, assetId }, 
      }),
      prisma.account.update({
        where: { id: accountId },
        data: { balance: { increment: accountBalanceChange } },
      })
    );

    if (assetId) {
      const assetBalanceChange = (type === 'EXPENSE' || type === 'TRANSFER_OUT') ? -amount : amount;
      operations.push(
        prisma.asset.update({
          where: { id: assetId },
          data: { balance: { increment: assetBalanceChange } },
        })
      );
    }

    const result = await prisma.$transaction(operations);
    res.status(201).json(result[result.length - 1]); 
  } catch (error: any) {
    if (error instanceof z.ZodError) return res.status(400).json({ error: error.issues[0].message });
    console.error(error); 
    res.status(500).json({ error: 'Error al registrar la transacción' });
  }
});

// 6. Ruta para obtener el historial de una cuenta específica
app.get('/accounts/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params; 

    const account = await prisma.account.findUnique({
      where: { id: Number(id) }, 
      include: {
        transactions: {
          orderBy: { date: 'desc' }, 
        },
      },
    });

    if (!account) {
      return res.status(404).json({ error: 'Cuenta no encontrada' });
    }

    res.json(account);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener el historial' });
  }
});

// 7. Ruta para crear una categoría BLINDADA
app.post('/categories', async (req: Request, res: Response) => {
  try {
    const validData = categorySchema.parse(req.body);
    const newCategory = await prisma.category.create({ data: { name: validData.name } });
    res.status(201).json(newCategory);
  } catch (error: any) {
    if (error instanceof z.ZodError) return res.status(400).json({ error: error.issues[0].message });
    res.status(500).json({ error: 'No se pudo crear la categoría' });
  }
});

// 8. Ruta para ver todas las categorías
app.get('/categories', async (req: Request, res: Response) => {
  const categories = await prisma.category.findMany();
  res.json(categories);
});

// 9. Ruta para calcular el patrimonio total de un usuario
app.get('/users/:id/net-worth', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const aggregation = await prisma.account.aggregate({
      _sum: {
        balance: true,
      },
      where: {
        userId: Number(id),
      },
    });

    const totalNetWorth = aggregation._sum.balance || 0;

    res.json({ 
      userId: Number(id),
      totalNetWorth: totalNetWorth 
    });
  } catch (error) {
    res.status(500).json({ error: 'Error al calcular el patrimonio total' });
  }
});

// 10. Ruta para eliminar una transacción y revertir matemáticas
app.delete('/transactions/:id', async (req: Request, res: Response) => {
  try {
    const transactionId = parseInt(req.params.id as string, 10);
    const transaction = await prisma.transaction.findUnique({ where: { id: transactionId } });
    if (!transaction) return res.status(404).json({ error: 'Transacción no encontrada' });

    let accountBalanceCorrection = 0;
    if (transaction.type === 'INCOME') accountBalanceCorrection = -transaction.amount;
    if (transaction.type === 'EXPENSE') accountBalanceCorrection = transaction.amount;
    
    const assetBalanceCorrection = transaction.type === 'EXPENSE' ? transaction.amount : -transaction.amount;

    const operations: any[] = [
      prisma.transaction.delete({ where: { id: transactionId } }),
      prisma.account.update({
        where: { id: transaction.accountId },
        data: { balance: { increment: accountBalanceCorrection } },
      })
    ];

    if (transaction.assetId) {
      operations.push(
        prisma.asset.update({
          where: { id: transaction.assetId },
          data: { balance: { increment: assetBalanceCorrection } },
        })
      );
    }

    await prisma.$transaction(operations);
    res.json({ message: 'Movimiento eliminado' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al eliminar' });
  }
});

// 11. Ruta para eliminar una categoría
app.delete('/categories/:id', async (req: Request, res: Response) => {
  try {
    const categoryId = parseInt(req.params.id as string, 10);

    await prisma.transaction.updateMany({
      where: { categoryId: categoryId },
      data: { categoryId: null },
    });

    await prisma.category.delete({
      where: { id: categoryId },
    });

    res.json({ message: 'Categoría eliminada con éxito' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al eliminar la categoría' });
  }
});

// 12. Ruta para actualizar la categoría de una transacción
app.patch('/transactions/:id/category', async (req: Request, res: Response) => {
  try {
    const transactionId = parseInt(req.params.id as string, 10);
    const { categoryId } = req.body; 

    const updatedTx = await prisma.transaction.update({
      where: { id: transactionId },
      data: { 
        categoryId: categoryId ? parseInt(categoryId, 10) : null 
      },
    });

    res.json(updatedTx);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al actualizar la categoría' });
  }
});

// 13. Ruta para eliminar una cuenta y sus transacciones
app.delete('/accounts/:id', async (req: Request, res: Response) => {
  try {
    const accountId = parseInt(req.params.id as string, 10);

    await prisma.transaction.deleteMany({
      where: { accountId: accountId }
    });

    await prisma.account.delete({
      where: { id: accountId }
    });

    res.json({ message: 'Cuenta y movimientos eliminados con éxito' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al eliminar la cuenta' });
  }
});

// 14. Ruta para añadir un nuevo activo (fondo/cripto) a una cuenta BLINDADA
app.post('/assets', async (req: Request, res: Response) => {
  try {
    const validData = assetSchema.parse(req.body);
    const { name, symbol, balance, accountId } = validData;
    
    const newAsset = await prisma.asset.create({
      data: {
        name,
        symbol,
        balance,
        accountId,
      },
    });

    if (balance > 0) {
      // 1. Restamos el dinero invertido de la liquidez de la cuenta
      await prisma.account.update({
        where: { id: accountId },
        data: { balance: { decrement: balance } }
      });

      // 2. Generamos el recibo (movimiento) para el historial del mes
      await prisma.transaction.create({
        data: {
          description: `Inversión inicial: ${name}`,
          amount: balance,
          type: 'CONTRIBUTION',
          accountId: accountId,
          assetId: newAsset.id
        }
      });
    }

    res.status(201).json(newAsset);
  } catch (error: any) {
    if (error instanceof z.ZodError) return res.status(400).json({ error: error.issues[0].message });
    console.error(error);
    res.status(500).json({ error: 'Error al crear el activo' });
  }
});

// 15. Ruta para eliminar un Activo (Fondo/Cripto)
app.delete('/assets/:id', async (req: Request, res: Response) => {
  try {
    const assetId = parseInt(req.params.id as string, 10);
    const asset = await prisma.asset.findUnique({ where: { id: assetId } });
    
    if (asset) {
      await prisma.account.update({
        where: { id: asset.accountId },
        data: { balance: { increment: asset.balance } }
      });
    }
    
    await prisma.asset.delete({ where: { id: assetId } });
    res.json({ message: 'Activo eliminado' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al eliminar activo' });
  }
});

// Iniciar el servidor
app.listen(PORT, () => {
  console.log(`Servidor escuchando en http://localhost:${PORT}`);
});