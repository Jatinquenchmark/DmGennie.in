import crypto from 'crypto';
import Razorpay from 'razorpay';
import { supabase, cors, getUser, ensureSettings } from '../server/supabaseApi.js';
import { getBillingConfig, getProIntroEligibility } from '../server/billingConfig.js';

export const config = {
    api: { bodyParser: false },
};

async function getRawBody(req) {
    if (Buffer.isBuffer(req.body)) return req.body;
    if (typeof req.body === 'string') return Buffer.from(req.body);
    if (req.body && typeof req.body === 'object') return Buffer.from(JSON.stringify(req.body));

    return new Promise((resolve, reject) => {
        const chunks = [];
        req.on('data', (chunk) => chunks.push(chunk));
        req.on('end', () => resolve(Buffer.concat(chunks)));
        req.on('error', reject);
    });
}

async function getJsonBody(req) {
    if (req.body && typeof req.body === 'object' && !Buffer.isBuffer(req.body)) return req.body;
    const rawBody = await getRawBody(req);
    if (!rawBody.length) return {};
    return JSON.parse(rawBody.toString());
}

function verifySignature(rawBody, signature, secret) {
    if (!secret) return false;
    const expected = crypto.createHmac('sha256', secret).update(rawBody).digest('hex');
    const expectedBuffer = Buffer.from(expected);
    const signatureBuffer = Buffer.from(signature || '');
    return expectedBuffer.length === signatureBuffer.length && crypto.timingSafeEqual(expectedBuffer, signatureBuffer);
}

async function updateCheckoutReference(userId, subscriptionId) {
    const updates = {
        razorpay_subscription_id: subscriptionId,
        subscription_plan: 'starter',
        subscription_status: 'payment_pending',
        updated_at: new Date().toISOString(),
    };
    const { error } = await supabase.from('user_settings').update(updates).eq('user_id', userId);
    if (error) {
        // TODO: ensure billing migration is applied before enabling live checkout.
        console.warn('[billing] Unable to store checkout reference:', error.message);
    }
}

async function markPaymentSuccess(userId, entity = {}, { introApplied = false } = {}) {
    if (!userId) return;
    const now = new Date().toISOString();
    const currentPeriodEnd = entity.current_end ? new Date(Number(entity.current_end) * 1000).toISOString() : null;
    const updates = {
        subscription_plan: 'pro',
        subscription_status: 'active',
        current_period_start: now,
        current_period_end: currentPeriodEnd,
        razorpay_customer_id: entity.customer_id || entity.customer || null,
        razorpay_subscription_id: entity.subscription_id || entity.id || null,
        updated_at: now,
    };
    if (introApplied) {
        updates.has_used_pro_intro_offer = true;
        updates.pro_intro_started_at = now;
    }

    const { error } = await supabase.from('user_settings').update(updates).eq('user_id', userId);
    if (error) {
        // TODO: ensure billing migration is applied before enabling Razorpay webhooks.
        console.warn('[billing] Unable to mark intro offer used:', error.message);
    }

    const { data: { user } } = await supabase.auth.admin.getUserById(userId);
    if (user) {
        await supabase.auth.admin.updateUserById(userId, {
            app_metadata: {
                ...(user.app_metadata || {}),
                plan: 'pro',
                subscription_status: 'active',
                ...(introApplied ? { has_used_pro_intro_offer: true, pro_intro_started_at: now } : {}),
                current_period_start: now,
                current_period_end: currentPeriodEnd,
            },
        });
    }
}

async function markPaymentNotCompleted(userId, status = 'payment_failed') {
    if (!userId) return;
    const safeStatus = ['payment_failed', 'cancelled', 'expired', 'inactive'].includes(status) ? status : 'payment_failed';
    const updates = {
        subscription_plan: 'starter',
        subscription_status: safeStatus,
        updated_at: new Date().toISOString(),
    };
    const { error } = await supabase.from('user_settings').update(updates).eq('user_id', userId);
    if (error) console.warn('[billing] Unable to mark payment incomplete:', error.message);

    const { data: { user } } = await supabase.auth.admin.getUserById(userId);
    if (user) {
        await supabase.auth.admin.updateUserById(userId, {
            app_metadata: {
                ...(user.app_metadata || {}),
                plan: 'starter',
                subscription_status: safeStatus,
            },
        });
    }
}

async function pricingHandler(req, res) {
    if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

    const configData = getBillingConfig(req.query.currency);
    const user = await getUser(req);
    let eligibility = { eligible: false, reason: `Sign in to start Pro for ${configData.symbol}${configData.plans.pro.introOffer.amount}`, isPro: false, hasUsedIntroOffer: false };

    if (user) {
        const settings = await ensureSettings(user.id);
        eligibility = getProIntroEligibility(user, settings);
    }

    return res.json({
        currency: configData.currency,
        symbol: configData.symbol,
        plans: configData.plans,
        proIntroOffer: {
            ...configData.plans.pro.introOffer,
            eligible: eligibility.eligible,
            reason: eligibility.reason,
            hasUsedIntroOffer: eligibility.hasUsedIntroOffer,
            isPro: eligibility.isPro,
            subscriptionStatus: eligibility.status,
            isPaymentPending: eligibility.isPaymentPending,
            currentPeriodEnd: eligibility.currentPeriodEnd || null,
            proIntroStartedAt: eligibility.proIntroStartedAt || null,
        },
    });
}

async function checkoutHandler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    const body = await getJsonBody(req).catch(() => ({}));
    const user = await getUser(req);
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    const configData = getBillingConfig(body.currency || req.query.currency);
    const settings = await ensureSettings(user.id);
    const eligibility = getProIntroEligibility(user, settings);
    const applyIntroOffer = !eligibility.isPro && !eligibility.hasUsedIntroOffer;

    if (!configData.razorpay.keyId || !configData.razorpay.keySecret || !configData.razorpay.proMonthlyPlanId) {
        return res.status(501).json({
            error: 'Checkout setup required',
            message: 'Razorpay Pro monthly plan is not configured yet.',
            setupRequired: true,
            pricing: configData.plans.pro,
        });
    }

    if (applyIntroOffer && !configData.razorpay.proIntroOfferId) {
        return res.status(501).json({
            error: 'Intro offer setup required',
            message: `Razorpay intro offer/coupon is not configured yet for ${configData.currency}. Add the intro offer id before charging ${configData.symbol}${configData.plans.pro.introOffer.amount}.`,
            setupRequired: true,
            pricing: configData.plans.pro,
        });
    }

    const razorpay = new Razorpay({
        key_id: configData.razorpay.keyId,
        key_secret: configData.razorpay.keySecret,
    });

    try {
        const subscriptionPayload = {
            plan_id: configData.razorpay.proMonthlyPlanId,
            total_count: Number(process.env.RAZORPAY_PRO_SUBSCRIPTION_MONTHS || 120),
            quantity: 1,
            customer_notify: 1,
            notes: {
                user_id: user.id,
                email: user.email || '',
                plan: 'pro',
                currency: configData.currency,
                intro_offer: applyIntroOffer ? 'true' : 'false',
                intro_amount: String(configData.plans.pro.introOffer.amount),
                renewal_amount: String(configData.plans.pro.monthlyPrice),
            },
        };

        if (applyIntroOffer) subscriptionPayload.offer_id = configData.razorpay.proIntroOfferId;

        const subscription = await razorpay.subscriptions.create(subscriptionPayload);
        await updateCheckoutReference(user.id, subscription.id);

        return res.json({
            checkoutUrl: subscription.short_url,
            subscriptionId: subscription.id,
            introOfferApplied: applyIntroOffer,
            pricing: configData.plans.pro,
        });
    } catch (error) {
        console.error('[billing] Checkout failed:', error?.error || error);
        return res.status(500).json({
            error: 'Unable to create checkout',
            message: 'Something went wrong while creating the Pro checkout. Please try again.',
        });
    }
}

async function webhookHandler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    const billing = getBillingConfig();
    const rawBody = await getRawBody(req);
    const signature = req.headers['x-razorpay-signature'];

    if (!verifySignature(rawBody, signature, billing.razorpay.webhookSecret)) {
        return res.status(401).json({ error: 'Invalid signature' });
    }

    let event;
    try {
        event = JSON.parse(rawBody.toString());
    } catch {
        return res.status(400).json({ error: 'Invalid payload' });
    }

    const subscription = event.payload?.subscription?.entity;
    const payment = event.payload?.payment?.entity;
    const entity = subscription || payment || {};
    const notes = entity.notes || payment?.notes || subscription?.notes || {};
    const userId = notes.user_id;
    const introApplied = notes.intro_offer === 'true';
    const isProPayment = String(notes.plan || '').toLowerCase() === 'pro'
        || entity.plan_id === billing.razorpay.proMonthlyPlanId
        || subscription?.plan_id === billing.razorpay.proMonthlyPlanId;

    if ((event.event === 'subscription.charged' || event.event === 'payment.captured') && userId && isProPayment) {
        await markPaymentSuccess(userId, entity, { introApplied });
    }

    if ((event.event === 'payment.failed' || event.event === 'subscription.payment_failed') && userId && isProPayment) {
        await markPaymentNotCompleted(userId, 'payment_failed');
    }

    if ((event.event === 'subscription.cancelled' || event.event === 'subscription.paused') && userId && isProPayment) {
        await markPaymentNotCompleted(userId, 'cancelled');
    }

    if ((event.event === 'subscription.completed' || event.event === 'subscription.expired') && userId && isProPayment) {
        await markPaymentNotCompleted(userId, 'expired');
    }

    return res.status(200).json({ received: true });
}

export default async function handler(req, res) {
    const action = String(req.query.action || 'pricing');
    if (action !== 'webhook') cors(req, res);
    if (req.method === 'OPTIONS') return res.status(200).end();

    if (action === 'pricing') return pricingHandler(req, res);
    if (action === 'checkout') return checkoutHandler(req, res);
    if (action === 'webhook') return webhookHandler(req, res);
    return res.status(400).json({ error: 'Unsupported billing action.' });
}
