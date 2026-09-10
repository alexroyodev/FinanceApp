import { UserButton } from '@clerk/clerk-react';

interface HeaderProps {
  user: any;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export default function Header({ user, activeTab, setActiveTab }: HeaderProps) {
  const tabs = [
    { id: 'dashboard', label: 'Dashboard', bgColor: 'bg-blue-600' },
    { id: 'transactions', label: 'Movimientos', bgColor: 'bg-blue-600' },
    { id: 'investments', label: 'Inversiones', bgColor: 'bg-indigo-600' },
    { id: 'accounts', label: 'Cuentas', bgColor: 'bg-blue-600' },
    { id: 'analytics', label: 'Estadísticas', bgColor: 'bg-blue-600' }
  ];

  return (
    <header className="flex flex-col md:flex-row justify-between items-center md:items-end border-b border-gray-300 pb-4 gap-4">
      <div className="flex items-center gap-4">
        <UserButton afterSignOutUrl="/" />
        <h1 className="text-3xl font-bold text-gray-800">Hola, {user.name} 👋</h1>
      </div>
      <nav className="flex flex-wrap gap-2">
        {tabs.map(tab => (
          <button 
            key={tab.id}
            onClick={() => setActiveTab(tab.id)} 
            className={`px-4 py-2 font-bold rounded-lg transition-colors cursor-pointer ${
              activeTab === tab.id ? `${tab.bgColor} text-white` : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </nav>
    </header>
  );
}