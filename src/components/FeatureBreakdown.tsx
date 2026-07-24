'use client'

import { motion } from 'framer-motion'
import { MessageCircle, MousePointerClick, Send, Sparkles } from 'lucide-react'

type Feature = {
  title: string
  description: string
  keyword: string
  response: string
  accent: string
}

function PhoneMockup({ feature, index }: { feature: Feature; index: number }) {
  return (
    <div className="relative mx-auto h-[440px] w-full max-w-[430px]">
      <div className={`absolute inset-8 rounded-full ${feature.accent} opacity-30 blur-3xl`} />
      {/* 9:19.5 is a modern phone's aspect ratio; both frames use it so they read as real devices */}
      <div className="absolute left-2 top-0 aspect-[9/19.5] w-[168px] overflow-hidden rounded-[2.1rem] border-[7px] border-slate-950 bg-white shadow-2xl">
        <div className="mx-auto mt-3 h-4 w-14 rounded-full bg-slate-950" />
        <div className="mx-3 mt-5 overflow-hidden rounded-2xl bg-slate-100">
          <div className={`h-36 ${feature.accent} p-4 text-white`}>
            <div className="mb-12 flex items-center gap-2">
              <span className="h-2 w-10 rounded-full bg-white/80" />
              <span className="h-2 w-2 rounded-full bg-white/60" />
            </div>
            <div className="text-xs font-black uppercase">Reply {feature.keyword}</div>
            <div className="text-lg font-black">Get the link</div>
          </div>
          <div className="space-y-2 p-3">
            <div className="h-2 w-24 rounded-full bg-slate-300" />
            <div className="h-2 w-16 rounded-full bg-slate-200" />
            <div className="mt-3 rounded-full border border-slate-200 px-3 py-2 text-xs font-bold text-slate-600">
              Comment {feature.keyword}
            </div>
          </div>
        </div>
      </div>

      <div className="absolute right-2 top-16 aspect-[9/19.5] w-[168px] overflow-hidden rounded-[1.6rem] border-[6px] border-slate-950 bg-white shadow-2xl">
        <div className="mx-auto mt-3 h-3 w-12 rounded-full bg-slate-950" />
        <div className="p-4">
          <div className="mb-4 flex items-center gap-2">
            <div className={`flex h-9 w-9 items-center justify-center rounded-full ${feature.accent} text-white`}>
              <MessageCircle className="h-4 w-4" />
            </div>
            <div>
              <div className="h-2 w-20 rounded-full bg-slate-300" />
              <div className="mt-1 h-2 w-12 rounded-full bg-slate-200" />
            </div>
          </div>
          <div className="rounded-2xl bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-700">
            {feature.response}
          </div>
          <div className={`ml-auto mt-3 rounded-2xl ${feature.accent} px-3 py-2 text-xs font-black text-white`}>
            Sent instantly
          </div>
        </div>
      </div>

      <div className="absolute right-0 top-6 flex h-9 w-9 items-center justify-center rounded-full bg-red-500 text-sm font-black text-white shadow-xl">
        {index + 1}
      </div>
      <div className="absolute bottom-4 left-48 hidden items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-black text-slate-700 shadow-lg sm:flex">
        <Send className="h-4 w-4 text-accent-blue" />
        DM delivered
      </div>
    </div>
  )
}

export function FeatureBreakdown() {
  const features: Feature[] = [
    {
      title: 'Auto-Reply to Instagram Reel Comments',
      description: 'Reply to Instagram reel comments automatically with a DM sent straight to the user inbox. Add trigger keywords or respond to all comments.',
      keyword: 'GUIDE',
      response: 'Here is the guide you asked for.',
      accent: 'bg-accent-blue',
    },
    {
      title: 'Auto-Reply to Instagram Post Comments',
      description: 'Turn post comments into conversations. Trigger DMs from keywords, offers, product links, or lead magnets.',
      keyword: 'LINK',
      response: 'Your link is ready. Tap to open.',
      accent: 'bg-[#c07a8a]',
    },
    {
      title: 'Auto-Respond to Instagram Story Replies',
      description: 'Automatically respond to story replies with a message sent directly to the user inbox.',
      keyword: 'SHOP',
      response: 'Thanks for replying. Here is the shop link.',
      accent: 'bg-slate-950',
    },
    {
      title: 'Inbox Starters',
      description: 'Display up to 4 conversation starters when a user navigates to your Instagram inbox.',
      keyword: 'FAQ',
      response: 'Choose a starter and DMGennie handles the rest.',
      accent: 'bg-emerald-600',
    },
  ]

  return (
    <section className="bg-background py-16 sm:py-20 lg:py-24">
      <div className="container mx-auto px-6 sm:px-8 lg:px-12">
        <div className="mx-auto mb-16 max-w-4xl text-center">
          <div className="mb-5 text-sm font-black uppercase tracking-[0.18em] text-accent-blue">Feature Focus</div>
          <h2 className="mb-5 text-4xl font-black leading-tight text-foreground sm:text-5xl lg:text-6xl">
            Feature Breakdown
          </h2>
          <p className="text-xl leading-relaxed text-muted-foreground">
            Dive into the specifics of each feature, understanding its functionality and how it can elevate your Instagram strategy.
          </p>
        </div>

        <div className="mx-auto max-w-6xl space-y-20">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 28 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className={`grid items-center gap-10 lg:grid-cols-2 ${index % 2 === 1 ? 'lg:[&>*:first-child]:order-2' : ''}`}
            >
              <PhoneMockup feature={feature} index={index} />
              <div>
                <div className="mb-5 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-accent-blue/10 text-accent-blue">
                  {index % 2 === 0 ? <MousePointerClick className="h-6 w-6" /> : <Sparkles className="h-6 w-6" />}
                </div>
                <h3 className="mb-5 text-4xl font-black leading-tight text-foreground lg:text-5xl">
                  {feature.title}
                </h3>
                <p className="max-w-xl text-xl leading-relaxed text-muted-foreground">
                  {feature.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
