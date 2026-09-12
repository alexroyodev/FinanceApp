import { useState } from 'react';
import { useAuth } from '@clerk/clerk-react';
import toast from 'react-hot-toast';

interface TransactionsViewProps {
  allTransactions: any[];
  categories: any[];
  accounts: any[];
  onDataChange: () => void;
}

export default function TransactionsView({ allTransactions, categories, accounts, onDataChange }: TransactionsViewProps) {
  const { getToken } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('ALL');
  const [filterCategory, setFilterCategory] = useState('ALL'); 
  const [filterAccount, setFilterAccount] = useState('ALL');
  const [filterMin, setFilterMin] = useState('');
  const [filterMax, setFilterMax] = useState('');

  const handleDelete = async (id: number) => {
    if (!window.confirm('¿Eliminar este movimiento?')) return;
    const loadingToast = toast.loading('Eliminando...');
    try {
      const token = await getToken();
      const res = await fetch(`https://fintracker-api-9k8t.onrender.com/transactions/${id}`, { 
        method: 'DELETE', headers: { Authorization: `Bearer ${token}` }
      });
      
      const data = await res.json();
      
      if (res.ok) {
        toast.success('Movimiento eliminado', { id: loadingToast });
        onDataChange();
      } else { 
        toast.error(data.error || 'Error al eliminar', { id: loadingToast }); 
      }
    } catch (err) { 
      toast.error('Error de conexión con el servidor', { id: loadingToast }); 
    }
  };

  const handleUpdateTransactionCategory = async (txId: number, newCatId: string) => {
    const loadingToast = toast.loading('Actualizando...');
    try {
      const token = await getToken();
      const res = await fetch(`https://fintracker-api-9k8t.onrender.com/transactions/${txId}/category`, { 
        method: 'PATCH', 
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, 
        body: JSON.stringify({ categoryId: newCatId }) 
      });
      
      const data = await res.json();
      
      if (res.ok) { 
        toast.success('Categoría actualizada', { id: loadingToast }); 
        onDataChange(); 
      } else {
        toast.error(data.error || 'Error al actualizar', { id: loadingToast });
      }
    } catch (err) { 
      toast.error('Error de conexión con el servidor', { id: loadingToast }); 
    }
  };

  const exportToCSV = () => {
    if (filteredTransactions.length === 0) { toast.error('No hay datos para exportar'); return; }
    const headers = ['Fecha', 'Descripción', 'Cuenta', 'Tipo', 'Categoría', 'Cantidad'];
    const rows = filteredTransactions.map((tx: any) => {
      const date = new Date(tx.date).toLocaleDateString();
      const desc = `"${tx.description.replace(/"/g, '""')}"`; 
      const accountName = accounts.find((acc: any) => acc.id === tx.accountId)?.name || 'Desconocida';
      const type = tx.type;
      const cat = tx.category ? tx.category.name : 'Sin categoría';
      const amount = tx.amount.toString();
      return [date, desc, accountName, type, cat, amount].join(',');
    });
    const csvContent = [headers.join(','), ...rows].join('\n');
    const blob = new Blob(["\uFEFF" + csvContent], { type: 'text/csv;charset=utf-8;' }); 
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `movimientos_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    toast.success('¡Archivo exportado con éxito!');
  };

  const filteredTransactions = allTransactions.filter((tx: any) => {
    const matchesSearch = tx.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'ALL' || tx.type === filterType;
    const matchesMin = filterMin === '' || tx.amount >= parseFloat(filterMin);
    const matchesMax = filterMax === '' || tx.amount <= parseFloat(filterMax);
    const matchesCategory = filterCategory === 'ALL' || (filterCategory === 'NONE' && !tx.category) || (tx.category && tx.category.id === parseInt(filterCategory));
    const matchesAccount = filterAccount === 'ALL' || tx.accountId === parseInt(filterAccount);
    
    return matchesSearch && matchesType && matchesMin && matchesMax && matchesCategory && matchesAccount;
  });

  return (
    <div className="space-y-6 animate-fade-in transition-colors">
      <div className="flex justify-end">
        <button onClick={exportToCSV} className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg flex items-center gap-2 transition-colors shadow-sm">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
          Exportar a Excel (CSV)
        </button>
      </div>

      <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow border border-gray-100 dark:border-gray-700 space-y-4 transition-colors">
        <h3 className="font-bold text-gray-800 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-2">Filtros de búsqueda</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <div>
            <label className="block text-xs text-gray-500 dark:text-gray-400 uppercase font-bold mb-1">Buscar nombre</label>
            <input type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white rounded p-2 text-sm outline-none focus:ring-1 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-xs text-gray-500 dark:text-gray-400 uppercase font-bold mb-1">Tipo</label>
            <select value={filterType} onChange={(e) => setFilterType(e.target.value)} className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white rounded p-2 text-sm outline-none focus:ring-1 focus:ring-blue-500">
              <option value="ALL">Todos</option>
              <option value="EXPENSE">Gastos</option>
              <option value="INCOME">Ingresos</option>
              <option value="CONTRIBUTION">Aportaciones</option>
              <option value="TRANSFER_OUT">Traspasos</option>
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-500 dark:text-gray-400 uppercase font-bold mb-1">Categoría</label>
            <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)} className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white rounded p-2 text-sm outline-none focus:ring-1 focus:ring-blue-500">
              <option value="ALL">Todas</option>
              <option value="NONE">Sin categoría</option>
              {categories.map((cat: any) => <option key={cat.id} value={cat.id.toString()}>{cat.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-500 dark:text-gray-400 uppercase font-bold mb-1">Cuenta</label>
            <select value={filterAccount} onChange={(e) => setFilterAccount(e.target.value)} className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white rounded p-2 text-sm outline-none focus:ring-1 focus:ring-blue-500">
              <option value="ALL">Todas</option>
              {accounts.map((acc: any) => <option key={acc.id} value={acc.id.toString()}>{acc.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-500 dark:text-gray-400 uppercase font-bold mb-1">Min €</label>
            <input type="number" value={filterMin} onChange={(e) => setFilterMin(e.target.value)} className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white rounded p-2 text-sm outline-none focus:ring-1 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-xs text-gray-500 dark:text-gray-400 uppercase font-bold mb-1">Max €</label>
            <input type="number" value={filterMax} onChange={(e) => setFilterMax(e.target.value)} className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white rounded p-2 text-sm outline-none focus:ring-1 focus:ring-blue-500" />
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow border border-gray-100 dark:border-gray-700 overflow-hidden overflow-x-auto transition-colors">
        {filteredTransactions.length === 0 ? (
          <div className="p-10 text-center text-gray-500 dark:text-gray-400 font-medium">No se encontraron movimientos.</div>
        ) : (
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-700 text-xs uppercase text-gray-500 dark:text-gray-400">
                <th className="p-4 font-bold">Fecha</th>
                <th className="p-4 font-bold">Descripción</th>
                <th className="p-4 font-bold">Cuenta</th>
                <th className="p-4 font-bold">Categoría</th>
                <th className="p-4 font-bold text-right">Importe</th>
                <th className="p-4 font-bold text-center">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredTransactions.map((tx: any) => (
                <tr key={tx.id} className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                  <td className="p-4 text-sm text-gray-600 dark:text-gray-400">{new Date(tx.date).toLocaleDateString()}</td>
                  <td className="p-4 font-medium text-gray-800 dark:text-white">
                    {tx.description}
                    {tx.type === 'CONTRIBUTION' && <span className="ml-2 text-[10px] bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-400 px-2 py-1 rounded-full font-bold uppercase">Aportación</span>}
                    {tx.type === 'TRANSFER_OUT' && <span className="ml-2 text-[10px] bg-gray-100 dark:bg-gray-600 text-gray-500 dark:text-gray-300 px-2 py-1 rounded-full font-bold uppercase">Traspaso</span>}
                    {tx.type !== 'CONTRIBUTION' && tx.type !== 'TRANSFER_OUT' && tx.assetId && <span className="ml-2 text-[10px] bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-400 px-2 py-1 rounded-full font-bold uppercase">Rendimiento</span>}
                  </td>
                  <td className="p-4 text-sm text-gray-500 dark:text-gray-300">
                    {accounts.find(acc => acc.id === tx.accountId)?.name || 'Desconocida'}
                  </td>
                  <td className="p-4">
                    <select 
                      value={tx.category?.id || ''}
                      onChange={(e) => handleUpdateTransactionCategory(tx.id, e.target.value)}
                      className="border border-gray-200 dark:border-gray-600 rounded text-sm p-1 bg-white dark:bg-gray-700 text-gray-900 dark:text-white outline-none cursor-pointer hover:border-blue-400 dark:hover:border-blue-500 disabled:opacity-50"
                      disabled={!!tx.assetId || tx.type === 'TRANSFER_OUT'} 
                    >
                      <option value="">Sin categoría</option>
                      {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                    </select>
                  </td>
                  <td className={`p-4 text-right font-bold ${tx.type === 'EXPENSE' || tx.type === 'TRANSFER_OUT' ? 'text-red-500 dark:text-red-400' : tx.type === 'CONTRIBUTION' ? 'text-blue-500 dark:text-blue-400' : 'text-green-500 dark:text-green-400'}`}>
                    {tx.type === 'EXPENSE' || tx.type === 'TRANSFER_OUT' ? '-' : '+'}{tx.amount.toFixed(2)} €
                  </td>
                  <td className="p-4 text-center">
                    <button onClick={() => handleDelete(tx.id)} className="text-gray-400 hover:text-red-600 dark:hover:text-red-400 p-2 font-bold bg-gray-100 dark:bg-gray-700 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg text-sm cursor-pointer transition-colors">Eliminar</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}