import { useEffect, useState } from 'react';
// 👇 1. Importamos Clerk y el nuevo componente, eliminando las gráficas
import { SignedIn, SignedOut, SignIn, UserButton } from '@clerk/clerk-react';
import AnalyticsView from './components/AnalyticsView';

function App() {
  // --- ESTADOS BASE ---
  const [user, setUser] = useState<any>(null);
  const [categories, setCategories] = useState<any[]>([]);
  const [newCategoryName, setNewCategoryName] = useState('');
  
  const [activeTab, setActiveTab] = useState('dashboard');

  // --- ESTADOS: NUEVO MOVIMIENTO ---
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [type, setType] = useState('EXPENSE');
  const [accountId, setAccountId] = useState('');
  const [categoryId, setCategoryId] = useState('');

  const [newAccountName, setNewAccountName] = useState('');
  const [newAccountBalance, setNewAccountBalance] = useState('');

  // --- ESTADOS: INVERSIONES ---
  const [newAssetName, setNewAssetName] = useState('');
  const [newAssetSymbol, setNewAssetSymbol] = useState('');
  const [newAssetBalance, setNewAssetBalance] = useState('');
  const [newAssetAccountId, setNewAssetAccountId] = useState('');

  const [returnAmount, setReturnAmount] = useState('');
  const [returnType, setReturnType] = useState('INCOME'); 
  const [returnAssetId, setReturnAssetId] = useState('');

  const [contributionAmount, setContributionAmount] = useState('');
  const [contributionAssetId, setContributionAssetId] = useState('');
  const [contributionOriginAccountId, setContributionOriginAccountId] = useState('');

  // --- ESTADOS: FILTROS ---
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('ALL');
  const [filterCategory, setFilterCategory] = useState('ALL'); 
  const [filterMin, setFilterMin] = useState('');
  const [filterMax, setFilterMax] = useState('');

  // --- PETICIONES AL BACKEND ---
  const fetchUserData = () => {
    fetch('http://localhost:3000/users')
      .then((res) => res.json())
      .then((data) => {
        if (data && data.length > 0) {
          setUser(data[0]);
          if (!accountId && data[0].accounts.length > 0) {
            const firstId = data[0].accounts[0].id.toString();
            setAccountId(firstId);
            setNewAssetAccountId(firstId);
            if (!contributionOriginAccountId) setContributionOriginAccountId(firstId);
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

  // --- FUNCIONES ---
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); 
    const newTransaction: any = { description, amount: parseFloat(amount), type, accountId: parseInt(accountId) };
    if (categoryId) newTransaction.categoryId = parseInt(categoryId);
    try {
      const res = await fetch('http://localhost:3000/transactions', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(newTransaction) });
      if (res.ok) { setDescription(''); setAmount(''); setCategoryId(''); fetchUserData(); }
    } catch (err) { console.error('Error:', err); }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('¿Eliminar este movimiento?')) return;
    try {
      const res = await fetch(`http://localhost:3000/transactions/${id}`, { method: 'DELETE' });
      if (res.ok) fetchUserData();
    } catch (err) { console.error(err); }
  };

  const handleUpdateTransactionCategory = async (txId: number, newCatId: string) => {
    try {
      const res = await fetch(`http://localhost:3000/transactions/${txId}/category`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ categoryId: newCatId }) });
      if (res.ok) fetchUserData();
    } catch (err) { console.error(err); }
  };

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategoryName.trim()) return;
    try {
      const res = await fetch('http://localhost:3000/categories', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: newCategoryName }) });
      if (res.ok) { setNewCategoryName(''); fetchCategories(); }
    } catch (err) { console.error(err); }
  };

  const handleDeleteCategory = async (id: number) => {
    if (!window.confirm('¿Eliminar esta categoría?')) return;
    try {
      const res = await fetch(`http://localhost:3000/categories/${id}`, { method: 'DELETE' });
      if (res.ok) { fetchCategories(); fetchUserData(); }
    } catch (err) { console.error(err); }
  };

  const handleAddAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAccountName.trim() || !newAccountBalance) return;
    try {
      const res = await fetch('http://localhost:3000/accounts', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: newAccountName, balance: parseFloat(newAccountBalance), userId: user.id }) });
      if (res.ok) { setNewAccountName(''); setNewAccountBalance(''); fetchUserData(); }
    } catch (err) { console.error(err); }
  };

  const handleDeleteAccount = async (id: number) => {
    if (!window.confirm('🚨 ¡ATENCIÓN! Se borrarán todos los movimientos y activos asociados.')) return;
    try {
      const res = await fetch(`http://localhost:3000/accounts/${id}`, { method: 'DELETE' });
      if (res.ok) { if (accountId === id.toString()) setAccountId(''); fetchUserData(); }
    } catch (err) { console.error(err); }
  };

  const handleAddAsset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAssetName.trim() || !newAssetBalance || !newAssetAccountId) return;
    try {
      const res = await fetch('http://localhost:3000/assets', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: newAssetName, symbol: newAssetSymbol, balance: parseFloat(newAssetBalance), accountId: parseInt(newAssetAccountId) }) });
      if (res.ok) { setNewAssetName(''); setNewAssetSymbol(''); setNewAssetBalance(''); fetchUserData(); }
    } catch (err) { console.error(err); }
  };

  const handleDeleteAsset = async (id: number) => {
    if (!window.confirm('🚨 ¿Estás seguro de que quieres eliminar este activo y todos sus registros?')) return;
    try {
      const res = await fetch(`http://localhost:3000/assets/${id}`, { method: 'DELETE' });
      if (res.ok) fetchUserData();
    } catch (err) { console.error(err); }
  };

  const handleAddReturn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!returnAssetId || !returnAmount) return;
    const selectedAsset = allAssets.find((a: any) => a.id.toString() === returnAssetId);
    if (!selectedAsset) return;
    try {
      const res = await fetch('http://localhost:3000/transactions', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ description: `Rendimiento: ${selectedAsset.name}`, amount: parseFloat(returnAmount), type: returnType, accountId: selectedAsset.accountId, assetId: selectedAsset.id }) });
      if (res.ok) { setReturnAmount(''); fetchUserData(); }
    } catch (err) { console.error(err); }
  };

  const handleAddContribution = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contributionAssetId || !contributionAmount || !contributionOriginAccountId) return;
    const selectedAsset = allAssets.find((a: any) => a.id.toString() === contributionAssetId);
    if (!selectedAsset) return;
    try {
      const res = await fetch('http://localhost:3000/transactions', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          description: selectedAsset.name, amount: parseFloat(contributionAmount),
          type: 'CONTRIBUTION', accountId: selectedAsset.accountId, assetId: selectedAsset.id,
          originAccountId: parseInt(contributionOriginAccountId)
        }),
      });
      if (res.ok) { setContributionAmount(''); fetchUserData(); }
    } catch (err) { console.error(err); }
  };

  // --- CÁLCULOS PRINCIPALES ---
  const allAssets = user ? user.accounts.flatMap((acc: any) => (acc.assets || []).map((asset: any) => ({ ...asset, accountName: acc.name }))) : [];
  const totalNetWorth = user ? user.accounts.reduce((sum: number, acc: any) => sum + acc.balance, 0) : 0;
  const totalInvested = allAssets.reduce((sum: number, asset: any) => sum + asset.balance, 0);
  const totalLiquidity = totalNetWorth - totalInvested;

  const allTransactions = user ? user.accounts.flatMap((acc: any) => acc.transactions || []) : [];
  allTransactions.sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());
  
  const recentTransactions = allTransactions.slice(0, 5); 

  const filteredTransactions = allTransactions.filter((tx: any) => {
    const matchesSearch = tx.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'ALL' || tx.type === filterType;
    const matchesMin = filterMin === '' || tx.amount >= parseFloat(filterMin);
    const matchesMax = filterMax === '' || tx.amount <= parseFloat(filterMax);
    const matchesCategory = filterCategory === 'ALL' || (filterCategory === 'NONE' && !tx.category) || (tx.category && tx.category.id === parseInt(filterCategory));
    return matchesSearch && matchesType && matchesMin && matchesMax && matchesCategory;
  });

  // --- RENDERIZADO VISUAL CON CLERK ---
  return (
    <div className="min-h-screen bg-gray-100 font-sans">
      
      <SignedOut>
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-4">
          <div className="mb-8 text-center">
            <h1 className="text-4xl font-extrabold text-blue-600 mb-2">Finance Tracker</h1>
            <p className="text-gray-500">Inicia sesión para gestionar tu patrimonio</p>
          </div>
          <SignIn routing="hash" />
        </div>
      </SignedOut>

      <SignedIn>
        {user ? (
          <div className="p-8">
            <div className="max-w-6xl mx-auto space-y-8">
              
              <header className="flex flex-col md:flex-row justify-between items-center md:items-end border-b border-gray-300 pb-4 gap-4">
                <div className="flex items-center gap-4">
                  <UserButton afterSignOutUrl="/" />
                  <h1 className="text-3xl font-bold text-gray-800">Hola, {user.name} 👋</h1>
                </div>
                <nav className="flex flex-wrap gap-2">
                  <button onClick={() => setActiveTab('dashboard')} className={`px-4 py-2 font-bold rounded-lg transition-colors cursor-pointer ${activeTab === 'dashboard' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600 hover:bg-gray-300'}`}>Dashboard</button>
                  <button onClick={() => setActiveTab('transactions')} className={`px-4 py-2 font-bold rounded-lg transition-colors cursor-pointer ${activeTab === 'transactions' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600 hover:bg-gray-300'}`}>Movimientos</button>
                  <button onClick={() => setActiveTab('investments')} className={`px-4 py-2 font-bold rounded-lg transition-colors cursor-pointer ${activeTab === 'investments' ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-600 hover:bg-gray-300'}`}>Inversiones</button>
                  <button onClick={() => setActiveTab('accounts')} className={`px-4 py-2 font-bold rounded-lg transition-colors cursor-pointer ${activeTab === 'accounts' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600 hover:bg-gray-300'}`}>Cuentas</button>
                  <button onClick={() => setActiveTab('analytics')} className={`px-4 py-2 font-bold rounded-lg transition-colors cursor-pointer ${activeTab === 'analytics' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600 hover:bg-gray-300'}`}>Estadísticas</button>
                </nav>
              </header>

              {/* VISTA 1: DASHBOARD */}
              {activeTab === 'dashboard' && (
                <div className="space-y-8 animate-fade-in">
                  <div className="bg-blue-600 text-white p-6 rounded-2xl shadow-lg">
                    <h2 className="text-blue-100 text-sm uppercase tracking-wider font-semibold mb-1">Patrimonio Total</h2>
                    <p className="text-5xl font-bold mb-4">{totalNetWorth.toFixed(2)} €</p>
                    <div className="flex gap-8 border-t border-blue-500 pt-4 mt-2">
                      <div>
                        <p className="text-blue-200 text-xs uppercase font-bold tracking-wider mb-1">Liquidez (Cuentas)</p>
                        <p className="text-2xl font-semibold">{totalLiquidity.toFixed(2)} €</p>
                      </div>
                      <div>
                        <p className="text-indigo-200 text-xs uppercase font-bold tracking-wider mb-1">Invertido (Cartera)</p>
                        <p className="text-2xl font-semibold">{totalInvested.toFixed(2)} €</p>
                      </div>
                    </div>
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
                      <h3 className="text-xl font-bold text-gray-800 mb-4">Añadir Movimiento Rápido</h3>
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
                      <h3 className="text-xl font-bold text-gray-800 mb-4">Últimos Movimientos</h3>
                      <div className="bg-white rounded-xl shadow border border-gray-100 overflow-hidden h-80 overflow-y-auto">
                        {recentTransactions.length === 0 ? (
                          <div className="p-6 text-center text-gray-500">No hay movimientos todavía.</div>
                        ) : (
                          recentTransactions.map((tx: any) => (
                            <div key={tx.id} className="p-4 border-b border-gray-100 flex justify-between items-center hover:bg-gray-50">
                              <div>
                                <p className="font-semibold text-gray-800">
                                  {tx.description}
                                  {tx.category && <span className="ml-2 text-xs bg-gray-200 text-gray-600 px-2 py-1 rounded-full">{tx.category.name}</span>}
                                  {tx.type === 'CONTRIBUTION' && <span className="ml-2 text-[10px] bg-blue-100 text-blue-700 px-2 py-1 rounded-full font-bold uppercase">Aportación</span>}
                                  {tx.type === 'TRANSFER_OUT' && <span className="ml-2 text-[10px] bg-gray-100 text-gray-500 px-2 py-1 rounded-full font-bold uppercase">Traspaso</span>}
                                  {tx.type !== 'CONTRIBUTION' && tx.type !== 'TRANSFER_OUT' && tx.assetId && <span className="ml-2 text-xs bg-indigo-100 text-indigo-700 px-2 py-1 rounded-full font-bold">Rendimiento</span>}
                                </p>
                                <p className="text-xs text-gray-500 mt-1">{new Date(tx.date).toLocaleDateString()}</p>
                              </div>
                              <span className={`font-bold ${tx.type === 'EXPENSE' || tx.type === 'TRANSFER_OUT' ? 'text-red-500' : tx.type === 'CONTRIBUTION' ? 'text-blue-500' : 'text-green-500'}`}>
                                {tx.type === 'EXPENSE' || tx.type === 'TRANSFER_OUT' ? '-' : '+'}{tx.amount.toFixed(2)} €
                              </span>
                            </div>
                          ))
                        )}
                      </div>
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
                </div>
              )}

              {/* VISTA 2: INVERSIONES */}
              {activeTab === 'investments' && (
                <div className="grid md:grid-cols-2 gap-8 animate-fade-in">
                  <div className="space-y-8">
                    
                    {/* Crear Activo */}
                    <div>
                      <h3 className="text-xl font-bold text-gray-800 mb-4">Añadir Nuevo Activo</h3>
                      <form onSubmit={handleAddAsset} className="bg-white p-6 rounded-xl shadow border border-gray-100 space-y-4 border-l-4 border-indigo-500">
                        <div className="flex gap-4">
                          <div className="flex-[2] w-full">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
                            <input type="text" required value={newAssetName} onChange={(e) => setNewAssetName(e.target.value)} placeholder="Ej: S&P 500" className="w-full border border-gray-300 rounded-lg p-2 outline-none focus:ring-2 focus:ring-indigo-500" />
                          </div>
                          <div className="flex-1">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Símbolo (Opc)</label>
                            <input type="text" value={newAssetSymbol} onChange={(e) => setNewAssetSymbol(e.target.value)} placeholder="Ej: SPY" className="w-full border border-gray-300 rounded-lg p-2 outline-none focus:ring-2 focus:ring-indigo-500 uppercase" />
                          </div>
                        </div>
                        <div className="flex gap-4">
                          <div className="flex-1">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Inversión Inicial (€)</label>
                            <input type="number" step="0.01" required value={newAssetBalance} onChange={(e) => setNewAssetBalance(e.target.value)} className="w-full border border-gray-300 rounded-lg p-2 outline-none focus:ring-2 focus:ring-indigo-500" />
                          </div>
                          <div className="flex-1">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Cuenta Asociada</label>
                            <select value={newAssetAccountId} onChange={(e) => setNewAssetAccountId(e.target.value)} className="w-full border border-gray-300 rounded-lg p-2 outline-none bg-white focus:ring-2 focus:ring-indigo-500">
                              {user.accounts.map((account: any) => <option key={account.id} value={account.id}>{account.name}</option>)}
                            </select>
                          </div>
                        </div>
                        <button type="submit" className="w-full bg-indigo-600 text-white font-bold py-3 rounded-lg hover:bg-indigo-700 transition-colors cursor-pointer mt-2">Crear Activo</button>
                      </form>
                    </div>

                    {/* Aportación Periódica */}
                    <div>
                      <h3 className="text-xl font-bold text-gray-800 mb-4">Aportación de Capital</h3>
                      <form onSubmit={handleAddContribution} className="bg-white p-6 rounded-xl shadow border border-gray-100 space-y-4 border-l-4 border-blue-500">
                        {allAssets.length === 0 ? (
                          <p className="text-gray-500 text-sm">Añade un activo arriba primero.</p>
                        ) : (
                          <>
                            <div className="flex gap-4">
                              <div className="flex-[2]">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Invertir en (Destino)</label>
                                <select value={contributionAssetId} onChange={(e) => setContributionAssetId(e.target.value)} className="w-full border border-gray-300 rounded-lg p-2 outline-none bg-white focus:ring-2 focus:ring-blue-500">
                                  <option value="">-- Selecciona activo --</option>
                                  {allAssets.map((asset: any) => <option key={asset.id} value={asset.id}>{asset.name}</option>)}
                                </select>
                              </div>
                              <div className="flex-1">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Cantidad (€)</label>
                                <input type="number" step="0.01" required value={contributionAmount} onChange={(e) => setContributionAmount(e.target.value)} placeholder="0.00" className="w-full border border-gray-300 rounded-lg p-2 outline-none focus:ring-2 focus:ring-blue-500" />
                              </div>
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Cuenta Origen (El dinero sale de aquí)</label>
                              <select value={contributionOriginAccountId} onChange={(e) => setContributionOriginAccountId(e.target.value)} className="w-full border border-gray-300 rounded-lg p-2 outline-none bg-white focus:ring-2 focus:ring-blue-500">
                                {user.accounts.map((account: any) => <option key={account.id} value={account.id}>{account.name} (Disp: {account.balance.toFixed(2)}€)</option>)}
                              </select>
                            </div>
                            <button type="submit" className="w-full bg-blue-600 text-white font-bold py-3 rounded-lg hover:bg-blue-700 transition-colors cursor-pointer mt-2 disabled:bg-gray-400" disabled={!contributionAssetId || !contributionOriginAccountId}>Registrar Aportación</button>
                          </>
                        )}
                      </form>
                    </div>

                    {/* Rendimiento */}
                    <div>
                      <h3 className="text-xl font-bold text-gray-800 mb-4">Registrar Rendimiento (Bolsa)</h3>
                      <form onSubmit={handleAddReturn} className="bg-white p-6 rounded-xl shadow border border-gray-100 space-y-4 border-l-4 border-green-500">
                        {allAssets.length === 0 ? (
                          <p className="text-gray-500 text-sm">Añade un activo arriba primero.</p>
                        ) : (
                          <>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Selecciona el Activo</label>
                              <select value={returnAssetId} onChange={(e) => setReturnAssetId(e.target.value)} className="w-full border border-gray-300 rounded-lg p-2 outline-none bg-white focus:ring-2 focus:ring-green-500">
                                <option value="">-- Elige un activo --</option>
                                {allAssets.map((asset: any) => <option key={asset.id} value={asset.id}>{asset.name}</option>)}
                              </select>
                            </div>
                            <div className="flex gap-4">
                              <div className="flex-1">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Rendimiento neto (€)</label>
                                <input type="number" step="0.01" required value={returnAmount} onChange={(e) => setReturnAmount(e.target.value)} placeholder="Ej: 50.00" className="w-full border border-gray-300 rounded-lg p-2 outline-none focus:ring-2 focus:ring-green-500" />
                              </div>
                              <div className="flex-1">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Evolución</label>
                                <select value={returnType} onChange={(e) => setReturnType(e.target.value)} className="w-full border border-gray-300 rounded-lg p-2 outline-none bg-white focus:ring-2 focus:ring-green-500 font-bold">
                                  <option value="INCOME" className="text-green-600">📈 Sube (Plusvalía)</option>
                                  <option value="EXPENSE" className="text-red-600">📉 Baja (Minusvalía)</option>
                                </select>
                              </div>
                            </div>
                            <button type="submit" className="w-full bg-gray-800 text-white font-bold py-3 rounded-lg hover:bg-black transition-colors cursor-pointer mt-2 disabled:bg-gray-400" disabled={!returnAssetId}>Guardar Evolución</button>
                          </>
                        )}
                      </form>
                    </div>

                  </div>

                  <div>
                    <h3 className="text-xl font-bold text-gray-800 mb-4">Tu Cartera de Inversión</h3>
                    <div className="bg-white rounded-xl shadow border border-gray-100 overflow-hidden sticky top-8">
                      <div className="bg-indigo-50 p-4 border-b border-indigo-100 flex justify-between items-center">
                        <span className="font-bold text-indigo-900">Total Invertido</span>
                        <span className="text-2xl font-black text-indigo-700">{totalInvested.toFixed(2)} €</span>
                      </div>
                      {allAssets.length === 0 ? (
                        <div className="p-10 text-center text-gray-500">Aún no tienes activos registrados.</div>
                      ) : (
                        <div className="divide-y divide-gray-100">
                          {allAssets.map((asset: any) => (
                            <div key={asset.id} className="p-5 hover:bg-gray-50 transition-colors flex justify-between items-center">
                              <div>
                                <div className="flex items-center gap-2">
                                  <p className="font-bold text-gray-800 text-lg">{asset.name}</p>
                                  {asset.symbol && <span className="bg-gray-200 text-gray-700 text-xs px-2 py-1 rounded font-bold tracking-wider">{asset.symbol}</span>}
                                </div>
                                <p className="text-sm text-gray-500 mt-1">🏦 En: {asset.accountName}</p>
                              </div>
                              <div className="flex items-center gap-4">
                                <p className="text-xl font-bold text-gray-900">{asset.balance.toFixed(2)} €</p>
                                <button onClick={() => handleDeleteAsset(asset.id)} className="text-gray-300 hover:text-red-500 font-bold p-2 cursor-pointer text-lg" title="Borrar activo y su historial">✕</button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* VISTA 3: GESTIÓN DE MOVIMIENTOS */}
              {activeTab === 'transactions' && (
                <div className="space-y-6 animate-fade-in">
                  <div className="bg-white p-6 rounded-xl shadow border border-gray-100 space-y-4">
                    <h3 className="font-bold text-gray-800 border-b pb-2">Filtros de búsqueda</h3>
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                      <div>
                        <label className="block text-xs text-gray-500 uppercase font-bold mb-1">Buscar nombre</label>
                        <input type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full border border-gray-300 rounded p-2 text-sm outline-none focus:ring-1 focus:ring-blue-500" />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500 uppercase font-bold mb-1">Tipo</label>
                        <select value={filterType} onChange={(e) => setFilterType(e.target.value)} className="w-full border border-gray-300 rounded p-2 text-sm bg-white outline-none focus:ring-1 focus:ring-blue-500">
                          <option value="ALL">Todos</option>
                          <option value="EXPENSE">Gastos</option>
                          <option value="INCOME">Ingresos</option>
                          <option value="CONTRIBUTION">Aportaciones</option>
                          <option value="TRANSFER_OUT">Traspasos</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500 uppercase font-bold mb-1">Categoría</label>
                        <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)} className="w-full border border-gray-300 rounded p-2 text-sm bg-white outline-none focus:ring-1 focus:ring-blue-500">
                          <option value="ALL">Todas</option>
                          <option value="NONE">Sin categoría</option>
                          {categories.map((cat: any) => <option key={cat.id} value={cat.id.toString()}>{cat.name}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500 uppercase font-bold mb-1">Min €</label>
                        <input type="number" value={filterMin} onChange={(e) => setFilterMin(e.target.value)} className="w-full border border-gray-300 rounded p-2 text-sm outline-none" />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500 uppercase font-bold mb-1">Max €</label>
                        <input type="number" value={filterMax} onChange={(e) => setFilterMax(e.target.value)} className="w-full border border-gray-300 rounded p-2 text-sm outline-none" />
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-xl shadow border border-gray-100 overflow-hidden overflow-x-auto">
                    {filteredTransactions.length === 0 ? (
                      <div className="p-10 text-center text-gray-500 font-medium">No se encontraron movimientos.</div>
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
                              <td className="p-4 font-medium text-gray-800">
                                {tx.description}
                                {tx.type === 'CONTRIBUTION' && <span className="ml-2 text-[10px] bg-blue-100 text-blue-700 px-2 py-1 rounded-full font-bold uppercase">Aportación</span>}
                                {tx.type === 'TRANSFER_OUT' && <span className="ml-2 text-[10px] bg-gray-100 text-gray-500 px-2 py-1 rounded-full font-bold uppercase">Traspaso</span>}
                                {tx.type !== 'CONTRIBUTION' && tx.type !== 'TRANSFER_OUT' && tx.assetId && <span className="ml-2 text-[10px] bg-indigo-100 text-indigo-700 px-2 py-1 rounded-full font-bold uppercase">Rendimiento</span>}
                              </td>
                              <td className="p-4">
                                <select 
                                  value={tx.category?.id || ''}
                                  onChange={(e) => handleUpdateTransactionCategory(tx.id, e.target.value)}
                                  className="border border-gray-200 rounded text-sm p-1 bg-white outline-none cursor-pointer hover:border-blue-400 disabled:opacity-50"
                                  disabled={!!tx.assetId || tx.type === 'TRANSFER_OUT'} 
                                >
                                  <option value="">Sin categoría</option>
                                  {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                                </select>
                              </td>
                              <td className={`p-4 text-right font-bold ${tx.type === 'EXPENSE' || tx.type === 'TRANSFER_OUT' ? 'text-red-500' : tx.type === 'CONTRIBUTION' ? 'text-blue-500' : 'text-green-500'}`}>
                                {tx.type === 'EXPENSE' || tx.type === 'TRANSFER_OUT' ? '-' : '+'}{tx.amount.toFixed(2)} €
                              </td>
                              <td className="p-4 text-center">
                                <button onClick={() => handleDelete(tx.id)} className="text-gray-400 hover:text-red-600 p-2 font-bold bg-gray-100 hover:bg-red-50 rounded-lg text-sm cursor-pointer">Eliminar</button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                </div>
              )}

              {/* VISTA 4: GESTIÓN DE CUENTAS */}
              {activeTab === 'accounts' && (
                <div className="grid md:grid-cols-2 gap-8 animate-fade-in">
                  <div>
                    <h3 className="text-xl font-bold text-gray-800 mb-4">Añadir Nueva Cuenta</h3>
                    <form onSubmit={handleAddAccount} className="bg-white p-6 rounded-xl shadow border border-gray-100 space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Nombre de la cuenta</label>
                        <input type="text" required value={newAccountName} onChange={(e) => setNewAccountName(e.target.value)} className="w-full border border-gray-300 rounded-lg p-2 outline-none focus:ring-2 focus:ring-blue-500" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Saldo Inicial (€)</label>
                        <input type="number" step="0.01" required value={newAccountBalance} onChange={(e) => setNewAccountBalance(e.target.value)} className="w-full border border-gray-300 rounded-lg p-2 outline-none focus:ring-2 focus:ring-blue-500" />
                      </div>
                      <button type="submit" className="w-full bg-blue-600 text-white font-bold py-3 rounded-lg hover:bg-blue-700 transition-colors cursor-pointer mt-2">Añadir Cuenta</button>
                    </form>
                  </div>

                  <div>
                    <h3 className="text-xl font-bold text-gray-800 mb-4">Tus Cuentas Activas</h3>
                    <div className="bg-white rounded-xl shadow border border-gray-100 overflow-hidden">
                      {user.accounts.map((acc: any) => (
                        <div key={acc.id} className="p-4 flex justify-between items-center hover:bg-gray-50 border-b">
                          <div>
                            <p className="font-bold text-gray-800">{acc.name}</p>
                            <p className="text-sm text-gray-500">Movimientos: {acc.transactions?.length || 0} | Activos: {acc.assets?.length || 0}</p>
                          </div>
                          <div className="flex items-center gap-4">
                            <span className="font-bold text-lg text-gray-900">{acc.balance.toFixed(2)} €</span>
                            <button onClick={() => handleDeleteAccount(acc.id)} className="text-gray-300 hover:text-red-500 font-bold p-2 cursor-pointer text-lg">✕</button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* VISTA 5 : ESTADÍSTICAS */}
              {activeTab === 'analytics' && (
                <AnalyticsView allTransactions={allTransactions} allAssets={allAssets} />
              )}

            </div>
          </div>
        ) : (
          <div className="min-h-screen flex items-center justify-center bg-gray-100">
            <div className="text-gray-500 animate-pulse">Cargando tus datos...</div>
          </div>
        )}
      </SignedIn>

    </div>
  );
}

export default App;