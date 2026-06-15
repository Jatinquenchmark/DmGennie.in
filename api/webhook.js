import crypto from 'crypto';
import axios from 'axios';
import { createClient } from '@supabase/supabase-js';
import { getPlanLimitsForState, getSubscriptionState } from '../server/billingConfig.js';

const API_VERSION = 'v25.0';
const SUCCESS_STATUSES = ['sent', 'success', 'delivered'];

// Validates Meta's X-Hub-Signature-256 header against the raw request bytes,
// using the app secret. Fails closed: any missing input returns false.
function isValidMetaSignature(rawBody, signature, appSecret) {
    if (!rawBody || !signature || !appSecret) return false;
    if (typeof signature !== 'string' || !signature.startsWith('sha256=')) return false;

    const expected = 'sha256=' + crypto.createHmac('sha256', appSecret).update(rawBody).digest('hex');
    const expectedBuffer = Buffer.from(expected);
    const signatureBuffer = Buffer.from(signature);

    return expectedBuffer.length === signatureBuffer.length
        && crypto.timingSafeEqual(expectedBuffer, signatureBuffer);
}

export const config = {
    // Keep the request stream untouched so Meta signature validation uses the exact bytes sent.
    api: { bodyParser: false }
};

function getSupabase() {
    return createClient(
        process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY,
        { auth: { persistSession: false } }
    );
}

async function getRawBody(req) {
    const chunks = [];
    for await (const chunk of req) {
        chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    }
    return Buffer.concat(chunks);
}

export default async function handler(req, res) {
    // Webhook verification
    if (req.method === 'GET') {
        const mode = req.query['hub.mode'];
        const token = req.query['hub.verify_token'];
        const challenge = req.query['hub.challenge'];
        const verifyToken = process.env.WEBHOOK_VERIFY_TOKEN;

        // Fail closed: never accept a hardcoded/default token.
        if (verifyToken && mode === 'subscribe' && token === verifyToken) {
            return res.status(200).send(challenge);
        }
        return res.status(403).json({ error: 'Forbidden' });
    }

    if (req.method === 'POST') {
        let rawBody;
        try {
            rawBody = await getRawBody(req);
        } catch (error) {
            console.error('[Webhook] Failed to read raw body:', error?.message || error);
            return res.status(400).send('Bad Request');
        }

        // Verify Meta's signature over the exact raw bytes before trusting any payload.
        // Fail closed: forged or unsigned requests are rejected.
        const signature = req.headers['x-hub-signature-256'];
        if (!isValidMetaSignature(rawBody, signature, process.env.META_APP_SECRET)) {
            console.warn('[Webhook] Rejected: invalid or missing X-Hub-Signature-256');
            return res.status(401).json({ error: 'Invalid signature' });
        }

        let body;
        try { body = JSON.parse(rawBody.toString('utf8')); } catch { return res.status(400).send('Bad Request'); }

        if (body.object === 'instagram') {
            const supabase = getSupabase();
            for (const entry of body.entry || []) {
                const changes = entry.changes || [];
                if (!changes.length && entry.field === 'comments' && entry.value) {
                    await processComment(supabase, entry.value, entry.id);
                    continue;
                }
                for (const change of changes) {
                    if (change.field === 'comments') {
                        await processComment(supabase, change.value, entry.id);
                    }
                }
            }
        }

        return res.status(200).send('EVENT_RECEIVED');
    }
    res.status(405).end();
}

async function processComment(supabase, commentValue, igAccountId) {
    console.log('[processComment] entry.id (igAccountId param):', igAccountId);

    // BUG FIX: entry.id in Meta webhooks is the commenter's user ID, NOT your business account ID.
    // First try to match by stored instagram_account_id, then fall back to any connected account.
    let { data: settingsRows } = await supabase
        .from('user_settings')
        .select('*')
        .eq('instagram_account_id', igAccountId)
        .not('page_access_token', 'is', null);

    console.log('[processComment] rows by account ID match:', settingsRows?.length ?? 0);

    if (!settingsRows || settingsRows.length === 0) {
        // Fallback: grab any account that has a token (works for single-user setup)
        const { data: fallbackRows } = await supabase
            .from('user_settings')
            .select('*')
            .not('page_access_token', 'is', null)
            .not('instagram_account_id', 'is', null);
        settingsRows = fallbackRows;
        console.log('[processComment] fallback rows (any connected):', settingsRows?.length ?? 0);
    }
    const settings = settingsRows[0];
    if (!settings) {
        console.warn('[processComment] No connected Instagram settings found');
        return;
    }
    console.log('[processComment] Using account:', settings.instagram_account_id);

    if (!settings.bot_enabled) {
        console.log('[processComment] Bot is disabled');
        return;
    }

    const commentId = commentValue.comment_id || commentValue.id;
    const commentText = (commentValue.text || '').toLowerCase();
    const username = commentValue.from?.username || 'unknown';

    console.log(`[processComment] Processing comment id=${commentId}`);

    if (!commentId || !commentText) return;

    const { data: triggers } = await supabase.from('triggers').select('*')
        .eq('user_id', settings.user_id).eq('enabled', true);

    console.log('[processComment] Active triggers:', (triggers || []).map(t => `"${t.keyword}"`).join(', ') || 'NONE');

    for (const trigger of triggers || []) {
        if (!commentText.includes(trigger.keyword.toLowerCase())) continue;

        console.log(`[processComment] ✅ Matched trigger "${trigger.keyword}"`);
        const limitStatus = await getAutomationLimitStatus(supabase, settings);
        if (limitStatus.blocked) {
            await supabase.from('activity_log').insert({
                user_id: settings.user_id,
                username: `@${username}`,
                keyword: trigger.keyword,
                trigger_keyword: trigger.keyword,
                status: limitStatus.reason,
            });
            console.warn(`[processComment] Blocked by plan limit: ${limitStatus.reason}`);
            return;
        }

        const dmSuccess = await sendPrivateReply(settings, commentId, trigger.reply_message);

        if (dmSuccess) {
            await supabase.from('user_settings').update({
                total_dms_sent: (settings.total_dms_sent || 0) + 1,
                total_links_sent: (settings.total_links_sent || 0) + 1,
                dms_sent_today: (settings.dms_sent_today || 0) + 1,
            }).eq('user_id', settings.user_id);

            await supabase.from('activity_log').insert({
                user_id: settings.user_id, username: `@${username}`,
                keyword: trigger.keyword, trigger_keyword: trigger.keyword, status: 'sent',
            });

            if (settings.success_public_reply) {
                await sendPublicReply(settings, commentId, settings.success_public_reply);
                await supabase.from('user_settings').update({
                    total_public_replies: (settings.total_public_replies || 0) + 1
                }).eq('user_id', settings.user_id);
            }
        } else {
            await supabase.from('user_settings').update({
                failed_dms: (settings.failed_dms || 0) + 1
            }).eq('user_id', settings.user_id);

            await supabase.from('activity_log').insert({
                user_id: settings.user_id, username: `@${username}`,
                keyword: trigger.keyword, trigger_keyword: trigger.keyword, status: 'failed_dms_closed',
            });

            if (settings.fallback_public_reply) {
                await sendPublicReply(settings, commentId, settings.fallback_public_reply);
            }
        }
        break;
    }
}

async function getAutomationLimitStatus(supabase, settings) {
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

async function sendPrivateReply(settings, commentId, message) {
    if (!settings.page_access_token || !settings.instagram_account_id) {
        console.warn('[sendPrivateReply] Missing token or account ID');
        return false;
    }
    try {
        const res = await axios.post(
            `https://graph.facebook.com/${API_VERSION}/${settings.instagram_account_id}/messages`,
            { recipient: { comment_id: commentId }, message: { text: message } },
            { headers: { 'Authorization': `Bearer ${settings.page_access_token}`, 'Content-Type': 'application/json' } }
        );
        console.log('[sendPrivateReply] ✅ DM sent:', res.data.message_id);
        return true;
    } catch (err) {
        const e = err.response?.data?.error || {};
        console.error(`[sendPrivateReply] ❌ Failed [${e.code}/${e.error_subcode}]: ${e.message || err.message}`);
        return false;
    }
}

async function sendPublicReply(settings, commentId, message) {
    if (!settings.page_access_token) return false;
    try {
        await axios.post(
            `https://graph.facebook.com/${API_VERSION}/${commentId}/replies`,
            { message },
            { headers: { 'Authorization': `Bearer ${settings.page_access_token}`, 'Content-Type': 'application/json' } }
        );
        console.log('[sendPublicReply] ✅ Public reply sent');
        return true;
    } catch (err) {
        console.error('[sendPublicReply] ❌ Failed:', err.response?.data?.error?.message || err.message);
        return false;
    }
}
