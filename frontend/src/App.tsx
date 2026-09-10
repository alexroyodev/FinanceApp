import { useEffect, useState } from 'react';
import { SignedIn, SignedOut, SignIn, useAuth } from '@clerk/clerk-react';

// Importamos todos los módulos
import Header from './components/Header';
import DashboardView from './components/DashboardView';
import TransactionsView from './components/TransactionsView';
import InvestmentsView from './components/InvestmentsView';
import AccountsView from './components/AccountsView';
import AnalyticsView from './components/AnalyticsView';

function App() {
  const { getToken } = useAuth();
  const [user, setUser] = useState<any>(null);
  const [categories, setCategories] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState('dashboard');

  const fetchUserData = async () => {
    try {
      const token = await getToken();
      const res = await fetch('http://localhost:3000/users/me', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (data) setUser(data);
    } catch (err) {
      console.error('Error al cargar datos:', err);
    }
  };

  const fetchCategories = async () => {
    try {
      const token = await getToken();
      const res = await fetch('http://localhost:3000/categories', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (data) setCategories(data);
    } catch (err) {
      console.error('Error al cargar categorías:', err);
    }
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
  const totalNetWorth = user ? user.accounts.reduce((sum: number, acc: any) => sum + acc.balance, 0) : 0;
  const totalInvested = allAssets.reduce((sum: number, asset: any) => sum + asset.balance, 0);
  const totalLiquidity = totalNetWorth - totalInvested;

  const allTransactions = user ? user.accounts.flatMap((acc: any) => acc.transactions || []) : [];
  allTransactions.sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());
  const recentTransactions = allTransactions.slice(0, 5); 

  return (
    <div className="min-h-screen bg-gray-100 font-sans">
      
      <SignedOut>
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-4">
          <div className="mb-8 text-center">
            <h1 className="text-4xl font-extrabold text-blue-600 mb-2">Finance Tracker</h1>
            <p className="text-gray-500">Inicia sesión para gestionar tu patrimonio</p>
          </div>
          <SignIn routing="hash" />
        </div>
      </SignedOut>

      <SignedIn>
        {user ? (
          <div className="p-8">
            <div className="max-w-6xl mx-auto space-y-8">
              
              <Header user={user} activeTab={activeTab} setActiveTab={setActiveTab} />

              {activeTab === 'dashboard' && (
                <DashboardView 
                  user={user} 
                  categories={categories} 
                  recentTransactions={recentTransactions} 
                  totalNetWorth={totalNetWorth} 
                  totalLiquidity={totalLiquidity} 
                  totalInvested={totalInvested} 
                  onDataChange={refreshAllData} 
                />
              )}

              {activeTab === 'transactions' && (
                <TransactionsView 
                  allTransactions={allTransactions} 
                  categories={categories} 
                  onDataChange={refreshAllData} 
                />
              )}

              {activeTab === 'investments' && (
                <InvestmentsView 
                  user={user} 
                  allAssets={allAssets} 
                  totalInvested={totalInvested} 
                  onDataChange={refreshAllData} 
                />
              )}

              {activeTab === 'accounts' && (
                <AccountsView 
                  user={user} 
                  onDataChange={refreshAllData} 
                />
              )}

              {activeTab === 'analytics' && (
                <AnalyticsView 
                  allTransactions={allTransactions} 
                  allAssets={allAssets} 
                />
              )}

            </div>
          </div>
        ) : (
          <div className="min-h-screen flex items-center justify-center bg-gray-100">
            <div className="text-gray-500 animate-pulse">Cargando tus datos...</div>
          </div>
        )}
      </SignedIn>
    </div>
  );
}

export default App;