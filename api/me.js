import { supabase, getUser, getUserRole, ensureSettings, cors } from '../server/supabaseApi.js';
import { getSubscriptionState } from '../server/billingConfig.js';
import { buildDashboardMetrics } from '../server/dashboardMetrics.js';

function mapSettings(s) {
    return {
        botEnabled: s.bot_enabled,
        instagramAccountId: s.instagram_account_id,
        instagramHandle: s.instagram_handle,
        verifyToken: s.verify_token,
        successPublicReply: s.success_public_reply,
        fallbackPublicReply: s.fallback_public_reply,
        replyDelay: s.reply_delay,
        timezone: s.timezone,
    };
}

export default async function handler(req, res) {
    cors(req, res);
    if (req.method === 'OPTIONS') return res.status(200).end();

    const user = await getUser(req);
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    const action = String(req.query.action || 'profile');
    if (action === 'settings') {
        if (req.method === 'GET') {
            const settings = await ensureSettings(user.id);
            return res.json(mapSettings(settings));
        }

        if (req.method === 'PUT') {
            // Only user-editable preferences are settable here. instagram_account_id and
            // verify_token are owned by the OAuth callback — letting a user set them would
            // let them bind another account's id to their row and hijack webhook routing.
            const map = {
                botEnabled: 'bot_enabled',
                instagramHandle: 'instagram_handle',
                successPublicReply: 'success_public_reply',
                fallbackPublicReply: 'fallback_public_reply',
                replyDelay: 'reply_delay',
                timezone: 'timezone',
            };
            const updates = { updated_at: new Date().toISOString() };
            for (const [key, col] of Object.entries(map)) {
                if (req.body?.[key] !== undefined) updates[col] = req.body[key];
            }
            const { data, error } = await supabase.from('user_settings').update(updates).eq('user_id', user.id).select().single();
            if (error) return res.status(500).json({ error: 'Unable to save settings.' });
            return res.json(mapSettings(data));
        }

        return res.status(405).json({ error: 'Method not allowed' });
    }

    if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
    if (action !== 'profile') return res.status(400).json({ error: 'Unsupported me action.' });

    const role = await getUserRole(user.id, user);
    const settings = await ensureSettings(user.id);
    const subscription = getSubscriptionState(user, settings);
    const dashboard = await buildDashboardMetrics({ supabase, userId: user.id, user, settings });

    return res.json({
        user: {
            id: user.id,
            email: user.email,
            name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Creator',
        },
        id: user.id,
        email: user.email,
        name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Creator',
        role,
        plan: subscription.planKey,
        planName: subscription.plan,
        subscription_status: subscription.status,
        subscriptionStatus: subscription.status,
        isPro: subscription.isPro,
        current_period_start: subscription.currentPeriodStart,
        current_period_end: subscription.currentPeriodEnd,
        razorpay_customer_id: subscription.razorpayCustomerId,
        razorpay_subscription_id: subscription.razorpaySubscriptionId,
        has_used_pro_intro_offer: subscription.hasUsedIntroOffer,
        pro_intro_started_at: subscription.proIntroStartedAt,
        limits: subscription.limits,
        usage: dashboard.usage,
        featureAccess: subscription.featureAccess,
    });
}
