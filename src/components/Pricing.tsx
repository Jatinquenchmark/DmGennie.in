'use client'

import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Check, X } from 'lucide-react'

const plans = [
  {
    name: 'Free',
    monthly: '₹0',
    yearly: '₹0',
    suffix: '/account /month',
    cta: 'Create a Free Account',
    included: ['Unlimited Automations', '1000 DMs', '1000 Contacts'],
    excluded: ['Re-trigger', 'Ask For Follow', 'Lead Gen'],
    highlight: false,
  },
  {
    name: 'Pro',
    monthly: '₹499',
    yearly: '₹399',
    suffix: '/account /month',
    cta: 'Get Pro',
    helper: '7-day free trial. Cancel anytime.',
    included: ['Unlimited Automations', '20k DMs/month', 'Fair usage policy', 'Unlimited Contacts', 'Re-trigger', 'Ask For Follow', 'Lead Gen'],
    excluded: [],
    highlight: true,
  },
  {
    name: 'Enterprise',
    monthly: 'Custom',
    yearly: 'Custom',
    suffix: '',
    cta: 'Get in Touch',
    included: ['Manage Multiple Accounts', 'Dedicated Account Manager', 'Custom Solutions', 'Early Access New Features'],
    excluded: [],
    highlight: false,
  },
]

export function Pricing() {
  const [billing, setBilling] = useState<'monthly' | 'yearly'>('monthly')

  return (
    <section id="pricing" className="relative overflow-hidden bg-[#fbf7f8] py-24 sm:py-28">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_16%,rgba(109,41,72,0.10),transparent_30%),radial-gradient(circle_at_80%_72%,rgba(200,154,111,0.10),transparent_30%),linear-gradient(180deg,#fff,rgba(248,241,243,0.82)_100%)]" />
      <div className="container relative mx-auto px-6 sm:px-8 lg:px-12">
        <div className="mx-auto mb-10 max-w-3xl text-center">
          <div className="mb-4 text-sm font-black uppercase tracking-[0.18em] text-[#6d2948]">Pricing</div>
          <h2 className="text-4xl font-black leading-tight text-[#151119] sm:text-5xl">
            Simple pricing for serious growth
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg font-medium leading-relaxed text-[#6a6168]">
            Start free, upgrade when your Instagram automation volume grows, and stay protected with fair usage.
          </p>
        </div>

        <div className="mx-auto mb-16 flex w-fit items-center gap-4 rounded-2xl border border-white/80 bg-white/75 px-5 py-3 shadow-[0_16px_44px_rgba(109,41,72,0.10)] backdrop-blur">
          <button
            type="button"
            onClick={() => setBilling('monthly')}
            className={`text-base font-bold transition-colors ${billing === 'monthly' ? 'text-[#151119]' : 'text-[#7b727a]'}`}
          >
            Monthly
          </button>
          <button
            type="button"
            onClick={() => setBilling(billing === 'monthly' ? 'yearly' : 'monthly')}
            className={`relative h-9 w-16 rounded-full border-2 p-1 transition-all ${
              billing === 'yearly' ? 'border-[#6d2948] bg-[#6d2948]' : 'border-[#6d2948] bg-[#f3edf0]'
            }`}
            aria-label="Toggle annual pricing"
          >
            <span
              className={`block h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${
                billing === 'yearly' ? 'translate-x-7' : 'translate-x-0'
              }`}
            />
          </button>
          <button
            type="button"
            onClick={() => setBilling('yearly')}
            className={`text-base font-bold transition-colors ${billing === 'yearly' ? 'text-[#151119]' : 'text-[#7b727a]'}`}
          >
            Annual
          </button>
          <span className="rounded-lg bg-[#f4edf1] px-3 py-1 text-sm font-black text-[#6d2948]">20% Off</span>
        </div>

        <div className="mx-auto grid max-w-7xl grid-cols-1 items-stretch gap-7 lg:grid-cols-3">
          {plans.map((plan) => (
            <motion.div
              key={plan.name}
              whileHover={{ y: -6 }}
              className={`relative flex min-h-[580px] flex-col overflow-hidden rounded-[2rem] border p-8 shadow-[0_18px_55px_rgba(21,17,25,0.08)] sm:p-10 ${
                plan.highlight
                  ? 'border-white/20 bg-[linear-gradient(155deg,#351326_0%,#6d2948_52%,#93536a_100%)] text-white shadow-[0_34px_100px_rgba(109,41,72,0.32)] lg:-mt-5 lg:min-h-[640px]'
                  : 'border-white/80 bg-white/86 text-[#151119] shadow-[0_20px_60px_rgba(109,41,72,0.08)] backdrop-blur'
              }`}
            >
              {plan.highlight && (
                <>
                  <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(255,255,255,0.18),transparent_34%),linear-gradient(180deg,rgba(255,255,255,0.08),transparent_42%)]" />
                  <div className="pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-white/50 to-transparent" />
                </>
              )}

              {plan.highlight && (
                <div className="relative mx-auto mb-7 inline-flex items-center rounded-full border border-white/20 bg-white/14 px-5 py-2 text-xs font-black uppercase tracking-[0.16em] text-[#f9dfb5] shadow-[inset_0_1px_0_rgba(255,255,255,0.18)] backdrop-blur">
                  Most Popular
                </div>
              )}
              {!plan.highlight && <div className="mb-7 h-8" />}

              <div className="relative text-center">
                <h3 className={`text-3xl font-black ${plan.highlight ? 'text-white' : 'text-[#151119]'}`}>
                  {plan.name}
                </h3>
                <div className="mt-8">
                  <span className={`text-6xl font-black tracking-tight sm:text-7xl ${
                    plan.highlight ? 'text-white' : plan.name === 'Enterprise' ? 'text-5xl sm:text-6xl text-[#151119]' : 'text-[#151119]'
                  }`}>
                    {billing === 'monthly' ? plan.monthly : plan.yearly}
                  </span>
                </div>
                {plan.suffix && (
                  <div className={`mt-3 text-lg font-semibold ${plan.highlight ? 'text-white/78' : 'text-[#7a7279]'}`}>
                    {plan.suffix}
                  </div>
                )}
                {plan.highlight && billing === 'yearly' && (
                  <div className="mt-1 text-sm font-semibold text-white/65">billed annually</div>
                )}
              </div>

              <Link to="/signup" className="relative">
                <button className={`mt-12 w-full rounded-full px-6 py-4 text-base font-black transition-all ${
                  plan.highlight
                    ? 'bg-white text-[#6d2948] shadow-[0_18px_42px_rgba(0,0,0,0.18)] hover:bg-[#fbf7f8]'
                    : 'bg-[#6d2948] text-white shadow-[0_14px_34px_rgba(109,41,72,0.22)] hover:bg-[#551f38]'
                }`}>
                  {plan.cta}
                </button>
              </Link>
              {'helper' in plan && plan.helper && (
                <div className={`mt-3 text-center text-sm font-semibold ${plan.highlight ? 'text-white/72' : 'text-[#7a7279]'}`}>
                  {plan.helper}
                </div>
              )}

              <div className="relative mt-12 space-y-5">
                {plan.included.map((feature) => (
                  <div key={feature} className={`flex items-start gap-4 text-base font-bold ${plan.highlight ? 'text-white' : 'text-[#42404a]'}`}>
                    <span className={`mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${
                      plan.highlight ? 'bg-white/15 text-white' : 'bg-[#f4edf1] text-[#6d2948]'
                    }`}>
                      <Check className="h-3.5 w-3.5" />
                    </span>
                    <span>{feature}</span>
                  </div>
                ))}
                {plan.excluded.map((feature) => (
                  <div key={feature} className="flex items-start gap-4 text-base font-bold text-[#9ba1ad]">
                    <span className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#f3f0f2] text-[#9ba1ad]">
                      <X className="h-3.5 w-3.5" />
                    </span>
                    <span>{feature}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
