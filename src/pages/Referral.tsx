import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, BadgeIndianRupee, Calculator, Check, Copy, Gift, Handshake, Mail, Share2, Sparkles, Users } from 'lucide-react'
import { Footer } from '@/components/Footer'

const earnings = [
  { creators: '10', value: '₹998', label: 'monthly commission' },
  { creators: '50', value: '₹4,988', label: 'monthly commission' },
  { creators: '100', value: '₹9,975', label: 'monthly commission' },
]

const steps = [
  {
    icon: Share2,
    title: 'Share your link',
    text: 'Promote DMGennie to creators, agencies, coaches, and ecommerce brands.',
  },
  {
    icon: Users,
    title: 'They become customers',
    text: 'Your referral starts using DMGennie for Instagram DM automation.',
  },
  {
    icon: BadgeIndianRupee,
    title: 'Earn commission',
    text: 'Get recurring commission for every active paid account you refer.',
  },
]

const perks = [
  '25% recurring commission',
  'Monthly payouts',
  'Real-time referral tracking',
  'Premium partner support',
  'Ready-to-share creatives',
  'No cap on qualified referrals',
]

const commissionPerReferral = 99.75

function formatRupees(value: number) {
  return new Intl.NumberFormat('en-IN', {
    maximumFractionDigits: 0,
    style: 'currency',
    currency: 'INR',
  }).format(value)
}

function ReferralLogo() {
  return (
    <Link to="/" className="inline-flex items-center gap-2.5">
      <svg width="32" height="32" viewBox="0 0 40 40" fill="none">
        <rect width="40" height="40" rx="10" fill="#C13584" />
        <path d="M10 27 L19 13" stroke="white" strokeWidth="3.8" strokeLinecap="round" />
        <path d="M17 27 L26 13" stroke="white" strokeWidth="3.8" strokeLinecap="round" />
        <circle cx="29" cy="27" r="3" fill="#f5a9c4" />
      </svg>
      <span className="text-xl font-black tracking-tight text-[#151119]">DMGennie</span>
    </Link>
  )
}

export default function Referral() {
  const [referralCount, setReferralCount] = useState(50)
  const monthlyEstimate = referralCount * commissionPerReferral
  const yearlyEstimate = monthlyEstimate * 12

  return (
    <div className="min-h-screen bg-[#ffffff] text-[#151119]">
      <header className="sticky top-0 z-50 border-b border-white/70 bg-white/72 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 sm:px-8 lg:px-12">
          <ReferralLogo />
          <nav className="hidden items-center gap-8 text-sm font-bold text-[#6a6168] md:flex">
            <Link to="/pricing" className="transition-colors hover:text-[#C13584]">Pricing</Link>
            <a href="#how-referrals-work" className="transition-colors hover:text-[#C13584]">How it Works</a>
            <Link to="/referral" className="text-[#C13584]">Affiliate</Link>
          </nav>
          <Link to="/signup" className="rounded-xl bg-[#C13584] px-5 py-2.5 text-sm font-black text-white shadow-[0_12px_28px_rgba(193,53,132,0.22)] transition-colors hover:bg-[#ad2a75]">
            Join Program
          </Link>
        </div>
      </header>

      <main>
        <section className="relative overflow-hidden px-6 pb-20 pt-16 sm:px-8 sm:pb-24 sm:pt-20 lg:px-12">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_22%_12%,rgba(193,53,132,0.14),transparent_30%),radial-gradient(circle_at_80%_32%,rgba(64,93,230,0.12),transparent_30%),linear-gradient(180deg,#fff,rgba(248,241,243,0.78))]" />
          <div className="relative mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-[0.78fr_1.1fr]">
            <div>
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/80 bg-white/70 px-4 py-2 text-sm font-black uppercase tracking-[0.16em] text-[#C13584] shadow-sm backdrop-blur">
                <Sparkles className="h-4 w-4" />
                Partner Program
              </div>
              <h1 className="max-w-3xl text-5xl font-black leading-[0.96] tracking-tight text-[#151119] sm:text-6xl lg:text-7xl">
                Earn commission by sharing DMGennie
              </h1>
              <p className="mt-7 max-w-2xl text-xl font-medium leading-relaxed text-[#655d64]">
                Refer creators and businesses to DMGennie and earn recurring commission when they grow with Instagram DM automation.
              </p>
              <div className="mt-9 flex flex-wrap gap-4">
                <Link to="/signup" className="inline-flex items-center gap-2 rounded-xl bg-[#C13584] px-7 py-4 text-base font-black text-white shadow-[0_16px_36px_rgba(193,53,132,0.24)] transition-all hover:-translate-y-0.5 hover:bg-[#ad2a75]">
                  Become a Partner
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <a href="#how-referrals-work" className="inline-flex items-center gap-2 rounded-xl border border-white/80 bg-white/70 px-7 py-4 text-base font-black text-[#151119] shadow-sm backdrop-blur transition-all hover:-translate-y-0.5 hover:bg-white">
                  See How It Works
                </a>
              </div>
            </div>

            <div className="relative">
              <div className="absolute -inset-6 rounded-[2.5rem] bg-[#C13584]/10 blur-2xl" />
              <div className="relative overflow-hidden rounded-[2.1rem] border border-white/80 bg-white/78 shadow-[0_30px_90px_rgba(193,53,132,0.16)] backdrop-blur-xl">
                <img
                  src="/brand-assets/referral-partner-program.png"
                  alt="DMGennie partner program"
                  className="h-full min-h-[420px] w-full object-cover"
                />
                <div className="absolute left-5 top-5 inline-flex items-center gap-3 rounded-2xl border border-white/55 bg-white/78 px-4 py-3 shadow-[0_16px_40px_rgba(193,53,132,0.16)] backdrop-blur">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[linear-gradient(155deg,#3a2b8f,#C13584)]">
                    <Handshake className="h-5 w-5 text-[#f0c7a6]" />
                  </div>
                  <div>
                    <div className="text-xs font-black uppercase tracking-[0.14em] text-[#8d7f87]">Golden partner</div>
                    <div className="text-sm font-black text-[#151119]">25% recurring</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="relative mx-auto mt-10 max-w-7xl">
            <div className="grid gap-6 rounded-[2rem] border border-white/80 bg-white/72 p-5 shadow-[0_28px_80px_rgba(193,53,132,0.12)] backdrop-blur-xl lg:grid-cols-[0.9fr_1.1fr] lg:p-7">
              <div className="rounded-[1.6rem] bg-[linear-gradient(155deg,#3a2b8f_0%,#C13584_58%,#E1306C_100%)] p-7 text-white shadow-[0_22px_64px_rgba(193,53,132,0.24)]">
                <div className="mb-8 flex items-center justify-between">
                  <div>
                    <div className="text-sm font-black uppercase tracking-[0.16em] text-white/58">Commission</div>
                    <div className="mt-3 text-6xl font-black tracking-tight">25%</div>
                    <div className="mt-2 text-lg font-bold text-white/72">recurring revenue share</div>
                  </div>
                  <div className="rounded-2xl border border-white/15 bg-white/12 p-4 backdrop-blur">
                    <Gift className="h-7 w-7 text-[#f0c7a6]" />
                  </div>
                </div>

                <div className="rounded-2xl border border-white/15 bg-white/10 p-4">
                  <div className="mb-4 flex items-center justify-between text-sm font-bold text-white/66">
                    <span>Your referral link</span>
                    <Copy className="h-4 w-4 text-[#f0c7a6]" />
                  </div>
                  <div className="truncate rounded-xl bg-white px-4 py-3 text-sm font-black text-[#C13584]">
                    dmgennie.in/ref/partner
                  </div>
                </div>
              </div>

              <div className="rounded-[1.6rem] border border-[#eadde2] bg-[#ffffff] p-6">
                <div className="mb-5 flex items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 text-sm font-black uppercase tracking-[0.16em] text-[#C13584]">
                      <Calculator className="h-4 w-4" />
                      Earnings Calculator
                    </div>
                    <div className="mt-2 text-2xl font-black text-[#151119]">
                      {formatRupees(monthlyEstimate)} / month
                    </div>
                    <div className="text-sm font-bold text-[#8a8088]">
                      {formatRupees(yearlyEstimate)} estimated yearly
                    </div>
                  </div>
                  <div className="rounded-2xl bg-white px-4 py-3 text-center shadow-sm">
                    <div className="text-3xl font-black text-[#151119]">{referralCount}</div>
                    <div className="text-xs font-black uppercase tracking-[0.12em] text-[#8a8088]">referrals</div>
                  </div>
                </div>

                <input
                  type="range"
                  min="10"
                  max="100"
                  step="10"
                  value={referralCount}
                  onChange={(event) => setReferralCount(Number(event.target.value))}
                  className="mb-6 h-2 w-full cursor-pointer accent-[#C13584]"
                  aria-label="Paid referral count"
                />

                <div className="grid gap-3">
                  {earnings.map((item) => (
                    <button
                      key={item.creators}
                      type="button"
                      onClick={() => setReferralCount(Number(item.creators))}
                      className={`flex items-center justify-between rounded-2xl border px-4 py-4 text-left shadow-sm transition-all ${
                        referralCount === Number(item.creators)
                          ? 'border-[#C13584]/25 bg-white shadow-[0_12px_28px_rgba(193,53,132,0.10)]'
                          : 'border-white/80 bg-white/70 hover:border-[#C13584]/20 hover:bg-white'
                      }`}
                    >
                      <div>
                        <div className="text-sm font-bold text-[#7a7279]">{item.creators} paid referrals</div>
                        <div className="text-xs font-semibold uppercase tracking-[0.12em] text-[#a0929a]">{item.label}</div>
                      </div>
                      <div className="text-2xl font-black text-[#151119]">{item.value}</div>
                    </button>
                  ))}
                </div>
                <p className="mt-5 text-xs font-semibold leading-relaxed text-[#8a8088]">
                  Example based on 25% commission on the annual Pro price. Actual earnings depend on active paid accounts.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section id="how-referrals-work" className="bg-white px-6 py-20 sm:px-8 lg:px-12">
          <div className="mx-auto max-w-7xl">
            <div className="mx-auto mb-12 max-w-3xl text-center">
              <div className="mb-4 text-sm font-black uppercase tracking-[0.18em] text-[#C13584]">How It Works</div>
              <h2 className="text-4xl font-black tracking-tight text-[#151119] sm:text-5xl">Three simple steps</h2>
            </div>
            <div className="grid gap-6 md:grid-cols-3">
              {steps.map((step, index) => {
                const Icon = step.icon
                return (
                  <div key={step.title} className="rounded-[1.5rem] border border-[#eadde2] bg-[#ffffff] p-7 shadow-[0_18px_45px_rgba(193,53,132,0.08)]">
                    <div className="mb-6 flex items-center justify-between">
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#C13584] text-white">
                        <Icon className="h-5 w-5" />
                      </div>
                      <span className="text-sm font-black uppercase tracking-[0.16em] text-[#c4a0ad]">Step {index + 1}</span>
                    </div>
                    <h3 className="text-2xl font-black text-[#151119]">{step.title}</h3>
                    <p className="mt-3 text-base font-medium leading-relaxed text-[#665d66]">{step.text}</p>
                  </div>
                )
              })}
            </div>
          </div>
        </section>

        <section className="relative overflow-hidden px-6 py-20 sm:px-8 lg:px-12">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_30%,rgba(193,53,132,0.10),transparent_28%),radial-gradient(circle_at_78%_30%,rgba(64,93,230,0.10),transparent_28%)]" />
          <div className="relative mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.85fr_1fr]">
            <div>
              <div className="mb-4 text-sm font-black uppercase tracking-[0.18em] text-[#C13584]">Why Partners Like It</div>
              <h2 className="text-4xl font-black leading-tight text-[#151119] sm:text-5xl">
                A clean commission program for creator tools
              </h2>
              <p className="mt-5 text-lg font-medium leading-relaxed text-[#665d66]">
                DMGennie is easy to explain: creators comment-trigger DMs, capture leads, send links, and save hours every week.
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {perks.map((perk) => (
                <div key={perk} className="flex items-center gap-3 rounded-2xl border border-white/80 bg-white/72 p-4 shadow-sm backdrop-blur">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#C13584] text-white">
                    <Check className="h-4 w-4" />
                  </span>
                  <span className="font-bold text-[#312b32]">{perk}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="relative overflow-hidden px-6 py-20 sm:px-8 lg:px-12">
          <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.4),rgba(248,241,243,0.95)),radial-gradient(circle_at_50%_40%,rgba(193,53,132,0.12),transparent_32%)]" />
          <div className="relative mx-auto max-w-6xl rounded-[2.25rem] border border-white/80 bg-white/72 p-7 shadow-[0_34px_100px_rgba(193,53,132,0.14)] backdrop-blur-xl sm:p-10 lg:p-12">
            <div className="grid items-center gap-8 lg:grid-cols-[0.82fr_1fr]">
              <div className="relative overflow-hidden rounded-[1.75rem] bg-[linear-gradient(155deg,#3a2b8f_0%,#C13584_58%,#E1306C_100%)] p-8 text-white shadow-[0_22px_64px_rgba(193,53,132,0.24)]">
                <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_10%,rgba(255,255,255,0.20),transparent_34%)]" />
                <div className="relative">
                  <div className="mb-10 inline-flex h-14 w-14 items-center justify-center rounded-2xl border border-white/15 bg-white/12 backdrop-blur">
                    <Handshake className="h-7 w-7 text-[#f0c7a6]" />
                  </div>
                  <div className="text-sm font-black uppercase tracking-[0.18em] text-white/55">Partner Program</div>
                  <div className="mt-4 text-6xl font-black tracking-tight">25%</div>
                  <div className="mt-2 text-lg font-bold text-white/70">recurring commission</div>
                </div>
              </div>

              <div>
                <h2 className="text-4xl font-black leading-tight tracking-tight text-[#151119] sm:text-5xl">
                  Ready to become a DMGennie partner?
                </h2>
                <p className="mt-5 max-w-2xl text-lg font-medium leading-relaxed text-[#665d66]">
                  Join the referral program and start earning from creators who need simple, premium Instagram DM automation.
                </p>
                <div className="mt-7 flex flex-wrap gap-3">
                  {['Fast approval', 'Monthly payouts', 'Creator-friendly offer'].map((item) => (
                    <span key={item} className="rounded-full border border-[#eadde2] bg-[#ffffff] px-4 py-2 text-sm font-black text-[#C13584]">
                      {item}
                    </span>
                  ))}
                </div>
                <div className="mt-8 flex flex-wrap gap-4">
                  <Link to="/signup" className="rounded-xl bg-[#C13584] px-7 py-4 text-base font-black text-white shadow-[0_16px_36px_rgba(193,53,132,0.22)] transition-all hover:-translate-y-0.5 hover:bg-[#ad2a75]">
                    Apply Now
                  </Link>
                  <a href="mailto:support@dmgennie.in" className="inline-flex items-center gap-2 rounded-xl border border-[#eadde2] bg-white px-7 py-4 text-base font-black text-[#151119] shadow-sm transition-all hover:-translate-y-0.5 hover:border-[#C13584]/30">
                    <Mail className="h-4 w-4 text-[#C13584]" />
                    Contact Us
                  </a>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
