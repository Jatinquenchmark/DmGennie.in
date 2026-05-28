'use client'

import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { MessageCircle, Send, UserCheck } from 'lucide-react'
import { TrustChips } from './TrustChips'

function ShowcaseImage({ src, alt }: { src: string; alt: string }) {
  return (
    <div className="glass-card relative mx-auto w-full max-w-[560px] overflow-hidden rounded-[2rem] p-2">
      <img
        src={src}
        alt={alt}
        className="block aspect-[1.12/1] w-full rounded-[1.5rem] object-cover object-center"
        loading="lazy"
      />
    </div>
  )
}

export function FeatureShowcase() {
  const showcases = [
    {
      title: 'Boost Engagement!',
      description: 'Auto-respond to every Instagram comment in a DM. Keep your audience active and move interested followers straight to the next step.',
      image: '/brand-assets/boost-engagement.png',
      imageAlt: 'Instagram DM automation example for boosting engagement',
      icon: MessageCircle,
    },
    {
      title: 'Convert More Followers!',
      description: 'Ask users to follow first, then send the right link, offer, or guide only to real Instagram followers.',
      image: '/brand-assets/convert-followers.png',
      imageAlt: 'Ask for follow automation example with guide delivery',
      icon: UserCheck,
    },
  ]

  return (
    <section className="relative overflow-hidden bg-background py-24">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_8%_20%,rgba(53,92,255,0.08),transparent_28%),radial-gradient(circle_at_92%_55%,rgba(109,93,252,0.08),transparent_28%)]" />
      <div className="container relative mx-auto space-y-24 px-6 sm:px-8 lg:px-12">
        {showcases.map((item, index) => {
          const Icon = item.icon

          return (
            <div key={item.title} className={`grid items-center gap-14 lg:grid-cols-2 ${index % 2 === 1 ? 'lg:[&>*:first-child]:order-2' : ''}`}>
              <motion.div
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                viewport={{ once: true }}
              >
                <div className="mb-5 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-accent-blue/10 text-accent-blue">
                  <Icon className="h-6 w-6" />
                </div>
                <h2 className="mb-6 text-4xl font-black leading-tight text-foreground sm:text-5xl lg:text-6xl">
                  {item.title}
                </h2>
                <p className="mb-8 max-w-xl text-xl leading-relaxed text-muted-foreground">
                  {item.description}
                </p>
                <Link to="/signup">
                  <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} className="premium-button inline-flex items-center gap-3 rounded-xl px-8 py-4 text-lg font-bold text-white transition-colors">
                    Start For Free
                    <Send className="h-5 w-5" />
                  </motion.button>
                </Link>
                <TrustChips className="mt-6" />
              </motion.div>

              <motion.div
                initial={{ opacity: 0, scale: 0.96 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.7 }}
                viewport={{ once: true }}
              >
                <ShowcaseImage src={item.image} alt={item.imageAlt} />
              </motion.div>
            </div>
          )
        })}
      </div>
    </section>
  )
}
