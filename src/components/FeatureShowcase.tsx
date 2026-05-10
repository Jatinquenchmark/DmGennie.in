'use client'

import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'

export function FeatureShowcase() {
  const showcases = [
    {
      title: "Convert More Followers!",
      description: "Ensure your discounts, offers, or exclusives are going to only real, actual Instagram followers with Ask for a Follow automation",
      gradient: 'from-blue-50 to-purple-50',
    },
    {
      title: "Boost Engagement!",
      description: "Auto-respond to every Instagram comment in a DM. Keep your audience (and the algorithm) happy — and watch your revenue grow",
      gradient: 'from-purple-50 to-pink-50',
    },
  ]

  return (
    <section className="relative py-20 bg-background">
      <div className="container mx-auto px-6 sm:px-8 lg:px-12 space-y-20">
        {showcases.map((item, index) => (
          <div key={item.title} className={`flex flex-col ${index % 2 === 1 ? 'lg:flex-row-reverse' : 'lg:flex-row'} items-center gap-12`}>
            <div className="flex-1">
              <h2 className="text-4xl sm:text-5xl lg:text-6xl font-black leading-tight mb-6 text-foreground">
                {item.title}
              </h2>
              <p className="text-xl text-muted-foreground leading-relaxed mb-8 max-w-lg">
                {item.description}
              </p>
              <Link to="/signup">
                <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="bg-accent-blue text-white font-bold px-8 py-4 rounded-xl text-lg cursor-pointer hover:bg-blue-700 gentle-animation">
                  Start For Free
                </motion.button>
              </Link>
              <div className="flex flex-wrap gap-3 mt-4">
                {['✓ Official Meta APIs', '✓ No Credit Card', '✓ Instant Setup'].map(b => (
                  <span key={b} className="text-sm text-muted-foreground font-medium">{b}</span>
                ))}
              </div>
            </div>
            <div className="flex-1">
              <div className={`bg-gradient-to-br ${item.gradient} rounded-3xl p-8 lg:p-12 elevated-shadow`}>
                <div className="bg-white rounded-2xl shadow-lg p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-accent-blue rounded-full" />
                    <div className="flex-1">
                      <div className="h-3 bg-gray-200 rounded w-32 mb-2" />
                      <div className="h-2 bg-gray-100 rounded w-20" />
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="bg-accent-blue/10 rounded-xl p-4">
                      <div className="text-accent-blue font-semibold text-sm">{index === 0 ? '✅ Following confirmed!' : '💬 New comment detected!'}</div>
                      <div className="text-muted-foreground text-xs mt-1">{index === 0 ? 'Sending exclusive offer...' : 'Auto-sending DM with link...'}</div>
                    </div>
                    <div className="bg-accent-emerald/10 rounded-xl p-4">
                      <div className="text-accent-emerald font-semibold text-sm">{index === 0 ? '🎁 Discount sent via DM' : '📤 Link delivered!'}</div>
                      <div className="text-muted-foreground text-xs mt-1">{index === 0 ? 'Only real followers receive offers' : 'User engaged successfully'}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
