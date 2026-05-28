import crypto from 'crypto';
import { supabase } from '../_supabase.js';
import { getBillingConfig } from '../../server/billingConfig.js';

export const config = {
    api: { bodyParser: false },
};

async function getRawBody(req) {
    return new Promise((resolve, reject) => {
        const chunks = [];
        req.on('data', (chunk) => chunks.push(chunk));
        req.on('end', () => resolve(Buffer.concat(chunks)));
        req.on('error', reject);
    });
}

function verifySignature(rawBody, signature, secret) {
    if (!secret) return false;
    const expected = crypto.createHmac('sha256', secret).update(rawBody).digest('hex');
    const expectedBuffer = Buffer.from(expected);
    const signatureBuffer = Buffer.from(signature || '');
    return expectedBuffer.length === signatureBuffer.length && crypto.timingSafeEqual(expectedBuffer, signatureBuffer);
}

async function markIntroOfferUsed(userId, entity = {}) {
    if (!userId) return;
    const now = new Date().toISOString();
    const currentPeriodEnd = entity.current_end ? new Date(Number(entity.current_end) * 1000).toISOString() : null;
    const updates = {
        has_used_pro_intro_offer: true,
        pro_intro_started_at: now,
        subscription_plan: 'Pro',
        subscription_status: 'active',
        current_period_end: currentPeriodEnd,
        razorpay_subscription_id: entity.subscription_id || entity.id || null,
        updated_at: now,
    };

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
                plan: 'Pro',
                subscription_status: 'active',
                has_used_pro_intro_offer: true,
                pro_intro_started_at: now,
                current_period_end: currentPeriodEnd,
            },
        });
    }
}

export default async function handler(req, res) {
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

    if ((event.event === 'subscription.charged' || event.event === 'payment.captured') && introApplied && userId) {
        await markIntroOfferUsed(userId, entity);
    }

    return res.status(200).json({ received: true });
}
