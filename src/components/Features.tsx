'use client'

import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'

export function Features() {
  const [hoveredFeature, setHoveredFeature] = useState<string | null>(null)

  const features = [
    { id: 'comment', icon: '💬', title: 'Comment Automation', description: 'Reply to comments and send a DM to engage your followers.' },
    { id: 'story', icon: '📖', title: 'Story Automation', description: 'Auto respond to story replies and reactions.' },
    { id: 'live', icon: '🔴', title: 'Live Automation', description: 'Send a message to followers who are active during lives.' },
    { id: 'dm', icon: '✉️', title: 'DM Automation', description: 'Automatically reply to the followers who message you.' },
    { id: 'follow', icon: '👤', title: 'Ask For Follow', description: 'Ask users to follow you before sending the message.' },
    { id: 'retrigger', icon: '🔄', title: 'Re-trigger', description: 'Re-trigger automations for old posts and never lose customers.' },
    { id: 'collect', icon: '📋', title: 'Collect User Data', description: 'Create your email list to re-target your audience.' },
    { id: 'ai', icon: '✨', title: 'AI Replies', description: 'Convert more users with the help of AI.', comingSoon: true },
  ]

  return (
    <section id="features" className="relative py-24 bg-card/30">
      <div className="container mx-auto px-6 sm:px-8 lg:px-12">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-3 mb-6">
            <div className="w-3 h-3 bg-accent-emerald rounded-full animate-pulse" />
            <span className="text-sm font-semibold text-muted-foreground">All The Features You Need</span>
            <div className="w-3 h-3 bg-accent-blue rounded-full animate-pulse" />
          </div>
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-black leading-tight mb-6 text-foreground">
            Unlock the Full Power of Instagram
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
          {features.map((feature) => (
            <motion.div
              key={feature.id}
              whileHover={{ y: -8, scale: 1.02 }}
              onMouseEnter={() => setHoveredFeature(feature.id)}
              onMouseLeave={() => setHoveredFeature(null)}
              className="relative bg-background clean-border rounded-2xl p-6 subtle-shadow hover:elevated-shadow gentle-animation cursor-pointer group"
            >
              {feature.comingSoon && (
                <span className="absolute top-3 right-3 bg-accent-purple/10 text-accent-purple text-xs font-bold px-2 py-1 rounded-full">Coming Soon</span>
              )}
              <div className="text-4xl mb-4">{feature.icon}</div>
              <h3 className="font-bold text-lg text-foreground mb-2">{feature.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
            </motion.div>
          ))}
        </div>

        <div className="text-center mt-12">
          <Link to="/signup">
            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="bg-accent-blue text-white font-bold px-8 py-4 rounded-xl text-lg cursor-pointer hover:bg-blue-700 gentle-animation">
              Start For Free
            </motion.button>
          </Link>
          <div className="flex justify-center gap-4 mt-4">
            {['✓ Official Meta APIs', '✓ No Credit Card', '✓ Instant Setup'].map(b => (
              <span key={b} className="text-sm text-muted-foreground font-medium">{b}</span>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
