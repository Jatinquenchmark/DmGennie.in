'use client'

import { Fragment } from 'react'
import { motion } from 'framer-motion'
import { Mail, MousePointerClick, Sparkles } from 'lucide-react'

export function HowItWorks() {
  const steps = [
    { number: '1', title: 'Choose Trigger', description: 'Choose which keywords activate your automation.', icon: MousePointerClick },
    { number: '2', title: 'Automate Response', description: 'Set up custom responses with links and offers to share.', icon: Mail },
    { number: '3', title: 'Go Viral', description: 'Let automations do the work while you focus on creating.', icon: Sparkles },
  ]

  return (
    <section id="how-it-works" className="relative bg-muted py-16 sm:py-20 lg:py-24">
      <div className="container mx-auto px-6 sm:px-8 lg:px-12">
        <div className="mb-16 text-center">
          <div className="mb-5 text-sm font-black uppercase tracking-[0.18em] text-accent-blue">How it works</div>
          <h2 className="text-4xl font-black leading-tight text-foreground sm:text-5xl lg:text-6xl">
            3 Easy Steps, <span className="text-accent-blue">Unlimited</span> Possibilities
          </h2>
        </div>

        <div className="mx-auto grid max-w-6xl grid-cols-1 gap-12 md:grid-cols-[1fr_auto_1fr_auto_1fr] md:items-center">
          {steps.map((step, index) => {
            const Icon = step.icon

            return (
              <Fragment key={step.number}>
                <motion.div
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.12 }}
                  viewport={{ once: true }}
                  className="text-center"
                >
                  <div className="mb-7 inline-flex rounded-lg bg-accent-blue px-4 py-1.5 text-sm font-black uppercase tracking-wide text-white">
                    Step {step.number}
                  </div>
                  <div className="mx-auto mb-7 flex h-16 w-16 items-center justify-center text-accent-blue">
                    <Icon className="h-12 w-12 stroke-[1.8]" />
                  </div>
                  <h3 className="mb-4 text-3xl font-black text-foreground">{step.title}</h3>
                  <p className="mx-auto max-w-xs text-lg leading-relaxed text-muted-foreground">{step.description}</p>
                </motion.div>

                {index < steps.length - 1 && (
                  <div className="hidden text-5xl font-light text-accent-blue md:block">→</div>
                )}
              </Fragment>
            )
          })}
        </div>
      </div>
    </section>
  )
}
