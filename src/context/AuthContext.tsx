import { createContext, useContext, useEffect, useRef, useState, ReactNode } from 'react'
import { Session, User } from '@supabase/supabase-js'
import { LoadingScreen } from '@/components/Loading'
import { supabase } from '@/lib/supabase'

interface AuthContextType {
  session: Session | null
  user: User | null
  loading: boolean
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  loading: true,
  signOut: async () => {},
})

// ── Session policy ───────────────────────────────────────────
const SIX_HOURS_MS = 6 * 60 * 60 * 1000
const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000
const STARTED_KEY = 'dmgennie_session_started'
const REMEMBER_KEY = 'dmgennie_remember'
const GEO_KEY = 'dmgennie_session_geo'

function getMaxAgeMs() {
  return localStorage.getItem(REMEMBER_KEY) === '1' ? THIRTY_DAYS_MS : SIX_HOURS_MS
}

function clearSessionMarkers() {
  localStorage.removeItem(STARTED_KEY)
  localStorage.removeItem(REMEMBER_KEY)
  localStorage.removeItem(GEO_KEY)
}

async function fetchCountry(): Promise<string | null> {
  try {
    const res = await fetch('/api/session')
    if (!res.ok) return null
    const data = await res.json()
    const country = String(data?.country || '').toUpperCase()
    return country || null
  } catch {
    return null
  }
}

/**
 * Records the start of a session. Call this right before a successful login so the
 * absolute-timeout clock starts fresh and the "remember me" preference is captured.
 */
export function beginSession(remember: boolean) {
  localStorage.setItem(REMEMBER_KEY, remember ? '1' : '0')
  localStorage.setItem(STARTED_KEY, String(Date.now()))
  localStorage.removeItem(GEO_KEY) // re-baselined on next check
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const sessionRef = useRef<Session | null>(null)
  sessionRef.current = session

  const signOut = async () => {
    clearSessionMarkers()
    await supabase.auth.signOut()
  }

  useEffect(() => {
    // Get initial session
    supabase.auth
      .getSession()
      .then(({ data: { session } }) => {
        // If we have a persisted session but no start marker (e.g. first load after
        // an older login), baseline it now so the user isn't logged out immediately.
        if (session && !localStorage.getItem(STARTED_KEY)) {
          localStorage.setItem(STARTED_KEY, String(Date.now()))
        }
        setSession(session)
      })
      .catch(() => {
        setSession(null)
      })
      .finally(() => {
        setLoading(false)
      })

    // Listen for auth changes (login, logout, token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session && !localStorage.getItem(STARTED_KEY)) {
        localStorage.setItem(STARTED_KEY, String(Date.now()))
      }
      if (event === 'SIGNED_OUT') {
        clearSessionMarkers()
      }
      setSession(session)
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  // ── Enforce absolute timeout + major location change ────────
  useEffect(() => {
    if (!session) return

    let cancelled = false

    const enforce = async () => {
      if (cancelled || !sessionRef.current) return

      // 1) Absolute timeout (6h, or 30 days with "remember me").
      const startedAt = Number(localStorage.getItem(STARTED_KEY) || 0)
      if (startedAt && Date.now() - startedAt > getMaxAgeMs()) {
        await signOut()
        return
      }

      // 2) Major network/location change as a security signal. We compare country
      //    (not raw IP) so normal mobile Wi-Fi/cellular hops don't log users out.
      const country = await fetchCountry()
      if (cancelled || !country || country === 'UNKNOWN') return
      const knownCountry = localStorage.getItem(GEO_KEY)
      if (!knownCountry) {
        localStorage.setItem(GEO_KEY, country)
      } else if (knownCountry !== country) {
        await signOut()
      }
    }

    enforce()
    const interval = window.setInterval(enforce, 60 * 1000)
    const onFocus = () => { enforce() }
    window.addEventListener('focus', onFocus)

    return () => {
      cancelled = true
      window.clearInterval(interval)
      window.removeEventListener('focus', onFocus)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session])

  if (loading) {
    return (
      <LoadingScreen
        title="Loading DMGennie"
        subtitle="Preparing your Instagram automation workspace..."
        detail="Checking your secure session..."
      />
    )
  }

  return (
    <AuthContext.Provider value={{ session, user: session?.user ?? null, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
