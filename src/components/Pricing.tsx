'use client'

import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Check, X } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'

type PricingConfig = {
  currency: 'INR'
  displayCurrencies?: Record<string, {
    code: string
    label: string
    symbol: string
    locale: string
    rateFromInr: number
    approximate?: boolean
  }>
  plans: {
    pro: {
      monthlyPriceInr: number
      annualMonthlyPriceInr: number
      introOffer: {
        amountInr: number
        label: string
        disclaimer: string
      }
    }
  }
  proIntroOffer: {
    amountInr: number
    label: string
    disclaimer: string
    eligible: boolean
    reason: string
    hasUsedIntroOffer: boolean
    isPro: boolean
    subscriptionStatus?: string
    isPaymentPending?: boolean
    currentPeriodEnd?: string | null
  }
}

const defaultPricing: PricingConfig = {
  currency: 'INR',
  displayCurrencies: {
    INR: {
      code: 'INR',
      label: 'INR',
      symbol: '₹',
      locale: 'en-IN',
      rateFromInr: 1,
      approximate: false,
    },
    USD: {
      code: 'USD',
      label: 'USD',
      symbol: '$',
      locale: 'en-US',
      rateFromInr: 0.012,
      approximate: true,
    },
  },
  plans: {
    pro: {
      monthlyPriceInr: 499,
      annualMonthlyPriceInr: 399,
      introOffer: {
        amountInr: 1,
        label: '₹1 first month',
        disclaimer: '₹1 for the first month. Renews at ₹499/month unless cancelled.',
      },
    },
  },
  proIntroOffer: {
    amountInr: 1,
    label: '₹1 first month',
    disclaimer: '₹1 for the first month. Renews at ₹499/month unless cancelled.',
    eligible: false,
    reason: 'Sign in to start Pro for ₹1',
    hasUsedIntroOffer: false,
    isPro: false,
    subscriptionStatus: 'inactive',
    isPaymentPending: false,
    currentPeriodEnd: null,
  },
}

const plans = [
  {
    name: 'Free',
    monthly: '₹0',
    yearly: '₹0',
    suffix: '/account /month',
    cta: 'Create a Free Account',
    included: ['1000 DMs/month', '1000 Contacts', 'Unlimited Automations', '1 Instagram account', 'Basic analytics'],
    excluded: ['Re-trigger', 'Ask For Follow', 'Lead Gen', 'Advanced analytics', 'CSV export'],
    highlight: false,
  },
  {
    name: 'Pro',
    suffix: '/account /month',
    included: ['20,000 DMs/month', 'Unlimited Contacts', 'Unlimited Automations', '1 Instagram account', 'Re-trigger', 'Ask For Follow', 'Lead Gen', 'Advanced analytics', 'CSV export'],
    excluded: [],
    highlight: true,
  },
  {
    name: 'Enterprise',
    monthly: 'Custom',
    yearly: 'Custom',
    suffix: '',
    cta: 'Get in Touch',
    included: ['Manage multiple accounts', 'Dedicated account manager', 'Custom solutions', 'Early access features', 'Higher custom DM limits', 'Custom integrations'],
    excluded: [],
    highlight: false,
  },
]

export function Pricing() {
  const [billing, setBilling] = useState<'monthly' | 'yearly'>('monthly')
  const [selectedCurrency, setSelectedCurrency] = useState('INR')
  const [pricing, setPricing] = useState<PricingConfig>(defaultPricing)
  const [checkoutLoading, setCheckoutLoading] = useState(false)
  const [notice, setNotice] = useState('')
  const { session } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    let cancelled = false
    fetch('/api/billing?action=pricing', {
      headers: session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : undefined,
    })
      .then((response) => response.ok ? response.json() : null)
      .then((data) => {
        if (!cancelled && data) setPricing(data)
      })
      .catch(() => {
        if (!cancelled) setNotice('Pricing loaded with local fallback. Checkout will verify live pricing.')
      })
    return () => {
      cancelled = true
    }
  }, [session?.access_token])

  const proMonthly = pricing.plans.pro.monthlyPriceInr
  const proAnnual = pricing.plans.pro.annualMonthlyPriceInr
  const introAmount = pricing.proIntroOffer.amountInr
  const displayCurrencies = pricing.displayCurrencies || defaultPricing.displayCurrencies || {}
  const currencyOptions = Object.values(displayCurrencies)
  const activeCurrency = displayCurrencies[selectedCurrency] || displayCurrencies.INR || currencyOptions[0]
  const formatMoney = (amountInr: number) => {
    if (!activeCurrency) return `₹${amountInr.toLocaleString('en-IN')}`
    const converted = amountInr * activeCurrency.rateFromInr
    const maximumFractionDigits = activeCurrency.code === 'INR' ? 0 : 2
    const minimumFractionDigits = activeCurrency.code === 'INR' ? 0 : converted > 0 && converted < 1 ? 2 : 0
    return new Intl.NumberFormat(activeCurrency.locale || 'en-IN', {
      style: 'currency',
      currency: activeCurrency.code,
      minimumFractionDigits,
      maximumFractionDigits,
    }).format(converted)
  }
  const introPriceLabel = formatMoney(introAmount)
  const proMonthlyLabel = formatMoney(proMonthly)
  const proAnnualLabel = formatMoney(proAnnual)

  const handlePlanCta = async (planName: string) => {
    setNotice('')
    if (planName === 'Free') {
      navigate('/signup')
      return
    }
    if (planName === 'Enterprise') {
      window.location.href = 'mailto:support@dmgennie.in?subject=DMGennie%20Enterprise%20Plan'
      return
    }
    if (planName === 'Pro' && pricing.proIntroOffer.isPro) {
      setNotice('You are already on Pro.')
      return
    }
    if (!session?.access_token) {
      navigate('/signup?mode=signin')
      return
    }

    setCheckoutLoading(true)
    try {
      const response = await fetch('/api/billing?action=checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ plan: 'pro', billingCycle: 'monthly' }),
      })
      const data = await response.json()
      if (response.ok && data.checkoutUrl) {
        window.location.href = data.checkoutUrl
        return
      }
      setNotice(data.message || 'Checkout is not ready yet. Please contact support.')
    } catch {
      setNotice('Unable to start checkout. Please try again.')
    } finally {
      setCheckoutLoading(false)
    }
  }

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

        <div className="mx-auto mb-16 flex w-fit max-w-full flex-col items-center gap-3 rounded-2xl border border-white/80 bg-white/75 px-5 py-3 shadow-[0_16px_44px_rgba(109,41,72,0.10)] backdrop-blur sm:flex-row">
          <div className="flex items-center gap-4">
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
          <div className="h-px w-full bg-[#eadde2] sm:h-8 sm:w-px" />
          <div className="flex flex-col items-center gap-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-black uppercase tracking-[0.14em] text-[#8a7b84]">Currency</span>
              <div className="flex rounded-xl border border-[#eadde2] bg-white/70 p-1">
                {currencyOptions.map((currency) => (
                  <button
                    key={currency.code}
                    type="button"
                    onClick={() => setSelectedCurrency(currency.code)}
                    className={`rounded-lg px-3 py-1.5 text-xs font-black transition ${
                      selectedCurrency === currency.code ? 'bg-[#6d2948] text-white shadow-sm' : 'text-[#6a6168] hover:bg-[#f4edf1]'
                    }`}
                  >
                    {currency.label}
                  </button>
                ))}
              </div>
            </div>
            {activeCurrency?.approximate && (
              <span className="text-[11px] font-semibold text-[#8a7b84]">Approximate display. Checkout verifies live pricing.</span>
            )}
          </div>
        </div>

        <div className="mx-auto grid max-w-7xl grid-cols-1 items-stretch gap-7 lg:grid-cols-3">
          {plans.map((plan) => (
            (() => {
              const isPro = plan.name === 'Pro'
              const proActive = isPro && pricing.proIntroOffer.isPro
              const paymentPending = isPro && Boolean(pricing.proIntroOffer.isPaymentPending)
              const showIntroOffer = isPro && billing === 'monthly' && !proActive && !paymentPending && (!session?.access_token || pricing.proIntroOffer.eligible)
              const price = isPro
                ? proActive
                  ? proMonthlyLabel
                  : billing === 'monthly'
                  ? showIntroOffer ? introPriceLabel : proMonthlyLabel
                  : proAnnualLabel
                : plan.name === 'Free'
                  ? formatMoney(0)
                  : 'Custom'
              const helper = isPro
                ? proActive
                  ? pricing.proIntroOffer.currentPeriodEnd ? `Pro active. Renews on ${new Date(pricing.proIntroOffer.currentPeriodEnd).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}.` : 'Pro active.'
                  : paymentPending
                    ? 'Payment pending. Complete payment to unlock Pro.'
                    : billing === 'monthly'
                  ? showIntroOffer ? `Then ${proMonthlyLabel}/month after the first month.` : pricing.proIntroOffer.reason || `${proMonthlyLabel}/month.`
                  : `Billed annually at the equivalent of ${proAnnualLabel}/month.`
                : undefined
              const cta = isPro
                ? proActive
                  ? 'Current plan'
                  : paymentPending
                    ? 'Complete payment'
                    : billing === 'monthly'
                  ? showIntroOffer ? `Start Pro for ${introPriceLabel}` : 'Upgrade to Pro'
                  : 'Get Pro'
                : plan.name === 'Free'
                  ? 'Create a Free Account'
                  : 'Get in Touch'

              return (
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
                  {proActive ? 'Pro active' : paymentPending ? 'Payment pending' : (!session?.access_token || pricing.proIntroOffer.eligible) ? `Limited offer · ${introPriceLabel} first month` : 'Most Popular'}
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
                    {price}
                  </span>
                </div>
                {plan.suffix && (
                  <div className={`mt-3 text-lg font-semibold ${plan.highlight ? 'text-white/78' : 'text-[#7a7279]'}`}>
                    {showIntroOffer ? 'for first month' : plan.suffix}
                  </div>
                )}
                {showIntroOffer && (
                  <div className="mt-3 inline-flex flex-wrap justify-center gap-2">
                    <span className="rounded-full bg-white/14 px-3 py-1 text-xs font-black text-[#f9dfb5] ring-1 ring-white/18">Limited offer</span>
                    <span className="rounded-full bg-white/14 px-3 py-1 text-xs font-black text-white ring-1 ring-white/18">{introPriceLabel} first month</span>
                  </div>
                )}
                {plan.highlight && billing === 'yearly' && (
                  <div className="mt-1 text-sm font-semibold text-white/65">billed annually</div>
                )}
              </div>

              <div className="relative">
                <button
                  onClick={() => handlePlanCta(plan.name)}
                  disabled={(checkoutLoading && isPro) || proActive}
                  className={`mt-12 w-full rounded-full px-6 py-4 text-base font-black transition-all disabled:cursor-not-allowed disabled:opacity-70 ${
                  plan.highlight
                    ? 'bg-white text-[#6d2948] shadow-[0_18px_42px_rgba(0,0,0,0.18)] hover:bg-[#fbf7f8]'
                    : 'bg-[#6d2948] text-white shadow-[0_14px_34px_rgba(109,41,72,0.22)] hover:bg-[#551f38]'
                }`}>
                  {checkoutLoading && isPro ? 'Starting checkout...' : cta}
                </button>
              </div>
              {helper && (
                <div className={`mt-3 text-center text-sm font-semibold ${plan.highlight ? 'text-white/72' : 'text-[#7a7279]'}`}>
                  {helper}
                </div>
              )}
              {showIntroOffer && (
                <p className="relative mt-2 text-center text-xs font-semibold leading-5 text-white/62">
                  {`${introPriceLabel} for the first month. Renews at ${proMonthlyLabel}/month unless cancelled.`}
                </p>
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
              )
            })()
          ))}
        </div>
        {notice && (
          <div className="mx-auto mt-8 max-w-3xl rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-center text-sm font-bold text-amber-800">
            {notice}
          </div>
        )}
      </div>
    </section>
  )
}
