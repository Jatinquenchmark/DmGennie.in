import { supabase, requireAdmin, cors } from '../_supabase.js';
import { listAuthUsers, userDisplayName } from '../../server/adminUtils.js';

export default async function handler(req, res) {
    cors(res);
    if (req.method === 'OPTIONS') return res.status(200).end();

    const admin = await requireAdmin(req, res);
    if (!admin) return;

    try {
        if (req.method === 'GET') {
            const [users, triggersResult, activityResult] = await Promise.all([
                listAuthUsers(supabase),
                supabase.from('triggers').select('*').order('created_at', { ascending: false }),
                supabase.from('activity_log').select('user_id,trigger_keyword,status'),
            ]);

            const userById = new Map(users.map((user) => [user.id, user]));
            const activity = activityResult.data || [];

            const automations = (triggersResult.data || []).map((trigger) => {
                const owner = userById.get(trigger.user_id);
                const triggerActivity = activity.filter((item) => item.user_id === trigger.user_id && item.trigger_keyword === trigger.keyword);
                return {
                    id: trigger.id,
                    ownerId: trigger.user_id,
                    ownerEmail: owner?.email || 'Unknown user',
                    ownerName: owner ? userDisplayName(owner) : 'Unknown user',
                    keyword: trigger.keyword || 'Unknown',
                    replyMessage: trigger.reply_message || '',
                    status: trigger.enabled ? 'Live' : 'Paused',
                    dmsSent: triggerActivity.filter((item) => item.status === 'sent').length,
                    failed: triggerActivity.filter((item) => item.status !== 'sent').length,
                    createdAt: trigger.created_at,
                    updatedAt: trigger.updated_at || trigger.created_at,
                };
            });

            return res.json({ automations });
        }

        if (req.method === 'PUT') {
            const { id, enabled } = req.body || {};
            if (!id || typeof enabled !== 'boolean') return res.status(400).json({ error: 'Missing automation update.' });
            const { error } = await supabase.from('triggers').update({ enabled }).eq('id', id);
            if (error) throw error;
            return res.json({ success: true });
        }

        return res.status(405).json({ error: 'Method not allowed' });
    } catch (error) {
        return res.status(500).json({ error: 'Unable to load admin automations.' });
    }
}
