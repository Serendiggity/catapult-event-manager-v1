import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Calendar, Users, Mail, Zap, Menu, X, LayoutDashboard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { QUICK_ADD_EVENT_ID } from '@/constants/quick-add';

export function Header() {
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  
  // Initialize dark mode from localStorage
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark' || (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      setDarkMode(true);
      document.documentElement.classList.add('dark');
    }
  }, []);

  const toggleDarkMode = () => {
    const newMode = !darkMode;
    setDarkMode(newMode);
    
    if (newMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  };
  
  const isActive = (path: string) => {
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };
  
  const navLinks = [
    { to: '/', label: 'Dashboard', icon: LayoutDashboard, active: location.pathname === '/' },
    { to: '/events', label: 'Events', icon: Calendar, active: isActive('/events') },
    { to: '/contacts', label: 'Leads', icon: Users, active: isActive('/contacts') || isActive('/campaign-groups') },
    { to: '/campaigns', label: 'Campaigns', icon: Mail, active: isActive('/campaigns') }
  ];
  
  return (
    <header className="sticky top-0 z-50 bg-background border-b border-border">
      <div className="max-w-[1400px] mx-auto px-10">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <Link to="/" className="flex items-center">
            <img src="/logo.png" alt="New Era" className="h-10 w-auto" />
          </Link>
          
          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className={`flex items-center gap-2 text-base font-medium transition-colors ${
                  link.active 
                    ? 'text-foreground' 
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <link.icon className="h-4 w-4" />
                <span>{link.label}</span>
              </Link>
            ))}
          </nav>

          {/* Right side actions */}
          <div className="flex items-center gap-5">
            {/* Dark Mode Toggle */}
            <button
              onClick={toggleDarkMode}
              className="relative w-11 h-6 bg-border dark:bg-muted-foreground/30 rounded-full transition-colors cursor-pointer"
              aria-label="Toggle dark mode"
            >
              <div 
                className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white dark:bg-card rounded-full transition-transform ${
                  darkMode ? 'translate-x-5' : ''
                }`}
              />
            </button>

            {/* Quick Add Button */}
            <Button
              className="rounded-full px-6 h-11 bg-primary hover:bg-primary/90 text-primary-foreground font-medium"
              onClick={() => navigate(`/events/${QUICK_ADD_EVENT_ID}/contacts/new`)}
            >
              <Zap className="h-4 w-4 mr-2" />
              Quick Add
            </Button>

            {/* Mobile Menu Button */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>
        
        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <nav className="md:hidden py-4 space-y-1 border-t border-border">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  link.active 
                    ? 'bg-accent text-accent-foreground' 
                    : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                }`}
                onClick={() => setMobileMenuOpen(false)}
              >
                <link.icon className="h-5 w-5" />
                {link.label}
              </Link>
            ))}
          </nav>
        )}
      </div>
    </header>
  );
}