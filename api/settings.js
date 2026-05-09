import { supabase, getUserId, ensureSettings, cors } from './_supabase.js';

export default async function handler(req, res) {
    cors(res);
    if (req.method === 'OPTIONS') return res.status(200).end();

    const userId = await getUserId(req);
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    if (req.method === 'GET') {
        const s = await ensureSettings(userId);
        return res.json({
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
    }

    if (req.method === 'PUT') {
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
        const { data } = await supabase.from('user_settings').update(updates).eq('user_id', userId).select().single();
        return res.json({
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
    }

    res.status(405).json({ error: 'Method not allowed' });
}
