import { supabase, requireAdmin, cors } from '../_supabase.js';
import { listAuthUsers, userDisplayName } from '../../server/adminUtils.js';

export default async function handler(req, res) {
    cors(res);
    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

    const admin = await requireAdmin(req, res);
    if (!admin) return;

    try {
        const [users, activityResult] = await Promise.all([
            listAuthUsers(supabase),
            supabase.from('activity_log').select('*').order('created_at', { ascending: false }).limit(1000),
        ]);

        const userById = new Map(users.map((user) => [user.id, user]));
        const contacts = (activityResult.data || []).map((item) => {
            const owner = userById.get(item.user_id);
            return {
                id: item.id,
                ownerId: item.user_id,
                ownerEmail: owner?.email || 'Unknown user',
                ownerName: owner ? userDisplayName(owner) : 'Unknown user',
                instagramUser: item.username || 'Unknown Instagram user',
                email: 'No email captured',
                source: item.trigger_keyword ? `Auto DM for "${item.trigger_keyword}"` : 'Unknown source',
                keyword: item.keyword || item.trigger_keyword || 'Unknown',
                status: item.status || 'Unknown',
                joinedAt: item.created_at,
            };
        });

        return res.json({ contacts });
    } catch (error) {
        return res.status(500).json({ error: 'Unable to load admin contacts.' });
    }
}
