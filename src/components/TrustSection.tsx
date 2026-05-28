'use client'

import { motion } from 'framer-motion'

export function TrustSection() {
  return (
    <section className="relative overflow-hidden bg-white py-20 sm:py-24 lg:py-28" aria-label="Meta Tech Provider trust section">
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,#fff_0%,#fff_52%,rgba(248,241,243,0.42)_100%),radial-gradient(circle_at_48%_100%,rgba(109,41,72,0.07),transparent_34%)]" />
      <div className="container relative mx-auto px-4 sm:px-8 lg:px-12">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.65 }}
          viewport={{ once: true }}
          className="relative mx-auto w-full max-w-[1180px]"
        >
          <img
            src="/brand-assets/meta-tech-provider-section.png"
            alt="Safe and compliant Meta Tech Provider section for official Instagram API automation"
            className="block w-full rounded-[2rem] object-contain shadow-[0_30px_90px_rgba(21,17,25,0.10)] sm:rounded-[2.5rem] lg:rounded-[3rem]"
            loading="lazy"
          />
        </motion.div>
      </div>
    </section>
  )
}
