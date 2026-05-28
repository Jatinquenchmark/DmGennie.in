import express from 'express';
import cors from 'cors';
import crypto from 'crypto';
import dotenv from 'dotenv';
import axios from 'axios';
import { createClient } from '@supabase/supabase-js';
import Razorpay from 'razorpay';
import { buildDashboardMetrics } from './dashboardMetrics.js';
import { getBillingConfig, getProIntroEligibility } from './billingConfig.js';

dotenv.config({ path: '.env' });

const API_VERSION = 'v25.0';

// ── Supabase (service role for backend — bypasses RLS) ─────
const supabase = createClient(
    process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

// ── Express Setup ──────────────────────────────────────────
const app = express();
app.use('/webhook', express.raw({ type: 'application/json' }));
app.use('/api/billing/webhook', express.raw({ type: 'application/json' }));
app.use(express.json());
app.use(cors());
app.use((req, res, next) => {
    res.setHeader('ngrok-skip-browser-warning', 'true');
    next();
});

// ── Helper: get user_id from Bearer token ──────────────────
async function getUserId(req) {
    const user = await getUser(req);
    return user?.id || null;
}

async function getUser(req) {
    const auth = req.headers.authorization;
    if (!auth || !auth.startsWith('Bearer ')) return null;
    const token = auth.split(' ')[1];
    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error || !user) return null;
    return user;
}

async function getUserRole(userId, user) {
    const { data, error } = await supabase.from('user_roles').select('role').eq('user_id', userId).single();
    if (data?.role) return data.role;
    const appRole = user?.app_metadata?.role;
    if (appRole === 'admin' || appRole === 'user') return appRole;
    if (!error || error.code === 'PGRST116') {
        await supabase.from('user_roles').upsert({ user_id: userId, role: 'user', updated_at: new Date().toISOString() });
    }
    return 'user';
}

async function requireAdmin(req, res) {
    const user = await getUser(req);
    if (!user) {
        res.status(401).json({ error: 'Unauthorized' });
        return null;
    }
    const role = await getUserRole(user.id, user);
    if (role !== 'admin') {
        res.status(403).json({ error: 'Access denied' });
        return null;
    }
    return { user, role };
}

async function listAuthUsers() {
    const allUsers = [];
    let page = 1;
    const perPage = 1000;
    while (true) {
        const { data, error } = await supabase.auth.admin.listUsers({ page, perPage });
        if (error) throw error;
        const users = data?.users || [];
        allUsers.push(...users);
        if (users.length < perPage) break;
        page += 1;
    }
    return allUsers;
}

// ── Helper: ensure settings row exists ────────────────────
async function ensureSettings(userId) {
    const { data } = await supabase
        .from('user_settings')
        .select('*')
        .eq('user_id', userId)
        .single();
    if (data) return data;
    // Create default row if trigger didn't fire
    const { data: created } = await supabase
        .from('user_settings')
        .insert({ user_id: userId })
        .select()
        .single();
    return created;
}

// ── Health Check ───────────────────────────────────────────
app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));

app.get('/api/me', async (req, res) => {
    const user = await getUser(req);
    if (!user) return res.status(401).json({ error: 'Unauthorized' });
    const role = await getUserRole(user.id, user);
    res.json({
        id: user.id,
        email: user.email,
        name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Creator',
        role,
    });
});

app.get('/api/admin/overview', async (req, res) => {
    const admin = await requireAdmin(req, res);
    if (!admin) return;
    try {
        const [users, settingsResult, triggersResult, activityResult] = await Promise.all([
            listAuthUsers(),
            supabase.from('user_settings').select('*'),
            supabase.from('triggers').select('*'),
            supabase.from('activity_log').select('*').order('created_at', { ascending: false }).limit(25),
        ]);
        const settings = settingsResult.data || [];
        const triggers = triggersResult.data || [];
        const activity = activityResult.data || [];
        const totals = settings.reduce((acc, row) => ({
            dms: acc.dms + Number(row.total_dms_sent || 0),
            contacts: acc.contacts + Number(row.total_links_sent || 0),
            failed: acc.failed + Number(row.failed_dms || 0),
        }), { dms: 0, contacts: 0, failed: 0 });
        const userById = new Map(users.map((user) => [user.id, user]));
        res.json({
            metrics: {
                totalUsers: users.length,
                activeUsers: settings.filter((row) => row.page_access_token && row.instagram_account_id).length,
                totalAutomations: triggers.length,
                totalDmsSent: totals.dms,
                totalContacts: totals.contacts,
                failedMessages: totals.failed,
                revenue: 0,
            },
            recentSignups: users.slice().sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0)).slice(0, 8).map((user) => ({
                id: user.id,
                email: user.email,
                name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Creator',
                createdAt: user.created_at,
                plan: user.app_metadata?.plan || 'Starter',
            })),
            recentActivity: activity.map((item) => ({
                id: item.id,
                ownerEmail: userById.get(item.user_id)?.email || 'Unknown user',
                user: item.username || 'Unknown Instagram user',
                keyword: item.keyword || item.trigger_keyword || 'Unknown',
                status: item.status || 'Unknown',
                createdAt: item.created_at,
            })),
        });
    } catch {
        res.status(500).json({ error: 'Unable to load admin overview.' });
    }
});

app.get('/api/admin/users', async (req, res) => {
    const admin = await requireAdmin(req, res);
    if (!admin) return;
    try {
        const [users, settingsResult, rolesResult] = await Promise.all([
            listAuthUsers(),
            supabase.from('user_settings').select('*'),
            supabase.from('user_roles').select('*'),
        ]);
        const settingsByUser = new Map((settingsResult.data || []).map((row) => [row.user_id, row]));
        const roles = rolesResult.data || [];
        res.json({
            users: users.map((user) => {
                const settings = settingsByUser.get(user.id) || {};
                return {
                    id: user.id,
                    email: user.email,
                    name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Creator',
                    role: roles.find((row) => row.user_id === user.id)?.role || user.app_metadata?.role || 'user',
                    plan: user.app_metadata?.plan || 'Starter',
                    suspended: Boolean(user.banned_until && new Date(user.banned_until) > new Date()),
                    connectedInstagram: Boolean(settings.page_access_token && settings.instagram_account_id),
                    instagramHandle: settings.instagram_handle || 'Instagram not connected',
                    dmsSent: settings.total_dms_sent || 0,
                    contacts: settings.total_links_sent || 0,
                    introOfferUsed: Boolean(settings.has_used_pro_intro_offer || user.app_metadata?.has_used_pro_intro_offer),
                    proIntroStartedAt: settings.pro_intro_started_at || user.app_metadata?.pro_intro_started_at || null,
                    subscriptionStatus: settings.subscription_status || user.app_metadata?.subscription_status || 'free',
                    createdAt: user.created_at,
                    lastSignInAt: user.last_sign_in_at,
                };
            }),
        });
    } catch {
        res.status(500).json({ error: 'Unable to load admin users.' });
    }
});

app.put('/api/admin/users', async (req, res) => {
    const admin = await requireAdmin(req, res);
    if (!admin) return;
    try {
        const { userId, action, plan } = req.body || {};
        if (!userId || !action) return res.status(400).json({ error: 'Missing user action.' });
        if (action === 'suspend') await supabase.auth.admin.updateUserById(userId, { banned_until: '2999-12-31T23:59:59.000Z' });
        else if (action === 'activate') await supabase.auth.admin.updateUserById(userId, { banned_until: null });
        else if (action === 'plan') {
            const { data: { user } } = await supabase.auth.admin.getUserById(userId);
            await supabase.auth.admin.updateUserById(userId, { app_metadata: { ...(user?.app_metadata || {}), plan: String(plan || 'Starter').slice(0, 40) } });
        } else return res.status(400).json({ error: 'Unsupported admin action.' });
        res.json({ success: true });
    } catch {
        res.status(500).json({ error: 'Unable to update admin user.' });
    }
});

app.get('/api/admin/automations', async (req, res) => {
    const admin = await requireAdmin(req, res);
    if (!admin) return;
    try {
        const [users, triggersResult, activityResult] = await Promise.all([
            listAuthUsers(),
            supabase.from('triggers').select('*').order('created_at', { ascending: false }),
            supabase.from('activity_log').select('user_id,trigger_keyword,status'),
        ]);
        const userById = new Map(users.map((user) => [user.id, user]));
        const activity = activityResult.data || [];
        res.json({
            automations: (triggersResult.data || []).map((trigger) => {
                const owner = userById.get(trigger.user_id);
                const triggerActivity = activity.filter((item) => item.user_id === trigger.user_id && item.trigger_keyword === trigger.keyword);
                return {
                    id: trigger.id,
                    ownerId: trigger.user_id,
                    ownerEmail: owner?.email || 'Unknown user',
                    ownerName: owner?.user_metadata?.full_name || owner?.email?.split('@')[0] || 'Unknown user',
                    keyword: trigger.keyword || 'Unknown',
                    replyMessage: trigger.reply_message || '',
                    status: trigger.enabled ? 'Live' : 'Paused',
                    dmsSent: triggerActivity.filter((item) => item.status === 'sent').length,
                    failed: triggerActivity.filter((item) => item.status !== 'sent').length,
                    createdAt: trigger.created_at,
                    updatedAt: trigger.updated_at || trigger.created_at,
                };
            }),
        });
    } catch {
        res.status(500).json({ error: 'Unable to load admin automations.' });
    }
});

app.put('/api/admin/automations', async (req, res) => {
    const admin = await requireAdmin(req, res);
    if (!admin) return;
    const { id, enabled } = req.body || {};
    if (!id || typeof enabled !== 'boolean') return res.status(400).json({ error: 'Missing automation update.' });
    const { error } = await supabase.from('triggers').update({ enabled }).eq('id', id);
    if (error) return res.status(500).json({ error: 'Unable to update automation.' });
    res.json({ success: true });
});

app.get('/api/admin/contacts', async (req, res) => {
    const admin = await requireAdmin(req, res);
    if (!admin) return;
    try {
        const [users, activityResult] = await Promise.all([
            listAuthUsers(),
            supabase.from('activity_log').select('*').order('created_at', { ascending: false }).limit(1000),
        ]);
        const userById = new Map(users.map((user) => [user.id, user]));
        res.json({
            contacts: (activityResult.data || []).map((item) => {
                const owner = userById.get(item.user_id);
                return {
                    id: item.id,
                    ownerId: item.user_id,
                    ownerEmail: owner?.email || 'Unknown user',
                    ownerName: owner?.user_metadata?.full_name || owner?.email?.split('@')[0] || 'Unknown user',
                    instagramUser: item.username || 'Unknown Instagram user',
                    email: 'No email captured',
                    source: item.trigger_keyword ? `Auto DM for "${item.trigger_keyword}"` : 'Unknown source',
                    keyword: item.keyword || item.trigger_keyword || 'Unknown',
                    status: item.status || 'Unknown',
                    joinedAt: item.created_at,
                };
            }),
        });
    } catch {
        res.status(500).json({ error: 'Unable to load admin contacts.' });
    }
});

// ── Billing / Pro Intro Offer ─────────────────────────────
app.get('/api/billing/pricing', async (req, res) => {
    const config = getBillingConfig();
    const user = await getUser(req);
    let eligibility = { eligible: false, reason: 'Sign in to start Pro for ₹1', isPro: false, hasUsedIntroOffer: false };

    if (user) {
        const settings = await ensureSettings(user.id);
        eligibility = getProIntroEligibility(user, settings);
    }

    res.json({
        currency: config.currency,
        plans: config.plans,
        proIntroOffer: {
            ...config.plans.pro.introOffer,
            eligible: eligibility.eligible,
            reason: eligibility.reason,
            hasUsedIntroOffer: eligibility.hasUsedIntroOffer,
            isPro: eligibility.isPro,
            proIntroStartedAt: eligibility.proIntroStartedAt || null,
        },
    });
});

app.post('/api/billing/checkout', async (req, res) => {
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

    try {
        const razorpay = new Razorpay({
            key_id: config.razorpay.keyId,
            key_secret: config.razorpay.keySecret,
        });

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

        if (eligibility.eligible) subscriptionPayload.offer_id = config.razorpay.proIntroOfferId;

        const subscription = await razorpay.subscriptions.create(subscriptionPayload);
        const { error } = await supabase.from('user_settings').update({
            razorpay_subscription_id: subscription.id,
            subscription_plan: 'Pro',
            subscription_status: 'checkout_created',
            updated_at: new Date().toISOString(),
        }).eq('user_id', user.id);
        if (error) console.warn('[billing] Unable to store checkout reference:', error.message);

        res.json({
            checkoutUrl: subscription.short_url,
            subscriptionId: subscription.id,
            introOfferApplied: eligibility.eligible,
            pricing: config.plans.pro,
        });
    } catch (error) {
        console.error('[billing] Checkout failed:', error?.error || error);
        res.status(500).json({
            error: 'Unable to create checkout',
            message: 'Something went wrong while creating the Pro checkout. Please try again.',
        });
    }
});

app.post('/api/billing/webhook', async (req, res) => {
    const config = getBillingConfig();
    const signature = req.headers['x-razorpay-signature'];
    const rawBody = Buffer.isBuffer(req.body) ? req.body : Buffer.from(JSON.stringify(req.body || {}));
    if (!config.razorpay.webhookSecret) return res.status(501).json({ error: 'Webhook secret not configured' });

    const expected = crypto.createHmac('sha256', config.razorpay.webhookSecret).update(rawBody).digest('hex');
    const expectedBuffer = Buffer.from(expected);
    const signatureBuffer = Buffer.from(signature || '');
    if (expectedBuffer.length !== signatureBuffer.length || !crypto.timingSafeEqual(expectedBuffer, signatureBuffer)) {
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

    if ((event.event === 'subscription.charged' || event.event === 'payment.captured') && notes.intro_offer === 'true' && userId) {
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
        if (error) console.warn('[billing] Unable to mark intro offer used:', error.message);
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

    res.json({ received: true });
});

// ── Dashboard Overview ─────────────────────────────────────
app.get('/api/dashboard', async (req, res) => {
    const user = await getUser(req);
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    const settings = await ensureSettings(user.id);
    const payload = await buildDashboardMetrics({ supabase, userId: user.id, user, settings });
    res.json(payload);
});

app.get('/api/dashboard/metrics', async (req, res) => {
    const user = await getUser(req);
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    const settings = await ensureSettings(user.id);
    const payload = await buildDashboardMetrics({ supabase, userId: user.id, user, settings });
    res.json(payload);
});

// ── Stats ──────────────────────────────────────────────────
app.get('/api/stats', async (req, res) => {
    const userId = await getUserId(req);
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });
    const settings = await ensureSettings(userId);
    res.json({
        followers: settings.followers,
        totalDmsSent: settings.total_dms_sent,
        totalLinksSent: settings.total_links_sent,
        totalPublicReplies: settings.total_public_replies,
        dmsSentToday: settings.dms_sent_today,
        failedDms: settings.failed_dms,
    });
});

// ── Instagram Profile ──────────────────────────────────────
app.get('/api/instagram/profile', async (req, res) => {
    const userId = await getUserId(req);
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const settings = await ensureSettings(userId);
    const { page_access_token, instagram_account_id } = settings;

    if (!page_access_token || !instagram_account_id) {
        return res.status(400).json({ error: 'Instagram account not connected.' });
    }

    try {
        const response = await axios.get(
            `https://graph.instagram.com/${API_VERSION}/${instagram_account_id}`,
            { params: { fields: 'id,username,name,followers_count,media_count,profile_picture_url', access_token: page_access_token } }
        );
        const profile = response.data;
        await supabase.from('user_settings').update({ followers: profile.followers_count || 0 }).eq('user_id', userId);
        res.json(profile);
    } catch (error) {
        res.status(500).json({ error: error.response?.data?.error || error.message });
    }
});

// ── Triggers ───────────────────────────────────────────────
app.get('/api/triggers', async (req, res) => {
    const userId = await getUserId(req);
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const { data } = await supabase
        .from('triggers')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: true });

    res.json((data || []).map(t => ({ id: t.id, keyword: t.keyword, replyMessage: t.reply_message, enabled: t.enabled })));
});

app.post('/api/triggers', async (req, res) => {
    const userId = await getUserId(req);
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const { data, error } = await supabase
        .from('triggers')
        .insert({ user_id: userId, keyword: req.body.keyword || '', reply_message: req.body.replyMessage || '' })
        .select()
        .single();

    if (error) return res.status(500).json({ error: error.message });
    res.json({ id: data.id, keyword: data.keyword, replyMessage: data.reply_message, enabled: data.enabled });
});

app.put('/api/triggers/:id', async (req, res) => {
    const userId = await getUserId(req);
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const updates = {};
    if (req.body.keyword !== undefined) updates.keyword = req.body.keyword;
    if (req.body.replyMessage !== undefined) updates.reply_message = req.body.replyMessage;
    if (req.body.enabled !== undefined) updates.enabled = req.body.enabled;

    const { data, error } = await supabase
        .from('triggers')
        .update(updates)
        .eq('id', req.params.id)
        .eq('user_id', userId)
        .select()
        .single();

    if (error) return res.status(500).json({ error: error.message });
    res.json({ id: data.id, keyword: data.keyword, replyMessage: data.reply_message, enabled: data.enabled });
});

app.delete('/api/triggers/:id', async (req, res) => {
    const userId = await getUserId(req);
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    await supabase.from('triggers').delete().eq('id', req.params.id).eq('user_id', userId);
    res.json({ success: true });
});

// ── Settings ───────────────────────────────────────────────
app.get('/api/settings', async (req, res) => {
    const userId = await getUserId(req);
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const s = await ensureSettings(userId);
    res.json({
        botEnabled: s.bot_enabled,
        instagramAccountId: s.instagram_account_id,
        instagramHandle: s.instagram_handle,
        pageAccessToken: s.page_access_token,
        appSecret: s.app_secret,
        verifyToken: s.verify_token,
        successPublicReply: s.success_public_reply,
        fallbackPublicReply: s.fallback_public_reply,
        replyDelay: s.reply_delay,
        timezone: s.timezone,
    });
});

app.put('/api/settings', async (req, res) => {
    const userId = await getUserId(req);
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const map = {
        botEnabled: 'bot_enabled',
        instagramAccountId: 'instagram_account_id',
        instagramHandle: 'instagram_handle',
        pageAccessToken: 'page_access_token',
        appSecret: 'app_secret',
        verifyToken: 'verify_token',
        successPublicReply: 'success_public_reply',
        fallbackPublicReply: 'fallback_public_reply',
        replyDelay: 'reply_delay',
        timezone: 'timezone',
    };

    const updates = { updated_at: new Date().toISOString() };
    for (const [key, col] of Object.entries(map)) {
        if (req.body[key] !== undefined) updates[col] = req.body[key];
    }

    const { data } = await supabase
        .from('user_settings')
        .update(updates)
        .eq('user_id', userId)
        .select()
        .single();

    res.json({
        botEnabled: data.bot_enabled,
        instagramAccountId: data.instagram_account_id,
        instagramHandle: data.instagram_handle,
        pageAccessToken: data.page_access_token,
        appSecret: data.app_secret,
        verifyToken: data.verify_token,
        successPublicReply: data.success_public_reply,
        fallbackPublicReply: data.fallback_public_reply,
        replyDelay: data.reply_delay,
        timezone: data.timezone,
    });
});

// ── Activity Log ───────────────────────────────────────────
app.get('/api/activity', async (req, res) => {
    const userId = await getUserId(req);
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const { data } = await supabase
        .from('activity_log')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(200);

    res.json((data || []).map(a => ({ id: a.id, user: a.username, keyword: a.keyword, trigger: a.trigger_keyword, status: a.status, time: a.created_at })));
});

// ══════════════════════════════════════════════════════════
// Webhook (uses instagram_account_id to find user)
// ══════════════════════════════════════════════════════════

app.get('/webhook', (req, res) => {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    console.log("Webhook verify hit");
    console.log({ mode, token, challenge });

    if (mode === 'subscribe' && token === process.env.WEBHOOK_VERIFY_TOKEN) {
        console.log("WEBHOOK VERIFIED ✅");
        return res.status(200).send(challenge);
    } else {
        console.log("WEBHOOK FAILED ❌");
        return res.sendStatus(403);
    }
});

app.post('/webhook', async (req, res) => {
    const signature = req.headers['x-hub-signature-256'];

    let body;
    try { body = JSON.parse(req.body.toString()); } catch { return res.sendStatus(400); }

    res.status(200).send('EVENT_RECEIVED');

    if (body.object !== 'instagram') return;

    for (const entry of body.entry || []) {
        const changes = entry.changes || [];
        if (!changes.length && entry.field === 'comments') {
            await processComment(body, entry.value, entry.id, signature, req.body);
            continue;
        }
        for (const change of changes) {
            if (change.field === 'comments') {
                await processComment(body, change.value, entry.id, signature, req.body);
            }
        }
    }
});

async function processComment(body, commentValue, igAccountId, signature, rawBody) {
    // Find the user that owns this Instagram account
    const { data: settingsRows } = await supabase
        .from('user_settings')
        .select('*')
        .eq('instagram_account_id', igAccountId);

    if (!settingsRows || settingsRows.length === 0) return;
    const settings = settingsRows[0];

    // Validate signature
    if (settings.app_secret && signature) {
        const expected = 'sha256=' + crypto.createHmac('sha256', settings.app_secret).update(rawBody).digest('hex');
        if (signature !== expected) return;
    }

    if (!settings.bot_enabled) return;

    const commentId = commentValue.comment_id || commentValue.id;
    const commentText = (commentValue.text || '').toLowerCase();
    const username = commentValue.from?.username || 'unknown';

    if (!commentId || !commentText) return;

    const { data: triggers } = await supabase
        .from('triggers')
        .select('*')
        .eq('user_id', settings.user_id)
        .eq('enabled', true);

    for (const trigger of triggers || []) {
        if (!commentText.includes(trigger.keyword.toLowerCase())) continue;

        const dmSuccess = await sendPrivateReply(settings, commentId, trigger.reply_message, igAccountId);

        if (dmSuccess) {
            await supabase.from('user_settings').update({
                total_dms_sent: settings.total_dms_sent + 1,
                total_links_sent: settings.total_links_sent + 1,
                dms_sent_today: settings.dms_sent_today + 1,
            }).eq('user_id', settings.user_id);

            await supabase.from('activity_log').insert({
                user_id: settings.user_id,
                username: `@${username}`,
                keyword: trigger.keyword,
                trigger_keyword: trigger.keyword,
                status: 'sent',
            });

            if (settings.success_public_reply) {
                await sendPublicReply(settings, commentId, settings.success_public_reply);
                await supabase.from('user_settings').update({ total_public_replies: settings.total_public_replies + 1 }).eq('user_id', settings.user_id);
            }
        } else {
            await supabase.from('user_settings').update({ failed_dms: settings.failed_dms + 1 }).eq('user_id', settings.user_id);
            await supabase.from('activity_log').insert({
                user_id: settings.user_id,
                username: `@${username}`,
                keyword: trigger.keyword,
                trigger_keyword: trigger.keyword,
                status: 'failed_dms_closed',
            });

            if (settings.fallback_public_reply) {
                await sendPublicReply(settings, commentId, settings.fallback_public_reply);
            }
        }
        break;
    }
}

async function sendPrivateReply(settings, commentId, message, igAccountId) {
    const igId = settings.instagram_account_id || igAccountId;
    if (!settings.page_access_token || !igId) return false;
    try {
        await axios.post(`https://graph.instagram.com/${API_VERSION}/${igId}/messages`,
            { recipient: { comment_id: commentId }, message: { text: message } },
            { headers: { 'Authorization': `Bearer ${settings.page_access_token}`, 'Content-Type': 'application/json' } }
        );
        return true;
    } catch { return false; }
}

async function sendPublicReply(settings, commentId, message) {
    if (!settings.page_access_token) return false;
    try {
        await axios.post(`https://graph.instagram.com/${API_VERSION}/${commentId}/replies`,
            { message },
            { headers: { 'Authorization': `Bearer ${settings.page_access_token}`, 'Content-Type': 'application/json' } }
        );
        return true;
    } catch { return false; }
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`[DMGenie] Backend listening on port ${PORT}`));

// ══════════════════════════════════════════════════════════
// Instagram OAuth Flow
// ══════════════════════════════════════════════════════════

// Step 1 — Redirect user to Meta's OAuth dialog
app.get('/auth/instagram', async (req, res) => {
    const userId = await getUserId(req);
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const appId = process.env.META_APP_ID;
    const redirectUri = process.env.META_REDIRECT_URI || `${process.env.APP_URL}/auth/instagram/callback`;

    const scopes = [
        'instagram_basic',
        'instagram_manage_comments',
        'instagram_manage_messages',
        'pages_show_list',
        'pages_read_engagement',
    ].join(',');

    // Store userId in state so we can retrieve it in callback
    const state = Buffer.from(JSON.stringify({ userId })).toString('base64');

    const authUrl = `https://www.facebook.com/dialog/oauth?client_id=${appId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${scopes}&state=${encodeURIComponent(state)}&response_type=code`;

    res.json({ url: authUrl });
});

// Step 2 — Meta redirects back here with a code
app.get('/auth/instagram/callback', async (req, res) => {
    const { code, state, error } = req.query;

    if (error) {
        return res.redirect(`${process.env.FRONTEND_URL}/dashboard?instagram=error&reason=${error}`);
    }

    if (!code || !state) {
        return res.redirect(`${process.env.FRONTEND_URL}/dashboard?instagram=error&reason=missing_params`);
    }

    let userId;
    try {
        const decoded = JSON.parse(Buffer.from(decodeURIComponent(state), 'base64').toString());
        userId = decoded.userId;
    } catch {
        return res.redirect(`${process.env.FRONTEND_URL}/dashboard?instagram=error&reason=invalid_state`);
    }

    const appId = process.env.META_APP_ID;
    const appSecret = process.env.META_APP_SECRET;
    const redirectUri = process.env.META_REDIRECT_URI || `${process.env.APP_URL}/auth/instagram/callback`;

    try {
        // Exchange code for short-lived token
        const tokenRes = await axios.get('https://graph.facebook.com/v25.0/oauth/access_token', {
            params: {
                client_id: appId,
                client_secret: appSecret,
                redirect_uri: redirectUri,
                code,
            }
        });

        const shortToken = tokenRes.data.access_token;

        // Exchange for long-lived token (60 days)
        const longTokenRes = await axios.get('https://graph.facebook.com/v25.0/oauth/access_token', {
            params: {
                grant_type: 'fb_exchange_token',
                client_id: appId,
                client_secret: appSecret,
                fb_exchange_token: shortToken,
            }
        });

        const longToken = longTokenRes.data.access_token;

        // Get Facebook pages linked to this user
        const pagesRes = await axios.get('https://graph.facebook.com/v25.0/me/accounts', {
            params: { access_token: longToken, fields: 'id,name,access_token,instagram_business_account' }
        });

        const pages = pagesRes.data.data || [];

        // Find the page that has an Instagram business account
        let igAccountId = null;
        let pageAccessToken = null;
        let igHandle = null;

        for (const page of pages) {
            if (page.instagram_business_account) {
                igAccountId = page.instagram_business_account.id;
                pageAccessToken = page.access_token;

                // Get Instagram profile
                try {
                    const igProfile = await axios.get(`https://graph.facebook.com/v25.0/${igAccountId}`, {
                        params: { fields: 'username,name', access_token: pageAccessToken }
                    });
                    igHandle = '@' + igProfile.data.username;
                } catch { }
                break;
            }
        }

        if (!igAccountId || !pageAccessToken) {
            return res.redirect(`${process.env.FRONTEND_URL}/dashboard?instagram=error&reason=no_ig_account`);
        }

        // Save to Supabase
        await supabase.from('user_settings').update({
            page_access_token: pageAccessToken,
            instagram_account_id: igAccountId,
            instagram_handle: igHandle || '',
            app_secret: appSecret,
            updated_at: new Date().toISOString(),
        }).eq('user_id', userId);

        // Redirect back to dashboard with success
        return res.redirect(`${process.env.FRONTEND_URL}/dashboard?instagram=connected&handle=${encodeURIComponent(igHandle || igAccountId)}`);

    } catch (err) {
        console.error('OAuth error:', err.response?.data || err.message);
        return res.redirect(`${process.env.FRONTEND_URL}/dashboard?instagram=error&reason=token_exchange_failed`);
    }
});

// Step 3 — Disconnect Instagram
app.post('/auth/instagram/disconnect', async (req, res) => {
    const userId = await getUserId(req);
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    await supabase.from('user_settings').update({
        page_access_token: '',
        instagram_account_id: '',
        instagram_handle: '',
        updated_at: new Date().toISOString(),
    }).eq('user_id', userId);

    res.json({ success: true });
});
