'use client'

import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Sparkles } from 'lucide-react'
import { TrustChips } from './TrustChips'

export function Features() {
  const features = [
    {
      id: 'comment',
      title: 'Comment Automation',
      description: 'Reply to comments and send a DM to engage your followers.',
      image: '/brand-assets/features/comment-automation.webp',
    },
    {
      id: 'story',
      title: 'Story Automation',
      description: 'Auto respond to story replies and reactions.',
      image: '/brand-assets/features/story-automation.webp',
    },
    {
      id: 'live',
      title: 'Live Automation',
      description: 'Send a message to followers who are active during lives.',
      image: '/brand-assets/features/live-automation.webp',
    },
    {
      id: 'dm',
      title: 'DM Automation',
      description: 'Automatically reply to the followers who message you.',
      image: '/brand-assets/features/dm-automation.webp',
    },
    {
      id: 'follow',
      title: 'Ask For Follow',
      description: 'Ask users to follow you before sending the message.',
      image: '/brand-assets/features/ask-follow.webp',
    },
    {
      id: 'retrigger',
      title: 'Re-trigger',
      description: 'Re-trigger automations for old posts and never lose customers.',
      image: '/brand-assets/features/retrigger.webp',
    },
    {
      id: 'collect',
      title: 'Collect User Data',
      description: 'Create your email list to re-target your audience.',
      image: '/brand-assets/features/collect-user-data.webp',
    },
    {
      id: 'ai',
      title: 'AI Replies Coming Soon',
      description: 'Convert more users with the help of AI.',
      comingSoon: true,
    },
  ]

  return (
    <section id="features" className="relative overflow-hidden bg-[#050406] py-24 text-white sm:py-28 lg:py-32">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_8%,rgba(193,53,132,0.36),transparent_30%),radial-gradient(circle_at_18%_22%,rgba(245,169,196,0.16),transparent_25%),radial-gradient(circle_at_86%_66%,rgba(64,93,230,0.14),transparent_26%)]" />
      <div className="pointer-events-none absolute inset-0 opacity-[0.065] [background-image:linear-gradient(rgba(255,255,255,0.9)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.9)_1px,transparent_1px)] [background-size:46px_46px] [mask-image:radial-gradient(ellipse_at_center,black,transparent_76%)]" />
      <div className="container relative mx-auto px-6 sm:px-8 lg:px-12">
        <div className="relative mx-auto mb-16 max-w-5xl text-center sm:mb-18 lg:mb-20">
          <div className="pointer-events-none absolute left-1/2 top-2 h-60 w-[min(900px,92vw)] -translate-x-1/2 rounded-full bg-[radial-gradient(circle,rgba(245,169,196,0.24),rgba(193,53,132,0.16)_42%,transparent_72%)] blur-3xl" />
          <div className="relative mb-6 inline-flex items-center gap-3 rounded-full border border-white/10 bg-white/[0.07] px-4 py-2 text-xs font-black uppercase tracking-[0.22em] text-white/62 shadow-[inset_0_1px_0_rgba(255,255,255,0.10),0_18px_50px_rgba(0,0,0,0.22)] backdrop-blur-xl">
            <span className="h-1.5 w-1.5 rounded-full bg-[#f1bd51] shadow-[0_0_18px_rgba(241,189,81,0.85)]" />
            All the features you need
          </div>
          <h2 className="relative mx-auto max-w-5xl text-balance text-4xl font-black leading-[0.96] tracking-tight text-white sm:text-5xl lg:text-7xl">
            Unlock the Full Power of{' '}
            <span className="bg-gradient-to-r from-[#f5d8a8] via-[#fff7f0] to-[#f5a9c4] bg-clip-text text-transparent drop-shadow-[0_12px_34px_rgba(245,169,196,0.18)]">
              Instagram
            </span>
          </h2>
          <p className="relative mx-auto mt-6 max-w-2xl text-lg font-medium leading-relaxed text-white/58">
            Automate comments, stories, live replies, follow gates, re-triggers, and lead capture from one polished workspace.
          </p>
          <div className="relative mx-auto mt-8 h-px max-w-2xl bg-gradient-to-r from-transparent via-white/24 to-transparent" />

        </div>

        <div className="mx-auto grid max-w-7xl grid-cols-1 gap-5 sm:grid-cols-2 sm:gap-6 lg:grid-cols-4 lg:gap-7">
          {features.map((feature) => {
            return (
              <motion.div
                key={feature.id}
                whileHover={{ y: -6 }}
                transition={{ type: 'spring', stiffness: 220, damping: 22 }}
                className="group relative overflow-hidden rounded-[1.75rem] border border-white/[0.11] bg-white/[0.065] p-2 shadow-[0_28px_80px_rgba(0,0,0,0.36)] backdrop-blur-xl transition-all duration-300 hover:border-[#f5a9c4]/35 hover:bg-white/[0.085] hover:shadow-[0_34px_95px_rgba(193,53,132,0.24)]"
              >
                <div className="pointer-events-none absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-white/35 to-transparent" />
                <div className="relative aspect-[1.42] overflow-hidden rounded-[1.35rem] bg-white shadow-[inset_0_0_0_1px_rgba(255,255,255,0.55)]">
                  {feature.image ? (
                    <img
                      src={feature.image}
                      alt={`${feature.title} preview`}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.035]"
                      loading="lazy"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-white text-[#151119]">
                      <div className="flex items-center gap-3 rounded-2xl border border-[#eadde2] bg-[#ffffff] px-5 py-4 shadow-sm">
                        <Sparkles className="h-8 w-8 text-[#C13584]" />
                        <div className="text-2xl font-black tracking-tight">DMGennie AI</div>
                      </div>
                    </div>
                  )}
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#050406]/18 via-transparent to-white/0 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                </div>
                <div className="min-h-[184px] px-4 pb-5 pt-5 sm:px-5 sm:pb-6">
                  <div className="mb-3 flex items-start justify-between gap-3">
                    <h3 className="text-xl font-black tracking-tight text-white">{feature.title}</h3>
                    {feature.comingSoon && (
                      <span className="rounded-full border border-[#f1bd51]/20 bg-[#f1bd51]/12 px-2.5 py-1 text-[10px] font-black uppercase text-[#f1bd51]">Coming Soon</span>
                    )}
                  </div>
                  <p className="text-sm font-medium leading-relaxed text-white/60">{feature.description}</p>
                </div>
              </motion.div>
            )
          })}
        </div>

        <div className="mt-14 text-center">
          <Link to="/signup">
            <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} className="rounded-xl bg-white px-9 py-4 text-lg font-black text-[#C13584] shadow-[0_18px_44px_rgba(255,255,255,0.12)] transition-all hover:-translate-y-0.5 hover:bg-[#ffffff]">
              Start For Free
            </motion.button>
          </Link>
          <TrustChips variant="dark" className="mt-6 justify-center" />
        </div>
      </div>
    </section>
  )
}
