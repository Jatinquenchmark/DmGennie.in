export function getBillingConfig() {
    const proMonthlyPriceInr = Number(process.env.PRO_MONTHLY_PRICE_INR || process.env.VITE_PRO_MONTHLY_PRICE_INR || 499);
    const proAnnualMonthlyPriceInr = Number(process.env.PRO_ANNUAL_MONTHLY_PRICE_INR || process.env.VITE_PRO_ANNUAL_MONTHLY_PRICE_INR || 399);
    const introFirstMonthInr = Number(process.env.PRO_INTRO_FIRST_MONTH_INR || 1);

    return {
        currency: 'INR',
        plans: {
            free: {
                id: 'free',
                name: 'Free',
                monthlyPriceInr: 0,
                annualMonthlyPriceInr: 0,
            },
            pro: {
                id: 'pro',
                name: 'Pro',
                monthlyPriceInr: proMonthlyPriceInr,
                annualMonthlyPriceInr: proAnnualMonthlyPriceInr,
                introOffer: {
                    amountInr: introFirstMonthInr,
                    label: '₹1 first month',
                    disclaimer: `₹${introFirstMonthInr} for the first month. Renews at ₹${proMonthlyPriceInr}/month unless cancelled.`,
                },
            },
        },
        razorpay: {
            keyId: process.env.RAZORPAY_KEY_ID || '',
            keySecret: process.env.RAZORPAY_KEY_SECRET || '',
            proMonthlyPlanId: process.env.RAZORPAY_PRO_MONTHLY_PLAN_ID || '',
            proIntroOfferId: process.env.RAZORPAY_PRO_INTRO_OFFER_ID || '',
            webhookSecret: process.env.RAZORPAY_WEBHOOK_SECRET || '',
        },
    };
}

export function getSubscriptionState(user, settings = {}) {
    const appMeta = user?.app_metadata || {};
    const plan = String(settings.subscription_plan || settings.plan || appMeta.plan || 'Starter');
    const status = String(settings.subscription_status || appMeta.subscription_status || '').toLowerCase();
    const hasUsedIntroOffer = Boolean(settings.has_used_pro_intro_offer || appMeta.has_used_pro_intro_offer);
    const isPro = plan.toLowerCase() === 'pro' && !['cancelled', 'canceled', 'expired'].includes(status);

    return {
        plan,
        status,
        isPro,
        hasUsedIntroOffer,
        proIntroStartedAt: settings.pro_intro_started_at || appMeta.pro_intro_started_at || null,
        currentPeriodEnd: settings.current_period_end || appMeta.current_period_end || null,
    };
}

export function getProIntroEligibility(user, settings) {
    const state = getSubscriptionState(user, settings);
    return {
        eligible: Boolean(user?.id) && !state.isPro && !state.hasUsedIntroOffer,
        reason: state.isPro
            ? 'Already on Pro'
            : state.hasUsedIntroOffer
                ? 'Intro offer already used'
                : 'Eligible for intro offer',
        ...state,
    };
}
