import { Link, useLocation } from 'react-router-dom'
import { useEffect } from 'react'
import { Home, ArrowLeft } from 'lucide-react'
import { ThemeToggle } from '@/components/ThemeToggle'
import { BrandMark } from '@/components/BrandMark'

export default function NotFound() {
  const location = useLocation()

  useEffect(() => {
    // Removed console.error for production
  }, [location.pathname])

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-6">
      <div className="fixed right-4 top-4 z-50">
        <ThemeToggle />
      </div>
      <div className="text-center max-w-md">
        {/* Logo */}
        <Link to="/" className="inline-flex items-center gap-2.5 mb-12 group">
          <BrandMark size={32} />
          <span className="text-xl font-extrabold tracking-tight text-foreground transition-colors group-hover:text-brand">DMGennie</span>
        </Link>

        <div className="text-8xl font-extrabold text-accent-blue/20 mb-4 select-none">404</div>
        <h1 className="text-2xl font-bold text-foreground mb-3">Page Not Found</h1>
        <p className="text-muted-foreground mb-8 leading-relaxed">
          The page you're looking for doesn't exist or may have been moved.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            to="/"
            className="inline-flex items-center justify-center gap-2 bg-accent-blue text-white font-semibold px-6 py-3 rounded-control hover:bg-blue-700 transition-colors"
          >
            <Home className="w-4 h-4" /> Go Home
          </Link>
          <button
            onClick={() => window.history.back()}
            className="inline-flex items-center justify-center gap-2 border border-border text-foreground font-semibold px-6 py-3 rounded-control hover:bg-accent/50 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" /> Go Back
          </button>
        </div>
      </div>
    </div>
  )
}
