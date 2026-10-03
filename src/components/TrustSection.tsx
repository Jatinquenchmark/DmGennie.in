'use client'

import { motion } from 'framer-motion'

export function TrustSection() {
  return (
    <section className="relative overflow-hidden bg-background py-14 sm:py-16 lg:py-20" aria-label="Meta Tech Provider trust section">
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
            className="block w-full rounded-panel object-contain shadow-overlay sm:rounded-[2.5rem] lg:rounded-[3rem]"
            loading="lazy"
          />
        </motion.div>
      </div>
    </section>
  )
}
