'use client'

import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'

export function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  const faqs = [
    {
      question: 'Is DMGenie free?',
      answer: 'Yes! DMGenie offers a free plan to get started. You can create automations and start growing your Instagram presence without any credit card required.',
    },
    {
      question: 'Is DMGenie safe to use?',
      answer: 'Absolutely. DMGenie uses official Meta APIs and follows all Instagram API guidelines. Your account security is our top priority.',
    },
    {
      question: 'How does the DM automation work?',
      answer: 'When someone comments a specific keyword on your post, DMGenie automatically sends them a DM with your pre-configured message, link, or offer.',
    },
    {
      question: 'Will this get my account banned?',
      answer: 'No. DMGenie uses official Meta APIs and operates We operate within Instagram\'s terms of service.',
    },
    {
      question: 'How quickly can I set it up?',
      answer: 'Setup takes less than 5 minutes. Connect your Instagram account, choose your keywords, set your response, and you\'re live!',
    },
  ]

  return (
    <section id="faq" className="relative py-24 bg-background">
      <div className="container mx-auto px-6 sm:px-8 lg:px-12">
        <div className="text-center mb-16">
          <span className="text-sm font-semibold text-muted-foreground mb-4 block">FAQs</span>
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-black leading-tight text-foreground">
            All Questions Answered
          </h2>
        </div>

        <div className="max-w-3xl mx-auto space-y-4">
          {faqs.map((faq, index) => (
            <div key={index} className="bg-card clean-border rounded-2xl overflow-hidden subtle-shadow">
              <button
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
                className="w-full px-6 py-5 flex items-center justify-between text-left cursor-pointer"
              >
                <span className="font-bold text-foreground text-lg">{faq.question}</span>
                <span className={`text-2xl text-muted-foreground gentle-animation ${openIndex === index ? 'rotate-45' : ''}`}>+</span>
              </button>
              <AnimatePresence>
                {openIndex === index && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="overflow-hidden"
                  >
                    <div className="px-6 pb-5 text-muted-foreground leading-relaxed">{faq.answer}</div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>

        {/* Final CTA */}
        <div className="text-center mt-16">
          <Link to="/signup">
            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="bg-accent-blue text-white font-bold px-10 py-5 rounded-xl text-xl cursor-pointer hover:bg-blue-700 gentle-animation">
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
