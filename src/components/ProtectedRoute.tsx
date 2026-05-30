import { Navigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { LoadingScreen } from '@/components/Loading'

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { session, loading } = useAuth()

  if (loading) {
    return (
      <LoadingScreen
        title="Loading DMGennie"
        subtitle="Preparing your Instagram automation workspace..."
        detail="Checking your secure session..."
      />
    )
  }

  if (!session) {
    return <Navigate to="/signup" replace />
  }

  return <>{children}</>
}
