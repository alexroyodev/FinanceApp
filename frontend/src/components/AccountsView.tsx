import { useState } from 'react';
import { useAuth } from '@clerk/clerk-react';
import toast from 'react-hot-toast';

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

    if (parseFloat(newAccountBalance) < 0) {
      toast.error('El saldo inicial no puede ser negativo');
      return;
    }

    const loadingToast = toast.loading('Creando cuenta...');
    try {
      const token = await getToken();
      const res = await fetch('https://fintracker-api-9k8t.onrender.com/accounts', { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, 
        body: JSON.stringify({ name: newAccountName.trim(), balance: parseFloat(newAccountBalance), userId: user.id }) 
      });
      
      const data = await res.json();
      
      if (res.ok) { 
        setNewAccountName(''); 
        setNewAccountBalance(''); 
        toast.success('Cuenta creada con éxito', { id: loadingToast }); 
        onDataChange(); 
      } else {
        toast.error(data.error || 'Error al crear la cuenta', { id: loadingToast });
      }
    } catch (err) { 
      toast.error('Error de conexión con el servidor', { id: loadingToast }); 
    }
  };

  const handleDeleteAccount = async (id: number) => {
    if (!window.confirm('🚨 ¡ATENCIÓN! Se borrarán todos los movimientos y activos asociados.')) return;
    
    const loadingToast = toast.loading('Eliminando cuenta...');
    try {
      const token = await getToken();
      const res = await fetch(`https://fintracker-api-9k8t.onrender.com/accounts/${id}`, { 
        method: 'DELETE', 
        headers: { Authorization: `Bearer ${token}` } 
      });
      
      const data = await res.json();
      
      if (res.ok) { 
        toast.success('Cuenta y movimientos eliminados', { id: loadingToast }); 
        onDataChange(); 
      } else {
        toast.error(data.error || 'Error al eliminar', { id: loadingToast });
      }
    } catch (err) { 
      toast.error('Error de conexión con el servidor', { id: loadingToast }); 
    }
  };

  return (
    <div className="grid md:grid-cols-2 gap-8 animate-fade-in transition-colors">
      <div>
        <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-4">Añadir Nueva Cuenta</h3>
        <form onSubmit={handleAddAccount} className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow border border-gray-100 dark:border-gray-700 space-y-4 transition-colors">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nombre de la cuenta</label>
            <input type="text" required value={newAccountName} onChange={(e) => setNewAccountName(e.target.value)} className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white rounded-lg p-2 outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Saldo Inicial (€)</label>
            <input type="number" step="0.01" required value={newAccountBalance} onChange={(e) => setNewAccountBalance(e.target.value)} className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white rounded-lg p-2 outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <button type="submit" className="w-full bg-blue-600 text-white font-bold py-3 rounded-lg hover:bg-blue-700 transition-colors cursor-pointer mt-2">Añadir Cuenta</button>
        </form>
      </div>

      <div>
        <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-4">Tus Cuentas Activas</h3>
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow border border-gray-100 dark:border-gray-700 overflow-hidden transition-colors">
          {user.accounts.map((acc: any) => (
            <div key={acc.id} className="p-4 flex justify-between items-center hover:bg-gray-50 dark:hover:bg-gray-700 border-b border-gray-100 dark:border-gray-700 transition-colors">
              <div>
                <p className="font-bold text-gray-800 dark:text-white">{acc.name}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Movimientos: {acc.transactions?.length || 0} | Activos: {acc.assets?.length || 0}</p>
              </div>
              <div className="flex items-center gap-4">
                <span className="font-bold text-lg text-gray-900 dark:text-white">{acc.balance.toFixed(2)} €</span>
                <button onClick={() => handleDeleteAccount(acc.id)} className="text-gray-300 hover:text-red-500 dark:hover:text-red-400 font-bold p-2 cursor-pointer text-lg">✕</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}