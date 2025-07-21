import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Calendar, Users, Mail, Zap, Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { QUICK_ADD_EVENT_ID } from '@/constants/quick-add';

export function Header() {
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  const isActive = (path: string) => {
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };
  
  const navLinks = [
    { to: '/', label: 'Events', icon: Calendar, active: isActive('/events') || location.pathname === '/' },
    { to: '/contacts', label: 'Leads', icon: Users, active: isActive('/contacts') || isActive('/lead-groups') },
    { to: '/campaigns', label: 'Campaigns', icon: Mail, active: isActive('/campaigns') }
  ];
  
  return (
    <header className="border-b">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl sm:text-2xl font-bold">Catapult</h1>
          
          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-4 lg:gap-6">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className={`flex items-center gap-2 hover:text-blue-600 transition-colors ${
                  link.active ? 'text-blue-600' : 'text-gray-600'
                }`}
              >
                <link.icon className="h-4 w-4" />
                <span className="hidden lg:inline">{link.label}</span>
              </Link>
            ))}
            <Button
              size="sm"
              className={`ml-2 lg:ml-4 ${
                location.pathname === `/events/${QUICK_ADD_EVENT_ID}/contacts/new` 
                  ? 'bg-green-700' 
                  : 'bg-green-600 hover:bg-green-700'
              }`}
              onClick={() => navigate(`/events/${QUICK_ADD_EVENT_ID}/contacts/new`)}
            >
              <Zap className="h-4 w-4 lg:mr-2" />
              <span className="hidden lg:inline">Quick Add</span>
            </Button>
          </nav>
          
          {/* Mobile Menu Button */}
          <Button
            variant="ghost"
            size="sm"
            className="md:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
        
        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <nav className="md:hidden mt-4 space-y-2 pb-4">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className={`flex items-center gap-3 px-3 py-2 rounded-md transition-colors ${
                  link.active 
                    ? 'bg-blue-50 text-blue-600' 
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
                onClick={() => setMobileMenuOpen(false)}
              >
                <link.icon className="h-5 w-5" />
                {link.label}
              </Link>
            ))}
            <Button
              size="sm"
              className={`w-full justify-start gap-3 ${
                location.pathname === `/events/${QUICK_ADD_EVENT_ID}/contacts/new` 
                  ? 'bg-green-700' 
                  : 'bg-green-600 hover:bg-green-700'
              }`}
              onClick={() => {
                navigate(`/events/${QUICK_ADD_EVENT_ID}/contacts/new`)
                setMobileMenuOpen(false)
              }}
            >
              <Zap className="h-5 w-5" />
              Quick Add Lead
            </Button>
          </nav>
        )}
      </div>
    </header>
  )
}