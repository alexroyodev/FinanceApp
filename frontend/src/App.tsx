import { useEffect, useState } from 'react';
import { PieChart, Pie, Tooltip, Legend, ResponsiveContainer } from 'recharts';

function App() {
  // --- ESTADOS BASE ---
  const [user, setUser] = useState<any>(null);
  const [categories, setCategories] = useState<any[]>([]);
  const [newCategoryName, setNewCategoryName] = useState('');
  
  // --- NAVEGACIÓN DE PESTAÑAS ---
  const [activeTab, setActiveTab] = useState('dashboard');

  // --- ESTADOS DEL FORMULARIO DE NUEVO MOVIMIENTO ---
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [type, setType] = useState('EXPENSE');
  const [accountId, setAccountId] = useState('');
  const [categoryId, setCategoryId] = useState('');

  // --- ESTADOS DE LOS FILTROS ---
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('ALL');
  const [filterMin, setFilterMin] = useState('');
  const [filterMax, setFilterMax] = useState('');
  // 👇 NUEVO: Estado para el filtro de categoría
  const [filterCategory, setFilterCategory] = useState('ALL'); 

  // --- PETICIONES AL BACKEND ---
  const fetchUserData = () => {
    fetch('http://localhost:3000/users')
      .then((res) => res.json())
      .then((data) => {
        if (data && data.length > 0) {
          setUser(data[0]);
          if (!accountId && data[0].accounts.length > 0) {
            setAccountId(data[0].accounts[0].id.toString());
          }
        }
      })
      .catch((err) => console.error('Error al cargar datos:', err));
  };

  const fetchCategories = () => {
    fetch('http://localhost:3000/categories')
      .then((res) => res.json())
      .then((data) => setCategories(data))
      .catch((err) => console.error('Error al cargar categorías:', err));
  };

  useEffect(() => {
    fetchUserData();
    fetchCategories();
  }, []);

  // --- FUNCIONES DE MOVIMIENTOS ---
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); 
    const newTransaction: any = {
      description,
      amount: parseFloat(amount),
      type,
      accountId: parseInt(accountId),
    };
    if (categoryId) newTransaction.categoryId = parseInt(categoryId);

    try {
      const response = await fetch('http://localhost:3000/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newTransaction),
      });
      if (response.ok) {
        setDescription(''); setAmount(''); setCategoryId('');
        fetchUserData();
      }
    } catch (err) {
      console.error('Error al guardar:', err);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('¿Seguro que quieres eliminar este movimiento?')) return;
    try {
      const response = await fetch(`http://localhost:3000/transactions/${id}`, { method: 'DELETE' });
      if (response.ok) fetchUserData();
    } catch (err) {
      console.error('Error al eliminar:', err);
    }
  };

  const handleUpdateTransactionCategory = async (transactionId: number, newCatId: string) => {
    try {
      const response = await fetch(`http://localhost:3000/transactions/${transactionId}/category`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ categoryId: newCatId }),
      });
      if (response.ok) fetchUserData();
    } catch (err) {
      console.error('Error al actualizar categoría:', err);
    }
  };

  // --- FUNCIONES DE CATEGORÍAS ---
  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategoryName.trim()) return;
    try {
      const response = await fetch('http://localhost:3000/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newCategoryName }),
      });
      if (response.ok) {
        setNewCategoryName(''); fetchCategories();
      }
    } catch (err) {
      console.error('Error al crear categoría:', err);
    }
  };

  const handleDeleteCategory = async (id: number) => {
    if (!window.confirm('¿Eliminar esta categoría? Los gastos asociados se quedarán "Sin categoría".')) return;
    try {
      const response = await fetch(`http://localhost:3000/categories/${id}`, { method: 'DELETE' });
      if (response.ok) { fetchCategories(); fetchUserData(); }
    } catch (err) {
      console.error('Error al eliminar categoría:', err);
    }
  };

  // --- CÁLCULOS Y PREPARACIÓN DE DATOS ---
  if (!user) return <div className="min-h-screen flex items-center justify-center bg-gray-100">Cargando...</div>;

  const totalNetWorth = user.accounts.reduce((sum: number, acc: any) => sum + acc.balance, 0);
  const allTransactions = user.accounts.flatMap((acc: any) => acc.transactions || []);
  allTransactions.sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());
  
  const recentTransactions = allTransactions.slice(0, 5); 

  const expensesByCategory = allTransactions
    .filter((tx: any) => tx.type === 'EXPENSE' && tx.category)
    .reduce((acc: any, tx: any) => {
      const catName = tx.category.name;
      acc[catName] = (acc[catName] || 0) + tx.amount;
      return acc;
    }, {});

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];
  const pieData = Object.keys(expensesByCategory).map((name, index) => ({
    name,
    value: expensesByCategory[name],
    fill: COLORS[index % COLORS.length]
  }));

  // 👇 ACTUALIZADO: Añadida la lógica de filtrado por categoría
  const filteredTransactions = allTransactions.filter((tx: any) => {
    const matchesSearch = tx.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'ALL' || tx.type === filterType;
    const matchesMin = filterMin === '' || tx.amount >= parseFloat(filterMin);
    const matchesMax = filterMax === '' || tx.amount <= parseFloat(filterMax);
    
    // Si elegimos ALL pasa; si elegimos NONE comprueba que no tenga categoría; sino, comprueba el ID
    const matchesCategory = filterCategory === 'ALL' 
      || (filterCategory === 'NONE' && !tx.category) 
      || (tx.category && tx.category.id === parseInt(filterCategory));

    return matchesSearch && matchesType && matchesMin && matchesMax && matchesCategory;
  });

  // --- RENDERIZADO VISUAL ---
  return (
    <div className="min-h-screen bg-gray-100 p-8 font-sans">
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* CABECERA Y PESTAÑAS */}
        <header className="flex justify-between items-end border-b border-gray-300 pb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Hola, {user.name} 👋</h1>
          </div>
          <nav className="flex gap-2">
            <button 
              onClick={() => setActiveTab('dashboard')}
              className={`px-4 py-2 font-bold rounded-lg transition-colors cursor-pointer ${activeTab === 'dashboard' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600 hover:bg-gray-300'}`}
            >
              Dashboard
            </button>
            <button 
              onClick={() => setActiveTab('transactions')}
              className={`px-4 py-2 font-bold rounded-lg transition-colors cursor-pointer ${activeTab === 'transactions' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600 hover:bg-gray-300'}`}
            >
              Gestión de Movimientos
            </button>
          </nav>
        </header>

        {/* =========================================
            VISTA 1: DASHBOARD (Resumen) 
        ========================================= */}
        {activeTab === 'dashboard' && (
          <div className="space-y-8 animate-fade-in">
            
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
                    <input type="text" required value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Ej: Cena con amigos" className="w-full border border-gray-300 rounded-lg p-2 outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                  <div className="flex gap-4">
                    <div className="flex-1">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Cantidad (€)</label>
                      <input type="number" step="0.01" required value={amount} onChange={(e) => setAmount(e.target.value)} className="w-full border border-gray-300 rounded-lg p-2 outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>
                    <div className="flex-1">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
                      <select value={type} onChange={(e) => setType(e.target.value)} className="w-full border border-gray-300 rounded-lg p-2 outline-none bg-white focus:ring-2 focus:ring-blue-500">
                        <option value="EXPENSE">Gasto</option>
                        <option value="INCOME">Ingreso</option>
                      </select>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <div className="flex-1">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Cuenta</label>
                      <select value={accountId} onChange={(e) => setAccountId(e.target.value)} className="w-full border border-gray-300 rounded-lg p-2 outline-none bg-white focus:ring-2 focus:ring-blue-500">
                        {user.accounts.map((account: any) => <option key={account.id} value={account.id}>{account.name}</option>)}
                      </select>
                    </div>
                    <div className="flex-1">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Categoría</label>
                      <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} className="w-full border border-gray-300 rounded-lg p-2 outline-none bg-white focus:ring-2 focus:ring-blue-500">
                        <option value="">Sin categoría</option>
                        {categories.map((cat: any) => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                      </select>
                    </div>
                  </div>
                  <button type="submit" className="w-full bg-blue-600 text-white font-bold py-3 rounded-lg hover:bg-blue-700 transition-colors cursor-pointer">Guardar Movimiento</button>
                </form>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <h3 className="text-xl font-bold text-gray-800 mb-4">Gastos por Categoría</h3>
                {pieData.length > 0 ? (
                  <div className="bg-white p-6 rounded-xl shadow border border-gray-100 h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart><Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={5} dataKey="value" /><Tooltip formatter={(value: any) => `${Number(value).toFixed(2)} €`} /><Legend /></PieChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="bg-white p-6 rounded-xl shadow border h-80 flex justify-center items-center text-gray-400">Sin datos para el gráfico</div>
                )}
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-800 mb-4">Gestionar Categorías</h3>
                <div className="bg-white p-6 rounded-xl shadow border border-gray-100 h-80 flex flex-col">
                  <form onSubmit={handleAddCategory} className="flex gap-2 mb-4">
                    <input type="text" required value={newCategoryName} onChange={(e) => setNewCategoryName(e.target.value)} placeholder="Nueva categoría..." className="flex-1 border border-gray-300 rounded-lg p-2 outline-none focus:ring-2 focus:ring-blue-500" />
                    <button type="submit" className="bg-gray-800 text-white font-bold px-4 rounded-lg cursor-pointer hover:bg-black">+</button>
                  </form>
                  <div className="flex-1 overflow-y-auto space-y-2 pr-2">
                    {categories.map((cat: any) => (
                      <div key={cat.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg border">
                        <span className="text-gray-700 font-medium">{cat.name}</span>
                        <button onClick={() => handleDeleteCategory(cat.id)} className="text-gray-400 hover:text-red-500 font-bold px-2 cursor-pointer">✕</button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-xl font-bold text-gray-800 mb-4">Últimos 5 Movimientos</h3>
              <div className="bg-white rounded-xl shadow border border-gray-100 overflow-hidden">
                {recentTransactions.map((tx: any) => (
                  <div key={tx.id} className="p-4 border-b border-gray-100 flex justify-between items-center hover:bg-gray-50">
                    <div>
                      <p className="font-semibold text-gray-800">
                        {tx.description}
                        {tx.category && <span className="ml-2 text-xs bg-gray-200 text-gray-600 px-2 py-1 rounded-full">{tx.category.name}</span>}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">{new Date(tx.date).toLocaleDateString()}</p>
                    </div>
                    <span className={`font-bold ${tx.type === 'EXPENSE' ? 'text-red-500' : 'text-green-500'}`}>
                      {tx.type === 'EXPENSE' ? '-' : '+'}{tx.amount.toFixed(2)} €
                    </span>
                  </div>
                ))}
              </div>
            </div>

          </div>
        )}

        {/* =========================================
            VISTA 2: GESTIÓN DE MOVIMIENTOS (Avanzada) 
        ========================================= */}
        {activeTab === 'transactions' && (
          <div className="space-y-6 animate-fade-in">
            
            {/* Panel de Filtros */}
            <div className="bg-white p-6 rounded-xl shadow border border-gray-100 space-y-4">
              <h3 className="font-bold text-gray-800 border-b pb-2">Filtros de búsqueda</h3>
              {/* 👇 ACTUALIZADO: Cambiado a 5 columnas para que quepa la categoría */}
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <div>
                  <label className="block text-xs text-gray-500 uppercase font-bold mb-1">Buscar nombre</label>
                  <input type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Ej: Mercadona..." className="w-full border border-gray-300 rounded p-2 text-sm outline-none focus:ring-1 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 uppercase font-bold mb-1">Tipo</label>
                  <select value={filterType} onChange={(e) => setFilterType(e.target.value)} className="w-full border border-gray-300 rounded p-2 text-sm bg-white outline-none focus:ring-1 focus:ring-blue-500">
                    <option value="ALL">Todos</option>
                    <option value="EXPENSE">Solo Gastos</option>
                    <option value="INCOME">Solo Ingresos</option>
                  </select>
                </div>
                {/* 👇 NUEVO FILTRO: Categoría */}
                <div>
                  <label className="block text-xs text-gray-500 uppercase font-bold mb-1">Categoría</label>
                  <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)} className="w-full border border-gray-300 rounded p-2 text-sm bg-white outline-none focus:ring-1 focus:ring-blue-500">
                    <option value="ALL">Todas</option>
                    <option value="NONE">Sin categoría</option>
                    {categories.map((cat: any) => (
                      <option key={cat.id} value={cat.id.toString()}>{cat.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-500 uppercase font-bold mb-1">Min €</label>
                  <input type="number" value={filterMin} onChange={(e) => setFilterMin(e.target.value)} placeholder="0" className="w-full border border-gray-300 rounded p-2 text-sm outline-none focus:ring-1 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 uppercase font-bold mb-1">Max €</label>
                  <input type="number" value={filterMax} onChange={(e) => setFilterMax(e.target.value)} placeholder="1000" className="w-full border border-gray-300 rounded p-2 text-sm outline-none focus:ring-1 focus:ring-blue-500" />
                </div>
              </div>
            </div>

            {/* Tabla/Lista de todos los movimientos */}
            <div className="bg-white rounded-xl shadow border border-gray-100 overflow-hidden overflow-x-auto">
              {filteredTransactions.length === 0 ? (
                <div className="p-10 text-center text-gray-500 font-medium">No se encontraron movimientos con estos filtros.</div>
              ) : (
                <table className="w-full text-left border-collapse min-w-[700px]">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200 text-xs uppercase text-gray-500">
                      <th className="p-4 font-bold">Fecha</th>
                      <th className="p-4 font-bold">Descripción</th>
                      <th className="p-4 font-bold">Categoría</th>
                      <th className="p-4 font-bold text-right">Importe</th>
                      <th className="p-4 font-bold text-center">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTransactions.map((tx: any) => (
                      <tr key={tx.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                        <td className="p-4 text-sm text-gray-600">{new Date(tx.date).toLocaleDateString()}</td>
                        <td className="p-4 font-medium text-gray-800">{tx.description}</td>
                        
                        <td className="p-4">
                          <select 
                            value={tx.category?.id || ''}
                            onChange={(e) => handleUpdateTransactionCategory(tx.id, e.target.value)}
                            className="border border-gray-200 rounded text-sm p-1 bg-white outline-none cursor-pointer hover:border-blue-400"
                          >
                            <option value="">Sin categoría</option>
                            {categories.map(cat => (
                              <option key={cat.id} value={cat.id}>{cat.name}</option>
                            ))}
                          </select>
                        </td>
                        
                        <td className={`p-4 text-right font-bold ${tx.type === 'EXPENSE' ? 'text-red-500' : 'text-green-500'}`}>
                          {tx.type === 'EXPENSE' ? '-' : '+'}{tx.amount.toFixed(2)} €
                        </td>
                        
                        <td className="p-4 text-center">
                          <button 
                            onClick={() => handleDelete(tx.id)}
                            className="text-gray-400 hover:text-red-600 transition-colors p-2 cursor-pointer font-bold bg-gray-100 hover:bg-red-50 rounded-lg text-sm"
                            title="Eliminar definitivamente"
                          >
                            Eliminar
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

          </div>
        )}

      </div>
    </div>
  );
}

export default App;