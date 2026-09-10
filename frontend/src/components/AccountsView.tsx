import { useState } from 'react';
import { useAuth } from '@clerk/clerk-react';

interface AccountsViewProps {
  user: any;
  onDataChange: () => void;
}

export default function AccountsView({ user, onDataChange }: AccountsViewProps) {
  const { getToken } = useAuth();

  const [newAccountName, setNewAccountName] = useState('');
  const [newAccountBalance, setNewAccountBalance] = useState('');

  const handleAddAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAccountName.trim() || !newAccountBalance) return;
    try {
      const token = await getToken();
      const res = await fetch('http://localhost:3000/accounts', { 
        method: 'POST', 
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        }, 
        body: JSON.stringify({ name: newAccountName, balance: parseFloat(newAccountBalance), userId: user.id }) 
      });
      if (res.ok) { 
        setNewAccountName(''); 
        setNewAccountBalance(''); 
        onDataChange(); 
      }
    } catch (err) { console.error(err); }
  };

  const handleDeleteAccount = async (id: number) => {
    if (!window.confirm('🚨 ¡ATENCIÓN! Se borrarán todos los movimientos y activos asociados.')) return;
    try {
      const token = await getToken();
      const res = await fetch(`http://localhost:3000/accounts/${id}`, { 
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) { onDataChange(); }
    } catch (err) { console.error(err); }
  };

  return (
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
  );
}