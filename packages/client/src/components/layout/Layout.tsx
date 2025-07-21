import { ReactNode } from 'react'
import { Header } from './Header'
import { SkipLink } from './SkipLink'

interface LayoutProps {
  children: ReactNode
}

export function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      <SkipLink />
      <Header />
      <main id="main-content" className="container mx-auto px-4 py-8" tabIndex={-1}>
        {children}
      </main>
    </div>
  )
}