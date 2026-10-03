import { Link } from 'react-router-dom'
import { ThemeToggle } from './ThemeToggle'
import { BrandMark } from '@/components/BrandMark'

const navItems = [
  { label: 'Pricing', href: '/pricing' },
  { label: 'How it Works', href: '/#how-it-works' },
  { label: 'Affiliate', href: '/referral' },
]

export function PageHeader() {
  return (
    <header className="fixed left-0 right-0 top-0 z-50 w-full px-4 py-4 sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-7xl items-center justify-between rounded-card border border-border bg-card/80 px-4 py-3 backdrop-blur-xl">
        <Link to="/" className="flex items-center gap-2.5">
          <BrandMark size={32} />
          <span className="text-xl font-bold tracking-tight text-foreground">DMGennie</span>
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          {navItems.map((item) => (
            <Link key={item.label} to={item.href} className="text-sm font-semibold text-ink-muted transition-colors hover:text-brand">
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <ThemeToggle />
          <Link to="/signup" className="hidden rounded-control bg-brand-gradient px-5 py-2.5 text-sm font-semibold text-white transition-all hover:opacity-90 sm:block">
            Get Started Free
          </Link>
        </div>
      </div>
    </header>
  )
}
