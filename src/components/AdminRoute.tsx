import { useEffect, useState } from 'react'
import { Navigate, Link } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { LoadingScreen } from '@/components/Loading'

type AdminStatus = 'checking' | 'allowed' | 'denied' | 'unauthenticated'

export default function AdminRoute({ children }: { children: React.ReactNode }) {
  const { session, loading } = useAuth()
  const [status, setStatus] = useState<AdminStatus>('checking')

  useEffect(() => {
    if (loading) return
    if (!session?.access_token) {
      setStatus('unauthenticated')
      return
    }

    let cancelled = false

    fetch('/api/me', {
      headers: { Authorization: `Bearer ${session.access_token}` },
    })
      .then(async (response) => {
        if (!response.ok) throw new Error('Unable to verify admin access')
        return response.json()
      })
      .then((data) => {
        if (!cancelled) setStatus(data.role === 'admin' ? 'allowed' : 'denied')
      })
      .catch(() => {
        if (!cancelled) setStatus('denied')
      })

    return () => {
      cancelled = true
    }
  }, [loading, session?.access_token])

  if (loading || status === 'checking') {
    return (
      <LoadingScreen
        title="Loading Admin"
        subtitle="Verifying your DMGennie admin access..."
        detail="Checking secure role permissions..."
      />
    )
  }

  if (status === 'unauthenticated') {
    return <Navigate to="/signup" replace />
  }

  if (status === 'denied') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F7F7FB] px-5">
        <div className="w-full max-w-md rounded-[24px] border border-[#E5E7EB] bg-white p-8 text-center shadow-[0_28px_80px_rgba(15,23,42,0.10)]">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-[#6d2948]">Access denied</p>
          <h1 className="mt-3 text-3xl font-black tracking-tight text-[#0F172A]">Admin only</h1>
          <p className="mt-3 text-sm leading-6 text-[#64748B]">
            This area is restricted to DMGennie admins. Your regular dashboard is still available.
          </p>
          <Link
            to="/dashboard"
            className="mt-6 inline-flex h-11 items-center justify-center rounded-full bg-[#5B4DFF] px-6 text-sm font-black text-white transition hover:bg-[#4738E8]"
          >
            Back to Dashboard
          </Link>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
