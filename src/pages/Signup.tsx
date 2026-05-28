'use client'

import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowRight,
  Check,
  Loader2,
  Send,
  Shield,
} from 'lucide-react'
import { supabase } from '@/lib/supabase'

function DMGenieLogo() {
  return (
    <Link to="/" className="inline-flex items-center gap-2.5 group">
      <svg width="38" height="38" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="40" height="40" rx="10" fill="#6d2948" />
        <path d="M10 27 L19 13" stroke="white" strokeWidth="3.8" strokeLinecap="round" />
        <path d="M17 27 L26 13" stroke="white" strokeWidth="3.8" strokeLinecap="round" />
        <circle cx="29" cy="27" r="3" fill="#d7a2ad" />
      </svg>
      <span className="text-2xl font-black tracking-tight text-[#151119] transition-colors group-hover:text-[#6d2948]">
        DM<span className="text-[#6d2948]">Genie</span>
      </span>
    </Link>
  )
}

function DMGenieMark({ className = '' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      className={className}
    >
      <rect width="40" height="40" rx="10" fill="#6d2948" />
      <path d="M10 27 L19 13" stroke="white" strokeWidth="3.8" strokeLinecap="round" />
      <path d="M17 27 L26 13" stroke="white" strokeWidth="3.8" strokeLinecap="round" />
      <circle cx="29" cy="27" r="3" fill="#d7a2ad" />
    </svg>
  )
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
    </svg>
  )
}

function getSavedReferralCode() {
  if (typeof window === 'undefined') return ''

  const localCode = localStorage.getItem('dmgennie_referral_code')
  if (localCode) return localCode

  const cookieCode = document.cookie
    .split('; ')
    .find((row) => row.startsWith('dmgennie_referral_code='))
    ?.split('=')[1]

  return cookieCode ? decodeURIComponent(cookieCode) : ''
}

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())
}

function SignupTrustBadges() {
  const badges = [
    {
      title: 'Meta Approved',
      subtitle: 'Business Partner',
      logo: true,
    },
    {
      title: 'Official API Connection',
      subtitle: 'Secure OAuth Authentication',
      logo: false,
    },
  ]

  return (
    <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
      {badges.map((badge) => (
        <div
          key={badge.title}
          className="flex min-h-[3.65rem] items-start gap-2 rounded-xl border border-[#eadde2] bg-white/[0.66] px-2.5 py-2.5 shadow-[0_8px_20px_rgba(76,45,59,0.045)]"
        >
          {badge.logo ? (
            <span className="flex h-8 w-14 shrink-0 items-center justify-center rounded-lg border border-[#eadde2] bg-white px-1">
              <img
                src="/brand-assets/meta-business-partner.png"
                alt="Meta Business Partner"
                className="h-full w-full object-contain"
                loading="lazy"
              />
            </span>
          ) : (
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-500/[0.10] text-emerald-600">
              <Check className="h-3.5 w-3.5 stroke-[3]" />
            </span>
          )}
          <span className="min-w-0">
            <span className="block text-[10px] font-black leading-tight text-[#6d2948]">{badge.title}</span>
            <span className="mt-0.5 block text-[9px] font-bold leading-tight text-[#7b7078]">{badge.subtitle}</span>
          </span>
        </div>
      ))}
    </div>
  )
}

function CreatorProof() {
  return (
    <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
      <div className="flex -space-x-2">
        {['A', 'M', 'R', 'S', 'K'].map((initial, index) => (
          <span
            key={initial}
            className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-gradient-to-br from-[#6d2948] to-[#d7a2ad] text-[11px] font-black text-white shadow-[0_6px_14px_rgba(76,45,59,0.12)]"
            style={{ opacity: 1 - index * 0.045 }}
          >
            {initial}
          </span>
        ))}
      </div>
      <p className="text-xs font-bold text-[#756b73]">Joined by 2,000+ Instagram creators</p>
    </div>
  )
}

function AuthShowcase() {
  return (
    <div className="relative flex flex-col items-center justify-center overflow-hidden px-2 py-8 sm:py-10 lg:px-4 lg:py-0">
      <div className="pointer-events-none absolute left-1/2 top-1/2 h-[27rem] w-[27rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(109,41,72,0.13),rgba(139,72,116,0.08)_38%,rgba(215,162,173,0.045)_58%,transparent_74%)] blur-3xl" />
      <motion.div
        initial={{ opacity: 0, y: 18, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.55, delay: 0.08, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-10 w-[min(76vw,18.5rem)] sm:w-[min(50vw,18.75rem)] lg:w-[min(27vw,17.25rem)] xl:w-[18rem]"
      >
        <div className="pointer-events-none absolute -inset-6 rounded-[3.3rem] bg-[radial-gradient(circle,rgba(109,41,72,0.14),rgba(126,63,112,0.07)_48%,transparent_72%)] blur-2xl" />
        <div className="relative aspect-[390/812] rounded-[2.75rem] border border-white/30 bg-[#17131a] p-[7px] shadow-[0_20px_48px_rgba(21,17,25,0.16),0_7px_16px_rgba(109,41,72,0.055)]">
          <div className="absolute -right-5 top-24 z-30 rounded-2xl border border-white/70 bg-white/90 px-3 py-2 text-center shadow-[0_12px_28px_rgba(76,45,59,0.12)] backdrop-blur-xl">
            <p className="text-sm font-black leading-none text-[#6d2948]">+2.3K</p>
            <p className="mt-0.5 text-[9px] font-bold uppercase tracking-[0.08em] text-[#7b7078]">followers</p>
          </div>
          <div className="pointer-events-none absolute inset-x-14 top-1.5 h-px bg-gradient-to-r from-transparent via-white/22 to-transparent" />
          <div className="relative h-full overflow-hidden rounded-[2.35rem] border border-white/[0.055] bg-[#08080b]">
            <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,#111016_0%,#09090d_56%,#080609_100%)]" />
            <div className="pointer-events-none absolute inset-0 opacity-[0.02] [background-image:linear-gradient(rgba(255,255,255,0.9)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.9)_1px,transparent_1px)] [background-size:32px_32px]" />
            <div className="absolute left-1/2 top-0 z-20 h-6 w-28 -translate-x-1/2 rounded-b-[1.1rem] bg-[#050506]" />

            <div className="relative z-10 flex h-full flex-col px-4 pb-4 pt-3 text-white">
              <div className="flex h-7 items-center justify-between px-1 text-[10px] font-semibold text-white/70">
                <span>9:41</span>
                <div className="flex items-center gap-1.5 opacity-75">
                  <span className="h-1.5 w-3.5 rounded-full bg-white" />
                  <span className="h-1.5 w-1.5 rounded-full bg-white" />
                  <span className="h-2.5 w-5 rounded-[4px] border border-white/70">
                    <span className="block h-full w-3 rounded-[3px] bg-white/80" />
                  </span>
                </div>
              </div>

              <div className="mt-3 rounded-[1.35rem] border border-white/[0.06] bg-white/[0.04] p-2.5">
                <div className="flex items-center justify-between gap-2.5">
                  <div className="flex min-w-0 items-center gap-2.5">
                    <DMGenieMark className="h-8 w-8 shrink-0 rounded-xl shadow-[0_6px_16px_rgba(109,41,72,0.24)]" />
                    <div className="min-w-0">
                      <p className="text-[13px] font-bold leading-tight">DMGenie</p>
                      <p className="mt-0.5 text-[10px] font-medium text-white/[0.44]">Instagram Connected</p>
                    </div>
                  </div>
                  <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-emerald-400/[0.12] bg-emerald-400/[0.065] px-1.5 py-0.5 text-[7.5px] font-bold text-emerald-300">
                    <span className="h-1 w-1 rounded-full bg-emerald-300" />
                    Automation Active
                  </span>
                </div>
              </div>

              <div className="mt-2.5 grid grid-cols-3 gap-1.5">
                <div className="rounded-2xl border border-white/[0.06] bg-white/[0.032] px-2 py-2 text-center">
                  <p className="text-[15px] font-black leading-none text-white">1,247</p>
                  <p className="mt-1 text-[8px] font-bold uppercase tracking-wide text-white/[0.34]">Leads</p>
                </div>
                <div className="rounded-2xl border border-white/[0.06] bg-white/[0.032] px-2 py-2 text-center">
                  <p className="text-[15px] font-black leading-none text-white">98%</p>
                  <p className="mt-1 text-[8px] font-bold uppercase tracking-wide text-white/[0.34]">Reply Rate</p>
                </div>
                <div className="rounded-2xl border border-white/[0.06] bg-white/[0.032] px-2 py-2 text-center">
                  <p className="text-[15px] font-black leading-none text-white">3</p>
                  <p className="mt-1 text-[8px] font-bold uppercase tracking-wide text-white/[0.34]">Active Triggers</p>
                </div>
              </div>

              <div className="mt-2.5 rounded-[1.3rem] border border-white/[0.06] bg-white/[0.032] p-3">
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-white/[0.38]">Incoming comment</p>
                  <span className="rounded-full bg-white/[0.055] px-2 py-0.5 text-[9px] font-medium text-white/[0.46]">now</span>
                </div>
                <p className="text-[13px] leading-relaxed text-white/[0.86]">
                  <span className="font-semibold text-white">@creator</span> commented "drop the link 🔥"
                </p>
              </div>

              <div className="mt-2.5 rounded-[1.3rem] bg-[#6d2948] p-3 shadow-[0_10px_20px_rgba(109,41,72,0.12)]">
                <div className="flex items-center gap-2">
                  <Send className="h-3.5 w-3.5 text-white/[0.72]" />
                  <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-white/[0.62]">AI Auto Reply</span>
                </div>
                <p className="mt-2 text-[13px] font-medium leading-snug text-white/[0.94]">
                  Here's your guide. Tap below to open it.
                </p>
                <button type="button" className="mt-2.5 flex w-full items-center justify-center rounded-xl bg-white px-3 py-1.5 text-xs font-black text-[#5a203a]">
                  Open Guide
                </button>
              </div>

              <div className="mt-auto space-y-2 pt-3">
                <div className="rounded-[1.15rem] border border-white/[0.06] bg-white/[0.035] p-2.5">
                  <div className="flex items-center gap-2.5">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-400/[0.09] text-emerald-300">
                      <Check className="h-3.5 w-3.5 stroke-[3]" />
                    </span>
                    <div>
                      <p className="text-xs font-bold text-white">Lead captured</p>
                      <p className="text-[10px] font-medium text-white/[0.42]">Saved to campaign</p>
                    </div>
                  </div>
                </div>

                <div className="rounded-[1.15rem] border border-white/[0.06] bg-white/[0.035] p-2.5">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-2">
                      <Shield className="h-3.5 w-3.5 shrink-0 text-[#d7a2ad]" />
                      <span className="truncate text-[11px] font-bold text-white/[0.76]">Meta API Connected</span>
                    </div>
                    <span className="rounded-full border border-emerald-400/[0.12] bg-emerald-400/[0.07] px-2 py-0.5 text-[8px] font-bold text-emerald-300">Verified</span>
                  </div>
                  <p className="mt-1.5 text-[9px] font-medium text-white/[0.42]">Secure OAuth &middot; Password-free</p>
                </div>
              </div>

              <div className="mx-auto mt-2.5 h-1.5 w-24 rounded-full bg-white/[0.18]" />
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  )
}

export default function Signup() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const initialMode = searchParams.get('mode') === 'signin' ? 'signin' : 'signup'

  const [authMode, setAuthMode] = useState<'signup' | 'signin'>(initialMode)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [signUpError, setSignUpError] = useState('')
  const [signUpLoading, setSignUpLoading] = useState(false)
  const [signUpSuccess, setSignUpSuccess] = useState(false)

  const [signInEmail, setSignInEmail] = useState('')
  const [signInPassword, setSignInPassword] = useState('')
  const [signInError, setSignInError] = useState('')
  const [signInNotice, setSignInNotice] = useState('')
  const [signInLoading, setSignInLoading] = useState(false)
  const [passwordResetLoading, setPasswordResetLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)

  const switchAuthMode = (mode: 'signup' | 'signin') => {
    setAuthMode(mode)
    setSearchParams(mode === 'signin' ? { mode: 'signin' } : {})
    setSignUpError('')
    setSignInError('')
    setSignInNotice('')
    if (mode === 'signup') setSignUpSuccess(false)
  }

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setSignUpError('')

    if (!email.trim()) {
      setSignUpError('Email is required.')
      return
    }

    if (!isValidEmail(email)) {
      setSignUpError('Enter a valid email address.')
      return
    }

    if (!password) {
      setSignUpError('Password is required.')
      return
    }

    if (password.length < 6) {
      setSignUpError('Password must be at least 6 characters.')
      return
    }

    setSignUpLoading(true)

    const referralCode = getSavedReferralCode()
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          ...(referralCode ? { referral_code: referralCode } : {}),
          // TODO: attach referral code during signup and validate/create the referral relation on the backend.
        },
      },
    })

    setSignUpLoading(false)

    if (error) {
      setSignUpError(error.message)
      return
    }

    const { data: { session } } = await supabase.auth.getSession()
    if (session) {
      navigate('/dashboard')
    } else {
      setSignUpSuccess(true)
    }
  }

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setSignInError('')
    setSignInNotice('')

    if (!signInEmail.trim()) {
      setSignInError('Email is required.')
      return
    }

    if (!isValidEmail(signInEmail)) {
      setSignInError('Enter a valid email address.')
      return
    }

    if (!signInPassword) {
      setSignInError('Password is required.')
      return
    }

    setSignInLoading(true)

    const { data, error } = await supabase.auth.signInWithPassword({
      email: signInEmail.trim(),
      password: signInPassword,
    })

    setSignInLoading(false)

    if (error) {
      setSignInError('Invalid email or password. Please try again.')
      return
    }

    try {
      const token = data.session?.access_token
      if (token) {
        const roleRes = await fetch('/api/me', {
          headers: { Authorization: `Bearer ${token}` },
        })
        if (roleRes.ok) {
          const profile = await roleRes.json()
          navigate(profile.role === 'admin' ? '/admin' : '/dashboard')
          return
        }
      }
    } catch {
      // Fall through to the normal dashboard if role lookup is temporarily unavailable.
    }

    navigate('/dashboard')
  }

  const handlePasswordReset = async () => {
    setSignInError('')
    setSignInNotice('')

    if (!signInEmail.trim()) {
      setSignInError('Enter your email above to receive a password reset link.')
      return
    }

    setPasswordResetLoading(true)
    const { error } = await supabase.auth.resetPasswordForEmail(signInEmail.trim(), {
      redirectTo: `${window.location.origin}/signup`,
    })
    setPasswordResetLoading(false)

    if (error) {
      setSignInError('Unable to send a reset link. Please try again.')
      return
    }

    setSignInNotice('Password reset link sent. Please check your email.')
  }

  const handleGoogleSignIn = async () => {
    // TODO: attach saved referral code to OAuth signup during the auth callback/profile creation flow.
    setSignUpError('')
    setSignInError('')
    setSignInNotice('')
    setGoogleLoading(true)

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: `${window.location.origin}/dashboard` },
      })

      if (error) {
        if (authMode === 'signin') setSignInError('Google sign in could not be started. Please try again.')
        else setSignUpError('Google signup could not be started. Please try again.')
        setGoogleLoading(false)
      }
    } catch {
      if (authMode === 'signin') setSignInError('Google sign in could not be started. Please try again.')
      else setSignUpError('Google signup could not be started. Please try again.')
      setGoogleLoading(false)
    }
  }

  const inputCls = 'h-11 w-full rounded-xl border border-[#eadde2] bg-white/[0.82] px-3.5 text-sm font-medium text-[#151119] outline-none transition-all placeholder:text-[#a89ba4] focus:border-[#6d2948]/35 focus:bg-white focus:ring-4 focus:ring-[#6d2948]/[0.08]'

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#fffafb] text-[#151119]">
      <div className="pointer-events-none absolute left-[-10%] top-[-18%] h-[30rem] w-[30rem] rounded-full bg-[#6d2948]/[0.07] blur-3xl" />
      <div className="pointer-events-none absolute bottom-[-22%] right-[-12%] h-[34rem] w-[34rem] rounded-full bg-[#d7a2ad]/10 blur-3xl" />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.65),rgba(251,247,248,0.9))]" />
      <div className="pointer-events-none absolute inset-0 opacity-[0.13] [background-image:linear-gradient(rgba(109,41,72,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(109,41,72,0.08)_1px,transparent_1px)] [background-size:56px_56px]" />

      <div className="relative z-10 mx-auto grid min-h-screen max-w-6xl grid-cols-1 items-center gap-10 px-5 py-8 sm:px-8 lg:grid-cols-[0.92fr_1fr] lg:gap-12 lg:px-10 lg:py-10">
        <div className="flex items-center justify-center lg:justify-start">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="w-full max-w-[25.5rem]"
          >
            <DMGenieLogo />

            <div className="mt-7 rounded-[1.65rem] border border-white/80 bg-white/[0.78] p-5 shadow-[0_18px_55px_rgba(76,45,59,0.075)] backdrop-blur-xl sm:p-6">
              <div className="mb-5 grid grid-cols-2 rounded-2xl border border-[#eadde2] bg-white/[0.62] p-1 shadow-[inset_0_1px_0_rgba(255,255,255,0.7)]">
                {(['signup', 'signin'] as const).map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => switchAuthMode(mode)}
                    className={`h-10 rounded-xl text-sm font-black transition-all duration-200 ${
                      authMode === mode
                        ? 'bg-[#151119] text-white shadow-[0_8px_20px_rgba(21,17,25,0.13)]'
                        : 'text-[#756b73] hover:bg-white/70 hover:text-[#151119]'
                    }`}
                  >
                    {mode === 'signup' ? 'Sign Up' : 'Sign In'}
                  </button>
                ))}
              </div>

              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-[#eadde2] bg-white/[0.74] px-3 py-1.5 text-[11px] font-black uppercase tracking-[0.14em] text-[#6d2948]">
                {authMode === 'signin' ? <Shield className="h-3.5 w-3.5 text-emerald-600" /> : <Check className="h-3.5 w-3.5 stroke-[3] text-emerald-600" />}
                {authMode === 'signin' ? 'Secure sign in' : 'Secure signup'}
              </div>

              <AnimatePresence mode="wait">
                {authMode === 'signup' ? (
                  <motion.div
                    key="signup"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.18 }}
                  >
                    <h1 className="text-[1.65rem] font-black tracking-[-0.02em] text-[#151119] sm:text-3xl">Get Started Free</h1>
                    <p className="mt-2.5 text-sm font-medium leading-6 text-[#6f6570]">
                      Create your account and start automating Instagram DMs in minutes.
                    </p>

                    {signUpSuccess ? (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mt-8 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-6 text-center"
                      >
                        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-600">
                          <Send className="h-6 w-6" />
                        </div>
                        <h3 className="text-lg font-black text-[#151119]">Check your inbox</h3>
                        <p className="mt-2 text-sm leading-relaxed text-[#665d66]">
                          We sent a confirmation email to <strong>{email}</strong>. Click the link to activate your account.
                        </p>
                        <button
                          type="button"
                          onClick={() => switchAuthMode('signin')}
                          className="mt-5 inline-flex items-center gap-1 text-sm font-black text-[#6d2948] hover:underline"
                        >
                          Already confirmed? Sign in <ArrowRight className="h-4 w-4" />
                        </button>
                      </motion.div>
                    ) : (
                      <>
                        <button
                          type="button"
                          onClick={handleGoogleSignIn}
                          disabled={googleLoading || signUpLoading}
                          className="mt-6 flex h-11 w-full items-center justify-center gap-3 rounded-xl border border-[#eadde2] bg-white/[0.82] px-4 text-sm font-black text-[#151119] transition-all duration-200 hover:-translate-y-px hover:bg-white hover:shadow-[0_10px_24px_rgba(76,45,59,0.07)] disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {googleLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <GoogleIcon />}
                          {googleLoading ? 'Connecting...' : 'Continue with Google'}
                        </button>

                        <div className="my-5 flex items-center gap-4">
                          <div className="h-px flex-1 bg-[#eadde2]" />
                          <span className="text-[11px] font-black uppercase tracking-[0.14em] text-[#a89ba4]">or</span>
                          <div className="h-px flex-1 bg-[#eadde2]" />
                        </div>

                        {signUpError && (
                          <div className="mb-4 rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-center text-sm font-semibold text-red-600">
                            {signUpError}
                          </div>
                        )}

                        <form onSubmit={handleSignUp} className="space-y-3.5" noValidate>
                          <input type="email" placeholder="Email Address" value={email} onChange={(e) => setEmail(e.target.value)} className={inputCls} autoComplete="email" />
                          <input type="password" placeholder="Password (min. 6 characters)" value={password} onChange={(e) => setPassword(e.target.value)} className={inputCls} autoComplete="new-password" />

                          <p className="text-center text-[11px] leading-relaxed text-[#817782]">
                            By joining you agree to our{' '}
                            <Link to="/terms" className="font-bold text-[#6d2948] hover:underline">Terms</Link>
                            {' '}&amp;{' '}
                            <Link to="/privacy" className="font-bold text-[#6d2948] hover:underline">Privacy Policy</Link>
                          </p>

                          <button
                            type="submit"
                            disabled={signUpLoading || googleLoading}
                            className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-b from-[#73304f] to-[#5a203b] text-sm font-black text-white shadow-[0_12px_28px_rgba(109,41,72,0.18),inset_0_1px_0_rgba(255,255,255,0.18)] transition-all duration-200 hover:-translate-y-px hover:shadow-[0_16px_34px_rgba(109,41,72,0.22),inset_0_1px_0_rgba(255,255,255,0.2)] disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            {signUpLoading ? (
                              <><Loader2 className="h-5 w-5 animate-spin" /> Creating account...</>
                            ) : (
                              'Create Free Account'
                            )}
                          </button>
                          <p className="text-center text-[11px] font-semibold text-[#8a8088]">No credit card required &bull; Cancel anytime</p>
                          <SignupTrustBadges />
                        </form>

                        <p className="mt-5 text-center text-sm font-medium text-[#756b73]">
                          Already have an account?{' '}
                          <button type="button" onClick={() => switchAuthMode('signin')} className="border-none bg-transparent font-black text-[#6d2948] hover:underline">
                            Sign in
                          </button>
                        </p>
                        <CreatorProof />
                      </>
                    )}
                  </motion.div>
                ) : (
                  <motion.div
                    key="signin"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.18 }}
                  >
                    <h1 className="text-[1.65rem] font-black tracking-[-0.02em] text-[#151119] sm:text-3xl">Welcome Back</h1>
                    <p className="mt-2.5 text-sm font-medium leading-6 text-[#6f6570]">
                      Sign in to continue to your DMGenie dashboard.
                    </p>

                    <button
                      type="button"
                      onClick={handleGoogleSignIn}
                      disabled={googleLoading || signInLoading || passwordResetLoading}
                      className="mt-6 flex h-11 w-full items-center justify-center gap-3 rounded-xl border border-[#eadde2] bg-white/[0.82] px-4 text-sm font-black text-[#151119] transition-all duration-200 hover:-translate-y-px hover:bg-white hover:shadow-[0_10px_24px_rgba(76,45,59,0.07)] disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {googleLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <GoogleIcon />}
                      {googleLoading ? 'Connecting...' : 'Continue with Google'}
                    </button>

                    <div className="my-5 flex items-center gap-4">
                      <div className="h-px flex-1 bg-[#eadde2]" />
                      <span className="text-[11px] font-black uppercase tracking-[0.14em] text-[#a89ba4]">or</span>
                      <div className="h-px flex-1 bg-[#eadde2]" />
                    </div>

                    {signInError && (
                      <div className="mb-4 rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-center text-sm font-semibold text-red-600">{signInError}</div>
                    )}
                    {signInNotice && (
                      <div className="mb-4 rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-3 text-center text-sm font-semibold text-emerald-700">{signInNotice}</div>
                    )}

                    <form onSubmit={handleSignIn} className="space-y-3.5" noValidate>
                      <input type="email" placeholder="Email Address" value={signInEmail} onChange={(e) => setSignInEmail(e.target.value)} className={inputCls} autoComplete="email" />
                      <input type="password" placeholder="Password" value={signInPassword} onChange={(e) => setSignInPassword(e.target.value)} className={inputCls} autoComplete="current-password" />
                      <div className="flex justify-end">
                        <button
                          type="button"
                          onClick={handlePasswordReset}
                          disabled={signInLoading || googleLoading || passwordResetLoading}
                          className="text-sm font-bold text-[#6d2948] transition-colors hover:text-[#4f1c34] hover:underline disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {passwordResetLoading ? 'Sending reset link...' : 'Forgot password?'}
                        </button>
                      </div>
                      <button
                        type="submit"
                        disabled={signInLoading || googleLoading || passwordResetLoading}
                        className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-b from-[#73304f] to-[#5a203b] text-sm font-black text-white shadow-[0_12px_28px_rgba(109,41,72,0.18),inset_0_1px_0_rgba(255,255,255,0.18)] transition-all duration-200 hover:-translate-y-px disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {signInLoading ? <><Loader2 className="h-5 w-5 animate-spin" /> Signing in...</> : 'Sign In'}
                      </button>
                    </form>

                    <p className="mt-5 text-center text-sm font-medium text-[#756b73]">
                      Don&apos;t have an account?{' '}
                      <button type="button" onClick={() => switchAuthMode('signup')} className="border-none bg-transparent font-black text-[#6d2948] hover:underline">
                        Create account
                      </button>
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </div>

        <AuthShowcase />
      </div>
    </div>
  )
}
