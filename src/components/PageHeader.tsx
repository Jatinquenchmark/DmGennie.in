import { Link } from 'react-router-dom'

const navItems = [
  { label: 'Pricing', href: '/pricing' },
  { label: 'How it Works', href: '/#how-it-works' },
  { label: 'Affiliate', href: '/referral' },
]

export function PageHeader() {
  return (
    <header className="fixed left-0 right-0 top-0 z-50 w-full px-4 py-4 sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-7xl items-center justify-between rounded-[1.35rem] border border-white/80 bg-white/78 px-4 py-3 shadow-[0_18px_55px_rgba(109,41,72,0.10)] backdrop-blur-xl">
        <Link to="/" className="flex items-center gap-2.5">
          <svg width="32" height="32" viewBox="0 0 40 40" fill="none">
            <rect width="40" height="40" rx="10" fill="#6d2948" />
            <path d="M10 27 L19 13" stroke="white" strokeWidth="3.8" strokeLinecap="round" />
            <path d="M17 27 L26 13" stroke="white" strokeWidth="3.8" strokeLinecap="round" />
            <circle cx="29" cy="27" r="3" fill="#d7a2ad" />
          </svg>
          <span className="text-xl font-black tracking-tight text-[#151119]">DMGenie</span>
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          {navItems.map((item) => (
            <Link key={item.label} to={item.href} className="text-sm font-black text-[#625963] transition-colors hover:text-[#6d2948]">
              {item.label}
            </Link>
          ))}
        </nav>

        <Link to="/signup" className="hidden rounded-xl bg-[#6d2948] px-5 py-2.5 text-sm font-black text-white shadow-[0_12px_28px_rgba(109,41,72,0.20)] transition-all hover:bg-[#551f38] sm:block">
          Get Started Free
        </Link>
      </div>
    </header>
  )
}
