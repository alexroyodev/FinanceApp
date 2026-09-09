import { useEffect, useState } from 'react';

function App() {
  const [user, setUser] = useState<any>(null);
  const [categories, setCategories] = useState<any[]>([]);
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [type, setType] = useState('EXPENSE');
  const [accountId, setAccountId] = useState('');
  const [categoryId, setCategoryId] = useState('');

  const fetchUserData = () => {
    fetch('http://localhost:3000/users')
      .then((response) => response.json())
      .then((data) => {
        if (data && data.length > 0) {
          setUser(data[0]);
          if (!accountId && data[0].accounts.length > 0) {
            setAccountId(data[0].accounts[0].id.toString());
          }
        }
      })
      .catch((error) => console.error('Error al cargar datos:', error));
  };

  const fetchCategories = () => {
    fetch('http://localhost:3000/categories')
      .then((response) => response.json())
      .then((data) => setCategories(data))
      .catch((error) => console.error('Error al cargar categorías:', error));
  };

  useEffect(() => {
    fetchUserData();
    fetchCategories(); 
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); 

    const newTransaction: any = {
      description,
      amount: parseFloat(amount),
      type,
      accountId: parseInt(accountId),
    };

  
    if (categoryId) {
      newTransaction.categoryId = parseInt(categoryId);
    }

    try {
      const response = await fetch('http://localhost:3000/transactions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newTransaction),
      });

      if (response.ok) {
        setDescription('');
        setAmount('');
        setCategoryId('');
        fetchUserData();
      }
    } catch (error) {
      console.error('Error al guardar la transacción:', error);
    }
  };

  const handleDelete = async (id: number) => {
    // Pedimos confirmación al usuario por seguridad
    if (!window.confirm('¿Seguro que quieres eliminar este movimiento? El saldo se recalculará automáticamente.')) {
      return;
    }

    try {
      const response = await fetch(`http://localhost:3000/transactions/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        fetchUserData(); // Recargamos los datos para ver el nuevo saldo
      }
    } catch (error) {
      console.error('Error al eliminar:', error);
    }
  };

  if (!user) return <div className="min-h-screen flex items-center justify-center bg-gray-100">Cargando...</div>;

  const totalNetWorth = user.accounts.reduce((sum: number, account: any) => sum + account.balance, 0);

  const allTransactions = user.accounts.flatMap((account: any) => account.transactions || []);
  allTransactions.sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());
  const recentTransactions = allTransactions.slice(0, 10);

  return (
    <div className="min-h-screen bg-gray-100 p-8 font-sans">
      <div className="max-w-3xl mx-auto space-y-8">
        
        <header>
          <h1 className="text-3xl font-bold text-gray-800">Hola, {user.name} 👋</h1>
        </header>

        <div className="bg-blue-600 text-white p-6 rounded-2xl shadow-lg">
          <h2 className="text-blue-100 text-sm uppercase tracking-wider font-semibold mb-1">Patrimonio Total</h2>
          <p className="text-5xl font-bold">{totalNetWorth.toFixed(2)} €</p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          <div>
            <h3 className="text-xl font-bold text-gray-800 mb-4">Tus Cuentas</h3>
            <div className="space-y-4">
              {user.accounts.map((account: any) => (
                <div key={account.id} className="bg-white p-5 rounded-xl shadow border border-gray-100 flex justify-between items-center">
                  <span className="text-gray-600 font-medium">{account.name}</span>
                  <span className="text-xl font-bold text-gray-900">{account.balance.toFixed(2)} €</span>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-xl font-bold text-gray-800 mb-4">Añadir Movimiento</h3>
            <form onSubmit={handleSubmit} className="bg-white p-6 rounded-xl shadow border border-gray-100 space-y-4">
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
                <input 
                  type="text" 
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Ej: Cena con amigos"
                  className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Cantidad (€)</label>
                  <input 
                    type="number" 
                    step="0.01"
                    required
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0.00"
                    className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
                  <select 
                    value={type}
                    onChange={(e) => setType(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                  >
                    <option value="EXPENSE">Gasto</option>
                    <option value="INCOME">Ingreso</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Cuenta</label>
                  <select 
                    value={accountId}
                    onChange={(e) => setAccountId(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                  >
                    {user.accounts.map((account: any) => (
                      <option key={account.id} value={account.id}>
                        {account.name}
                      </option>
                    ))}
                  </select>
                </div>
                
                {/* Desplegable de categorías */}
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Categoría</label>
                  <select 
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                  >
                    <option value="">Sin categoría</option>
                    {categories.map((cat: any) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <button 
                type="submit"
                className="w-full bg-blue-600 text-white font-bold py-3 rounded-lg hover:bg-blue-700 transition-colors mt-2 cursor-pointer"
              >
                Guardar Movimiento
              </button>
            </form>
          </div>
        </div>

        <div className="mt-8">
          <h3 className="text-xl font-bold text-gray-800 mb-4">Últimos Movimientos</h3>
          <div className="bg-white rounded-xl shadow border border-gray-100 overflow-hidden">
            {recentTransactions.length === 0 ? (
              <div className="p-6 text-center text-gray-500">No hay movimientos todavía.</div>
            ) : (
              recentTransactions.map((tx: any) => (
                <div key={tx.id} className="p-4 border-b border-gray-100 flex justify-between items-center hover:bg-gray-50 transition-colors">
                  <div>
                    <p className="font-semibold text-gray-800">{tx.description}</p>
                    <p className="text-xs text-gray-500">
                      {new Date(tx.date).toLocaleDateString('es-ES', { 
                        year: 'numeric', month: 'long', day: 'numeric' 
                      })}
                    </p>
                  </div>
                  
                  {/* 👇 AQUÍ ESTÁ EL CAMBIO: El contenedor flex con el span y el botón */}
                  <div className="flex items-center gap-4">
                    <span className={`font-bold ${tx.type === 'EXPENSE' ? 'text-red-500' : 'text-green-500'}`}>
                      {tx.type === 'EXPENSE' ? '-' : '+'}{tx.amount.toFixed(2)} €
                    </span>
                    
                    <button 
                      onClick={() => handleDelete(tx.id)}
                      className="text-gray-300 hover:text-red-500 transition-colors font-bold text-lg px-2 cursor-pointer"
                      title="Eliminar movimiento"
                    >
                      ✕
                    </button>
                  </div>
                  
                </div>
              ))
            )}
          </div>
        </div>

      </div>
    </div>
  );
}

export default App;