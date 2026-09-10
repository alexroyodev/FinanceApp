import { useState } from 'react';
import { useAuth } from '@clerk/clerk-react';

interface TransactionsViewProps {
  allTransactions: any[];
  categories: any[];
  onDataChange: () => void;
}

export default function TransactionsView({ allTransactions, categories, onDataChange }: TransactionsViewProps) {
  const { getToken } = useAuth();

  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('ALL');
  const [filterCategory, setFilterCategory] = useState('ALL'); 
  const [filterMin, setFilterMin] = useState('');
  const [filterMax, setFilterMax] = useState('');

  const handleDelete = async (id: number) => {
    if (!window.confirm('¿Eliminar este movimiento?')) return;
    try {
      const token = await getToken();
      const res = await fetch(`http://localhost:3000/transactions/${id}`, { 
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) onDataChange();
    } catch (err) { console.error(err); }
  };

  const handleUpdateTransactionCategory = async (txId: number, newCatId: string) => {
    try {
      const token = await getToken();
      const res = await fetch(`http://localhost:3000/transactions/${txId}/category`, { 
        method: 'PATCH', 
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        }, 
        body: JSON.stringify({ categoryId: newCatId }) 
      });
      if (res.ok) onDataChange();
    } catch (err) { console.error(err); }
  };

  const filteredTransactions = allTransactions.filter((tx: any) => {
    const matchesSearch = tx.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'ALL' || tx.type === filterType;
    const matchesMin = filterMin === '' || tx.amount >= parseFloat(filterMin);
    const matchesMax = filterMax === '' || tx.amount <= parseFloat(filterMax);
    const matchesCategory = filterCategory === 'ALL' || (filterCategory === 'NONE' && !tx.category) || (tx.category && tx.category.id === parseInt(filterCategory));
    return matchesSearch && matchesType && matchesMin && matchesMax && matchesCategory;
  });

  return (
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
  );
}