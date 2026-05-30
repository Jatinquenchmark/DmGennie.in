import { supabase, getUser, ensureSettings, cors } from '../server/supabaseApi.js';
import { getSubscriptionState, isProUser, proRequiredPayload } from '../server/billingConfig.js';

function requestedProFeature(body = {}) {
    const value = String(body.feature || body.template || body.type || body.triggerType || body.automationType || '').toLowerCase();
    if (value.includes('retrigger') || value.includes('re-trigger')) return 'reTrigger';
    if (value.includes('askforfollow') || value.includes('ask for follow') || value.includes('follow')) return 'askForFollow';
    if (value.includes('grow')) return 'growFollowers';
    if (value.includes('lead')) return 'leadGen';
    if (value.includes('autoreply') || value.includes('auto-reply') || value.includes('auto reply') || value.includes('dm keyword') || value.includes('inbox')) return 'autoReply';
    return null;
}

export default async function handler(req, res) {
    cors(res);
    if (req.method === 'OPTIONS') return res.status(200).end();

    const user = await getUser(req);
    if (!user) return res.status(401).json({ error: 'Unauthorized' });
    const userId = user.id;

    if (req.method === 'GET') {
        const { data } = await supabase.from('triggers').select('*').eq('user_id', userId).order('created_at', { ascending: true });
        return res.json((data || []).map(t => ({ id: t.id, keyword: t.keyword, replyMessage: t.reply_message, enabled: t.enabled })));
    }

    if (req.method === 'POST') {
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

        const { data, error } = await supabase.from('triggers')
            .insert({
                user_id: userId,
                keyword: req.body.keyword || '',
                reply_message: req.body.replyMessage || '',
                trigger_type: req.body.triggerType || req.body.automationType || null,
            })
            .select().single();
        if (error) return res.status(500).json({ error: error.message });
        return res.json({ id: data.id, keyword: data.keyword, replyMessage: data.reply_message, enabled: data.enabled });
    }

    if (req.method === 'PUT') {
        const { id } = req.query;
        if (!id) return res.status(400).json({ error: 'Missing trigger id.' });
        const updates = {};
        if (req.body.keyword !== undefined) updates.keyword = req.body.keyword;
        if (req.body.replyMessage !== undefined) updates.reply_message = req.body.replyMessage;
        if (req.body.enabled !== undefined) updates.enabled = req.body.enabled;
        const { data, error } = await supabase.from('triggers').update(updates).eq('id', id).eq('user_id', userId).select().single();
        if (error) return res.status(500).json({ error: error.message });
        return res.json({ id: data.id, keyword: data.keyword, replyMessage: data.reply_message, enabled: data.enabled });
    }

    if (req.method === 'DELETE') {
        const { id } = req.query;
        if (!id) return res.status(400).json({ error: 'Missing trigger id.' });
        await supabase.from('triggers').delete().eq('id', id).eq('user_id', userId);
        return res.json({ success: true });
    }

    res.status(405).json({ error: 'Method not allowed' });
}
