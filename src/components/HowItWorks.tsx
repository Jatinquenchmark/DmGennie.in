'use client'

import { motion } from 'framer-motion'

export function HowItWorks() {
  const steps = [
    { number: '1', title: 'Connect Instagram', description: 'Securely connect your Instagram Business account via official Meta OAuth. No passwords stored.', icon: '🔗' },
    { number: '2', title: 'Create Keyword Trigger', description: 'Set a keyword like "link" or "info". When someone comments it, the automation activates.', icon: '⚡' },
    { number: '3', title: 'Replies Sent Automatically', description: 'DMGenie sends a personalised DM to the commenter instantly via official Instagram APIs.', icon: '✉️' },
  ]

  return (
    <section id="how-it-works" className="relative py-24 bg-background">
      <div className="container mx-auto px-6 sm:px-8 lg:px-12">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-3 mb-6">
            <div className="w-3 h-3 bg-accent-purple rounded-full animate-pulse" />
            <span className="text-sm font-semibold text-muted-foreground">How It Works</span>
            <div className="w-3 h-3 bg-accent-emerald rounded-full animate-pulse" />
          </div>
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-black leading-tight mb-6 text-foreground">
            3 Simple Steps to Automate
          </h2>
          <p className="text-lg text-muted-foreground max-w-xl mx-auto">
            Set up comment-to-DM automation in minutes using official Instagram APIs.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {steps.map((step, index) => (
            <motion.div
              key={step.number}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.2 }}
              viewport={{ once: true }}
              className="relative text-center"
            >
              {index < steps.length - 1 && (
                <div className="hidden md:block absolute top-16 left-[60%] w-[80%] h-0.5 bg-gradient-to-r from-accent-blue to-accent-purple opacity-30" />
              )}

              <div className="relative z-10">
                <div className="w-20 h-20 bg-accent-blue/10 rounded-2xl flex items-center justify-center mx-auto mb-6 text-4xl">
                  {step.icon}
                </div>
                <div className="text-accent-blue font-black text-sm mb-2">STEP {step.number}</div>
                <h3 className="text-2xl font-black text-foreground mb-3">{step.title}</h3>
                <p className="text-muted-foreground leading-relaxed max-w-xs mx-auto">{step.description}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
