import { UserButton } from '@clerk/clerk-react';

interface HeaderProps {
  user: any;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isDarkMode: boolean;
  setIsDarkMode: (val: boolean) => void;
}

export default function Header({ user, activeTab, setActiveTab, isDarkMode, setIsDarkMode }: HeaderProps) {
  const tabs = [
    { id: 'dashboard', label: 'Dashboard', bgColor: 'bg-blue-600' },
    { id: 'transactions', label: 'Movimientos', bgColor: 'bg-blue-600' },
    { id: 'investments', label: 'Inversiones', bgColor: 'bg-indigo-600' },
    { id: 'accounts', label: 'Cuentas', bgColor: 'bg-blue-600' },
    { id: 'analytics', label: 'Estadísticas', bgColor: 'bg-blue-600' }
  ];

  return (
    <header className="flex flex-col md:flex-row justify-between items-center md:items-end border-b border-gray-300 dark:border-gray-700 pb-4 gap-4 transition-colors">
      <div className="flex items-center gap-4">
        <UserButton afterSignOutUrl="/" />
        <h1 className="text-3xl font-bold text-gray-800 dark:text-white transition-colors">Hola, {user.name} 👋</h1>
        
        {/* 👇 EL BOTÓN DE CAMBIO DE TEMA */}
        <button 
          onClick={() => setIsDarkMode(!isDarkMode)} 
          className="ml-2 p-2 rounded-full bg-gray-200 dark:bg-gray-700 text-xl hover:scale-110 transition-transform shadow-sm"
          title={isDarkMode ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
        >
          {isDarkMode ? '🌞' : '🌙'}
        </button>
      </div>
      
      <nav className="flex flex-wrap gap-2">
        {tabs.map(tab => (
          <button 
            key={tab.id}
            onClick={() => setActiveTab(tab.id)} 
            className={`px-4 py-2 font-bold rounded-lg transition-colors cursor-pointer ${
              activeTab === tab.id 
                ? `${tab.bgColor} text-white` 
                : 'bg-gray-200 text-gray-600 hover:bg-gray-300 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </nav>
    </header>
  );
}