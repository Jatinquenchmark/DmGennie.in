import express from 'express';
import cors from 'cors';
import crypto from 'crypto';
import dotenv from 'dotenv';
import axios from 'axios';
import { createClient } from '@supabase/supabase-js';

// Load env vars if .env file exists (useful for local testing)
dotenv.config();

const API_VERSION = 'v25.0';

// ── Supabase (service role for backend — bypasses RLS) ─────
const supabase = createClient(
    process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

// ── Express Setup ──────────────────────────────────────────
const app = express();

// Middleware for webhook signature verification (needs raw body)
app.use('/webhook', express.raw({ type: 'application/json' }));
app.use(express.json());
app.use(cors());
app.use((req, res, next) => {
    res.setHeader('ngrok-skip-browser-warning', 'true');
    next();
});

//  Webhook Verification (GET)
app.get('/api/webhook', (req, res) => {
    const VERIFY_TOKEN = process.env.WEBHOOK_VERIFY_TOKEN;

    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    if (mode === 'subscribe' && token === VERIFY_TOKEN) {
        console.log('Webhook verified');
        return res.status(200).send(challenge);
    } else {
        return res.status(403).send('Verification failed');
    }
});
// ✅ Webhook Events (POST)
app.post('/api/webhook', (req, res) => {
    console.log('Webhook event:', req.body);
    return res.status(200).send('EVENT_RECEIVED');
});

// ── Helper: get user_id from Bearer token ──────────────────
async function getUserId(req) {
    const auth = req.headers.authorization;
    if (!auth || !auth.startsWith('Bearer ')) return null;
    const token = auth.split(' ')[1];
    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error || !user) return null;
    return user.id;
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

// ── Dashboard Overview ─────────────────────────────────────
app.get('/api/dashboard', async (req, res) => {
    const userId = await getUserId(req);
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const settings = await ensureSettings(userId);

    const { data: triggers } = await supabase
        .from('triggers')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: true });

    const { data: activityLog } = await supabase
        .from('activity_log')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(50);

    res.json({
        connected: !!(settings.page_access_token && settings.instagram_account_id),
        botEnabled: settings.bot_enabled,
        stats: {
            followers: settings.followers,
            totalDmsSent: settings.total_dms_sent,
            totalLinksSent: settings.total_links_sent,
            totalPublicReplies: settings.total_public_replies,
            dmsSentToday: settings.dms_sent_today,
            failedDms: settings.failed_dms,
        },
        triggers: (triggers || []).map(t => ({
            id: t.id,
            keyword: t.keyword,
            replyMessage: t.reply_message,
            enabled: t.enabled,
        })),
        activityLog: (activityLog || []).map(a => ({
            id: a.id,
            user: a.username,
            keyword: a.keyword,
            trigger: a.trigger_keyword,
            status: a.status,
            time: a.created_at,
        })),
    });
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
    try {
        // req.body might be a Buffer if express.raw was used
        body = JSON.parse(req.body.toString());
    } catch {
        return res.sendStatus(400);
    }

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

export default app;
