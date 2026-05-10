'use client'

import { motion } from 'framer-motion'
import { Shield, Lock, CheckCircle, Key } from 'lucide-react'

export function TrustSection() {
  const items = [
    { icon: <Shield className="w-6 h-6 text-accent-blue" />, title: 'Official Instagram APIs', desc: 'Built exclusively on Meta\'s official Graph API and webhook infrastructure.' },
    { icon: <Lock className="w-6 h-6 text-accent-blue" />, title: 'Secure OAuth Login', desc: 'Connect your account using Facebook\'s official OAuth 2.0 flow. No passwords stored.' },
    { icon: <CheckCircle className="w-6 h-6 text-accent-blue" />, title: 'HTTPS Encrypted', desc: 'All data is transmitted over TLS/HTTPS. Tokens are encrypted at rest in our database.' },
    { icon: <Key className="w-6 h-6 text-accent-blue" />, title: 'Meta Policy Compliant', desc: 'Our automation operates within Instagram\'s terms of service and messaging guidelines.' },
  ]

  return (
    <section className="py-16 bg-card/30 border-y border-border">
      <div className="container mx-auto px-6 sm:px-8 lg:px-12">
        <div className="text-center mb-10">
          <h2 className="text-2xl font-black text-foreground mb-2">Built for Trust & Compliance</h2>
          <p className="text-muted-foreground">DMGenie uses official Instagram APIs — not third-party workarounds.</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto">
          {items.map((item, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              viewport={{ once: true }}
              className="bg-background rounded-2xl p-5 border border-border text-center"
            >
              <div className="w-12 h-12 bg-accent-blue/10 rounded-xl flex items-center justify-center mx-auto mb-3">
                {item.icon}
              </div>
              <h3 className="font-bold text-foreground mb-2 text-sm">{item.title}</h3>
              <p className="text-muted-foreground text-xs leading-relaxed">{item.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
