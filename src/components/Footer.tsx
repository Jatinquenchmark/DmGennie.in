import { Link } from 'react-router-dom'
import { Mail, Instagram } from 'lucide-react'

function FooterLogo() {
  return (
    <Link to="/" className="inline-flex items-center gap-2.5 group">
      <svg width="30" height="30" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="40" height="40" rx="10" fill="#5b5ef4" fillOpacity="0.15" />
        <path d="M10 27 L19 13" stroke="#5b5ef4" strokeWidth="3.8" strokeLinecap="round" />
        <path d="M17 27 L26 13" stroke="#5b5ef4" strokeWidth="3.8" strokeLinecap="round" />
        <circle cx="29" cy="27" r="3" fill="#5b5ef4" />
      </svg>
      <span className="text-lg font-extrabold tracking-tight text-foreground group-hover:text-accent-blue transition-colors">
        DM<span className="text-accent-blue">Genie</span>
      </span>
    </Link>
  )
}

const productLinks = [
  { label: 'How It Works', href: '/#how-it-works' },
  { label: 'Features', href: '/#features' },
  { label: 'Pricing', href: '/#pricing' },
  { label: 'FAQ', href: '/#faq' },
]

const legalLinks = [
  { label: 'Privacy Policy', href: '/privacy' },
  { label: 'Terms of Service', href: '/terms' },
  { label: 'Data Deletion', href: '/delete-data' },
]

const supportLinks = [
  { label: 'Contact Support', href: 'mailto:support@dmgennie.in' },
  { label: 'Reviewer Guide', href: '/reviewer-demo' },
]

export function Footer() {
  return (
    <footer className="bg-background border-t border-border">
      <div className="max-w-7xl mx-auto px-6 py-14">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 mb-12">

          {/* Brand */}
          <div className="lg:col-span-1">
            <FooterLogo />
            <p className="mt-4 text-muted-foreground text-sm leading-relaxed max-w-xs">
              Instagram comment-to-DM automation for creators and businesses. Built on official Meta APIs.
            </p>
            <div className="flex items-center gap-3 mt-5">
              <a
                href="mailto:support@dmgennie.in"
                className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Email support"
              >
                <Mail className="w-4 h-4" />
                support@dmgennie.in
              </a>
            </div>
            <div className="mt-3">
              <a
                href="https://instagram.com/dmgenie"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
                aria-label="DMGenie on Instagram"
              >
                <Instagram className="w-4 h-4" />
                @dmgenie
              </a>
            </div>
          </div>

          {/* Product */}
          <div>
            <h3 className="text-sm font-bold text-foreground uppercase tracking-wider mb-4">Product</h3>
            <ul className="space-y-3">
              {productLinks.map((l) => (
                <li key={l.label}>
                  <a
                    href={l.href}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {l.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="text-sm font-bold text-foreground uppercase tracking-wider mb-4">Legal</h3>
            <ul className="space-y-3">
              {legalLinks.map((l) => (
                <li key={l.label}>
                  <Link
                    to={l.href}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className="text-sm font-bold text-foreground uppercase tracking-wider mb-4">Support</h3>
            <ul className="space-y-3">
              {supportLinks.map((l) => (
                <li key={l.label}>
                  <a
                    href={l.href}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {l.label}
                  </a>
                </li>
              ))}
            </ul>

            {/* Trust badges */}
            <div className="mt-6 space-y-2">
              <div className="inline-flex items-center gap-1.5 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 text-xs font-medium px-3 py-1.5 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
                Official Meta APIs
              </div>
              <div className="block">
                <div className="inline-flex items-center gap-1.5 bg-accent-blue/10 text-accent-blue text-xs font-medium px-3 py-1.5 rounded-full">
                  <span className="w-1.5 h-1.5 rounded-full bg-accent-blue inline-block" />
                  HTTPS Secured
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="pt-8 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-muted-foreground text-xs text-center sm:text-left">
            © {new Date().getFullYear()} DMGenie. All rights reserved.
            {' '}DMGenie is not affiliated with or endorsed by Meta Platforms, Inc.
          </p>
          <div className="flex items-center gap-6">
            <Link to="/privacy" className="text-xs text-muted-foreground hover:text-foreground transition-colors">Privacy</Link>
            <Link to="/terms" className="text-xs text-muted-foreground hover:text-foreground transition-colors">Terms</Link>
            <Link to="/delete-data" className="text-xs text-muted-foreground hover:text-foreground transition-colors">Delete Data</Link>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer
