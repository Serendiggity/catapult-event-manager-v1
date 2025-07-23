import type { ReactNode } from 'react'
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Header } from './Header'
import { SkipLink } from './SkipLink'
import { NavBar } from '../ui/tubelight-navbar'
import { Calendar, Users, FolderOpen, Mail, Home, Zap, Moon, Sun } from 'lucide-react'
import { Button } from '../ui/button'
import { QUICK_ADD_EVENT_ID } from '@/constants/quick-add'

interface LayoutProps {
  children: ReactNode
}

export function Layout({ children }: LayoutProps) {
  const navigate = useNavigate();
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
  
  // Define navigation items for the tubelight navbar
  const navItems = [
    { name: 'Home', url: '/', icon: Home },
    { name: 'Events', url: '/events', icon: Calendar },
    { name: 'Leads', url: '/contacts', icon: Users },
    { name: 'Groups', url: '/campaign-groups', icon: FolderOpen },
    { name: 'Campaigns', url: '/campaigns', icon: Mail }
  ]

  // You can toggle between using the traditional header or the tubelight navbar
  const useTubelightNavbar = true // Set to true to use the new navbar

  return (
    <div className="min-h-screen bg-background">
      <SkipLink />
      {useTubelightNavbar ? (
        <>
          <NavBar items={navItems} />
          {/* Quick Add and Dark Mode buttons */}
          <div className="fixed top-6 right-6 z-50 flex items-center gap-3">
            {/* Dark Mode Toggle */}
            <button
              onClick={toggleDarkMode}
              className="relative w-11 h-6 bg-border dark:bg-muted-foreground/30 rounded-full transition-colors cursor-pointer"
              aria-label="Toggle dark mode"
            >
              <div 
                className={`
                  absolute top-0.5 left-0.5 h-5 w-5 bg-white dark:bg-primary rounded-full transition-transform duration-200
                  ${darkMode ? 'translate-x-5' : ''}
                `}
              >
                <div className="flex items-center justify-center h-full">
                  {darkMode ? (
                    <Moon className="h-3 w-3 text-primary-foreground" />
                  ) : (
                    <Sun className="h-3 w-3 text-muted-foreground" />
                  )}
                </div>
              </div>
            </button>
            {/* Quick Add Button */}
            <Button
              className="rounded-full px-6 h-11 bg-primary hover:bg-primary/90 text-primary-foreground font-medium"
              onClick={() => navigate(`/events/${QUICK_ADD_EVENT_ID}/contacts/new`)}
            >
              <Zap className="h-4 w-4 mr-2" />
              Quick add
            </Button>
          </div>
          <div className="pt-20" /> {/* Add padding for fixed navbar */}
        </>
      ) : (
        <Header />
      )}
      <main id="main-content" tabIndex={-1} className={useTubelightNavbar ? "pb-20 sm:pb-0" : ""}>
        {children}
      </main>
    </div>
  )
}