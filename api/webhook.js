import crypto from 'crypto';
import axios from 'axios';
import { createClient } from '@supabase/supabase-js';

const API_VERSION = 'v25.0';

export const config = {
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
    return new Promise((resolve, reject) => {
        const chunks = [];
        req.on('data', chunk => chunks.push(chunk));
        req.on('end', () => resolve(Buffer.concat(chunks)));
        req.on('error', reject);
    });
}

export default async function handler(req, res) {
    // Webhook verification — no Supabase needed
    if (req.method === 'GET') {
        const mode = req.query['hub.mode'];
        const token = req.query['hub.verify_token'];
        const challenge = req.query['hub.challenge'];
        const verifyToken = process.env.WEBHOOK_VERIFY_TOKEN || 'dmgenie_verify_token_123';

        if (mode === 'subscribe' && token === verifyToken) {
            return res.status(200).send(challenge);
        }
        return res.status(403).json({ error: 'Forbidden', received: token });
    }

    if (req.method === 'POST') {
        const rawBody = await getRawBody(req);
        const signature = req.headers['x-hub-signature-256'];

        let body;
        try { body = JSON.parse(rawBody.toString()); } catch { return res.status(400).end(); }

        res.status(200).send('EVENT_RECEIVED');

        if (body.object !== 'instagram') return;

        const supabase = getSupabase();

        for (const entry of body.entry || []) {
            const changes = entry.changes || [];
            if (!changes.length && entry.field === 'comments') {
                await processComment(supabase, entry.value, entry.id, signature, rawBody);
                continue;
            }
            for (const change of changes) {
                if (change.field === 'comments') {
                    await processComment(supabase, change.value, entry.id, signature, rawBody);
                }
            }
        }
        return;
    }

    res.status(405).end();
}

async function processComment(supabase, commentValue, igAccountId, signature, rawBody) {
    const { data: settingsRows } = await supabase
        .from('user_settings').select('*').eq('instagram_account_id', igAccountId);

    if (!settingsRows || settingsRows.length === 0) return;
    const settings = settingsRows[0];

    if (settings.app_secret && signature) {
        const expected = 'sha256=' + crypto.createHmac('sha256', settings.app_secret).update(rawBody).digest('hex');
        if (signature !== expected) return;
    }

    if (!settings.bot_enabled) return;

    const commentId = commentValue.comment_id || commentValue.id;
    const commentText = (commentValue.text || '').toLowerCase();
    const username = commentValue.from?.username || 'unknown';

    if (!commentId || !commentText) return;

    const { data: triggers } = await supabase.from('triggers').select('*')
        .eq('user_id', settings.user_id).eq('enabled', true);

    for (const trigger of triggers || []) {
        if (!commentText.includes(trigger.keyword.toLowerCase())) continue;

        const dmSuccess = await sendPrivateReply(settings, commentId, trigger.reply_message);

        if (dmSuccess) {
            await supabase.from('user_settings').update({
                total_dms_sent: settings.total_dms_sent + 1,
                total_links_sent: settings.total_links_sent + 1,
                dms_sent_today: settings.dms_sent_today + 1,
            }).eq('user_id', settings.user_id);

            await supabase.from('activity_log').insert({
                user_id: settings.user_id, username: `@${username}`,
                keyword: trigger.keyword, trigger_keyword: trigger.keyword, status: 'sent',
            });

            if (settings.success_public_reply) {
                await sendPublicReply(settings, commentId, settings.success_public_reply);
                await supabase.from('user_settings').update({
                    total_public_replies: settings.total_public_replies + 1
                }).eq('user_id', settings.user_id);
            }
        } else {
            await supabase.from('user_settings').update({
                failed_dms: settings.failed_dms + 1
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

async function sendPrivateReply(settings, commentId, message) {
    if (!settings.page_access_token || !settings.instagram_account_id) return false;
    try {
        await axios.post(
            `https://graph.instagram.com/${API_VERSION}/${settings.instagram_account_id}/messages`,
            { recipient: { comment_id: commentId }, message: { text: message } },
            { headers: { 'Authorization': `Bearer ${settings.page_access_token}`, 'Content-Type': 'application/json' } }
        );
        return true;
    } catch { return false; }
}

async function sendPublicReply(settings, commentId, message) {
    if (!settings.page_access_token) return false;
    try {
        await axios.post(
            `https://graph.instagram.com/${API_VERSION}/${commentId}/replies`,
            { message },
            { headers: { 'Authorization': `Bearer ${settings.page_access_token}`, 'Content-Type': 'application/json' } }
        );
        return true;
    } catch { return false; }
}
