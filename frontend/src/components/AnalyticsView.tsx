import { useState } from 'react';
import { PieChart, Pie, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, ReferenceLine } from 'recharts';

interface AnalyticsViewProps {
  allTransactions: any[];
  allAssets: any[];
}

export default function AnalyticsView({ allTransactions, allAssets }: AnalyticsViewProps) {
  const currentYearStr = new Date().getFullYear().toString();
  const [analyticsYear, setAnalyticsYear] = useState(currentYearStr);
  const [analyticsMonth, setAnalyticsMonth] = useState('ALL');
  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f43f5e'];
  
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

  const expensesByCategory = txForAnalytics
    .filter((tx: any) => tx.type === 'EXPENSE' && tx.category && !tx.assetId)
    .reduce((acc: any, tx: any) => { acc[tx.category.name] = (acc[tx.category.name] || 0) + tx.amount; return acc; }, {});
  const pieDataExpenses = Object.keys(expensesByCategory).map((name, i) => ({ name, value: expensesByCategory[name], fill: COLORS[i % COLORS.length] }));

  const incomesByCategory = txForAnalytics
    .filter((tx: any) => tx.type === 'INCOME' && tx.category && !tx.assetId)
    .reduce((acc: any, tx: any) => { acc[tx.category.name] = (acc[tx.category.name] || 0) + tx.amount; return acc; }, {});
  const pieDataIncomes = Object.keys(incomesByCategory).map((name, i) => ({ name, value: incomesByCategory[name], fill: COLORS[(i + 2) % COLORS.length] }));

  const pieDataAssets = allAssets.map((asset: any, index: number) => ({
    name: asset.name, value: asset.balance, fill: COLORS[index % COLORS.length]
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
                <Tooltip formatter={(v: any) => `${Number(v).toFixed(2)} €`} cursor={{fill: 'transparent'}} />
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
                <Tooltip formatter={(v: any) => `${Number(v).toFixed(2)} €`} cursor={{fill: 'transparent'}} />
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
          ) : <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow border border-gray-100 dark:border-gray-700 h-80 flex justify-center items-center text-gray-400 dark:text-gray-500 transition-colors">Sin datos de gastos</div>}
        </div>
        <div>
          <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-4">Ingresos por Categoría</h3>
          {pieDataIncomes.length > 0 ? (
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow border border-gray-100 dark:border-gray-700 h-80 transition-colors"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={pieDataIncomes} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={5} dataKey="value" /><Tooltip formatter={(v: any) => `${Number(v).toFixed(2)} €`} /><Legend /></PieChart></ResponsiveContainer></div>
          ) : <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow border border-gray-100 dark:border-gray-700 h-80 flex justify-center items-center text-gray-400 dark:text-gray-500 transition-colors">Sin datos de ingresos</div>}
        </div>
      </div>

      <div>
        <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-4">Distribución de Cartera</h3>
        {pieDataAssets.length > 0 ? (
          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow border border-gray-100 dark:border-gray-700 h-80 md:w-1/2 transition-colors">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pieDataAssets} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={5} dataKey="value" />
                <Tooltip formatter={(v: any) => `${Number(v).toFixed(2)} €`} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow border border-gray-100 dark:border-gray-700 h-80 md:w-1/2 flex justify-center items-center text-gray-400 dark:text-gray-500 transition-colors">No hay activos registrados</div>
        )}
      </div>
    </div>
  );
}