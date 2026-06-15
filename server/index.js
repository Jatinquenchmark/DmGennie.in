import express from 'express';
import cors from 'cors';
import crypto from 'crypto';
import dotenv from 'dotenv';
import axios from 'axios';
import { createClient } from '@supabase/supabase-js';
import Razorpay from 'razorpay';
import { buildDashboardMetrics } from './dashboardMetrics.js';
import { buildContactsPayload } from './contactsData.js';
import { getBillingConfig, getPlanLimitsForState, getProIntroEligibility, getSubscriptionState, isProUser, proRequiredPayload } from './billingConfig.js';
import adminApiHandler from '../api/admin.js';
import authApiHandler from '../api/auth.js';
import billingApiHandler from '../api/billing.js';

dotenv.config({ path: '.env' });

const API_VERSION = 'v25.0';
const SUCCESS_STATUSES = ['sent', 'success', 'delivered'];
const allowedCorsOrigins = ['https://www.dmgennie.in', 'https://dmgennie.in'];
if (process.env.NODE_ENV !== 'production') allowedCorsOrigins.push('http://localhost:5173');

// ── Supabase (service role for backend — bypasses RLS) ─────
const supabase = createClient(
    process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

// ── Express Setup ──────────────────────────────────────────
const app = express();
app.use('/webhook', express.raw({ type: 'application/json' }));
app.use('/api/billing/webhook', express.raw({ type: 'application/json' }));
const jsonParser = express.json();
app.use((req, res, next) => {
    if (['/webhook', '/api/webhook', '/api/billing/webhook'].includes(req.path)) return next();
    return jsonParser(req, res, next);
});
app.use(cors({
    origin(origin, callback) {
        if (!origin || allowedCorsOrigins.includes(origin)) return callback(null, true);
        return callback(new Error('Not allowed by CORS'));
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
}));
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
        .insert({ user_id: userId, subscription_plan: 'starter', subscription_status: 'inactive' })
        .select()
        .single();
    return created;
}

function requestedProFeature(body = {}) {
    const value = String(body.feature || body.template || body.type || body.triggerType || body.automationType || '').toLowerCase();
    if (value.includes('retrigger') || value.includes('re-trigger')) return 'reTrigger';
    if (value.includes('askforfollow') || value.includes('ask for follow') || value.includes('follow')) return 'askForFollow';
    if (value.includes('grow')) return 'growFollowers';
    if (value.includes('lead')) return 'leadGen';
    if (value.includes('autoreply') || value.includes('auto-reply') || value.includes('auto reply') || value.includes('dm keyword') || value.includes('inbox')) return 'autoReply';
    return null;
}

function csvEscape(value) {
    const text = String(value ?? '');
    return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

function buildContactsCsv(contacts) {
    const headers = ['Name', 'Username', 'Email', 'Source', 'Relationship', 'Last Interaction', 'Joined Date'];
    const body = contacts.map((contact) => [
        contact.name,
        contact.username,
        contact.email,
        contact.source,
        contact.relationship,
        contact.lastInteractionLabel || contact.lastInteraction,
        contact.joined,
    ].map(csvEscape).join(','));
    return [headers.join(','), ...body].join('\n');
}

// ── Health Check ───────────────────────────────────────────
app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));

app.get('/api/me', async (req, res) => {
    const user = await getUser(req);
    if (!user) return res.status(401).json({ error: 'Unauthorized' });
    if (req.query.action === 'settings') {
        const s = await ensureSettings(user.id);
        return res.json({
            botEnabled: s.bot_enabled,
            instagramAccountId: s.instagram_account_id,
            instagramHandle: s.instagram_handle,
            verifyToken: s.verify_token,
            successPublicReply: s.success_public_reply,
            fallbackPublicReply: s.fallback_public_reply,
            replyDelay: s.reply_delay,
            timezone: s.timezone,
        });
    }
    const role = await getUserRole(user.id, user);
    const settings = await ensureSettings(user.id);
    const subscription = getSubscriptionState(user, settings);
    const dashboard = await buildDashboardMetrics({ supabase, userId: user.id, user, settings });
    res.json({
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
});

app.put('/api/me', async (req, res) => {
    const userId = await getUserId(req);
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });
    if (req.query.action !== 'settings') return res.status(400).json({ error: 'Unsupported me action.' });

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
        if (req.body[key] !== undefined) updates[col] = req.body[key];
    }
    const { data } = await supabase.from('user_settings').update(updates).eq('user_id', userId).select().single();
    return res.json({
        botEnabled: data.bot_enabled,
        instagramAccountId: data.instagram_account_id,
        instagramHandle: data.instagram_handle,
        verifyToken: data.verify_token,
        successPublicReply: data.success_public_reply,
        fallbackPublicReply: data.fallback_public_reply,
        replyDelay: data.reply_delay,
        timezone: data.timezone,
    });
});

app.all('/api/admin', adminApiHandler);
app.all('/api/auth', authApiHandler);
app.all('/api/billing', billingApiHandler);

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
                const plan = String(settings.subscription_plan || user.app_metadata?.plan || 'starter').toLowerCase() === 'pro' ? 'Pro' : 'Starter';
                return {
                    id: user.id,
                    email: user.email,
                    name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Creator',
                    role: roles.find((row) => row.user_id === user.id)?.role || user.app_metadata?.role || 'user',
                    plan,
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
            const safePlan = String(plan || 'starter').trim().toLowerCase() === 'pro' ? 'pro' : 'starter';
            const subscriptionStatus = safePlan === 'pro' ? 'active' : 'inactive';
            const { data: { user } } = await supabase.auth.admin.getUserById(userId);
            await supabase.auth.admin.updateUserById(userId, { app_metadata: { ...(user?.app_metadata || {}), plan: safePlan, subscription_status: subscriptionStatus } });
            await supabase.from('user_settings').upsert({
                user_id: userId,
                subscription_plan: safePlan,
                subscription_status: subscriptionStatus,
                updated_at: new Date().toISOString(),
            }, { onConflict: 'user_id' });
        } else if (action === 'subscriptionStatus') {
            const status = String(req.body?.status || 'inactive').trim().toLowerCase();
            const safeStatus = ['active', 'inactive', 'cancelled', 'expired', 'payment_pending'].includes(status) ? status : 'inactive';
            const { data: { user } } = await supabase.auth.admin.getUserById(userId);
            await supabase.auth.admin.updateUserById(userId, { app_metadata: { ...(user?.app_metadata || {}), subscription_status: safeStatus } });
            await supabase.from('user_settings').upsert({
                user_id: userId,
                subscription_status: safeStatus,
                updated_at: new Date().toISOString(),
            }, { onConflict: 'user_id' });
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

app.get('/api/contacts', async (req, res) => {
    const user = await getUser(req);
    if (!user) return res.status(401).json({ error: 'Unauthorized' });
    const action = String(req.query.action || 'list');

    try {
        const payload = await buildContactsPayload({ supabase, userId: user.id });
        if (action === 'metrics') return res.json({ metrics: payload.metrics });
        if (action === 'export') {
            await ensureSettings(user.id);
            if (!(await isProUser(supabase, user.id, user))) {
                return res.status(403).json(proRequiredPayload('Upgrade to Pro to export contacts.'));
            }
            res.setHeader('Content-Type', 'text/csv; charset=utf-8');
            res.setHeader('Content-Disposition', 'attachment; filename="dmgennie-contacts.csv"');
            return res.send(buildContactsCsv(payload.contacts));
        }
        res.json(payload);
    } catch (error) {
        console.error('[contacts] Unable to load contacts:', error?.message || error);
        res.status(500).json({ error: 'Unable to load contacts.' });
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
            subscriptionStatus: eligibility.status,
            isPaymentPending: eligibility.isPaymentPending,
            currentPeriodEnd: eligibility.currentPeriodEnd || null,
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
    const applyIntroOffer = !eligibility.isPro && !eligibility.hasUsedIntroOffer;

    if (!config.razorpay.keyId || !config.razorpay.keySecret || !config.razorpay.proMonthlyPlanId) {
        return res.status(501).json({
            error: 'Checkout setup required',
            message: 'Razorpay Pro monthly plan is not configured yet.',
            setupRequired: true,
            pricing: config.plans.pro,
        });
    }

    if (applyIntroOffer && !config.razorpay.proIntroOfferId) {
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
                plan: 'pro',
                intro_offer: applyIntroOffer ? 'true' : 'false',
                intro_amount_inr: String(config.plans.pro.introOffer.amountInr),
                renewal_amount_inr: String(config.plans.pro.monthlyPriceInr),
            },
        };

        if (applyIntroOffer) subscriptionPayload.offer_id = config.razorpay.proIntroOfferId;

        const subscription = await razorpay.subscriptions.create(subscriptionPayload);
        const { error } = await supabase.from('user_settings').update({
            razorpay_subscription_id: subscription.id,
            subscription_plan: 'starter',
            subscription_status: 'payment_pending',
            updated_at: new Date().toISOString(),
        }).eq('user_id', user.id);
        if (error) console.warn('[billing] Unable to store checkout reference:', error.message);

        res.json({
            checkoutUrl: subscription.short_url,
            subscriptionId: subscription.id,
            introOfferApplied: applyIntroOffer,
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
    const isProPayment = String(notes.plan || '').toLowerCase() === 'pro'
        || entity.plan_id === config.razorpay.proMonthlyPlanId
        || subscription?.plan_id === config.razorpay.proMonthlyPlanId;

    if ((event.event === 'subscription.charged' || event.event === 'payment.captured') && userId && isProPayment) {
        const now = new Date().toISOString();
        const introApplied = notes.intro_offer === 'true';
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
        if (error) console.warn('[billing] Unable to mark intro offer used:', error.message);
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

    if ((event.event === 'payment.failed' || event.event === 'subscription.payment_failed' || event.event === 'subscription.cancelled' || event.event === 'subscription.paused' || event.event === 'subscription.completed' || event.event === 'subscription.expired') && userId && isProPayment) {
        const status = event.event === 'payment.failed' || event.event === 'subscription.payment_failed'
            ? 'payment_failed'
            : event.event === 'subscription.completed' || event.event === 'subscription.expired'
                ? 'expired'
                : 'cancelled';
        const updates = {
            subscription_plan: 'starter',
            subscription_status: status,
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
                    subscription_status: status,
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

// ── Instagram Media (posts / reels / stories) ──────────────
const MEDIA_GRADIENTS = [
    'from-[#5B4DFF] via-[#8A3FFC] to-[#F05A8A]',
    'from-[#2B1635] via-[#7A2E57] to-[#F3B8D0]',
    'from-[#111827] via-[#4C1D95] to-[#5B4DFF]',
    'from-emerald-900 via-teal-600 to-cyan-300',
    'from-amber-100 via-white to-[#FFF7DA]',
];
const igMediaTypeLabel = (type) => (type === 'VIDEO' ? 'Reel' : type === 'CAROUSEL_ALBUM' ? 'Carousel' : 'Post');
const igTitleFromCaption = (caption, fallback) => {
    const text = String(caption || '').trim().replace(/\s+/g, ' ');
    if (!text) return fallback;
    return text.length > 40 ? `${text.slice(0, 40)}…` : text;
};

app.get('/api/instagram/media', async (req, res) => {
    const userId = await getUserId(req);
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const settings = await ensureSettings(userId);
    const { page_access_token, instagram_account_id } = settings;
    if (!page_access_token || !instagram_account_id) {
        return res.status(200).json({ connected: false, posts: [], stories: [] });
    }

    const base = `https://graph.facebook.com/${API_VERSION}/${instagram_account_id}`;
    const fetchEdge = async (edge, fields) => {
        try {
            const r = await axios.get(`${base}/${edge}`, { params: { fields, access_token: page_access_token, limit: 25 } });
            return Array.isArray(r.data?.data) ? r.data.data : [];
        } catch (error) {
            console.error(`[media] ${edge} fetch failed:`, error.response?.data?.error?.message || error.message);
            return [];
        }
    };

    const [posts, stories] = await Promise.all([
        fetchEdge('media', 'id,caption,media_type,media_url,thumbnail_url,permalink,like_count,comments_count,timestamp'),
        fetchEdge('stories', 'id,caption,media_type,media_url,thumbnail_url,permalink,timestamp'),
    ]);

    const mapItem = (item, index, isStory) => ({
        id: item.id,
        title: igTitleFromCaption(item.caption, isStory ? 'Story' : igMediaTypeLabel(item.media_type)),
        type: isStory ? 'Post' : igMediaTypeLabel(item.media_type),
        caption: item.caption || '',
        color: MEDIA_GRADIENTS[index % MEDIA_GRADIENTS.length],
        metric: isStory
            ? 'Active story'
            : (typeof item.like_count === 'number' ? `${item.like_count.toLocaleString()} likes`
                : typeof item.comments_count === 'number' ? `${item.comments_count.toLocaleString()} comments` : 'Recent'),
        thumbnailUrl: item.thumbnail_url || item.media_url || '',
    });

    res.json({
        connected: true,
        posts: posts.map((item, i) => mapItem(item, i, false)),
        stories: stories.map((item, i) => mapItem(item, i, true)),
    });
});

// ── Session geo (security signal) ──────────────────────────
app.get('/api/session', (req, res) => {
    const country = req.headers['x-vercel-ip-country']
        || req.headers['cf-ipcountry']
        || req.headers['x-country-code']
        || 'unknown';
    res.json({ country: String(country).toUpperCase() });
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
    const user = await getUser(req);
    if (!user) return res.status(401).json({ error: 'Unauthorized' });
    const userId = user.id;

    const settings = await ensureSettings(userId);
    const subscription = getSubscriptionState(user, settings);
    const feature = requestedProFeature(req.body);
    if (feature && !(await isProUser(supabase, userId, user))) {
        return res.status(403).json(proRequiredPayload());
    }

    const { count } = await supabase
        .from('triggers')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId);
    if ((count || 0) >= subscription.limits.automationLimit) {
        return res.status(403).json({
            error: 'PLAN_LIMIT_REACHED',
            message: "You've reached your Starter automation limit. Upgrade to Pro to create more.",
        });
    }

    const { data, error } = await supabase
        .from('triggers')
        .insert({
            user_id: userId,
            keyword: req.body.keyword || '',
            reply_message: req.body.replyMessage || '',
            trigger_type: req.body.triggerType || req.body.automationType || null,
        })
        .select()
        .single();

    if (error) return res.status(500).json({ error: error.message });
    res.json({ id: data.id, keyword: data.keyword, replyMessage: data.reply_message, enabled: data.enabled });
});

app.put('/api/triggers', async (req, res) => {
    const userId = await getUserId(req);
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });
    const { id } = req.query;
    if (!id) return res.status(400).json({ error: 'Missing trigger id.' });

    const updates = {};
    if (req.body.keyword !== undefined) updates.keyword = req.body.keyword;
    if (req.body.replyMessage !== undefined) updates.reply_message = req.body.replyMessage;
    if (req.body.enabled !== undefined) updates.enabled = req.body.enabled;

    const { data, error } = await supabase
        .from('triggers')
        .update(updates)
        .eq('id', id)
        .eq('user_id', userId)
        .select()
        .single();

    if (error) return res.status(500).json({ error: error.message });
    res.json({ id: data.id, keyword: data.keyword, replyMessage: data.reply_message, enabled: data.enabled });
});

app.delete('/api/triggers', async (req, res) => {
    const userId = await getUserId(req);
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });
    const { id } = req.query;
    if (!id) return res.status(400).json({ error: 'Missing trigger id.' });

    await supabase.from('triggers').delete().eq('id', id).eq('user_id', userId);
    res.json({ success: true });
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

function isValidMetaSignature(rawBody, signature, appSecret) {
    if (!rawBody || !signature || !appSecret) return false;
    if (typeof signature !== 'string' || !signature.startsWith('sha256=')) return false;

    const expected = 'sha256=' + crypto.createHmac('sha256', appSecret).update(rawBody).digest('hex');
    const expectedBuffer = Buffer.from(expected);
    const signatureBuffer = Buffer.from(signature);

    return expectedBuffer.length === signatureBuffer.length
        && crypto.timingSafeEqual(expectedBuffer, signatureBuffer);
}

app.post('/webhook', async (req, res) => {
    const signature = req.headers['x-hub-signature-256'];

    if (!isValidMetaSignature(req.body, signature, process.env.META_APP_SECRET)) {
        return res.status(401).json({ error: 'Invalid signature' });
    }

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

        const limitStatus = await getAutomationLimitStatus(settings);
        if (limitStatus.blocked) {
            await supabase.from('activity_log').insert({
                user_id: settings.user_id,
                username: `@${username}`,
                keyword: trigger.keyword,
                trigger_keyword: trigger.keyword,
                status: limitStatus.reason,
            });
            return;
        }

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

async function getAutomationLimitStatus(settings) {
    const subscription = getSubscriptionState(null, settings);
    const limits = getPlanLimitsForState(subscription);
    const startMonth = new Date();
    startMonth.setUTCDate(1);
    startMonth.setUTCHours(0, 0, 0, 0);

    const { count: dmsThisMonth } = await supabase
        .from('activity_log')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', settings.user_id)
        .in('status', SUCCESS_STATUSES)
        .gte('created_at', startMonth.toISOString());

    if ((dmsThisMonth || 0) >= limits.dmLimit) {
        return { blocked: true, reason: 'blocked_due_to_dm_limit' };
    }

    const { count: contactsThisMonth } = await supabase
        .from('activity_log')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', settings.user_id)
        .in('status', ['lead_captured', 'email_captured', 'captured'])
        .gte('created_at', startMonth.toISOString());

    if ((contactsThisMonth || 0) >= limits.contactLimit) {
        return { blocked: true, reason: 'blocked_due_to_contact_limit' };
    }

    return { blocked: false };
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
app.listen(PORT, () => console.log(`[DMGennie] Backend listening on port ${PORT}`));

// ══════════════════════════════════════════════════════════
// Instagram OAuth Flow
// ══════════════════════════════════════════════════════════

// Step 1 — Redirect user to Meta's OAuth dialog
app.get('/auth/instagram', async (req, res) => {
    req.query.action = 'instagram';
    return authApiHandler(req, res);
});

// Step 2 — Meta redirects back here with a code
app.get('/auth/instagram/callback', async (req, res) => {
    req.query.action = 'callback';
    return authApiHandler(req, res);
});

// Step 3 — Disconnect Instagram
app.post('/auth/instagram/disconnect', async (req, res) => {
    req.query.action = 'disconnect';
    return authApiHandler(req, res);
});
