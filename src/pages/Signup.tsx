'use client'

import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Loader2, Shield, Zap } from 'lucide-react'
import { supabase } from '@/lib/supabase'

const creators = [
  { handle: '@masaischool', followers: '98.3K+', category: 'Startup' },
  { handle: '@ghar_sansar', followers: '156K+', category: 'Local Business' },
  { handle: '@jr.hardikpandyaa93', followers: '728K+', category: 'Creator' },
  { handle: '@ezsnippet', followers: '3.3M+', category: 'Tech' },
]

// DMGenie Logo Component
function DMGenieLogo() {
  return (
    <Link to="/" className="inline-flex items-center gap-2.5 group mb-10">
      <svg width="36" height="36" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="40" height="40" rx="10" fill="#5b5ef4" fillOpacity="0.15" />
        <path d="M10 26 L18 14" stroke="#5b5ef4" strokeWidth="3.5" strokeLinecap="round" />
        <path d="M16 26 L24 14" stroke="#5b5ef4" strokeWidth="3.5" strokeLinecap="round" />
        <circle cx="28" cy="26" r="3" fill="#5b5ef4" />
      </svg>
      <span className="text-2xl font-extrabold tracking-tight text-foreground group-hover:text-accent-blue transition-colors">
        DM<span className="text-accent-blue">Genie</span>
      </span>
    </Link>
  )
}

export default function Signup() {
  const navigate = useNavigate()

  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [signUpError, setSignUpError] = useState('')
  const [signUpLoading, setSignUpLoading] = useState(false)
  const [signUpSuccess, setSignUpSuccess] = useState(false)

  const [showSignIn, setShowSignIn] = useState(false)
  const [signInEmail, setSignInEmail] = useState('')
  const [signInPassword, setSignInPassword] = useState('')
  const [signInError, setSignInError] = useState('')
  const [signInLoading, setSignInLoading] = useState(false)

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setSignUpError('')
    setSignUpLoading(true)

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          first_name: firstName,
          last_name: lastName,
          phone,
          full_name: `${firstName} ${lastName}`.trim(),
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
    setSignInLoading(true)

    const { error } = await supabase.auth.signInWithPassword({
      email: signInEmail,
      password: signInPassword,
    })

    setSignInLoading(false)

    if (error) {
      setSignInError(error.message)
      return
    }

    navigate('/dashboard')
  }

  const handleGoogleSignIn = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/dashboard` },
    })
  }

  const inputCls = "w-full border border-border rounded-xl px-4 py-3 bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent-blue/40 transition-shadow text-sm"

  return (
    <div className="min-h-screen flex">
      {/* ── Left Panel ── */}
      <div className="flex-1 flex items-center justify-center px-6 py-12 bg-background">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          <DMGenieLogo />

          <h1 className="text-3xl font-extrabold text-foreground mb-2">Get Started Free</h1>
          <p className="text-muted-foreground mb-8 text-sm">
            Create your account and start automating Instagram DMs in minutes.
          </p>

          {signUpSuccess ? (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-6 text-center"
            >
              <div className="text-4xl mb-3">📬</div>
              <h3 className="text-lg font-bold text-foreground mb-2">Check your inbox!</h3>
              <p className="text-sm text-muted-foreground">
                We sent a confirmation email to <strong>{email}</strong>. Click the link to activate your account.
              </p>
              <button
                type="button"
                onClick={() => setShowSignIn(true)}
                className="mt-4 text-accent-blue font-semibold hover:underline text-sm cursor-pointer"
              >
                Already confirmed? Sign in →
              </button>
            </motion.div>
          ) : (
            <>
              {/* Google */}
              <button
                type="button"
                onClick={handleGoogleSignIn}
                className="w-full flex items-center justify-center gap-3 border border-border rounded-xl px-4 py-3.5 font-semibold text-foreground hover:bg-accent/50 transition-colors cursor-pointer mb-6 text-sm"
              >
                <svg width="18" height="18" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                </svg>
                Continue with Google
              </button>

              <div className="flex items-center gap-4 mb-6">
                <div className="flex-1 h-px bg-border" />
                <span className="text-xs text-muted-foreground font-medium">OR</span>
                <div className="flex-1 h-px bg-border" />
              </div>

              {signUpError && (
                <div className="bg-red-500/10 text-red-500 text-sm p-3 rounded-lg mb-4 text-center">
                  {signUpError}
                </div>
              )}

              <form onSubmit={handleSignUp} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <input type="text" placeholder="First Name" value={firstName} onChange={(e) => setFirstName(e.target.value)} className={inputCls} required />
                  <input type="text" placeholder="Last Name" value={lastName} onChange={(e) => setLastName(e.target.value)} className={inputCls} />
                </div>

                <div className="flex items-center border border-border rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-accent-blue/40 transition-shadow">
                  <span className="px-4 text-muted-foreground text-sm font-medium border-r border-border bg-accent/30 py-3">🇮🇳 +91</span>
                  <input type="tel" placeholder="Phone Number" value={phone} onChange={(e) => setPhone(e.target.value)} className="flex-1 px-4 py-3 bg-background text-foreground text-sm placeholder:text-muted-foreground focus:outline-none" />
                </div>

                <input type="email" placeholder="Email Address" value={email} onChange={(e) => setEmail(e.target.value)} className={inputCls} required />
                <input type="password" placeholder="Password (min. 6 characters)" value={password} onChange={(e) => setPassword(e.target.value)} className={inputCls} minLength={6} required />

                {/* Trust badge — safe wording, no "Meta-verified" */}
                <div className="flex items-start gap-3 bg-accent/40 rounded-xl px-4 py-3">
                  <Shield className="w-5 h-5 text-accent-blue flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-foreground">Secure & Compliant</p>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      DMGenie uses official Instagram APIs only. Your account remains in full control — we never store your password.
                    </p>
                  </div>
                </div>

                <p className="text-xs text-muted-foreground text-center">
                  By joining you agree to our{' '}
                  <Link to="/terms" className="text-accent-blue hover:underline">Terms</Link>
                  {' '}&amp;{' '}
                  <Link to="/privacy" className="text-accent-blue hover:underline">Privacy Policy</Link>
                </p>

                <button
                  type="submit"
                  disabled={signUpLoading}
                  className="w-full bg-accent-blue text-white font-bold py-3.5 rounded-xl hover:bg-blue-700 transition-colors cursor-pointer text-base flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {signUpLoading ? (
                    <><Loader2 className="w-5 h-5 animate-spin" /> Creating Account…</>
                  ) : (
                    <><Zap className="w-4 h-4" /> Create Free Account</>
                  )}
                </button>
              </form>

              <p className="text-center text-muted-foreground mt-6 text-sm">
                Already have an account?{' '}
                <button type="button" onClick={() => setShowSignIn(true)} className="text-accent-blue font-semibold hover:underline bg-transparent border-none cursor-pointer">
                  Sign in
                </button>
              </p>
            </>
          )}
        </motion.div>
      </div>

      {/* ── Right Panel ── */}
      <div className="hidden lg:flex flex-1 items-center justify-center relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #eff3ff 0%, #e8ecfa 50%, #f0e6ff 100%)' }}>
        <div className="relative z-10 text-center px-12 max-w-lg">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            {/* Big stat */}
            <div className="mb-10">
              <p className="text-6xl font-extrabold text-accent-blue mb-2">25k+</p>
              <p className="text-gray-600 font-semibold">Creators & businesses using DMGenie</p>
            </div>

            {/* Feature bullets */}
            <div className="space-y-3 text-left">
              {[
                { icon: '⚡', text: 'Set up in under 5 minutes' },
                { icon: '🔒', text: 'Official Meta API — fully compliant' },
                { icon: '📩', text: 'Auto-DM on keyword comments' },
                { icon: '📊', text: 'Real-time delivery tracking' },
              ].map((f) => (
                <div key={f.text} className="flex items-center gap-3 bg-white/60 backdrop-blur-sm rounded-xl px-4 py-3 shadow-sm border border-white/80">
                  <span className="text-xl">{f.icon}</span>
                  <span className="font-medium text-gray-800 text-sm">{f.text}</span>
                </div>
              ))}
            </div>

            {/* Creator cards */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.5 }}
              className="mt-8 flex gap-3 justify-center flex-wrap"
            >
              {creators.map((c, i) => (
                <motion.div
                  key={c.handle}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.6 + i * 0.1 }}
                  className="bg-white/70 backdrop-blur-sm rounded-xl px-3 py-2 border border-white/80 shadow-sm"
                >
                  <p className="font-bold text-gray-900 text-xs">{c.handle}</p>
                  <p className="text-gray-500 text-xs">{c.followers}</p>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>
        </div>
      </div>

      {/* ── Sign In Modal ── */}
      <AnimatePresence>
        {showSignIn && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="relative w-full max-w-md bg-card border border-border rounded-2xl p-8 shadow-2xl"
            >
              <button
                type="button"
                onClick={() => { setShowSignIn(false); setSignInError('') }}
                className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors cursor-pointer p-1"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-foreground">Welcome Back</h2>
                <p className="text-sm text-muted-foreground mt-1">Sign in to your DMGenie account</p>
              </div>

              {signInError && (
                <div className="bg-red-500/10 text-red-500 text-sm p-3 rounded-lg mb-4 text-center">{signInError}</div>
              )}

              <form onSubmit={handleSignIn} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Email</label>
                  <input type="email" value={signInEmail} onChange={(e) => setSignInEmail(e.target.value)} className={inputCls} required autoComplete="email" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Password</label>
                  <input type="password" value={signInPassword} onChange={(e) => setSignInPassword(e.target.value)} className={inputCls} required autoComplete="current-password" />
                </div>
                <div className="flex justify-end">
                  <a href="#" className="text-sm text-accent-blue hover:underline">Forgot password?</a>
                </div>
                <button
                  type="submit"
                  disabled={signInLoading}
                  className="w-full bg-accent-blue text-white font-bold py-3.5 rounded-xl hover:bg-blue-700 transition-colors mt-2 cursor-pointer flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {signInLoading ? <><Loader2 className="w-5 h-5 animate-spin" /> Signing in…</> : 'Sign In'}
                </button>
              </form>

              <div className="mt-6">
                <div className="relative">
                  <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border" /></div>
                  <div className="relative flex justify-center text-xs"><span className="px-2 bg-card text-muted-foreground">Or continue with</span></div>
                </div>
                <div className="mt-4">
                  <button
                    type="button"
                    onClick={handleGoogleSignIn}
                    className="w-full flex justify-center items-center gap-2 cursor-pointer py-2.5 border border-border rounded-xl hover:bg-accent/50 transition-colors text-sm font-semibold"
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                    </svg>
                    Google
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
