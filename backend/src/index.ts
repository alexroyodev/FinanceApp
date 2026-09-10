import express, { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import cors from 'cors';
import 'dotenv/config';
import { ClerkExpressRequireAuth, RequireAuthProp, clerkClient } from '@clerk/clerk-sdk-node';

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
app.use(ClerkExpressRequireAuth() as any);

// 1. Ruta de prueba (Health check)
app.get('/', (req: Request, res: Response) => {
  res.json({ message: '🚀 Servidor financiero funcionando correctamente' });
});


// 3. Ruta GET /users/me (Devuelve los datos del usuario logueado o lo crea si no existe)
app.get('/users/me', async (req: Request, res: Response) => {
  try {
    // req.auth.userId es el ID mágico que nos ha verificado el middleware de Clerk
    const clerkUserId = req.auth.userId; 

    // 1. Buscamos a ver si ya lo tenemos en nuestro PostgreSQL
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

    // 2. Si no existe (es un usuario nuevo), lo creamos en el acto
    if (!user) {
      // Le preguntamos a Clerk cómo se llama este usuario y su email
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

// 4. Ruta para crear una cuenta (Banco, Cripto, etc.)
app.post('/accounts', async (req: Request, res: Response) => {
  try {
    const { name, balance, userId } = req.body;

    const newAccount = await prisma.account.create({
      data: {
        name,
        balance,
        userId,
      },
    });

    res.status(201).json(newAccount);
  } catch (error) {
    res.status(400).json({ error: 'No se pudo crear la cuenta' });
  }
});

// 5. Ruta para registrar una transacción (Ingreso, Gasto o Aportación cruzada)
app.post('/transactions', async (req: Request, res: Response) => {
  try {
    const { amount, type, description, accountId, categoryId, assetId, originAccountId } = req.body; 

    // 1. ¿Cómo afecta a la cuenta destino?
    let accountBalanceChange = 0;
    if (type === 'INCOME') accountBalanceChange = amount;
    if (type === 'EXPENSE' || type === 'TRANSFER_OUT') accountBalanceChange = -amount;
    
    // Si es Aportación, el dinero solo SUMA en la cuenta destino si viene desde otra cuenta distinta
    if (type === 'CONTRIBUTION') {
      if (originAccountId && originAccountId !== accountId) {
        accountBalanceChange = amount; 
      } else {
        accountBalanceChange = 0; // Si es en la misma cuenta, solo se mueve de liquidez a invertido
      }
    }

    const operations: any[] = [];

    // 2. Si viene de otra cuenta, creamos una transacción de "Salida" y restamos el dinero origen
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

    // 3. Creamos la transacción principal en la cuenta destino
    operations.push(
      prisma.transaction.create({
        data: { amount, type, description, accountId, categoryId, assetId }, 
      }),
      prisma.account.update({
        where: { id: accountId },
        data: { balance: { increment: accountBalanceChange } },
      })
    );

    // 4. Si es un activo, sumamos/restamos a su valor total
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
  } catch (error) {
    console.error(error); 
    res.status(400).json({ error: 'Error al registrar la transacción' });
  }
});

// 6. Ruta para obtener el historial de una cuenta específica
app.get('/accounts/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params; // Sacamos el ID de la URL

    const account = await prisma.account.findUnique({
      where: { id: Number(id) }, // Convertimos a número porque la URL es un texto
      include: {
        transactions: {
          orderBy: { date: 'desc' }, // Ordenamos: de más reciente a más antiguo
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

// 7. Ruta para crear una categoría
app.post('/categories', async (req: Request, res: Response) => {
  try {
    const { name } = req.body;
    const newCategory = await prisma.category.create({ data: { name } });
    res.status(201).json(newCategory);
  } catch (error) {
    res.status(400).json({ error: 'No se pudo crear la categoría' });
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

    // Le pedimos a PostgreSQL que sume la columna 'balance' de todas las cuentas del usuario
    const aggregation = await prisma.account.aggregate({
      _sum: {
        balance: true,
      },
      where: {
        userId: Number(id),
      },
    });

    // Si el usuario no tiene cuentas, la suma devuelve null, así que le ponemos 0 por defecto
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

    // Operación matemática inversa para la cuenta
    let accountBalanceCorrection = 0;
    if (transaction.type === 'INCOME') accountBalanceCorrection = -transaction.amount;
    if (transaction.type === 'EXPENSE') accountBalanceCorrection = transaction.amount;
    
    // Operación matemática inversa para el activo
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

    // 1. Desvinculamos esta categoría de cualquier transacción (evita error de clave foránea)
    await prisma.transaction.updateMany({
      where: { categoryId: categoryId },
      data: { categoryId: null },
    });

    // 2. Ahora sí, borramos la categoría de la base de datos
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
    const { categoryId } = req.body; // Puede ser un número o vacío (null)

    const updatedTx = await prisma.transaction.update({
      where: { id: transactionId },
      data: { 
        // Si nos envían un texto vacío, lo convertimos a null para quitarle la categoría
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

    // 1. Primero borramos todos los movimientos asociados a esta cuenta para no dejar datos huérfanos
    await prisma.transaction.deleteMany({
      where: { accountId: accountId }
    });

    // 2. Ahora ya podemos borrar la cuenta de forma segura
    await prisma.account.delete({
      where: { id: accountId }
    });

    res.json({ message: 'Cuenta y movimientos eliminados con éxito' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al eliminar la cuenta' });
  }
});

// 14. Ruta para añadir un nuevo activo (fondo/cripto) a una cuenta
app.post('/assets', async (req: Request, res: Response) => {
  try {
    const { name, symbol, balance, accountId } = req.body;
    
    // Creamos el activo
    const newAsset = await prisma.asset.create({
      data: {
        name,
        symbol,
        balance,
        accountId,
      },
    });

    // Sumamos el valor inicial de este activo al saldo total de la cuenta
    if (balance > 0) {
      await prisma.account.update({
        where: { id: accountId },
        data: { balance: { increment: balance } }
      });
    }

    res.status(201).json(newAsset);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al crear el activo' });
  }
});

// 15. Ruta para eliminar un Activo (Fondo/Cripto)
app.delete('/assets/:id', async (req: Request, res: Response) => {
  try {
    const assetId = parseInt(req.params.id as string, 10);
    // Buscamos cuánto dinero tenía para quitárselo a la cuenta general y cuadrar las cuentas
    const asset = await prisma.asset.findUnique({ where: { id: assetId } });
    if (asset) {
      await prisma.account.update({
        where: { id: asset.accountId },
        data: { balance: { decrement: asset.balance } }
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