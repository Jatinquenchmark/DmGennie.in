'use client'

import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { Menu, X, Shield, Zap, MessageCircle } from 'lucide-react'
import { useState, useEffect } from 'react'
import TextType from './ui/TextType'
import { createClient } from '@supabase/supabase-js'
const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL!,
  import.meta.env.VITE_SUPABASE_ANON_KEY!
)
import Particles from './ui/Particles'

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
    <div className="relative min-h-screen w-full overflow-hidden" style={{ background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 50%, #1e40af 100%)' }}>
      <div className="absolute inset-0 z-0">
        <Particles particleColors={['#ffffff','#ffffff','#ffffff']} particleCount={200} particleSpread={10} speed={0.1} particleBaseSize={100} moveParticlesOnHover={true} alphaParticles={true} disableRotation={false} />
      </div>

      {/* Navbar */}
      <motion.nav initial={{ opacity: 0, y: -30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.3 }} className="fixed top-0 left-0 right-0 w-full z-[110]">
        <div className={`w-full px-6 sm:px-8 lg:px-12 py-4 transition-all duration-300 ease-out ${isScrolled ? 'bg-white/95 backdrop-blur-xl border-b border-border shadow-sm' : 'bg-transparent'}`}>
          <div className="flex items-center justify-between max-w-7xl mx-auto">
            <motion.div whileHover={{ scale: 1.05 }} className="flex items-center gap-2.5 cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
              <svg width="32" height="32" viewBox="0 0 40 40" fill="none">
                <rect width="40" height="40" rx="10" fill={isScrolled ? "#2563eb" : "rgba(255,255,255,0.2)"}/>
                <path d="M10 27 L19 13" stroke="white" strokeWidth="3.8" strokeLinecap="round"/>
                <path d="M17 27 L26 13" stroke="white" strokeWidth="3.8" strokeLinecap="round"/>
                <circle cx="29" cy="27" r="3" fill="#60a5fa"/>
              </svg>
              <span className={`font-black text-xl tracking-tight ${isScrolled ? 'text-accent-blue' : 'text-white'}`}>DMGenie</span>
            </motion.div>

            <div className="hidden md:flex items-center space-x-8">
              {['Features', 'How it Works', 'Testimonials', 'FAQ'].map(item => (
                <a key={item} href={`#${item.toLowerCase().replace(/ /g, '-')}`} className={`font-medium gentle-animation hover:scale-105 ${isScrolled ? 'text-foreground hover:text-accent-blue' : 'text-white/90 hover:text-white'}`}>{item}</a>
              ))}
            </div>

            <div className="flex items-center space-x-3">
              <Link to="/signup">
                <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className={`hidden sm:block font-semibold px-5 py-2.5 rounded-xl text-sm transition-all ${isScrolled ? 'bg-accent-blue text-white' : 'bg-white/20 text-white border border-white/30'}`}>
                  Get Started Free
                </motion.button>
              </Link>
              <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="md:hidden p-3 rounded-full text-white hover:bg-white/20 cursor-pointer z-[120] relative">
                {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>
      </motion.nav>

      {isMobileMenuOpen && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="md:hidden fixed inset-0 bg-black/50 backdrop-blur-md z-[80]" onClick={() => setIsMobileMenuOpen(false)} />}
      <motion.div initial={{ x: '100%' }} animate={{ x: isMobileMenuOpen ? '0%' : '100%' }} transition={{ type: 'spring', damping: 25, stiffness: 200 }} className="md:hidden fixed top-0 right-0 h-full w-72 max-w-[85vw] bg-white z-[90] shadow-2xl">
        <div className="flex flex-col p-6 pt-20 space-y-4">
          {['Features', 'How it Works', 'Testimonials', 'FAQ'].map(item => (
            <a key={item} href={`#${item.toLowerCase().replace(/ /g, '-')}`} className="px-4 py-3 text-foreground hover:bg-accent rounded-lg font-medium text-lg" onClick={() => setIsMobileMenuOpen(false)}>{item}</a>
          ))}
          <Link to="/signup" className="block bg-accent-blue text-white font-semibold px-6 py-3 rounded-xl text-center mt-4">Get Started Free</Link>
        </div>
      </motion.div>

      {/* Hero Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 pt-32 pb-20 flex flex-col lg:flex-row items-center gap-12">
        <motion.div initial={{ opacity: 0, x: -50 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 1, delay: 0.5 }} className="flex-1 text-white">
          <div className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-sm rounded-full px-4 py-2 mb-8">
            <Shield className="w-4 h-4" />
            <span className="font-semibold text-sm">Built on Official Instagram APIs</span>
          </div>

          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black leading-tight mb-6">
            <TextType text="Automate Instagram DMs from Comments" typingSpeed={45} pauseDuration={3000} showCursor={true} cursorCharacter="|" loop={false} />
          </h1>

          <p className="text-xl lg:text-2xl text-white/80 max-w-xl leading-relaxed mb-8">
            Automatically send Instagram direct messages when users comment keywords on your posts and reels — using official Meta APIs, fully compliant.
          </p>

          <div className="flex flex-wrap gap-4">
            <Link to="/signup">
              <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="bg-[#c8ff00] text-black font-bold px-8 py-4 rounded-xl text-lg cursor-pointer hover:bg-[#d4ff33] gentle-animation">
                Start For Free
              </motion.button>
            </Link>
            <a href="#how-it-works">
              <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="bg-white/15 backdrop-blur-sm text-white font-semibold px-8 py-4 rounded-xl text-lg cursor-pointer hover:bg-white/25 gentle-animation border border-white/20">
                See How It Works
              </motion.button>
            </a>
          </div>

          <div className="flex flex-wrap gap-4 mt-6">
            {['✓ Official Meta APIs', '✓ No Credit Card', '✓ Instant Setup'].map(badge => (
              <span key={badge} className="bg-white/10 backdrop-blur-sm rounded-full px-4 py-2 text-sm font-medium">{badge}</span>
            ))}
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 1, delay: 0.8 }} className="flex-1 relative">
          <div className="relative w-full max-w-md mx-auto">
            <div className="bg-white rounded-3xl shadow-2xl p-6 relative">
              <div className="bg-gray-50 rounded-2xl p-4 mb-4 border border-gray-100">
                <div className="flex items-start gap-3 mb-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-purple-400 to-blue-500 rounded-full flex items-center justify-center text-white font-bold text-sm">SB</div>
                  <div>
                    <div className="font-bold text-gray-900 text-sm">sofia_creates</div>
                    <div className="text-gray-600 text-sm mt-0.5">💬 "link please!"</div>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-xs text-green-600 font-semibold bg-green-50 rounded-lg px-3 py-1.5">
                  <Zap className="w-3 h-3" />
                  Keyword matched → Sending DM
                </div>
              </div>
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-4 border border-blue-100">
                <div className="flex items-center gap-2 mb-2">
                  <MessageCircle className="w-4 h-4 text-accent-blue" />
                  <span className="text-xs font-semibold text-accent-blue">Direct Message Sent</span>
                </div>
                <p className="text-gray-800 font-medium text-sm mb-3">Hi! Here's the link you asked for. Let me know if you have questions! 🙌</p>
                <div className="bg-accent-blue text-white rounded-xl px-4 py-2 text-center font-semibold text-sm">View Resource →</div>
              </div>
            </div>

            <motion.div animate={{ y: [0, -10, 0] }} transition={{ duration: 3, repeat: Infinity }} className="absolute -top-4 -right-4 bg-white rounded-2xl px-4 py-3 shadow-xl border border-gray-100">
              <div className="flex items-center gap-2">
                <span className="text-2xl font-black text-accent-blue">9x</span>
                <span className="text-xs font-medium text-gray-600">Faster<br />Replies</span>
              </div>
            </motion.div>

            <motion.div animate={{ y: [0, -8, 0] }} transition={{ duration: 4, repeat: Infinity, delay: 1 }} className="absolute bottom-12 -left-8 bg-white rounded-2xl px-4 py-3 shadow-xl border border-gray-100">
              <div className="flex items-center gap-2">
                <span className="text-lg">📈</span>
                <span className="text-gray-900 font-bold text-sm">More Engagement</span>
              </div>
            </motion.div>

            <motion.div animate={{ y: [0, -6, 0] }} transition={{ duration: 3.5, repeat: Infinity, delay: 0.5 }} className="absolute bottom-0 -right-6 bg-white rounded-2xl px-4 py-3 shadow-xl border border-gray-100">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-green-500" />
                <span className="text-gray-900 font-bold text-sm">API Compliant</span>
              </div>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
