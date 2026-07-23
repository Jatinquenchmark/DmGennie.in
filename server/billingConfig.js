export const PLAN_FEATURES = {
    starter: {
        planName: 'Starter',
        dmLimit: 1000,
        contactLimit: 1000,
        automationLimit: 999999,
        instagramAccountLimit: 1,
        reTrigger: false,
        askForFollow: false,
        leadGen: false,
        advancedAnalytics: false,
        exportCsv: false,
        autoReply: false,
        growFollowers: false,
        leadGeneration: false,
        advancedFilters: false,
        prioritySupport: false,
    },
    pro: {
        planName: 'Pro',
        dmLimit: 20000,
        contactLimit: 999999,
        automationLimit: 999999,
        instagramAccountLimit: 1,
        reTrigger: true,
        askForFollow: true,
        leadGen: true,
        advancedAnalytics: true,
        exportCsv: true,
        autoReply: true,
        growFollowers: true,
        leadGeneration: true,
        advancedFilters: true,
        prioritySupport: true,
    },
};

const PRO_REQUIRED_FEATURES = new Set([
    'reTrigger',
    'askForFollow',
    'leadGen',
    'advancedAnalytics',
    'exportCsv',
    'autoReply',
    'growFollowers',
    'leadGeneration',
    'advancedFilters',
    'prioritySupport',
]);

function normalizePlanKey(value) {
    const plan = String(value || 'starter').trim().toLowerCase();
    return plan === 'pro' ? 'pro' : 'starter';
}

function normalizeSubscriptionStatus(value) {
    const status = String(value || '').trim().toLowerCase();
    if (['active', 'inactive', 'cancelled', 'canceled', 'expired', 'payment_pending', 'payment_failed'].includes(status)) {
        return status === 'canceled' ? 'cancelled' : status;
    }
    return status || 'inactive';
}

function isCurrentPeriodValid(value, now = new Date()) {
    if (!value) return true;
    const end = new Date(value);
    if (Number.isNaN(end.getTime())) return false;
    return end.getTime() > now.getTime();
}

const CURRENCY_PRICING = {
    INR: {
        symbol: '₹',
        monthly: () => Number(process.env.PRO_MONTHLY_PRICE_INR || process.env.VITE_PRO_MONTHLY_PRICE_INR || 499),
        annualMonthly: () => Number(process.env.PRO_ANNUAL_MONTHLY_PRICE_INR || process.env.VITE_PRO_ANNUAL_MONTHLY_PRICE_INR || 399),
        intro: () => Number(process.env.PRO_INTRO_FIRST_MONTH_INR || 1),
        planId: () => process.env.RAZORPAY_PRO_MONTHLY_PLAN_ID || '',
        introOfferId: () => process.env.RAZORPAY_PRO_INTRO_OFFER_ID || '',
    },
    USD: {
        symbol: '$',
        monthly: () => Number(process.env.PRO_MONTHLY_PRICE_USD || 15),
        annualMonthly: () => Number(process.env.PRO_ANNUAL_MONTHLY_PRICE_USD || 12),
        intro: () => Number(process.env.PRO_INTRO_FIRST_MONTH_USD || 1),
        planId: () => process.env.RAZORPAY_PRO_MONTHLY_PLAN_ID_USD || '',
        introOfferId: () => process.env.RAZORPAY_PRO_INTRO_OFFER_ID_USD || '',
    },
};

export function normalizeCurrency(value) {
    return String(value || 'INR').trim().toUpperCase() === 'USD' ? 'USD' : 'INR';
}

export function getBillingConfig(currency = 'INR') {
    const cur = normalizeCurrency(currency);
    const p = CURRENCY_PRICING[cur];
    const symbol = p.symbol;
    const monthly = p.monthly();
    const annualMonthly = p.annualMonthly();
    const intro = p.intro();

    return {
        currency: cur,
        symbol,
        plans: {
            free: {
                id: 'starter',
                name: 'Starter',
                monthlyPrice: 0,
                annualMonthlyPrice: 0,
                limits: PLAN_FEATURES.starter,
            },
            pro: {
                id: 'pro',
                name: 'Pro',
                monthlyPrice: monthly,
                annualMonthlyPrice: annualMonthly,
                limits: PLAN_FEATURES.pro,
                introOffer: {
                    amount: intro,
                    label: `${symbol}${intro} first month`,
                    disclaimer: `${symbol}${intro} for the first month. Renews at ${symbol}${monthly}/month unless cancelled.`,
                },
            },
        },
        razorpay: {
            keyId: process.env.RAZORPAY_KEY_ID || '',
            keySecret: process.env.RAZORPAY_KEY_SECRET || '',
            proMonthlyPlanId: p.planId(),
            proFirstMonthOfferId: p.introOfferId(),
            webhookSecret: process.env.RAZORPAY_WEBHOOK_SECRET || '',
        },
    };
}

export function getSubscriptionState(user, settings = {}) {
    const appMeta = user?.app_metadata || {};
    const planKey = normalizePlanKey(settings.subscription_plan || settings.plan || appMeta.plan || 'starter');
    const plan = planKey === 'pro' ? 'Pro' : 'Starter';
    const status = normalizeSubscriptionStatus(settings.subscription_status || appMeta.subscription_status || 'inactive');
    const hasUsedIntroOffer = Boolean(settings.has_used_pro_intro_offer || appMeta.has_used_pro_intro_offer);
    const currentPeriodEnd = settings.current_period_end || appMeta.current_period_end || null;
    const isPro = planKey === 'pro' && status === 'active' && isCurrentPeriodValid(currentPeriodEnd);
    const limits = PLAN_FEATURES[isPro ? 'pro' : 'starter'];
    const featureAccess = getFeatureAccess(isPro);

    return {
        planKey,
        plan,
        status,
        isPro,
        limits,
        featureAccess,
        hasUsedIntroOffer,
        proIntroStartedAt: settings.pro_intro_started_at || appMeta.pro_intro_started_at || null,
        currentPeriodStart: settings.current_period_start || appMeta.current_period_start || null,
        currentPeriodEnd,
        razorpayCustomerId: settings.razorpay_customer_id || appMeta.razorpay_customer_id || null,
        razorpaySubscriptionId: settings.razorpay_subscription_id || appMeta.razorpay_subscription_id || null,
    };
}

export function getProIntroEligibility(user, settings) {
    const state = getSubscriptionState(user, settings);
    const isPaymentPending = state.status === 'payment_pending';
    return {
        eligible: Boolean(user?.id) && !state.isPro && !state.hasUsedIntroOffer && !isPaymentPending,
        reason: state.isPro
            ? 'Already on Pro'
            : isPaymentPending
                ? 'Payment pending. Complete payment to unlock Pro.'
                : state.hasUsedIntroOffer
                    ? 'Intro offer already used'
                    : 'Eligible for intro offer',
        isPaymentPending,
        ...state,
    };
}

export async function isProUser(supabase, userId, user = null) {
    if (!supabase || !userId) return false;
    const { data: settings } = await supabase
        .from('user_settings')
        .select('subscription_plan,subscription_status,current_period_end')
        .eq('user_id', userId)
        .maybeSingle();
    return getSubscriptionState(user || { id: userId }, settings || {}).isPro;
}

export function getFeatureAccess(isPro) {
    const source = isPro ? PLAN_FEATURES.pro : PLAN_FEATURES.starter;
    return {
        reTrigger: source.reTrigger,
        askForFollow: source.askForFollow,
        leadGen: source.leadGen,
        advancedAnalytics: source.advancedAnalytics,
        exportCsv: source.exportCsv,
        autoReply: source.autoReply,
        growFollowers: source.growFollowers,
        leadGeneration: source.leadGeneration,
        advancedFilters: source.advancedFilters,
        prioritySupport: source.prioritySupport,
    };
}

export function getPlanLimitsForState(state) {
    return PLAN_FEATURES[state?.isPro ? 'pro' : 'starter'];
}

export function requiresPro(feature) {
    return PRO_REQUIRED_FEATURES.has(feature);
}

export function canUseFeature(state, feature) {
    if (!requiresPro(feature)) return true;
    return Boolean(state?.isPro && state?.featureAccess?.[feature]);
}

export function proRequiredPayload(message = 'Upgrade to Pro to use this feature.') {
    return {
        error: 'PRO_REQUIRED',
        message,
    };
}
