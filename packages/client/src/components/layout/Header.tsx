import { Link, useLocation } from 'react-router-dom';
import { Calendar, Users } from 'lucide-react';

export function Header() {
  const location = useLocation();
  
  const isActive = (path: string) => {
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };
  
  return (
    <header className="border-b">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Catapult Event Manager</h1>
          <nav className="flex gap-6">
            <Link 
              to="/" 
              className={`flex items-center gap-2 hover:text-blue-600 transition-colors ${
                isActive('/events') || location.pathname === '/' ? 'text-blue-600' : 'text-gray-600'
              }`}
            >
              <Calendar className="h-4 w-4" />
              Events
            </Link>
            <Link 
              to="/contacts" 
              className={`flex items-center gap-2 hover:text-blue-600 transition-colors ${
                isActive('/contacts') ? 'text-blue-600' : 'text-gray-600'
              }`}
            >
              <Users className="h-4 w-4" />
              Contacts
            </Link>
          </nav>
        </div>
      </div>
    </header>
  )
}