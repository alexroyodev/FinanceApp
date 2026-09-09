import express, { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import cors from 'cors';

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// 1. Ruta de prueba (Health check)
app.get('/', (req: Request, res: Response) => {
  res.json({ message: '🚀 Servidor financiero funcionando correctamente' });
});

// 2. Ruta para crear un nuevo usuario
app.post('/users', async (req: Request, res: Response) => {
  try {
    const { email, name } = req.body;

    const newUser = await prisma.user.create({
      data: {
        email,
        name,
      },
    });

    res.status(201).json(newUser);
  } catch (error) {
    res.status(400).json({ error: 'No se pudo crear el usuario (¿email duplicado?)' });
  }
});

// 3. Ruta para obtener todos los usuarios y sus cuentas
app.get('/users', async (req: Request, res: Response) => {
  try {
    const users = await prisma.user.findMany({
      include: {
        accounts: {
          include: {
            transactions: {
              orderBy: { date: 'desc' },
              include: { category: true }
            }
          }
          
        },
      },
    });
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener usuarios' });
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

// 5. Ruta para registrar una transacción (Ingreso/Gasto)
app.post('/transactions', async (req: Request, res: Response) => {
  try {

    const { amount, type, description, accountId, categoryId } = req.body; 

    const balanceChange = type === 'EXPENSE' ? -amount : amount;

    const result = await prisma.$transaction([
      prisma.transaction.create({
        // Y lo añadimos aquí en la data
        data: { amount, type, description, accountId, categoryId }, 
      }),

      // C. Actualizamos el saldo de la cuenta
      prisma.account.update({
        where: { id: accountId },
        data: { balance: { increment: balanceChange } },
      })
      
    ]);

    // result[0] es la transacción creada, result[1] es la cuenta actualizada
    res.status(201).json(result[0]); 
  } catch (error) {
    console.error(error); // Añadimos esto para ver el error real en la terminal si algo falla
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

// 10. Ruta para eliminar una transacción y recalcular saldo
app.delete('/transactions/:id', async (req: Request, res: Response) => {
  try {
    const transactionId = parseInt(req.params.id as string, 10);

    // 1. Buscamos el movimiento para saber cuánto dinero era y de qué cuenta
    const transaction = await prisma.transaction.findUnique({
      where: { id: transactionId },
    });

    if (!transaction) {
      return res.status(404).json({ error: 'Transacción no encontrada' });
    }

    // 2. Calculamos la operación inversa
    // Si fue un Gasto (-), ahora sumamos el dinero a la cuenta (+).
    // Si fue un Ingreso (+), ahora restamos el dinero (-).
    const balanceCorrection = transaction.type === 'EXPENSE' ? transaction.amount : -transaction.amount;

    // 3. Ejecutamos ambas acciones juntas (ACID)
    await prisma.$transaction([
      prisma.transaction.delete({
        where: { id: transactionId },
      }),
      prisma.account.update({
        where: { id: transaction.accountId },
        data: { balance: { increment: balanceCorrection } },
      }),
    ]);

    res.json({ message: 'Movimiento eliminado y saldo recalculado' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al eliminar el movimiento' });
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

// Iniciar el servidor
app.listen(PORT, () => {
  console.log(`Servidor escuchando en http://localhost:${PORT}`);
});