import { useState, useRef } from 'react';
import { PieChart, Pie, Cell } from 'recharts';
import { toPng } from 'html-to-image';
import toast from 'react-hot-toast';

interface ShareViewProps {
  allTransactions: any[];
  allAssets: any[];
}

const APP_NAME = "FINTRACK"; 

export default function ShareView({ allTransactions, allAssets }: ShareViewProps) {
  const currentYearStr = new Date().getFullYear().toString();
  const [shareYear, setShareYear] = useState(currentYearStr);
  const [shareMonth, setShareMonth] = useState(new Date().getMonth().toString());
  
  // Estado para controlar qué plantilla estamos viendo
  const [activeTemplate, setActiveTemplate] = useState('MONTHLY');
  
  const shareCardRef = useRef<HTMLDivElement>(null);

  const fullMonths = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
  
  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f43f5e'];
  const FLOW_COLORS = { ingresos: '#10b981', gastos: '#ef4444', inversiones: '#8b5cf6' };

  // --- CÁLCULOS DEL MES SELECCIONADO ---
  const txForMonth = allTransactions.filter((tx: any) => {
    const date = new Date(tx.date);
    const matchYear = shareYear === 'ALL' || date.getFullYear().toString() === shareYear;
    const matchMonth = shareMonth === 'ALL' || date.getMonth().toString() === shareMonth;
    return matchYear && matchMonth;
  });

  const monthIncome = txForMonth.filter((tx: any) => tx.type === 'INCOME' && !tx.assetId).reduce((sum: number, tx: any) => sum + tx.amount, 0);
  const monthExpense = txForMonth.filter((tx: any) => tx.type === 'EXPENSE' && !tx.assetId).reduce((sum: number, tx: any) => sum + tx.amount, 0);
  const monthInvested = txForMonth.filter((tx: any) => tx.type === 'CONTRIBUTION').reduce((sum: number, tx: any) => sum + tx.amount, 0);

  const flowData = [
    { name: 'Ingresos', value: monthIncome, color: FLOW_COLORS.ingresos },
    { name: 'Gastos', value: monthExpense, color: FLOW_COLORS.gastos },
    { name: 'Inversiones', value: monthInvested, color: FLOW_COLORS.inversiones }
  ].filter(d => d.value > 0);

  const assetsByType = allAssets.reduce((acc: any, asset: any) => {
    const type = asset.symbol || 'Otro'; 
    acc[type] = (acc[type] || 0) + asset.balance;
    return acc;
  }, {});
  
  const assetTypeData = Object.keys(assetsByType).map((name, i) => ({
    name, value: assetsByType[name], color: COLORS[(i + 4) % COLORS.length]
  })).filter(d => d.value > 0);

  const displayMonth = shareMonth === 'ALL' ? 'Acumulado' : fullMonths[parseInt(shareMonth)];
  const displayYear = shareYear === 'ALL' ? 'Global' : shareYear;

  const handleDownload = async () => {
    if (shareCardRef.current === null) return;
    const loadingToast = toast.loading('Generando tu plantilla...');
    try {
      const dataUrl = await toPng(shareCardRef.current, { 
        quality: 1, 
        pixelRatio: 3, 
        cacheBust: true,
      });
      const link = document.createElement('a');
      link.download = `${APP_NAME.toLowerCase()}-${activeTemplate.toLowerCase()}-${displayMonth}.png`;
      link.href = dataUrl;
      link.click();
      toast.success('¡Imagen descargada!', { id: loadingToast });
    } catch (err) {
      console.error(err);
      toast.error('Error al generar la imagen', { id: loadingToast });
    }
  };

  return (
    <div className="space-y-8 animate-fade-in transition-colors pb-10">
      
      {/* Cabecera de la sección */}
      <div>
        <h2 className="text-3xl font-black text-gray-900 dark:text-white mb-2">Plantillas para compartir</h2>
        <p className="text-gray-500 dark:text-gray-400">Genera imágenes de tu patrimonio, composición o ingresos listas para redes sociales.</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-8 items-start">
        
        {/* SIDEBAR: Selector de Plantillas */}
        <div className="w-full lg:w-1/3 space-y-4">
          <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4">Plantillas Disponibles</h3>
          
          {/* Botón Plantilla 1 */}
          <button 
            onClick={() => setActiveTemplate('MONTHLY')}
            className={`w-full text-left p-5 rounded-2xl border transition-all duration-200 ${
              activeTemplate === 'MONTHLY' 
                ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-500 shadow-sm' 
                : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-700'
            }`}
          >
            <div className="flex justify-between items-start mb-2">
              <span className="text-lg font-bold text-gray-900 dark:text-white">Resumen Mensual</span>
              {activeTemplate === 'MONTHLY' && <span className="bg-blue-500 text-white text-[10px] px-2 py-1 rounded-full font-bold">ACTIVA</span>}
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Ingresos, gastos, inversión y principales categorías del periodo seleccionado.</p>
          </button>

          {/* Botón Plantilla 2 (Próximamente) */}
          <button 
            onClick={() => setActiveTemplate('PORTFOLIO')}
            className={`w-full text-left p-5 rounded-2xl border transition-all duration-200 ${
              activeTemplate === 'PORTFOLIO' 
                ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-500 shadow-sm' 
                : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-700'
            }`}
          >
            <div className="flex justify-between items-start mb-2">
              <span className="text-lg font-bold text-gray-900 dark:text-white">Composición de Cartera</span>
              {activeTemplate === 'PORTFOLIO' && <span className="bg-blue-500 text-white text-[10px] px-2 py-1 rounded-full font-bold">ACTIVA</span>}
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Un desglose visual de dónde está tu patrimonio: liquidez, fondos, cripto, etc.</p>
          </button>
        </div>

        {/* ÁREA PRINCIPAL: Previsualización y Controles */}
        <div className="w-full lg:w-2/3 bg-white dark:bg-gray-800 p-8 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm">
          
          <div className="flex flex-col md:flex-row justify-between items-end mb-8 gap-4">
            <div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Editor de Plantilla</h3>
              
              {/* Filtros: Solo los mostramos si aplican a la plantilla (ej. el resumen mensual necesita mes/año) */}
              {activeTemplate === 'MONTHLY' && (
                <div className="flex gap-2">
                  <select value={shareMonth} onChange={(e) => setShareMonth(e.target.value)} className="border border-gray-200 dark:border-gray-600 rounded-lg p-2 text-sm bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white outline-none">
                    <option value="ALL">Todos los meses</option>
                    {fullMonths.map((m, i) => <option key={i} value={i.toString()}>{m}</option>)}
                  </select>
                  <select value={shareYear} onChange={(e) => setShareYear(e.target.value)} className="border border-gray-200 dark:border-gray-600 rounded-lg p-2 text-sm bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white outline-none">
                    <option value={currentYearStr}>{currentYearStr}</option>
                    <option value={(parseInt(currentYearStr) - 1).toString()}>{parseInt(currentYearStr) - 1}</option>
                  </select>
                </div>
              )}
            </div>
            
            <button 
              onClick={handleDownload}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-xl flex items-center gap-2 transition-transform hover:scale-[1.02] shadow-lg shadow-blue-500/30"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
              Descargar Imagen
            </button>
          </div>

          {/* CONTENEDOR CENTRAL DE LA TARJETA */}
          <div className="flex justify-center bg-gray-100 dark:bg-gray-900 py-10 rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden">
            
            {activeTemplate === 'MONTHLY' && (
              /* TARJETA 1: RESUMEN MENSUAL */
              <div 
                ref={shareCardRef} 
                className="w-[380px] h-[675px] bg-[#0b1121] rounded-2xl overflow-hidden relative flex flex-col justify-between shadow-2xl"
                style={{ padding: '32px' }}
              >
                <div>
                  <div className="flex justify-between items-center opacity-80 mb-6">
                    {/* AQUÍ VA EL NOMBRE DE LA APP*/}
                    <span className="text-blue-400 font-bold tracking-widest text-xs uppercase flex items-center gap-1">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M11.3 1.046A12.014 12.014 0 0010.337 1H9a2 2 0 00-2 2v2H5a2 2 0 00-2 2v3a2 2 0 002 2h2v2a2 2 0 002 2h1.663c.489 0 .964-.09 1.411-.257l2.846 1.139a1 1 0 001.353-1.157l-.366-1.463c.382-.676.626-1.442.702-2.253a1 1 0 00-.97-1.1H13V7a2 2 0 00-2-2h-1V3a2 2 0 00-2-2z" clipRule="evenodd"></path></svg>
                      {APP_NAME}
                    </span>
                    <span className="text-gray-400 text-[10px] font-mono border border-gray-700 px-2 py-1 rounded-full">{displayMonth} {displayYear}</span>
                  </div>
                  <h3 className="text-white text-2xl font-black tracking-tight leading-tight">Resumen<br/>Financiero</h3>
                </div>

                <div className="flex justify-between items-center my-6">
                  <div className="flex flex-col items-center">
                    <p className="text-gray-400 text-[10px] uppercase tracking-widest mb-2 font-bold">Flujo Mensual</p>
                    {flowData.length > 0 ? (
                      <PieChart width={140} height={140}>
                        <Pie data={flowData} cx={70} cy={70} innerRadius={45} outerRadius={65} paddingAngle={3} dataKey="value" stroke="none">
                          {flowData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                        </Pie>
                      </PieChart>
                    ) : (<div className="w-[140px] h-[140px] flex items-center justify-center text-gray-600 text-xs">Sin datos</div>)}
                  </div>

                  <div className="flex flex-col items-center">
                    <p className="text-gray-400 text-[10px] uppercase tracking-widest mb-2 font-bold">Cartera</p>
                    {assetTypeData.length > 0 ? (
                      <PieChart width={140} height={140}>
                        <Pie data={assetTypeData} cx={70} cy={70} innerRadius={45} outerRadius={65} paddingAngle={3} dataKey="value" stroke="none">
                          {assetTypeData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                        </Pie>
                      </PieChart>
                    ) : (<div className="w-[140px] h-[140px] flex items-center justify-center text-gray-600 text-xs">Sin datos</div>)}
                  </div>
                </div>

                <div className="bg-[#0f172a] -mx-8 p-6 mt-auto border-t border-gray-800 rounded-t-3xl">
                  <div className="space-y-4">
                    <div className="flex justify-between items-end">
                      <div className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full bg-emerald-500"></span>
                        <span className="text-gray-400 text-xs font-bold uppercase tracking-widest">Ingresos</span>
                      </div>
                      <span className="text-white font-black text-xl">+{monthIncome.toLocaleString('es-ES', { minimumFractionDigits: 2 })} €</span>
                    </div>

                    <div className="flex justify-between items-end">
                      <div className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full bg-red-500"></span>
                        <span className="text-gray-400 text-xs font-bold uppercase tracking-widest">Gastos</span>
                      </div>
                      <span className="text-white font-black text-xl">-{monthExpense.toLocaleString('es-ES', { minimumFractionDigits: 2 })} €</span>
                    </div>

                    <div className="flex justify-between items-end pb-4 border-b border-gray-800">
                      <div className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full bg-purple-500"></span>
                        <span className="text-gray-400 text-xs font-bold uppercase tracking-widest">Inversión</span>
                      </div>
                      <span className="text-white font-black text-xl">{monthInvested.toLocaleString('es-ES', { minimumFractionDigits: 2 })} €</span>
                    </div>

                    <div className="pt-2">
                      <p className="text-gray-500 text-[10px] uppercase tracking-widest font-bold mb-3">Top Inversiones</p>
                      <div className="flex flex-wrap gap-2">
                        {assetTypeData.slice(0, 4).map((asset, i) => (
                          <div key={i} className="flex items-center gap-1.5 bg-gray-800/50 px-2 py-1 rounded-md border border-gray-700/50">
                            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: asset.color }}></span>
                            <span className="text-gray-300 text-[10px] font-medium">{asset.name}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTemplate === 'PORTFOLIO' && (
              /* TARJETA 2 (Placeholder para cuando queramos diseñarla) */
              <div className="w-[380px] h-[675px] bg-[#0b1121] rounded-2xl flex items-center justify-center border border-gray-800 border-dashed">
                 <div className="text-center p-8">
                    <span className="text-6xl mb-4 block">🛠️</span>
                    <p className="text-gray-400 font-bold">Plantilla en construcción</p>
                    <p className="text-gray-600 text-sm mt-2">Aquí diseñaremos el desglose de composición total del patrimonio.</p>
                 </div>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}