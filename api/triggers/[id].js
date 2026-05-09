import { supabase, getUserId, cors } from './_supabase.js';

export default async function handler(req, res) {
    cors(res);
    if (req.method === 'OPTIONS') return res.status(200).end();

    const userId = await getUserId(req);
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const { id } = req.query;

    if (req.method === 'PUT') {
        const updates = {};
        if (req.body.keyword !== undefined) updates.keyword = req.body.keyword;
        if (req.body.replyMessage !== undefined) updates.reply_message = req.body.replyMessage;
        if (req.body.enabled !== undefined) updates.enabled = req.body.enabled;
        const { data, error } = await supabase.from('triggers').update(updates).eq('id', id).eq('user_id', userId).select().single();
        if (error) return res.status(500).json({ error: error.message });
        return res.json({ id: data.id, keyword: data.keyword, replyMessage: data.reply_message, enabled: data.enabled });
    }

    if (req.method === 'DELETE') {
        await supabase.from('triggers').delete().eq('id', id).eq('user_id', userId);
        return res.json({ success: true });
    }

    res.status(405).json({ error: 'Method not allowed' });
}
