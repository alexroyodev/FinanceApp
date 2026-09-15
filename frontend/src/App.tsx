import { useEffect, useState } from 'react';
import { SignedIn, SignedOut, SignIn, useAuth } from '@clerk/clerk-react';
import { Toaster } from 'react-hot-toast'; 
import { Routes, Route } from 'react-router-dom';

import Header from './components/Header';
import DashboardView from './components/DashboardView';
import TransactionsView from './components/TransactionsView';
import InvestmentsView from './components/InvestmentsView';
import AccountsView from './components/AccountsView';
import AnalyticsView from './components/AnalyticsView';
import ShareView from './components/ShareView';
import Footer from './components/Footer';
import PrivacyView from './pages/legal/PrivacyView';
import LegalView from './pages/legal/LegalView';
import CookiesView from './pages/legal/CookiesView';

function App() {
  const { getToken } = useAuth();
  const [user, setUser] = useState<any>(null);
  const [categories, setCategories] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState('dashboard');

  // LÓGICA DEL MODO OSCURO (Recuerda la preferencia del navegador)
  const [isDarkMode, setIsDarkMode] = useState(() => {
    return localStorage.getItem('theme') === 'dark';
  });

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  const fetchUserData = async () => {
    try {
      const token = await getToken();
      const res = await fetch('https://fintracker-api-9k8t.onrender.com/users/me', { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (data) setUser(data);
    } catch (err) { console.error('Error al cargar datos:', err); }
  };

  const fetchCategories = async () => {
    try {
      const token = await getToken();
      const res = await fetch('https://fintracker-api-9k8t.onrender.com/categories', { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (data) setCategories(data);
    } catch (err) { console.error('Error al cargar categorías:', err); }
  };

  useEffect(() => {
    fetchUserData();
    fetchCategories();
  }, []);

  const refreshAllData = () => {
    fetchUserData();
    fetchCategories();
  };

  // --- MATEMÁTICAS PRINCIPALES ---
  const allAssets = user ? user.accounts.flatMap((acc: any) => (acc.assets || []).map((asset: any) => ({ ...asset, accountName: acc.name }))) : [];
  
  // 1. La liquidez ahora es directamente el dinero que queda en tus cuentas (porque el backend ya lo resta)
  const totalLiquidity = user ? user.accounts.reduce((sum: number, acc: any) => sum + acc.balance, 0) : 0;
  
  // 2. Lo invertido es la suma de tus activos
  const totalInvested = allAssets.reduce((sum: number, asset: any) => sum + asset.balance, 0);
  
  // 3. El patrimonio total es la suma de tu liquidez más tus inversiones
  const totalNetWorth = totalLiquidity + totalInvested;

  const allTransactions = user ? user.accounts.flatMap((acc: any) => acc.transactions || []) : [];
  allTransactions.sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());
  const recentTransactions = allTransactions.slice(0, 5);

  return (
    <div className="min-h-screen flex flex-col bg-gray-100 dark:bg-gray-900 transition-colors duration-200 font-sans">
      <Toaster position="bottom-right" toastOptions={{ duration: 3000, style: { background: isDarkMode ? '#1f2937' : '#333', color: '#fff' } }} />
      
      {/* RUTAS DE LA APLICACIÓN */}
      <Routes>
        {/* RUTA PRINCIPAL (La app en sí) */}
        <Route path="/" element={
          <>
            <SignedOut>
              <div className="flex flex-col items-center justify-center flex-grow bg-gray-50 dark:bg-gray-900 p-4 transition-colors">
                <div className="mb-8 text-center">
                  <h1 className="text-4xl font-extrabold text-blue-600 mb-2">Finance Tracker</h1>
                  <p className="text-gray-500 dark:text-gray-400">Inicia sesión para gestionar tu patrimonio</p>
                </div>
                <SignIn routing="hash" />
              </div>
            </SignedOut>

            <SignedIn>
              {user ? (
                <div className="p-8 flex-grow">
                  <div className="max-w-6xl mx-auto space-y-8">
                    <Header 
                      user={user} 
                      activeTab={activeTab} 
                      setActiveTab={setActiveTab} 
                      isDarkMode={isDarkMode} 
                      setIsDarkMode={setIsDarkMode} 
                    />

                    {activeTab === 'dashboard' && (<DashboardView user={user} categories={categories} recentTransactions={recentTransactions}totalNetWorth={totalNetWorth} totalLiquidity={totalLiquidity} totalInvested={totalInvested} onDataChange={refreshAllData} onNavigateToAccounts={() => setActiveTab('accounts')}/>)}
                    {activeTab === 'transactions' && <TransactionsView allTransactions={allTransactions} categories={categories} accounts={user.accounts} onDataChange={refreshAllData} />}
                    {activeTab === 'investments' && <InvestmentsView user={user} allAssets={allAssets} totalInvested={totalInvested} onDataChange={refreshAllData} />}
                    {activeTab === 'accounts' && <AccountsView user={user} onDataChange={refreshAllData} />}
                    {activeTab === 'analytics' && (<AnalyticsView allTransactions={allTransactions} allAssets={allAssets}totalNetWorth={totalNetWorth}totalLiquidity={totalLiquidity}totalInvested={totalInvested}/>)}
                    {activeTab === 'share' && (<ShareView allTransactions={allTransactions} allAssets={allAssets}/>)}
                  </div>
                </div>
              ) : (
                <div className="flex-grow flex items-center justify-center bg-gray-100 dark:bg-gray-900">
                  <div className="text-gray-500 dark:text-gray-400 animate-pulse">Cargando tus datos...</div>
                </div>
              )}
            </SignedIn>
          </>
        } />

        {/* RUTAS LEGALES (Públicas, sin necesidad de login) */}
        <Route path="/privacidad" element={<PrivacyView />} />
        <Route path="/legal" element={<LegalView />} />
        <Route path="/cookies" element={<CookiesView />} />
      </Routes>

      {/* FOOTER: Siempre se renderiza, en todas las páginas */}
      <Footer />
    </div>
  );
}

export default App;