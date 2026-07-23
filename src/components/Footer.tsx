import { Link } from 'react-router-dom'
import { Instagram, Mail, MapPin } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

function FooterLogo() {
  return (
    <Link to="/" onClick={() => window.scrollTo(0, 0)} className="inline-flex items-center gap-2.5 group">
      <svg width="30" height="30" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="40" height="40" rx="10" fill="#C13584" fillOpacity="0.12" />
        <path d="M10 27 L19 13" stroke="#C13584" strokeWidth="3.8" strokeLinecap="round" />
        <path d="M17 27 L26 13" stroke="#a85d72" strokeWidth="3.8" strokeLinecap="round" />
        <circle cx="29" cy="27" r="3" fill="#833AB4" />
      </svg>
      <span className="text-lg font-extrabold tracking-tight text-[#151119] transition-colors group-hover:text-[#C13584]">
        DM<span className="text-[#C13584]">Gennie</span>
      </span>
    </Link>
  )
}

const productLinks = [
  { label: 'Pricing', href: '/pricing' },
  { label: 'Features', href: '/#features' },
  { label: 'How It Works', href: '/#how-it-works' },
  { label: 'Referral Program', href: '/referral' },
  { label: 'FAQ', href: '/#faq' },
]

const compareLinks = [
  { label: 'Beacons.ai', href: '/compare/beacons-ai' },
  { label: 'High Level', href: '/compare/high-level' },
  { label: 'ManyChat', href: '/compare/manychat' },
  { label: 'MobileMonkey', href: '/compare/mobile-monkey' },
  { label: 'Stan AutoDM', href: '/compare/stan-autodm' },
]

const legalLinks = [
  { label: 'Privacy Policy', href: '/privacy' },
  { label: 'Terms of Service', href: '/terms' },
  { label: 'Refund Policy', href: '/refund-policy' },
  { label: 'Data Deletion', href: '/delete-data' },
]

const supportLinks = [
  { label: 'Contact Support', href: 'mailto:support@dmgennie.in' },
  { label: 'Reviewer Guide', href: '/reviewer-demo' },
]

export function Footer() {
  const { session } = useAuth();
  const filteredLegalLinks = session ? legalLinks : legalLinks.filter(l => l.href !== '/delete-data');

  return (
    <footer className="relative overflow-hidden border-t border-[#eadde2] bg-[#f8f1f3] text-[#151119] dark:border-white/10 dark:bg-[#0b0f19] dark:text-slate-200">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_12%_8%,rgba(193,53,132,0.12),transparent_32%),radial-gradient(circle_at_86%_24%,rgba(64,93,230,0.12),transparent_28%),linear-gradient(135deg,rgba(255,255,255,0.82),rgba(255,255,255,0.18)_48%,rgba(193,53,132,0.05))] dark:opacity-0" />
      <div className="pointer-events-none absolute inset-0 opacity-[0.35] [background-image:linear-gradient(rgba(193,53,132,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(193,53,132,0.08)_1px,transparent_1px)] [background-size:42px_42px]" />
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#C13584]/25 to-transparent" />
      <div
        className="pointer-events-none absolute bottom-2 left-1/2 w-full -translate-x-1/2 select-none text-center text-[12vw] font-black leading-none tracking-tight text-[#C13584]/[0.06] dark:text-white/[0.05] sm:-bottom-1 sm:text-[11vw] lg:-bottom-3 lg:text-[9vw]"
        aria-hidden="true"
      >
        DMGennie
      </div>

      <div className="relative mx-auto max-w-[1320px] px-6 pb-16 pt-12 sm:pb-20 sm:pt-14 lg:pb-24">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-2 lg:grid-cols-12">
          <div className="lg:col-span-5">
            <FooterLogo />
            <p className="mt-6 max-w-sm text-base leading-relaxed text-[#5e5660]">
              Automate your Instagram DMs and grow with clean, compliant, 24/7 engagement.
            </p>
            <address className="mt-5 flex max-w-sm items-start gap-3 not-italic text-sm font-medium leading-relaxed text-[#665d66]">
              <span className="mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-white/80 bg-white/55 text-[#C13584] shadow-sm backdrop-blur">
                <MapPin className="h-4 w-4" />
              </span>
              <span>
                A-10 Suncity, Sector 54,<br />
                Gurgaon, Haryana
              </span>
            </address>
            <div className="mt-7 flex items-center gap-3">
              <a
                href="https://www.instagram.com/dmgennie.in/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/80 bg-white/55 text-[#C13584] shadow-sm backdrop-blur transition-all hover:-translate-y-0.5 hover:bg-white hover:text-[#151119]"
                aria-label="DMGennie on Instagram"
              >
                <Instagram className="h-4 w-4" />
              </a>
              <a
                href="mailto:support@dmgennie.in"
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/80 bg-white/55 text-[#C13584] shadow-sm backdrop-blur transition-all hover:-translate-y-0.5 hover:bg-white hover:text-[#151119]"
                aria-label="Email support"
              >
                <Mail className="h-4 w-4" />
              </a>
            </div>
            <a
              href="https://www.parameterx.org/"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-8 inline-flex items-center gap-3 rounded-2xl border border-white/80 bg-white/58 px-4 py-3 text-sm font-bold text-[#151119] shadow-[0_18px_55px_rgba(193,53,132,0.12)] backdrop-blur transition-all hover:-translate-y-0.5 hover:bg-white"
              aria-label="ParameterX security partner"
            >
              <span className="inline-flex h-12 w-12 items-center justify-center overflow-hidden rounded-xl bg-black p-1.5">
                <img
                  src="/brand-assets/parameter-x-logo.jpg"
                  alt=""
                  className="h-full w-full object-contain"
                  loading="lazy"
                />
              </span>
              <span>
                <span className="block text-xs font-black uppercase tracking-[0.14em] text-[#8d7f87]">Secured by</span>
                <span className="block text-sm font-black text-[#151119]">ParameterX</span>
              </span>
            </a>
          </div>

          <div className="lg:col-span-2">
            <h3 className="mb-5 text-sm font-black uppercase tracking-[0.16em] text-[#C13584]">Product</h3>
            <ul className="space-y-3">
              {productLinks.map((l) => (
                <li key={l.label}>
                  {l.href.startsWith('/') && !l.href.includes('#') ? (
                    <Link
                      to={l.href}
                      onClick={() => window.scrollTo(0, 0)}
                      className="text-sm text-[#665d66] transition-colors hover:text-[#151119]"
                    >
                      {l.label}
                    </Link>
                  ) : (
                    <a
                      href={l.href}
                      className="text-sm text-[#665d66] transition-colors hover:text-[#151119]"
                    >
                      {l.label}
                    </a>
                  )}
                </li>
              ))}
            </ul>
          </div>

          <div className="lg:col-span-2">
            <h3 className="mb-5 text-sm font-black uppercase tracking-[0.16em] text-[#C13584]">Compare</h3>
            <ul className="space-y-3">
              {compareLinks.map((l) => (
                <li key={l.label}>
                  <Link
                    to={l.href}
                    onClick={() => window.scrollTo(0, 0)}
                    className="text-sm text-[#665d66] transition-colors hover:text-[#151119]"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="lg:col-span-3">
            <h3 className="mb-5 text-sm font-black uppercase tracking-[0.16em] text-[#C13584]">Support</h3>
            <ul className="space-y-3">
              {supportLinks.map((l) => (
                <li key={l.label}>
                  {l.href.startsWith('/') ? (
                    <Link
                      to={l.href}
                      onClick={() => window.scrollTo(0, 0)}
                      className="text-sm text-[#665d66] transition-colors hover:text-[#151119]"
                    >
                      {l.label}
                    </Link>
                  ) : (
                    <a
                      href={l.href}
                      className="text-sm text-[#665d66] transition-colors hover:text-[#151119]"
                    >
                      {l.label}
                    </a>
                  )}
                </li>
              ))}
              {filteredLegalLinks.map((l) => (
                <li key={l.label}>
                  <Link
                    to={l.href}
                    onClick={() => window.scrollTo(0, 0)}
                    className="text-sm text-[#665d66] transition-colors hover:text-[#151119]"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-14 flex flex-col items-center justify-between gap-4 border-t border-[#e2d2d8] pt-8 sm:flex-row">
          <p className="max-w-2xl text-center text-xs leading-relaxed text-[#756b73] sm:text-left">
            © {new Date().getFullYear()} DMGennie. All rights reserved.
            {' '}DMGennie is not affiliated with or endorsed by Meta Platforms, Inc.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-5">
            <Link to="/privacy" onClick={() => window.scrollTo(0, 0)} className="text-xs text-[#756b73] transition-colors hover:text-[#151119]">Privacy</Link>
            <Link to="/terms" onClick={() => window.scrollTo(0, 0)} className="text-xs text-[#756b73] transition-colors hover:text-[#151119]">Terms</Link>
            <Link to="/refund-policy" onClick={() => window.scrollTo(0, 0)} className="text-xs text-[#756b73] transition-colors hover:text-[#151119]">Refunds</Link>
            {session && <Link to="/delete-data" onClick={() => window.scrollTo(0, 0)} className="text-xs text-[#756b73] transition-colors hover:text-[#151119]">Delete Data</Link>}
          </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer
