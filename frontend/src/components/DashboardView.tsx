import { useState, useEffect } from 'react';
import { useAuth } from '@clerk/clerk-react';

interface DashboardViewProps {
  user: any;
  categories: any[];
  recentTransactions: any[];
  totalNetWorth: number;
  totalLiquidity: number;
  totalInvested: number;
  onDataChange: () => void;
}

export default function DashboardView({ user, categories, recentTransactions, totalNetWorth, totalLiquidity, totalInvested, onDataChange }: DashboardViewProps) {
  const { getToken } = useAuth(); // 👇 Obtenemos la función del token

  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [type, setType] = useState('EXPENSE');
  const [accountId, setAccountId] = useState('');
  const [categoryId, setCategoryId] = useState('');
  
  const [newCategoryName, setNewCategoryName] = useState('');

  useEffect(() => {
    if (user && user.accounts.length > 0 && !accountId) {
      setAccountId(user.accounts[0].id.toString());
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); 
    const newTransaction: any = { description, amount: parseFloat(amount), type, accountId: parseInt(accountId) };
    if (categoryId) newTransaction.categoryId = parseInt(categoryId);
    try {
      const token = await getToken();
      const res = await fetch('http://localhost:3000/transactions', { 
        method: 'POST', 
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        }, 
        body: JSON.stringify(newTransaction) 
      });
      if (res.ok) { setDescription(''); setAmount(''); setCategoryId(''); onDataChange(); }
    } catch (err) { console.error('Error:', err); }
  };

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategoryName.trim()) return;
    try {
      const token = await getToken();
      const res = await fetch('http://localhost:3000/categories', { 
        method: 'POST', 
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        }, 
        body: JSON.stringify({ name: newCategoryName }) 
      });
      if (res.ok) { setNewCategoryName(''); onDataChange(); }
    } catch (err) { console.error(err); }
  };

  const handleDeleteCategory = async (id: number) => {
    if (!window.confirm('¿Eliminar esta categoría?')) return;
    try {
      const token = await getToken();
      const res = await fetch(`http://localhost:3000/categories/${id}`, { 
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) onDataChange();
    } catch (err) { console.error(err); }
  };

  return (
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
  );
}