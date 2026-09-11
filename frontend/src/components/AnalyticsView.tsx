import { useState, useMemo } from 'react';
import { PieChart, Pie, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, ReferenceLine, AreaChart, Area } from 'recharts';

interface AnalyticsViewProps {
  allTransactions: any[];
  allAssets: any[];
  totalNetWorth: number;
  totalLiquidity: number;
  totalInvested: number;
}

export default function AnalyticsView({ allTransactions, allAssets, totalNetWorth, totalLiquidity, totalInvested }: AnalyticsViewProps) {
  const currentYearStr = new Date().getFullYear().toString();
  const [analyticsYear, setAnalyticsYear] = useState(currentYearStr);
  const [analyticsMonth, setAnalyticsMonth] = useState('ALL');
  
  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f43f5e'];

  // --- CÁLCULOS PARA LA COMPOSICIÓN ---
  const liquidezPerc = totalNetWorth > 0 ? ((totalLiquidity / totalNetWorth) * 100).toFixed(1) : '0.0';
  const investPerc = totalNetWorth > 0 ? ((totalInvested / totalNetWorth) * 100).toFixed(1) : '0.0';

  // --- CÁLCULO HISTÓRICO APROXIMADO ---
  const historyChartData = useMemo(() => {
    const data = [];
    let runningBalance = totalNetWorth;
    
    for (let i = 0; i <= 5; i++) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const monthStr = d.toLocaleString('es-ES', { month: 'short', year: '2-digit' });
      
      const txInMonth = allTransactions.filter(tx => {
        const txDate = new Date(tx.date);
        return txDate.getMonth() === d.getMonth() && txDate.getFullYear() === d.getFullYear();
      });
      
      const netMonth = txInMonth.reduce((acc, tx) => {
        if (tx.type === 'INCOME') return acc + tx.amount;
        if (tx.type === 'EXPENSE') return acc - tx.amount;
        return acc;
      }, 0);

      data.unshift({
        name: monthStr,
        patrimonio: runningBalance > 0 ? runningBalance : 0
      });
      
      runningBalance -= netMonth; 
    }
    return data;
  }, [allTransactions, totalNetWorth]);


  // --- LÓGICA DE FILTROS Y GRÁFICAS INFERIORES ---
  const availableYears = Array.from(new Set(allTransactions.map((tx: any) => new Date(tx.date).getFullYear().toString())));
  if (!availableYears.includes(currentYearStr)) availableYears.push(currentYearStr);
  availableYears.sort((a: any, b: any) => b.localeCompare(a));

  const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
  const fullMonths = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

  const txForAnalytics = allTransactions.filter((tx: any) => {
    const date = new Date(tx.date);
    const matchYear = analyticsYear === 'ALL' || date.getFullYear().toString() === analyticsYear;
    const matchMonth = analyticsMonth === 'ALL' || date.getMonth().toString() === analyticsMonth;
    return matchYear && matchMonth;
  });

  // Quesitos de Gastos e Ingresos
  const expensesByCategory = txForAnalytics
    .filter((tx: any) => tx.type === 'EXPENSE' && tx.category && !tx.assetId)
    .reduce((acc: any, tx: any) => { acc[tx.category.name] = (acc[tx.category.name] || 0) + tx.amount; return acc; }, {});
  const pieDataExpenses = Object.keys(expensesByCategory).map((name, i) => ({ name, value: expensesByCategory[name], fill: COLORS[i % COLORS.length] }));

  const incomesByCategory = txForAnalytics
    .filter((tx: any) => tx.type === 'INCOME' && tx.category && !tx.assetId)
    .reduce((acc: any, tx: any) => { acc[tx.category.name] = (acc[tx.category.name] || 0) + tx.amount; return acc; }, {});
  const pieDataIncomes = Object.keys(incomesByCategory).map((name, i) => ({ name, value: incomesByCategory[name], fill: COLORS[(i + 2) % COLORS.length] }));

  // 👇 NUEVO: Quesito de Inversiones por Tipo (Fondo, Cripto, etc.)
  const assetsByType = allAssets.reduce((acc: any, asset: any) => {
    const type = asset.symbol || 'Otro'; // Recuerda que metimos el tipo en "symbol"
    acc[type] = (acc[type] || 0) + asset.balance;
    return acc;
  }, {});
  const pieDataAssetTypes = Object.keys(assetsByType).map((name, i) => ({
    name, 
    value: assetsByType[name], 
    fill: COLORS[(i + 4) % COLORS.length] // Desplazamos colores para que varíen
  }));

  // 👇 NUEVO: Quesito de Inversiones por Activo Individual
  const pieDataAssets = allAssets.map((asset: any, index: number) => ({
    name: asset.name, 
    value: asset.balance, 
    fill: COLORS[index % COLORS.length]
  }));

  const monthlyDataMap = months.map(m => ({ name: m, ingresos: 0, gastos: 0, inversiones: 0 }));
  allTransactions.forEach((tx: any) => {
    const date = new Date(tx.date);
    if (analyticsYear === 'ALL' || date.getFullYear().toString() === analyticsYear) {
      const monthIndex = date.getMonth();
      if (tx.assetId) {
        const change = (tx.type === 'EXPENSE' || tx.type === 'TRANSFER_OUT') ? -tx.amount : tx.amount;
        monthlyDataMap[monthIndex].inversiones += change;
      } else {
        if (tx.type === 'INCOME') monthlyDataMap[monthIndex].ingresos += tx.amount;
        if (tx.type === 'EXPENSE') monthlyDataMap[monthIndex].gastos += tx.amount;
      }
    }
  });

  const yearlyDataMap: any = {};
  allTransactions.forEach((tx: any) => {
    const year = new Date(tx.date).getFullYear().toString();
    if (!yearlyDataMap[year]) yearlyDataMap[year] = { name: year, ingresos: 0, gastos: 0, inversiones: 0 };
    if (tx.assetId) {
      const change = (tx.type === 'EXPENSE' || tx.type === 'TRANSFER_OUT') ? -tx.amount : tx.amount;
      yearlyDataMap[year].inversiones += change;
    } else {
      if (tx.type === 'INCOME') yearlyDataMap[year].ingresos += tx.amount;
      if (tx.type === 'EXPENSE') yearlyDataMap[year].gastos += tx.amount;
    }
  });
  const yearlyData = Object.values(yearlyDataMap).sort((a: any, b: any) => a.name.localeCompare(b.name));

  return (
    <div className="space-y-8 animate-fade-in transition-colors">
      
      {/* HERO GLOBAL */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow border border-gray-100 dark:border-gray-700 overflow-hidden transition-colors">
        <div className="p-8 pb-4">
          <p className="text-blue-600 dark:text-blue-400 text-xs font-bold tracking-[0.2em] uppercase mb-2">Vista Global</p>
          <h2 className="text-gray-900 dark:text-white text-2xl font-bold mb-1">Patrimonio total</h2>
          <p className="text-gray-500 dark:text-gray-400 text-sm">Cash, inversiones y evolución histórica en una sola lectura.</p>
          
          <div className="mt-8 text-center">
            <p className="text-gray-500 dark:text-gray-400 text-xs tracking-widest uppercase mb-2">Valor Actual</p>
            <h1 className="text-5xl md:text-6xl font-extrabold text-gray-900 dark:text-white tracking-tight transition-colors">
              {totalNetWorth.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €
            </h1>
          </div>
        </div>

        <div className="h-64 w-full mt-4">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={historyChartData} margin={{ top: 20, right: 0, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorPatrimonio" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#2563eb" stopOpacity={0.3}/> 
                  <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <Tooltip 
                contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.9)', borderColor: '#e5e7eb', color: '#1f2937', borderRadius: '8px' }}
                itemStyle={{ color: '#2563eb', fontWeight: 'bold' }}
                formatter={(value: any) => [`${Number(value || 0).toLocaleString('es-ES', { minimumFractionDigits: 2 })} €`, 'Patrimonio']}
              />
              <Area 
                type="monotone" 
                dataKey="patrimonio" 
                stroke="#2563eb" 
                strokeWidth={3}
                fillOpacity={1} 
                fill="url(#colorPatrimonio)" 
                animationDuration={1500}
              />
            </AreaChart>
          </ResponsiveContainer>
          <div className="flex justify-between px-8 text-xs text-gray-500 dark:text-gray-400 font-medium -mt-2 pb-6">
            {historyChartData.map((d, i) => <span key={i}>{d.name}</span>)}
          </div>
        </div>

        <div className="p-8 pt-6 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 transition-colors">
          <p className="text-gray-500 dark:text-gray-400 text-xs tracking-widest uppercase mb-4">Composición</p>
          <div className="flex items-center justify-between text-gray-900 dark:text-white font-medium mb-3">
            <span>De qué está hecho</span>
          </div>
          
          <div className="w-full h-3 flex rounded-full overflow-hidden mb-4 bg-gray-200 dark:bg-gray-700">
            <div style={{ width: `${liquidezPerc}%` }} className="bg-blue-500 h-full transition-all duration-500"></div>
            <div style={{ width: `${investPerc}%` }} className="bg-indigo-400 h-full transition-all duration-500"></div>
          </div>
          
          <div className="flex gap-6 text-sm">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-blue-500"></span>
              <span className="text-gray-600 dark:text-gray-400">Liquidez <span className="text-gray-900 dark:text-white font-bold ml-1">{liquidezPerc}%</span></span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-indigo-400"></span>
              <span className="text-gray-600 dark:text-gray-400">Inversión <span className="text-gray-900 dark:text-white font-bold ml-1">{investPerc}%</span></span>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow border border-gray-100 dark:border-gray-700 flex flex-wrap gap-4 items-center transition-colors">
        <span className="font-bold text-gray-800 dark:text-white uppercase text-sm tracking-wider">Filtros de Análisis:</span>
        <select value={analyticsYear} onChange={(e) => setAnalyticsYear(e.target.value)} className="border border-gray-300 dark:border-gray-600 rounded p-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white cursor-pointer outline-none focus:ring-1 focus:ring-blue-500">
          <option value="ALL">Todos los años</option>
          {availableYears.map((y: any) => <option key={y} value={y}>{y}</option>)}
        </select>
        <select value={analyticsMonth} onChange={(e) => setAnalyticsMonth(e.target.value)} className="border border-gray-300 dark:border-gray-600 rounded p-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white cursor-pointer outline-none focus:ring-1 focus:ring-blue-500">
          <option value="ALL">Todos los meses</option>
          {fullMonths.map((m, i) => <option key={i} value={i.toString()}>{m}</option>)}
        </select>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        <div>
          <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-4">Balance Mensual</h3>
          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow border border-gray-100 dark:border-gray-700 h-80 transition-colors">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyDataMap} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#374151" />
                <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} stroke="#9ca3af" />
                <YAxis fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => `${v}€`} stroke="#9ca3af" />
                <Tooltip cursor={{fill: 'transparent'}} formatter={(v: any) => `${Number(v).toFixed(2)} €`} />
                <ReferenceLine y={0} stroke="#6b7280" />
                <Legend />
                <Bar dataKey="ingresos" fill="#10b981" radius={[4, 4, 0, 0]} name="Ingresos" />
                <Bar dataKey="gastos" fill="#ef4444" radius={[4, 4, 0, 0]} name="Gastos" />
                <Bar dataKey="inversiones" fill="#8b5cf6" radius={[4, 4, 0, 0]} name="Inversiones" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div>
          <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-4">Histórico Anual Global</h3>
          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow border border-gray-100 dark:border-gray-700 h-80 transition-colors">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={yearlyData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#374151" />
                <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} stroke="#9ca3af" />
                <YAxis fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => `${v}€`} stroke="#9ca3af" />
                <Tooltip cursor={{fill: 'transparent'}} formatter={(v: any) => `${Number(v).toFixed(2)} €`} />
                <ReferenceLine y={0} stroke="#6b7280" />
                <Legend />
                <Bar dataKey="ingresos" fill="#10b981" radius={[4, 4, 0, 0]} name="Ingresos" />
                <Bar dataKey="gastos" fill="#ef4444" radius={[4, 4, 0, 0]} name="Gastos" />
                <Bar dataKey="inversiones" fill="#8b5cf6" radius={[4, 4, 0, 0]} name="Inversiones" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        <div>
          <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-4">Gastos por Categoría</h3>
          {pieDataExpenses.length > 0 ? (
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow border border-gray-100 dark:border-gray-700 h-80 transition-colors"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={pieDataExpenses} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={5} dataKey="value" /><Tooltip formatter={(v: any) => `${Number(v).toFixed(2)} €`} /><Legend /></PieChart></ResponsiveContainer></div>
          ) : <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow border border-gray-100 dark:border-gray-700 h-80 flex justify-center items-center text-gray-500 transition-colors">Sin datos de gastos</div>}
        </div>
        <div>
          <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-4">Ingresos por Categoría</h3>
          {pieDataIncomes.length > 0 ? (
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow border border-gray-100 dark:border-gray-700 h-80 transition-colors"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={pieDataIncomes} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={5} dataKey="value" /><Tooltip formatter={(v: any) => `${Number(v).toFixed(2)} €`} /><Legend /></PieChart></ResponsiveContainer></div>
          ) : <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow border border-gray-100 dark:border-gray-700 h-80 flex justify-center items-center text-gray-500 transition-colors">Sin datos de ingresos</div>}
        </div>
      </div>

      {/* 👇 NUEVA FILA: COMPOSICIÓN DE LA CARTERA DE INVERSIÓN 👇 */}
      <div className="grid md:grid-cols-2 gap-8">
        <div>
          <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-4">Inversiones por Tipo</h3>
          {pieDataAssetTypes.length > 0 ? (
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow border border-gray-100 dark:border-gray-700 h-80 transition-colors">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={pieDataAssetTypes} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={5} dataKey="value" />
                  <Tooltip formatter={(v: any) => `${Number(v).toFixed(2)} €`} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow border border-gray-100 dark:border-gray-700 h-80 flex justify-center items-center text-gray-500 transition-colors">Sin datos de inversión</div>
          )}
        </div>
        <div>
          <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-4">Activos Individuales</h3>
          {pieDataAssets.length > 0 ? (
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow border border-gray-100 dark:border-gray-700 h-80 transition-colors">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={pieDataAssets} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={5} dataKey="value" />
                  <Tooltip formatter={(v: any) => `${Number(v).toFixed(2)} €`} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow border border-gray-100 dark:border-gray-700 h-80 flex justify-center items-center text-gray-500 transition-colors">Sin datos de inversión</div>
          )}
        </div>
      </div>

    </div>
  );
}