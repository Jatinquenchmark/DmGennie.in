import { supabase, getUserId, cors } from './_supabase.js';

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

    res.status(405).json({ error: 'Method not allowed' });
}
