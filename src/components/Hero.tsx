'use client'

import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { Menu, X } from 'lucide-react'
import { useState, useEffect } from 'react'
import TextType from './ui/TextType'
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
        <Particles
          particleColors={['#ffffff', '#ffffff', '#ffffff']}
          particleCount={200}
          particleSpread={10}
          speed={0.1}
          particleBaseSize={100}
          moveParticlesOnHover={true}
          alphaParticles={true}
          disableRotation={false}
        />
      </div>
      {/* Navbar */}
      <motion.nav
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.3 }}
        className="fixed top-0 left-0 right-0 w-full z-[110]"
      >
        <div className={`w-full px-6 sm:px-8 lg:px-12 py-4 transition-all duration-300 ease-out ${isScrolled ? 'bg-white/95 backdrop-blur-xl border-b border-border shadow-sm' : 'bg-transparent'
          }`}>
          <div className="flex items-center justify-between max-w-7xl mx-auto">
            <motion.div whileHover={{ scale: 1.05 }} className="flex items-center cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
              <span className={`font-black text-2xl tracking-tight ${isScrolled ? 'text-accent-blue' : 'text-white'}`}>🧞 DMGenie</span>
            </motion.div>

            <div className="hidden md:flex items-center space-x-8">
              {['Features', 'How it Works', 'Testimonials', 'FAQ'].map(item => (
                <a key={item} href={`#${item.toLowerCase().replace(/ /g, '-')}`} className={`font-medium gentle-animation hover:scale-105 ${isScrolled ? 'text-foreground hover:text-accent-blue' : 'text-white/90 hover:text-white'}`}>
                  {item}
                </a>
              ))}
            </div>

            <div className="flex items-center space-x-3">
              <Link to="/signup">
                <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className={`hidden sm:block font-semibold px-6 py-3 rounded-xl gentle-animation cursor-pointer ${isScrolled ? 'bg-accent-blue text-white hover:bg-blue-700' : 'bg-white text-accent-blue hover:bg-white/90'
                  }`}>
                  Start for Free
                </motion.button>
              </Link>

              <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="md:hidden p-3 rounded-full text-white hover:bg-white/20 cursor-pointer z-[120] relative">
                {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>
      </motion.nav>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="md:hidden fixed inset-0 bg-black/50 backdrop-blur-md z-[80]" onClick={() => setIsMobileMenuOpen(false)} />
      )}
      <motion.div
        initial={{ x: '100%' }}
        animate={{ x: isMobileMenuOpen ? '0%' : '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className="md:hidden fixed top-0 right-0 h-full w-72 max-w-[85vw] bg-white z-[90] shadow-2xl"
      >
        <div className="flex flex-col p-6 pt-20 space-y-4">
          {['Features', 'How it Works', 'Testimonials', 'FAQ'].map(item => (
            <a key={item} href={`#${item.toLowerCase().replace(/ /g, '-')}`} className="px-4 py-3 text-foreground hover:bg-accent rounded-lg font-medium text-lg" onClick={() => setIsMobileMenuOpen(false)}>
              {item}
            </a>
          ))}
          <Link to="/signup" className="block bg-accent-blue text-white font-semibold px-6 py-3 rounded-xl text-center mt-4">
            Start for Free
          </Link>
        </div>
      </motion.div>

      {/* Hero Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 pt-32 pb-20 flex flex-col lg:flex-row items-center gap-12">
        <motion.div initial={{ opacity: 0, x: -50 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 1, delay: 0.5 }} className="flex-1 text-white">
          <div className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-sm rounded-full px-4 py-2 mb-8">
            <span className="font-semibold text-sm">🧞 DMGenie</span>
            <span className="text-white/60 mx-1">×</span>
            <span className="font-semibold text-sm">Meta</span>
          </div>

          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black leading-tight mb-6">
            <TextType
              text="Go Viral on IG with DM automation"
              typingSpeed={50}
              pauseDuration={3000}
              showCursor={true}
              cursorCharacter="|"
              loop={false}
            />
          </h1>

          <p className="text-xl lg:text-2xl text-white/80 max-w-xl leading-relaxed mb-8">
            Keep your audience and the IG algorithm happy by auto-responding to every comment in a DM.
          </p>

          <Link to="/signup">
            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="bg-[#c8ff00] text-black font-bold px-8 py-4 rounded-xl text-lg cursor-pointer hover:bg-[#d4ff33] gentle-animation">
              Start For Free
            </motion.button>
          </Link>

          <div className="flex flex-wrap gap-4 mt-6">
            {['✓ Meta Verified', '✓ No Credit Card', '✓ Instant Setup'].map(badge => (
              <span key={badge} className="bg-white/10 backdrop-blur-sm rounded-full px-4 py-2 text-sm font-medium">{badge}</span>
            ))}
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 1, delay: 0.8 }} className="flex-1 relative">
          {/* Phone mockup with feature cards */}
          <div className="relative w-full max-w-md mx-auto">
            <div className="bg-white rounded-3xl shadow-2xl p-6 relative">
              <div className="bg-gray-100 rounded-2xl p-4 mb-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-accent-blue rounded-full flex items-center justify-center text-white font-bold text-sm">SB</div>
                  <div>
                    <div className="font-bold text-gray-900 text-sm">Sofia Bennett</div>
                    <div className="text-gray-500 text-xs">DM me please!</div>
                  </div>
                </div>
              </div>
              <div className="bg-gradient-to-br from-purple-100 to-blue-100 rounded-2xl p-4">
                <p className="text-gray-800 font-medium text-sm mb-2">Here's the link you asked for. Enjoy!</p>
                <div className="bg-accent-blue text-white rounded-xl px-4 py-2 text-center font-semibold text-sm">Open</div>
              </div>
            </div>

            {/* Floating badges */}
            <motion.div animate={{ y: [0, -10, 0] }} transition={{ duration: 3, repeat: Infinity }} className="absolute -top-4 -right-4 bg-red-500 text-white rounded-2xl px-4 py-3 shadow-xl">
              <div className="flex items-center gap-2">
                <span className="text-2xl font-black">1K</span>
                <span className="text-xs font-medium">2X<br />Followers</span>
              </div>
            </motion.div>

            <motion.div animate={{ y: [0, -8, 0] }} transition={{ duration: 4, repeat: Infinity, delay: 1 }} className="absolute bottom-12 -left-8 bg-white rounded-2xl px-4 py-3 shadow-xl">
              <div className="flex items-center gap-2">
                <span className="text-accent-emerald text-lg">💰</span>
                <span className="text-gray-900 font-bold text-sm">+50% Sales</span>
              </div>
            </motion.div>

            <motion.div animate={{ y: [0, -6, 0] }} transition={{ duration: 3.5, repeat: Infinity, delay: 0.5 }} className="absolute bottom-0 -right-6 bg-white rounded-2xl px-4 py-3 shadow-xl">
              <div className="flex items-center gap-2">
                <span className="text-lg">🚀</span>
                <span className="text-gray-900 font-bold text-sm">Go Viral</span>
              </div>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
