import { Link } from 'react-router-dom'
import { ThemeToggle } from './ThemeToggle'

const navItems = [
  { label: 'Pricing', href: '/pricing' },
  { label: 'How it Works', href: '/#how-it-works' },
  { label: 'Affiliate', href: '/referral' },
]

export function PageHeader() {
  return (
    <header className="fixed left-0 right-0 top-0 z-50 w-full px-4 py-4 sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-7xl items-center justify-between rounded-[1.35rem] border border-border bg-card/80 px-4 py-3 shadow-[0_18px_55px_rgba(131,58,180,0.10)] backdrop-blur-xl">
        <Link to="/" className="flex items-center gap-2.5">
          <svg width="32" height="32" viewBox="0 0 40 40" fill="none">
            <defs>
              <linearGradient id="ph-logo-grad" x1="0" y1="40" x2="40" y2="0" gradientUnits="userSpaceOnUse">
                <stop stopColor="#C13584" />
                <stop offset="1" stopColor="#405DE6" />
              </linearGradient>
            </defs>
            <rect width="40" height="40" rx="10" fill="url(#ph-logo-grad)" />
            <path d="M10 27 L19 13" stroke="white" strokeWidth="3.8" strokeLinecap="round" />
            <path d="M17 27 L26 13" stroke="white" strokeWidth="3.8" strokeLinecap="round" />
            <circle cx="29" cy="27" r="3" fill="#f5a9c4" />
          </svg>
          <span className="text-xl font-black tracking-tight text-foreground">DMGennie</span>
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          {navItems.map((item) => (
            <Link key={item.label} to={item.href} className="text-sm font-black text-ink-muted transition-colors hover:text-brand-magenta">
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <ThemeToggle />
          <Link to="/signup" className="hidden rounded-xl bg-brand-gradient px-5 py-2.5 text-sm font-black text-white shadow-[0_12px_28px_rgba(131,58,180,0.22)] transition-all hover:opacity-90 sm:block">
            Get Started Free
          </Link>
        </div>
      </div>
    </header>
  )
}
