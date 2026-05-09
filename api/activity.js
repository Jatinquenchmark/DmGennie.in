import { supabase, getUserId, cors } from './_supabase.js';

export default async function handler(req, res) {
    cors(res);
    if (req.method === 'OPTIONS') return res.status(200).end();

    const userId = await getUserId(req);
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const { data } = await supabase.from('activity_log').select('*').eq('user_id', userId)
        .order('created_at', { ascending: false }).limit(200);

    res.json((data || []).map(a => ({ id: a.id, user: a.username, keyword: a.keyword, trigger: a.trigger_keyword, status: a.status, time: a.created_at })));
}
