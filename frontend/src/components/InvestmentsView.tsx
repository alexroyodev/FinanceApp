import { useState, useEffect } from 'react';
import { useAuth } from '@clerk/clerk-react';
import toast from 'react-hot-toast';

interface InvestmentsViewProps {
  user: any;
  allAssets: any[];
  totalInvested: number;
  onDataChange: () => void;
}

export default function InvestmentsView({ user, allAssets, totalInvested, onDataChange }: InvestmentsViewProps) {
  const { getToken } = useAuth();
  const [newAssetName, setNewAssetName] = useState('');
  const [newAssetSymbol, setNewAssetSymbol] = useState('');
  const [newAssetBalance, setNewAssetBalance] = useState('');
  const [newAssetAccountId, setNewAssetAccountId] = useState('');
  const [contributionAmount, setContributionAmount] = useState('');
  const [contributionAssetId, setContributionAssetId] = useState('');
  const [contributionOriginAccountId, setContributionOriginAccountId] = useState('');
  const [returnAmount, setReturnAmount] = useState('');
  const [returnType, setReturnType] = useState('INCOME'); 
  const [returnAssetId, setReturnAssetId] = useState('');

  useEffect(() => {
    if (user && user.accounts.length > 0) {
      if (!newAssetAccountId) setNewAssetAccountId(user.accounts[0].id.toString());
      if (!contributionOriginAccountId) setContributionOriginAccountId(user.accounts[0].id.toString());
    }
  }, [user]);

  const handleAddAsset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAssetName.trim() || !newAssetBalance || !newAssetAccountId) return;
    try {
      const token = await getToken();
      const res = await fetch('http://localhost:3000/assets', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ name: newAssetName, symbol: newAssetSymbol, balance: parseFloat(newAssetBalance), accountId: parseInt(newAssetAccountId) }) });
      if (res.ok) { setNewAssetName(''); setNewAssetSymbol(''); setNewAssetBalance(''); toast.success('Activo creado correctamente'); onDataChange(); }
    } catch (err) { toast.error('Error al crear activo'); }
  };

  const handleDeleteAsset = async (id: number) => {
    if (!window.confirm('🚨 ¿Eliminar este activo y todos sus registros?')) return;
    try {
      const token = await getToken();
      const res = await fetch(`http://localhost:3000/assets/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) { toast.success('Activo eliminado'); onDataChange(); }
    } catch (err) { toast.error('Error al eliminar'); }
  };

  const handleAddContribution = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contributionAssetId || !contributionAmount || !contributionOriginAccountId) return;
    const selectedAsset = allAssets.find((a: any) => a.id.toString() === contributionAssetId);
    if (!selectedAsset) return;
    try {
      const token = await getToken();
      const res = await fetch('http://localhost:3000/transactions', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ description: selectedAsset.name, amount: parseFloat(contributionAmount), type: 'CONTRIBUTION', accountId: selectedAsset.accountId, assetId: selectedAsset.id, originAccountId: parseInt(contributionOriginAccountId) }) });
      if (res.ok) { setContributionAmount(''); toast.success('Aportación registrada'); onDataChange(); }
    } catch (err) { toast.error('Error al registrar aportación'); }
  };

  const handleAddReturn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!returnAssetId || !returnAmount) return;
    const selectedAsset = allAssets.find((a: any) => a.id.toString() === returnAssetId);
    if (!selectedAsset) return;
    try {
      const token = await getToken();
      const res = await fetch('http://localhost:3000/transactions', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ description: `Rendimiento: ${selectedAsset.name}`, amount: parseFloat(returnAmount), type: returnType, accountId: selectedAsset.accountId, assetId: selectedAsset.id }) });
      if (res.ok) { setReturnAmount(''); toast.success('Evolución registrada'); onDataChange(); }
    } catch (err) { toast.error('Error al registrar evolución'); }
  };

  return (
    <div className="grid md:grid-cols-2 gap-8 animate-fade-in transition-colors">
      <div className="space-y-8">
        <div>
          <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-4">Añadir Nuevo Activo</h3>
          <form onSubmit={handleAddAsset} className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow border border-gray-100 dark:border-gray-700 space-y-4 border-l-4 border-indigo-500 transition-colors">
            <div className="flex gap-4">
              <div className="flex-[2] w-full">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nombre</label>
                <input type="text" required value={newAssetName} onChange={(e) => setNewAssetName(e.target.value)} placeholder="Ej: S&P 500" className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white rounded-lg p-2 outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Símbolo (Opc)</label>
                <input type="text" value={newAssetSymbol} onChange={(e) => setNewAssetSymbol(e.target.value)} placeholder="Ej: SPY" className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white rounded-lg p-2 outline-none focus:ring-2 focus:ring-indigo-500 uppercase" />
              </div>
            </div>
            <div className="flex gap-4">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Inversión Inicial (€)</label>
                <input type="number" step="0.01" required value={newAssetBalance} onChange={(e) => setNewAssetBalance(e.target.value)} className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white rounded-lg p-2 outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Cuenta Asociada</label>
                <select value={newAssetAccountId} onChange={(e) => setNewAssetAccountId(e.target.value)} className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white rounded-lg p-2 outline-none focus:ring-2 focus:ring-indigo-500">
                  {user.accounts.map((account: any) => <option key={account.id} value={account.id}>{account.name}</option>)}
                </select>
              </div>
            </div>
            <button type="submit" className="w-full bg-indigo-600 text-white font-bold py-3 rounded-lg hover:bg-indigo-700 transition-colors cursor-pointer mt-2">Crear Activo</button>
          </form>
        </div>

        <div>
          <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-4">Aportación de Capital</h3>
          <form onSubmit={handleAddContribution} className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow border border-gray-100 dark:border-gray-700 space-y-4 border-l-4 border-blue-500 transition-colors">
            {allAssets.length === 0 ? (
              <p className="text-gray-500 dark:text-gray-400 text-sm">Añade un activo arriba primero.</p>
            ) : (
              <>
                <div className="flex gap-4">
                  <div className="flex-[2]">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Invertir en (Destino)</label>
                    <select value={contributionAssetId} onChange={(e) => setContributionAssetId(e.target.value)} className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white rounded-lg p-2 outline-none focus:ring-2 focus:ring-blue-500">
                      <option value="">-- Selecciona activo --</option>
                      {allAssets.map((asset: any) => <option key={asset.id} value={asset.id}>{asset.name}</option>)}
                    </select>
                  </div>
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Cantidad (€)</label>
                    <input type="number" step="0.01" required value={contributionAmount} onChange={(e) => setContributionAmount(e.target.value)} placeholder="0.00" className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white rounded-lg p-2 outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Cuenta Origen (El dinero sale de aquí)</label>
                  <select value={contributionOriginAccountId} onChange={(e) => setContributionOriginAccountId(e.target.value)} className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white rounded-lg p-2 outline-none focus:ring-2 focus:ring-blue-500">
                    {user.accounts.map((account: any) => <option key={account.id} value={account.id}>{account.name} (Disp: {account.balance.toFixed(2)}€)</option>)}
                  </select>
                </div>
                <button type="submit" className="w-full bg-blue-600 text-white font-bold py-3 rounded-lg hover:bg-blue-700 transition-colors cursor-pointer mt-2 disabled:bg-gray-600 disabled:text-gray-400" disabled={!contributionAssetId || !contributionOriginAccountId}>Registrar Aportación</button>
              </>
            )}
          </form>
        </div>

        <div>
          <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-4">Registrar Rendimiento (Bolsa)</h3>
          <form onSubmit={handleAddReturn} className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow border border-gray-100 dark:border-gray-700 space-y-4 border-l-4 border-green-500 transition-colors">
            {allAssets.length === 0 ? (
              <p className="text-gray-500 dark:text-gray-400 text-sm">Añade un activo arriba primero.</p>
            ) : (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Selecciona el Activo</label>
                  <select value={returnAssetId} onChange={(e) => setReturnAssetId(e.target.value)} className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white rounded-lg p-2 outline-none focus:ring-2 focus:ring-green-500">
                    <option value="">-- Elige un activo --</option>
                    {allAssets.map((asset: any) => <option key={asset.id} value={asset.id}>{asset.name}</option>)}
                  </select>
                </div>
                <div className="flex gap-4">
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Rendimiento neto (€)</label>
                    <input type="number" step="0.01" required value={returnAmount} onChange={(e) => setReturnAmount(e.target.value)} placeholder="Ej: 50.00" className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white rounded-lg p-2 outline-none focus:ring-2 focus:ring-green-500" />
                  </div>
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Evolución</label>
                    <select value={returnType} onChange={(e) => setReturnType(e.target.value)} className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white rounded-lg p-2 outline-none focus:ring-2 focus:ring-green-500 font-bold">
                      <option value="INCOME" className="text-green-600 dark:text-green-400">📈 Sube (Plusvalía)</option>
                      <option value="EXPENSE" className="text-red-600 dark:text-red-400">📉 Baja (Minusvalía)</option>
                    </select>
                  </div>
                </div>
                <button type="submit" className="w-full bg-gray-800 dark:bg-gray-600 text-white font-bold py-3 rounded-lg hover:bg-black dark:hover:bg-gray-500 transition-colors cursor-pointer mt-2 disabled:bg-gray-700 disabled:text-gray-500" disabled={!returnAssetId}>Guardar Evolución</button>
              </>
            )}
          </form>
        </div>
      </div>

      <div>
        <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-4">Tu Cartera de Inversión</h3>
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow border border-gray-100 dark:border-gray-700 overflow-hidden sticky top-8 transition-colors">
          <div className="bg-indigo-50 dark:bg-indigo-900/30 p-4 border-b border-indigo-100 dark:border-indigo-800 flex justify-between items-center transition-colors">
            <span className="font-bold text-indigo-900 dark:text-indigo-200">Total Invertido</span>
            <span className="text-2xl font-black text-indigo-700 dark:text-indigo-400">{totalInvested.toFixed(2)} €</span>
          </div>
          {allAssets.length === 0 ? (
            <div className="p-10 text-center text-gray-500 dark:text-gray-400">Aún no tienes activos registrados.</div>
          ) : (
            <div className="divide-y divide-gray-100 dark:divide-gray-700">
              {allAssets.map((asset: any) => (
                <div key={asset.id} className="p-5 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex justify-between items-center">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-bold text-gray-800 dark:text-white text-lg">{asset.name}</p>
                      {asset.symbol && <span className="bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 text-xs px-2 py-1 rounded font-bold tracking-wider">{asset.symbol}</span>}
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">🏦 En: {asset.accountName}</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <p className="text-xl font-bold text-gray-900 dark:text-white">{asset.balance.toFixed(2)} €</p>
                    <button onClick={() => handleDeleteAsset(asset.id)} className="text-gray-300 hover:text-red-500 dark:hover:text-red-400 font-bold p-2 cursor-pointer text-lg" title="Borrar activo y su historial">✕</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}