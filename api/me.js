import { supabase, getUser, getUserRole, ensureSettings, cors } from '../server/supabaseApi.js';
import { getSubscriptionState } from '../server/billingConfig.js';
import { buildDashboardMetrics } from '../server/dashboardMetrics.js';

function fallbackSettings(userId) {
    return {
        user_id: userId,
        bot_enabled: false,
        instagram_account_id: null,
        instagram_handle: null,
        instagram_user_id: null,
        instagram_username: null,
        instagram_connection_status: 'disconnected',
        instagram_token_expires_at: null,
        instagram_permissions: [],
        instagram_connected_at: null,
        instagram_last_synced_at: null,
        page_access_token: null,
        verify_token: null,
        success_public_reply: null,
        fallback_public_reply: null,
        reply_delay: 0,
        timezone: 'Asia/Kolkata',

        // Billing-safe defaults
        subscription_plan: 'starter',
        subscription_status: 'inactive',
        current_period_start: null,
        current_period_end: null,
        razorpay_customer_id: null,
        razorpay_subscription_id: null,
        has_used_pro_intro_offer: false,
        pro_intro_started_at: null,
    };
}

async function getSafeSettings(userId) {
    try {
        const settings = await ensureSettings(userId);

        if (!settings) {
            console.warn('[api/me] user_settings missing. Using fallback defaults for user:', userId);
            return fallbackSettings(userId);
        }

        return {
            ...fallbackSettings(userId),
            ...settings,
        };
    } catch (error) {
        console.warn('[api/me] ensureSettings failed. Using fallback defaults:', error?.message || error);
        return fallbackSettings(userId);
    }
}

function mapSettings(s) {
    const settings = s || fallbackSettings(null);

    return {
        botEnabled: Boolean(settings.bot_enabled),
        instagramAccountId: settings.instagram_account_id || null,
        instagramHandle: settings.instagram_handle || null,
        instagramUserId: settings.instagram_user_id || settings.instagram_account_id || null,
        instagramUsername:
            settings.instagram_username ||
            String(settings.instagram_handle || '').replace(/^@/, '') ||
            null,
        instagramConnectionStatus:
            settings.instagram_connection_status ||
            (settings.page_access_token && settings.instagram_account_id ? 'connected' : 'disconnected'),
        instagramTokenExpiresAt: settings.instagram_token_expires_at || null,
        instagramPermissions: settings.instagram_permissions || [],
        instagramConnectedAt: settings.instagram_connected_at || null,
        instagramLastSyncedAt: settings.instagram_last_synced_at || null,
        verifyToken: settings.verify_token || null,
        successPublicReply: settings.success_public_reply || null,
        fallbackPublicReply: settings.fallback_public_reply || null,
        replyDelay: settings.reply_delay || 0,
        timezone: settings.timezone || 'Asia/Kolkata',
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
            const settings = await getSafeSettings(user.id);
            return res.json(mapSettings(settings));
        }

        if (req.method === 'PUT') {
            const map = {
                botEnabled: 'bot_enabled',
                instagramAccountId: 'instagram_account_id',
                instagramHandle: 'instagram_handle',
                verifyToken: 'verify_token',
                successPublicReply: 'success_public_reply',
                fallbackPublicReply: 'fallback_public_reply',
                replyDelay: 'reply_delay',
                timezone: 'timezone',
            };

            const updates = { updated_at: new Date().toISOString() };

            for (const [key, col] of Object.entries(map)) {
                if (req.body?.[key] !== undefined) updates[col] = req.body[key];
            }

            const { data, error } = await supabase
                .from('user_settings')
                .update(updates)
                .eq('user_id', user.id)
                .select()
                .maybeSingle();

            if (error) {
                console.error('[api/me] Unable to save settings:', error);
                return res.status(500).json({ error: 'Unable to save settings.' });
            }

            if (!data) {
                console.warn('[api/me] No user_settings row found while saving. Returning fallback + updates for user:', user.id);
                return res.json(mapSettings({ ...fallbackSettings(user.id), ...updates }));
            }

            return res.json(mapSettings(data));
        }

        return res.status(405).json({ error: 'Method not allowed' });
    }

    if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
    if (action !== 'profile') return res.status(400).json({ error: 'Unsupported me action.' });

    const role = await getUserRole(user.id, user);
    const settings = await getSafeSettings(user.id);
    const subscription = getSubscriptionState(user, settings);

    let dashboard = { usage: {} };

    try {
        dashboard = await buildDashboardMetrics({ supabase, userId: user.id, user, settings });
    } catch (error) {
        console.warn('[api/me] buildDashboardMetrics failed. Using empty usage fallback:', error?.message || error);
    }

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
        usage: dashboard.usage || {},
        featureAccess: subscription.featureAccess,
    });
}