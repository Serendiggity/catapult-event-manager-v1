import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Calendar, Users, Mail, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { QUICK_ADD_EVENT_ID } from '@/constants/quick-add';

export function Header() {
  const location = useLocation();
  const navigate = useNavigate();
  
  const isActive = (path: string) => {
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };
  
  return (
    <header className="border-b">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Catapult Event Manager</h1>
          <nav className="flex items-center gap-6">
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
                isActive('/contacts') || isActive('/lead-groups') ? 'text-blue-600' : 'text-gray-600'
              }`}
            >
              <Users className="h-4 w-4" />
              Leads
            </Link>
            <Link 
              to="/campaigns" 
              className={`flex items-center gap-2 hover:text-blue-600 transition-colors ${
                isActive('/campaigns') ? 'text-blue-600' : 'text-gray-600'
              }`}
            >
              <Mail className="h-4 w-4" />
              Campaigns
            </Link>
            <Button
              size="sm"
              className="ml-4 bg-purple-600 hover:bg-purple-700"
              onClick={() => navigate(`/events/${QUICK_ADD_EVENT_ID}/contacts/new`)}
            >
              <Zap className="h-4 w-4 mr-2" />
              Quick Add
            </Button>
          </nav>
        </div>
      </div>
    </header>
  )
}