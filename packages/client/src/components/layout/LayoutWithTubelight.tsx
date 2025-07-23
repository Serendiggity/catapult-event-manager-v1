import type { ReactNode } from 'react'
import { Header } from './Header'
import { SkipLink } from './SkipLink'
import { NavBar } from '../ui/tubelight-navbar'
import { Calendar, Users, FolderOpen, Mail, BarChart3, Settings } from 'lucide-react'

interface LayoutProps {
  children: ReactNode
}

export function LayoutWithTubelight({ children }: LayoutProps) {
  // Quick access navigation items for the tubelight navbar
  const quickNavItems = [
    { name: 'Events', url: '/events', icon: Calendar },
    { name: 'Leads', url: '/contacts', icon: Users },
    { name: 'Groups', url: '/campaign-groups', icon: FolderOpen },
    { name: 'Campaigns', url: '/campaigns', icon: Mail },
    { name: 'Analytics', url: '/analytics', icon: BarChart3 },
    { name: 'Settings', url: '/settings', icon: Settings }
  ]

  return (
    <div className="min-h-screen bg-background">
      <SkipLink />
      <Header />
      {/* Tubelight navbar positioned below the header on desktop, bottom on mobile */}
      <NavBar 
        items={quickNavItems} 
        className="hidden sm:block sm:fixed sm:top-20 sm:mb-0" 
      />
      {/* Mobile version at bottom */}
      <NavBar 
        items={quickNavItems.slice(0, 4)} // Show only first 4 items on mobile
        className="sm:hidden" 
      />
      <main 
        id="main-content" 
        tabIndex={-1} 
        className="pb-20 sm:pb-0 sm:pt-16"
      >
        {children}
      </main>
    </div>
  )
}