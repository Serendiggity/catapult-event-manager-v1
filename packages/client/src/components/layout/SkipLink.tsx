import { cn } from '@/lib/utils'

interface SkipLinkProps {
  href?: string
  className?: string
  children?: React.ReactNode
}

export function SkipLink({ 
  href = '#main-content', 
  className,
  children = 'Skip to main content' 
}: SkipLinkProps) {
  return (
    <a
      href={href}
      className={cn(
        'sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4',
        'bg-background text-foreground px-4 py-2 rounded-md',
        'border border-border shadow-sm',
        'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
        'z-50',
        className
      )}
    >
      {children}
    </a>
  )
}