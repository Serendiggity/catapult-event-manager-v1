import { useState } from 'react'
import { NavBar } from '@/components/ui/tubelight-navbar'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  Calendar, Users, FolderOpen, Mail, Home, Settings, 
  BarChart3, FileText, Briefcase, User 
} from 'lucide-react'

export function NavbarDemoPage() {
  const [navStyle, setNavStyle] = useState<'minimal' | 'full' | 'mobile'>('full')

  const minimalNavItems = [
    { name: 'Home', url: '/', icon: Home },
    { name: 'Events', url: '/events', icon: Calendar },
    { name: 'Leads', url: '/contacts', icon: Users },
    { name: 'Campaigns', url: '/campaigns', icon: Mail }
  ]

  const fullNavItems = [
    { name: 'Home', url: '/', icon: Home },
    { name: 'Events', url: '/events', icon: Calendar },
    { name: 'Leads', url: '/contacts', icon: Users },
    { name: 'Groups', url: '/campaign-groups', icon: FolderOpen },
    { name: 'Campaigns', url: '/campaigns', icon: Mail },
    { name: 'Analytics', url: '/analytics', icon: BarChart3 }
  ]

  const portfolioNavItems = [
    { name: 'Home', url: '#', icon: Home },
    { name: 'About', url: '#', icon: User },
    { name: 'Projects', url: '#', icon: Briefcase },
    { name: 'Resume', url: '#', icon: FileText }
  ]

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">Tubelight Navbar Component</h1>
          <p className="text-xl text-muted-foreground">
            A beautiful animated navigation bar with a unique tubelight effect
          </p>
        </div>

        {/* Demo Controls */}
        <Card>
          <CardHeader>
            <CardTitle>Demo Controls</CardTitle>
            <CardDescription>
              Try different navigation configurations
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4 flex-wrap">
              <Button 
                variant={navStyle === 'minimal' ? 'default' : 'outline'}
                onClick={() => setNavStyle('minimal')}
              >
                Minimal (4 items)
              </Button>
              <Button 
                variant={navStyle === 'full' ? 'default' : 'outline'}
                onClick={() => setNavStyle('full')}
              >
                Full (6 items)
              </Button>
              <Button 
                variant={navStyle === 'mobile' ? 'default' : 'outline'}
                onClick={() => setNavStyle('mobile')}
              >
                Portfolio Style
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Live Demo */}
        <Card className="relative overflow-hidden" style={{ minHeight: '400px' }}>
          <CardHeader>
            <CardTitle>Live Demo</CardTitle>
            <CardDescription>
              The navbar appears at the top on desktop and bottom on mobile
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="relative h-64">
              {navStyle === 'minimal' && <NavBar items={minimalNavItems} />}
              {navStyle === 'full' && <NavBar items={fullNavItems} />}
              {navStyle === 'mobile' && <NavBar items={portfolioNavItems} />}
            </div>
          </CardContent>
        </Card>

        {/* Features */}
        <div className="grid md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Features</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <li>Smooth spring animations with Framer Motion</li>
              <li>Responsive design - icons on mobile, text on desktop</li>
              <li>Beautiful tubelight glow effect on active tab</li>
              <li>Automatically syncs with React Router navigation</li>
              <li>Backdrop blur for modern glass effect</li>
              <li>Dark mode compatible</li>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Usage</CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-sm">
{`import { NavBar } from '@/components/ui/tubelight-navbar'
import { Home, Calendar, Users } from 'lucide-react'

const navItems = [
  { name: 'Home', url: '/', icon: Home },
  { name: 'Events', url: '/events', icon: Calendar },
  { name: 'Leads', url: '/contacts', icon: Users }
]

<NavBar items={navItems} />`}
              </pre>
            </CardContent>
          </Card>
        </div>

        {/* Implementation Notes */}
        <Card>
          <CardHeader>
            <CardTitle>Implementation Notes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">Layout Integration</h3>
              <p className="text-muted-foreground">
                To use the tubelight navbar in your app, update the Layout component 
                by setting <code className="bg-muted px-2 py-1 rounded">useTubelightNavbar = true</code>
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Positioning</h3>
              <p className="text-muted-foreground">
                The navbar is fixed positioned. On desktop it appears at the top, 
                on mobile it sticks to the bottom for better thumb reachability.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Customization</h3>
              <p className="text-muted-foreground">
                You can customize colors, animations, and positioning by passing 
                className prop or modifying the component styles.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}