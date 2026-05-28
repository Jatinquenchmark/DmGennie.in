import Razorpay from 'razorpay';
import { supabase, cors, getUser, ensureSettings } from '../_supabase.js';
import { getBillingConfig, getProIntroEligibility } from '../../server/billingConfig.js';

async function updateCheckoutReference(userId, subscriptionId) {
    const updates = {
        razorpay_subscription_id: subscriptionId,
        subscription_plan: 'Pro',
        subscription_status: 'checkout_created',
        updated_at: new Date().toISOString(),
    };

    const { error } = await supabase.from('user_settings').update(updates).eq('user_id', userId);
    if (error) {
        // TODO: ensure billing migration is applied before enabling live checkout.
        console.warn('[billing] Unable to store checkout reference:', error.message);
    }
}

export default async function handler(req, res) {
    cors(res);
    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    const user = await getUser(req);
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    const config = getBillingConfig();
    const settings = await ensureSettings(user.id);
    const eligibility = getProIntroEligibility(user, settings);

    if (!config.razorpay.keyId || !config.razorpay.keySecret || !config.razorpay.proMonthlyPlanId) {
        return res.status(501).json({
            error: 'Checkout setup required',
            message: 'Razorpay Pro monthly plan is not configured yet.',
            setupRequired: true,
            pricing: config.plans.pro,
        });
    }

    if (eligibility.eligible && !config.razorpay.proIntroOfferId) {
        return res.status(501).json({
            error: 'Intro offer setup required',
            message: 'Razorpay intro offer/coupon is not configured yet. Add RAZORPAY_PRO_INTRO_OFFER_ID before charging ₹1.',
            setupRequired: true,
            pricing: config.plans.pro,
        });
    }

    const razorpay = new Razorpay({
        key_id: config.razorpay.keyId,
        key_secret: config.razorpay.keySecret,
    });

    try {
        const subscriptionPayload = {
            plan_id: config.razorpay.proMonthlyPlanId,
            total_count: Number(process.env.RAZORPAY_PRO_SUBSCRIPTION_MONTHS || 120),
            quantity: 1,
            customer_notify: 1,
            notes: {
                user_id: user.id,
                email: user.email || '',
                plan: 'Pro',
                intro_offer: eligibility.eligible ? 'true' : 'false',
                intro_amount_inr: String(config.plans.pro.introOffer.amountInr),
                renewal_amount_inr: String(config.plans.pro.monthlyPriceInr),
            },
        };

        if (eligibility.eligible) {
            subscriptionPayload.offer_id = config.razorpay.proIntroOfferId;
        }

        const subscription = await razorpay.subscriptions.create(subscriptionPayload);
        await updateCheckoutReference(user.id, subscription.id);

        return res.json({
            checkoutUrl: subscription.short_url,
            subscriptionId: subscription.id,
            introOfferApplied: eligibility.eligible,
            pricing: config.plans.pro,
        });
    } catch (error) {
        console.error('[billing] Checkout failed:', error?.error || error);
        return res.status(500).json({
            error: 'Unable to create checkout',
            message: 'Something went wrong while creating the Pro checkout. Please try again.',
        });
    }
}
