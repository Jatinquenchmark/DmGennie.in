import { supabase, getUserId, cors } from '../server/supabaseApi.js';

export default async function handler(req, res) {
    cors(res);
    if (req.method === 'OPTIONS') return res.status(200).end();

    const userId = await getUserId(req);
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    if (req.method === 'GET') {
        const { data } = await supabase.from('triggers').select('*').eq('user_id', userId).order('created_at', { ascending: true });
        return res.json((data || []).map(t => ({ id: t.id, keyword: t.keyword, replyMessage: t.reply_message, enabled: t.enabled })));
    }

    if (req.method === 'POST') {
        const { data, error } = await supabase.from('triggers')
            .insert({ user_id: userId, keyword: req.body.keyword || '', reply_message: req.body.replyMessage || '' })
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
