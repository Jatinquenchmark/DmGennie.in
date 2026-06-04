import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, useLocation, Navigate } from 'react-router-dom'
import { Hero } from './components/Hero'
import { FeatureShowcase } from './components/FeatureShowcase'
import { Features } from './components/Features'
import { TrustSection } from './components/TrustSection'
import { HowItWorks } from './components/HowItWorks'
import { FeatureBreakdown } from './components/FeatureBreakdown'
import { Pricing } from './components/Pricing'
import { Testimonials } from './components/Testimonials'
import { FAQ } from './components/FAQ'
import { Footer } from './components/Footer'
import { PageHeader } from './components/PageHeader'
import Signup from './pages/Signup'
import Dashboard from './pages/Dashboard'
import AdminDashboard from './pages/AdminDashboard'
import Privacy from './pages/Privacy'
import Terms from './pages/Terms'
import DeleteData from './pages/DeleteData'
import ReviewerDemo from './pages/ReviewerDemo'
import Compare from './pages/Compare'
import Referral from './pages/Referral'
import NotFound from './pages/NotFound'
import { AuthProvider, useAuth } from './context/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import AdminRoute from './components/AdminRoute'

function HomePage() {
  const { session } = useAuth();
  if (session) return <Navigate to="/dashboard" replace />;
  return (
    <div className="min-h-screen bg-background text-foreground">
      <main className="relative" role="main">
        <section id="hero" aria-label="Hero section">
          <Hero />
        </section>
        <FeatureShowcase />
        <TrustSection />
        <Features />
        <HowItWorks />
        <FeatureBreakdown />
        <Testimonials />
        <FAQ />
      </main>
      <Footer />
    </div>
  )
}

function PricingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <PageHeader />
      <main className="pt-24">
        <Pricing />
      </main>
      <Footer />
    </div>
  )
}

function ReferralCodeTracker() {
  const location = useLocation()

  useEffect(() => {
    const params = new URLSearchParams(location.search)
    const referralCode = params.get('ref')?.trim()

    if (!referralCode || !/^[a-zA-Z0-9_-]{3,64}$/.test(referralCode)) {
      return
    }

    const existingCode = localStorage.getItem('dmgennie_referral_code')

    // TODO: validate referral code with backend before storing permanently.
    if (!existingCode || existingCode === referralCode) {
      localStorage.setItem('dmgennie_referral_code', referralCode)
      document.cookie = `dmgennie_referral_code=${encodeURIComponent(referralCode)}; path=/; max-age=${60 * 60 * 24 * 30}; SameSite=Lax`
    }
  }, [location.search])

  return null
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ReferralCodeTracker />
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/pricing" element={<PricingPage />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/delete-data" element={<DeleteData />} />
          <Route path="/reviewer-demo" element={<ReviewerDemo />} />
          <Route path="/compare/:slug" element={<Compare />} />
          <Route path="/referral" element={<Referral />} />
          <Route path="/dashboard-preview" element={<Dashboard preview />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/*"
            element={
              <AdminRoute>
                <AdminDashboard />
              </AdminRoute>
            }
          />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}
