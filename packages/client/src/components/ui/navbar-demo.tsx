import { Home, Calendar, Users, Mail, FolderOpen } from 'lucide-react'
import { NavBar } from "@/components/ui/tubelight-navbar"

export function NavBarDemo() {
  const navItems = [
    { name: 'Events', url: '/events', icon: Calendar },
    { name: 'Leads', url: '/contacts', icon: Users },
    { name: 'Groups', url: '/campaign-groups', icon: FolderOpen },
    { name: 'Campaigns', url: '/campaigns', icon: Mail }
  ]

  return <NavBar items={navItems} />
}