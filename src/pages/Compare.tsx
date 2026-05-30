'use client'

import { Link, useParams } from 'react-router-dom'
import { useEffect } from 'react'
import { Check, ChevronRight, Home, Medal, ShieldCheck, X, Zap } from 'lucide-react'
import { Footer } from '@/components/Footer'
import { PageHeader } from '@/components/PageHeader'
import { TrustChips } from '@/components/TrustChips'

type Status = boolean | 'Limited' | 'Complex' | 'Not confirmed' | string

type Competitor = {
  name: string
  slug: string
  price: string
  intro: string
  note?: string
  rows: Array<{ feature: string; dmgenie: Status; competitor: Status }>
}

const baseRows = [
  { feature: 'Meta Business Partner workflow', dmgenie: true, competitor: false },
  { feature: 'Forever free starter plan', dmgenie: true, competitor: false },
  { feature: 'Remove branding', dmgenie: true, competitor: true },
  { feature: 'Send non-brand URLs', dmgenie: true, competitor: false },
  { feature: 'Instagram DM automation', dmgenie: true, competitor: true },
  { feature: 'Facebook DM automation', dmgenie: true, competitor: false },
  { feature: 'Comment auto-reply', dmgenie: true, competitor: true },
  { feature: 'Rewind missed DMs', dmgenie: true, competitor: false },
  { feature: 'DM overflow queue', dmgenie: true, competitor: false },
  { feature: 'Slow down mode', dmgenie: true, competitor: false },
  { feature: 'Story DM automation', dmgenie: true, competitor: false },
  { feature: 'Fast customer support', dmgenie: true, competitor: 'Not confirmed' },
]

const competitors: Record<string, Competitor> = {
  'beacons-ai': {
    slug: 'beacons-ai',
    name: 'Smart Reply by Beacons.ai',
    price: '$30',
    intro:
      'DMGennie is a focused Instagram DM automation alternative for creators who want quick comment-to-DM campaigns, flexible links, and simple setup without being tied to a broader commerce platform.',
    rows: baseRows,
  },
  'high-level': {
    slug: 'high-level',
    name: 'High Level',
    price: '$99',
    intro:
      'DMGennie keeps Instagram automation lightweight and creator-friendly, while larger workflow tools can feel expensive and restrictive for straightforward DM campaigns.',
    rows: baseRows.map((row) =>
      ['Send non-brand URLs', 'Instagram DM automation', 'Facebook DM automation'].includes(row.feature)
        ? { ...row, competitor: true }
        : row
    ),
  },
  manychat: {
    slug: 'manychat',
    name: 'ManyChat',
    price: '$199',
    intro:
      'DMGennie gives creators a simpler path to launch Instagram and Facebook DM automations without wrestling with a heavy flow builder for every campaign.',
    note: 'ManyChat is a trademark of ManyChat Inc. DMGennie is not affiliated with ManyChat.',
    rows: baseRows.map((row) =>
      ['Meta Business Partner workflow', 'Forever free starter plan', 'Send non-brand URLs', 'Facebook DM automation'].includes(row.feature)
        ? { ...row, competitor: true }
        : row
    ),
  },
  'mobile-monkey': {
    slug: 'mobile-monkey',
    name: 'MobileMonkey',
    price: '$125',
    intro:
      'DMGennie is built for fast, flexible Instagram engagement. It keeps costs low while giving creators practical automation controls for comments, stories, inboxes, and campaigns.',
    rows: baseRows.map((row) =>
      ['Meta Business Partner workflow', 'Forever free starter plan', 'Send non-brand URLs', 'Facebook DM automation', 'Story DM automation'].includes(row.feature)
        ? { ...row, competitor: true }
        : row
    ),
  },
  'stan-autodm': {
    slug: 'stan-autodm',
    name: 'Stan AutoDM',
    price: '$29',
    intro:
      'DMGennie is a more complete automation option for creators who need external links, broader trigger support, and reliable campaign controls beyond store-only replies.',
    note: 'Stan is a trademark of Find Community, Inc. DMGennie is not affiliated with Stan.',
    rows: baseRows.map((row) =>
      row.feature === 'Instagram DM automation' || row.feature === 'Comment auto-reply'
        ? { ...row, competitor: true }
        : row
    ),
  },
}

const compareLinks = Object.values(competitors)

function StatusBadge({ value }: { value: Status }) {
  if (value === true) {
    return (
      <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600 ring-1 ring-emerald-500/15">
        <Check className="h-5 w-5 stroke-[3]" />
      </span>
    )
  }

  if (value === false) {
    return (
      <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-rose-500/10 text-rose-500 ring-1 ring-rose-500/15">
        <X className="h-5 w-5 stroke-[3]" />
      </span>
    )
  }

  return <span className="text-sm font-bold text-[#756b73]">{value}</span>
}

export default function Compare() {
  const { slug } = useParams()
  const page = slug ? competitors[slug] : undefined

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [slug])

  if (!page) {
    return (
      <div className="premium-gradient min-h-screen text-[#151119]">
        <PageHeader />
        <main className="mx-auto max-w-4xl px-6 pb-20 pt-36 text-center">
          <p className="text-sm font-black uppercase tracking-[0.2em] text-[#6d2948]">Compare</p>
          <h1 className="mt-5 text-4xl font-black tracking-tight sm:text-5xl">Comparison not found</h1>
          <p className="mx-auto mt-4 max-w-xl text-lg text-[#665d66]">Choose one of the available DMGennie comparisons below.</p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            {compareLinks.map((item) => (
              <Link key={item.slug} to={`/compare/${item.slug}`} className="rounded-full border border-white/80 bg-white/70 px-4 py-2 text-sm font-bold text-[#665d66] shadow-sm backdrop-blur transition-all hover:-translate-y-0.5 hover:text-[#6d2948]">
                {item.name}
              </Link>
            ))}
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  return (
    <div className="premium-gradient min-h-screen text-[#151119]">
      <PageHeader />

      <main className="relative overflow-hidden pb-20 pt-36">
        <div className="pointer-events-none absolute left-[-10%] top-24 h-80 w-80 rounded-full bg-[#6d2948]/10 blur-3xl" />
        <div className="pointer-events-none absolute right-[-10%] top-40 h-96 w-96 rounded-full bg-[#d7a2ad]/18 blur-3xl" />

        <section className="relative mx-auto max-w-7xl px-6 sm:px-8 lg:px-12">
          <div className="mb-10 flex flex-wrap items-center justify-center gap-2 text-sm font-bold text-[#756b73]">
            <Link to="/" className="inline-flex items-center gap-1 rounded-full border border-white/80 bg-white/62 px-3 py-1.5 backdrop-blur transition-colors hover:text-[#6d2948]">
              <Home className="h-4 w-4" />
              Home
            </Link>
            <ChevronRight className="h-4 w-4 text-[#b6aab1]" />
            <span>Compare</span>
            <ChevronRight className="h-4 w-4 text-[#b6aab1]" />
            <span className="text-[#151119]">{page.name}</span>
          </div>

          <div className="mx-auto max-w-5xl text-center">
            <p className="text-sm font-black uppercase tracking-[0.22em] text-[#6d2948]">Platform Comparison</p>
            <h1 className="mt-7 text-4xl font-black leading-tight tracking-tight text-[#151119] sm:text-6xl">
              DMGennie vs {page.name}
            </h1>
            <p className="mx-auto mt-6 max-w-4xl text-lg font-medium leading-8 text-[#665d66] sm:text-xl">
              {page.intro}
            </p>
            {page.note && <p className="mt-5 text-sm font-bold text-[#9f3b58]">{page.note}</p>}
          </div>

          <div className="mx-auto mt-10 flex max-w-5xl flex-wrap items-center justify-center gap-3">
            {compareLinks.map((item) => {
              const active = item.slug === page.slug
              return (
                <Link
                  key={item.slug}
                  to={`/compare/${item.slug}`}
                  className={`rounded-full border px-4 py-2 text-sm font-black transition-all ${
                    active
                      ? 'border-[#6d2948] bg-[#6d2948] text-white shadow-[0_14px_30px_rgba(109,41,72,0.22)]'
                      : 'border-white/80 bg-white/66 text-[#756b73] shadow-sm backdrop-blur hover:-translate-y-0.5 hover:text-[#6d2948]'
                  }`}
                >
                  {item.name}
                </Link>
              )
            })}
          </div>

          <div className="mx-auto mt-16 max-w-6xl overflow-x-auto rounded-[2rem] border border-white/80 bg-white/74 shadow-[0_28px_90px_rgba(109,41,72,0.10)] backdrop-blur-xl">
            <div className="min-w-[760px]">
              <div className="grid grid-cols-[1.2fr_1fr_1fr] bg-[#fbf7f8]/80">
                <div className="px-7 py-7 text-2xl font-black text-[#151119]">Features</div>
                <div className="border-x border-[#eadde2] bg-white/72 px-7 py-7 text-center">
                  <div className="inline-flex items-center gap-2 text-2xl font-black">
                    DMGennie
                    <Medal className="h-5 w-5 text-[#6d2948]" />
                  </div>
                  <div className="mt-2 text-xs font-black uppercase tracking-wider text-[#6d2948]">Best for creators</div>
                </div>
                <div className="px-7 py-7 text-center text-2xl font-black text-[#151119]">{page.name}</div>
              </div>

              <div className="divide-y divide-[#eadde2]">
                <div className="grid grid-cols-[1.2fr_1fr_1fr] items-center">
                  <div className="px-7 py-5 text-lg font-bold">Cost to send 25,000 DMs</div>
                  <div className="border-x border-[#eadde2] px-7 py-5 text-center text-xl font-black text-[#6d2948]">$0+</div>
                  <div className="px-7 py-5 text-center text-xl font-bold text-[#756b73]">{page.price}</div>
                </div>

                {page.rows.map((row) => (
                  <div key={row.feature} className="grid grid-cols-[1.2fr_1fr_1fr] items-center">
                    <div className="px-7 py-5 text-base font-bold text-[#151119]">{row.feature}</div>
                    <div className="border-x border-[#eadde2] px-7 py-5 text-center">
                      <StatusBadge value={row.dmgenie} />
                    </div>
                    <div className="px-7 py-5 text-center">
                      <StatusBadge value={row.competitor} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="mx-auto mt-12 grid max-w-5xl gap-4 md:grid-cols-3">
            {[
              { icon: <Zap className="h-5 w-5" />, title: 'Launch quickly', text: 'Create keyword automations without a heavy builder.' },
              { icon: <ShieldCheck className="h-5 w-5" />, title: 'API-safe flow', text: 'Built around official Instagram connection patterns.' },
              { icon: <Medal className="h-5 w-5" />, title: 'Creator-first', text: 'Simple campaign controls for links, offers, and replies.' },
            ].map((item) => (
              <div key={item.title} className="rounded-2xl border border-white/80 bg-white/62 p-6 shadow-[0_18px_46px_rgba(109,41,72,0.08)] backdrop-blur">
                <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-[#6d2948]/10 text-[#6d2948]">
                  {item.icon}
                </div>
                <h3 className="text-lg font-black">{item.title}</h3>
                <p className="mt-2 text-sm font-medium leading-relaxed text-[#665d66]">{item.text}</p>
              </div>
            ))}
          </div>

          <div className="mx-auto mt-16 max-w-4xl rounded-[2rem] border border-white/80 bg-white/68 p-8 text-center shadow-[0_26px_80px_rgba(109,41,72,0.10)] backdrop-blur-xl sm:p-10">
            <h2 className="text-3xl font-black tracking-tight text-[#151119] sm:text-4xl">Get started with DMGennie for free</h2>
            <p className="mx-auto mt-3 max-w-2xl text-lg font-medium text-[#665d66]">Create your account and launch your first automation in minutes.</p>
            <Link to="/signup" className="premium-button mt-8 inline-flex rounded-xl px-9 py-4 text-lg font-bold text-white transition-all hover:-translate-y-0.5">
              Create Free Account
            </Link>
            <TrustChips className="mt-6 justify-center" />
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
