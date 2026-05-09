import { supabase, getUserId, ensureSettings, cors } from './_supabase.js';

export default async function handler(req, res) {
    cors(res);
    if (req.method === 'OPTIONS') return res.status(200).end();

    const userId = await getUserId(req);
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const settings = await ensureSettings(userId);

    const { data: triggers } = await supabase
        .from('triggers').select('*').eq('user_id', userId).order('created_at', { ascending: true });

    const { data: activityLog } = await supabase
        .from('activity_log').select('*').eq('user_id', userId)
        .order('created_at', { ascending: false }).limit(50);

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
        triggers: (triggers || []).map(t => ({ id: t.id, keyword: t.keyword, replyMessage: t.reply_message, enabled: t.enabled })),
        activityLog: (activityLog || []).map(a => ({ id: a.id, user: a.username, keyword: a.keyword, trigger: a.trigger_keyword, status: a.status, time: a.created_at })),
    });
}
