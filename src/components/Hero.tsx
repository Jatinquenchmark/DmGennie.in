'use client'

import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { ArrowLeft, CheckCircle2, Link2, Menu, Send, Sparkles, X, Zap } from 'lucide-react'
import { useState, useEffect } from 'react'
import { TrustChips } from './TrustChips'

const navItems = [
  { label: 'Pricing', href: '/pricing' },
  { label: 'How it Works', href: '#how-it-works' },
  { label: 'Affiliate', href: '/referral' },
]

export function Hero() {
  const [isScrolled, setIsScrolled] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 50)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    document.body.style.overflow = isMobileMenuOpen ? 'hidden' : 'unset'
    return () => { document.body.style.overflow = 'unset' }
  }, [isMobileMenuOpen])

  return (
    <div className="premium-gradient relative isolate min-h-screen w-full overflow-hidden">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-white/50 dark:bg-transparent" />
      <div className="pointer-events-none absolute left-[-8%] top-[18%] h-72 w-72 rounded-full bg-[#C13584]/10 blur-3xl sm:h-96 sm:w-96" />
      <div className="pointer-events-none absolute right-[-10%] top-[24%] h-80 w-80 rounded-full bg-[#f5a9c4]/18 blur-3xl sm:h-[30rem] sm:w-[30rem]" />
      <div className="pointer-events-none absolute bottom-[-18%] left-[30%] h-72 w-72 rounded-full bg-[#C13584]/8 blur-3xl" />

      {/* Navbar */}
      <motion.nav initial={{ opacity: 0, y: -30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.3 }} className="fixed left-0 right-0 top-0 z-[110] w-full">
        <div className="w-full px-4 py-4 transition-all duration-300 ease-out sm:px-6 lg:px-8">
          <div className={`mx-auto flex max-w-7xl items-center justify-between rounded-[1.35rem] border px-4 py-3 transition-all duration-300 ${
            isScrolled
              ? 'border-white/80 bg-white/78 shadow-[0_18px_55px_rgba(193,53,132,0.10)] backdrop-blur-xl dark:border-white/10 dark:bg-[#131b2e]/85'
              : 'border-white/60 bg-white/42 shadow-[0_14px_42px_rgba(193,53,132,0.07)] backdrop-blur-md dark:border-white/10 dark:bg-[#131b2e]/55'
          }`}>
            <motion.div whileHover={{ scale: 1.03 }} className="flex cursor-pointer items-center gap-2.5" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
              <svg width="32" height="32" viewBox="0 0 40 40" fill="none">
                <rect width="40" height="40" rx="10" fill="#C13584"/>
                <path d="M10 27 L19 13" stroke="white" strokeWidth="3.8" strokeLinecap="round"/>
                <path d="M17 27 L26 13" stroke="white" strokeWidth="3.8" strokeLinecap="round"/>
                <circle cx="29" cy="27" r="3" fill="#f5a9c4"/>
              </svg>
              <span className="font-black text-xl tracking-tight text-foreground">DMGennie</span>
            </motion.div>

            <div className="hidden items-center gap-8 md:flex">
              {navItems.map((item) => (
                item.href.startsWith('/') ? (
                  <Link
                    key={item.label}
                    to={item.href}
                    className="text-sm font-black text-[#625963] transition-colors hover:text-[#C13584] dark:text-slate-300 dark:hover:text-brand-magenta"
                  >
                    {item.label}
                  </Link>
                ) : (
                  <a
                    key={item.label}
                    href={item.href}
                    className="text-sm font-black text-[#625963] transition-colors hover:text-[#C13584] dark:text-slate-300 dark:hover:text-brand-magenta"
                  >
                    {item.label}
                  </a>
                )
              ))}
            </div>

            <div className="flex items-center space-x-3">
              <Link to="/signup">
                <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} className="hidden rounded-xl bg-[#C13584] px-5 py-2.5 text-sm font-black text-white shadow-[0_12px_28px_rgba(193,53,132,0.20)] transition-all hover:bg-[#ad2a75] sm:block">
                  Get Started Free
                </motion.button>
              </Link>
              <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="relative z-[120] cursor-pointer rounded-full p-3 text-foreground hover:bg-white dark:hover:bg-white/10 md:hidden">
                {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>
      </motion.nav>

      {isMobileMenuOpen && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="md:hidden fixed inset-0 bg-black/50 backdrop-blur-md z-[80]" onClick={() => setIsMobileMenuOpen(false)} />}
      <motion.div initial={{ x: '100%' }} animate={{ x: isMobileMenuOpen ? '0%' : '100%' }} transition={{ type: 'spring', damping: 25, stiffness: 200 }} className="md:hidden fixed top-0 right-0 h-full w-72 max-w-[85vw] bg-white dark:bg-[#0f1626] z-[90] shadow-2xl">
        <div className="flex flex-col p-6 pt-20 space-y-4">
          {navItems.map((item) => (
            item.href.startsWith('/') ? (
              <Link
                key={item.label}
                to={item.href}
                className="rounded-lg px-4 py-3 text-lg font-semibold text-foreground hover:bg-accent"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                {item.label}
              </Link>
            ) : (
              <a
                key={item.label}
                href={item.href}
                className="rounded-lg px-4 py-3 text-lg font-semibold text-foreground hover:bg-accent"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                {item.label}
              </a>
            )
          ))}
          <Link to="/signup" className="block bg-accent-blue text-white font-semibold px-6 py-3 rounded-xl text-center mt-4">Get Started Free</Link>
        </div>
      </motion.div>

      {/* Hero Content */}
      <div className="relative z-10 mx-auto grid min-h-[calc(100vh-2rem)] max-w-[1440px] grid-cols-1 items-center gap-12 px-6 pb-16 pt-32 sm:px-8 sm:pb-20 sm:pt-36 lg:grid-cols-[minmax(0,1.02fr)_minmax(340px,0.88fr)] lg:gap-10 lg:px-12 xl:gap-16">
        <motion.div initial={{ opacity: 0, x: -42 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.9, delay: 0.45 }} className="mx-auto w-full max-w-[660px] text-center text-foreground lg:mx-0 lg:text-left">
          <h1 className="mx-auto mb-6 max-w-[760px] text-4xl font-black leading-[0.98] tracking-tight text-[#101018] dark:text-slate-50 sm:text-5xl md:text-6xl lg:mx-0 lg:max-w-[680px] xl:text-[4.55rem]">
            Automate Instagram DMs from Comments
          </h1>

          <p className="mx-auto mb-8 max-w-[620px] text-lg font-medium leading-relaxed text-[#675d65] dark:text-slate-300 sm:text-xl lg:mx-0">
            Automatically send Instagram direct messages when users comment keywords on your posts and reels — using official Meta APIs, fully compliant.
          </p>

          <div className="flex flex-wrap justify-center gap-4 lg:justify-start">
            <Link to="/signup">
              <motion.button whileHover={{ scale: 1.025, y: -2 }} whileTap={{ scale: 0.98 }} className="premium-button cursor-pointer rounded-xl px-8 py-4 text-lg font-bold text-white gentle-animation">
                Start For Free
              </motion.button>
            </Link>
            <a href="#how-it-works">
              <motion.button whileHover={{ scale: 1.025, y: -2 }} whileTap={{ scale: 0.98 }} className="glass-light cursor-pointer rounded-xl px-8 py-4 text-lg font-bold text-foreground gentle-animation">
                See How It Works
              </motion.button>
            </a>
          </div>

          <TrustChips className="mt-6 justify-center lg:justify-start" />

        </motion.div>

        <motion.div initial={{ opacity: 0, x: 42 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.9, delay: 0.7 }} className="relative flex w-full justify-center lg:justify-end">
          <div className="relative mx-auto flex w-full max-w-[460px] items-center justify-center lg:mx-0">
            <div className="absolute -inset-10 rounded-full bg-rose-200/20 blur-3xl" />
            <div className="absolute right-8 top-16 h-40 w-40 rounded-full bg-fuchsia-200/20 blur-3xl" />

            <motion.div
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}
              className="premium-glow relative w-[265px] rounded-[2.6rem] border-[10px] border-[#111318] bg-[#111318] sm:w-[315px] sm:rounded-[3rem] sm:border-[12px] xl:w-[342px]"
            >
              <div className="absolute left-1/2 top-3 z-20 h-6 w-24 -translate-x-1/2 rounded-full bg-[#111318] sm:w-32" />
              <div className="relative overflow-hidden rounded-[2.25rem] bg-[#f8fafc]">
                <div className="border-b border-slate-200/70 bg-white px-5 pb-4 pt-12 sm:pt-14">
                  <div className="flex items-center gap-3">
                    <ArrowLeft className="h-5 w-5 shrink-0 text-gray-900" />
                    <div className="relative h-11 w-11 shrink-0 rounded-full bg-gradient-to-br from-[#833AB4] via-[#C13584] to-[#f5a9c4] p-[3px] sm:h-12 sm:w-12">
                      <div className="flex h-full w-full items-center justify-center rounded-full bg-white p-1">
                        <div className="flex h-full w-full items-center justify-center rounded-full bg-accent-blue">
                          <svg width="24" height="24" viewBox="0 0 40 40" fill="none" aria-hidden="true" className="drop-shadow-sm">
                            <path d="M10 27 L19 13" stroke="white" strokeWidth="4" strokeLinecap="round" />
                            <path d="M17 27 L26 13" stroke="white" strokeWidth="4" strokeLinecap="round" />
                            <circle cx="29" cy="27" r="3.2" fill="#f5a9c4" />
                          </svg>
                        </div>
                      </div>
                      <span className="absolute -bottom-0.5 -right-0.5 h-4 w-4 rounded-full border-2 border-white bg-emerald-500" />
                    </div>
                    <div className="min-w-0">
                      <div className="truncate text-base font-black text-gray-950">dmgennie.in</div>
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                        Automation active
                      </div>
                    </div>
                  </div>
                </div>

                <div className="min-h-[420px] bg-gradient-to-b from-white via-slate-50 to-slate-100 px-5 py-6 sm:min-h-[500px] xl:min-h-[540px]">
                  <div className="flex items-end gap-2">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#833AB4] via-[#C13584] to-[#f5a9c4] p-[2px] shadow-sm">
                      <div className="flex h-full w-full items-center justify-center rounded-full bg-white text-[11px] font-black text-accent-blue">
                        IG
                      </div>
                    </div>
                    <div className="max-w-[190px] rounded-[1.25rem] rounded-bl-md bg-white px-4 py-3 text-sm font-semibold text-slate-900 shadow-sm ring-1 ring-slate-200/70">
                      Send me the guide
                    </div>
                  </div>

                  <motion.div
                    animate={{ opacity: [0.65, 1, 0.65] }}
                    transition={{ duration: 2.5, repeat: Infinity }}
                    className="my-6 flex items-center justify-end gap-2 text-[10px] font-black uppercase tracking-wider text-slate-400"
                  >
                    <Sparkles className="h-4 w-4 text-accent-blue" />
                    DMGennie automated reply
                  </motion.div>

                  <div className="ml-auto max-w-[245px] rounded-[1.35rem] rounded-br-md bg-[#111827] px-4 py-3 text-sm font-semibold leading-relaxed text-white shadow-xl">
                    Absolutely. Your Instagram growth guide is ready.
                  </div>

                  <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 1.2, duration: 0.6 }}
                    className="ml-auto mt-4 max-w-[230px] rounded-[1.5rem] border border-slate-200 bg-white p-4 shadow-[0_18px_46px_rgba(15,23,42,0.12)] sm:max-w-[250px]"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-50 text-accent-blue">
                        <Link2 className="h-5 w-5" />
                      </div>
                      <div className="min-w-0">
                        <div className="truncate text-sm font-black text-slate-950">Growth Automation Guide</div>
                        <div className="truncate text-xs font-medium text-slate-500">dmgennie.in/guide</div>
                      </div>
                    </div>
                    <div className="mt-3 rounded-2xl bg-accent-blue px-4 py-2.5 text-center text-xs font-black text-white shadow-sm">
                      Open Guide
                    </div>
                  </motion.div>

                  <div className="mt-5 flex items-end gap-2 sm:mt-7">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#833AB4] via-[#C13584] to-[#f5a9c4] p-[2px] shadow-sm">
                      <div className="flex h-full w-full items-center justify-center rounded-full bg-white text-[11px] font-black text-accent-blue">
                        IG
                      </div>
                    </div>
                    <div className="max-w-[210px] rounded-[1.25rem] rounded-bl-md bg-white px-4 py-3 text-sm font-semibold text-slate-900 shadow-sm ring-1 ring-slate-200/70">
                      Looks great, thanks.
                    </div>
                  </div>

                  <div className="absolute bottom-5 left-5 right-5">
                    <div className="flex items-center gap-3 rounded-full border border-slate-200 bg-white px-4 py-3 shadow-[0_12px_30px_rgba(15,23,42,0.08)]">
                      <div className="h-7 w-7 rounded-full border-2 border-slate-300" />
                      <div className="flex-1 text-sm font-medium text-slate-400">Message...</div>
                      <Send className="h-5 w-5 text-accent-blue" />
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>

            <motion.div animate={{ y: [0, -8, 0] }} transition={{ duration: 3.5, repeat: Infinity }} className="glass-card absolute -right-12 top-20 hidden rounded-2xl px-4 py-3 sm:block">
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-accent-blue" />
                <div>
                  <div className="text-sm font-black text-slate-950">Keyword matched</div>
                  <div className="text-xs font-semibold text-slate-500">Reply sent instantly</div>
                </div>
              </div>
            </motion.div>

            <motion.div animate={{ y: [0, -6, 0] }} transition={{ duration: 4, repeat: Infinity, delay: 0.6 }} className="glass-card absolute -left-2 bottom-28 hidden rounded-2xl px-4 py-3 sm:block">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                <span className="text-sm font-black text-slate-950">Lead captured</span>
              </div>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
