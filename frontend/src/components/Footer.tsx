import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="w-full p-6 text-center text-xs text-gray-500 mt-auto border-t border-gray-200">
      <div className="flex justify-center gap-6 mb-2">
        <Link to="/legal" className="hover:text-indigo-600 transition-colors">Aviso Legal</Link>
        <Link to="/privacidad" className="hover:text-indigo-600 transition-colors">Privacidad</Link>
        <Link to="/cookies" className="hover:text-indigo-600 transition-colors">Cookies</Link>
      </div>
      <p>© {new Date().getFullYear()} Fintracker. Todos los derechos reservados.</p>
    </footer>
  );
}