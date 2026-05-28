import { supabase, requireAdmin, cors } from '../_supabase.js';
import { formatNumber, listAuthUsers, userDisplayName } from '../../server/adminUtils.js';

export default async function handler(req, res) {
    cors(res);
    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

    const admin = await requireAdmin(req, res);
    if (!admin) return;

    try {
        const [users, settingsResult, triggersResult, activityResult] = await Promise.all([
            listAuthUsers(supabase),
            supabase.from('user_settings').select('*'),
            supabase.from('triggers').select('*'),
            supabase.from('activity_log').select('*').order('created_at', { ascending: false }).limit(25),
        ]);

        const settings = settingsResult.data || [];
        const triggers = triggersResult.data || [];
        const activity = activityResult.data || [];
        const activeUsers = settings.filter((row) => row.page_access_token && row.instagram_account_id).length;

        const totals = settings.reduce((acc, row) => ({
            dms: acc.dms + formatNumber(row.total_dms_sent),
            contacts: acc.contacts + formatNumber(row.total_links_sent),
            failed: acc.failed + formatNumber(row.failed_dms),
        }), { dms: 0, contacts: 0, failed: 0 });

        const userById = new Map(users.map((user) => [user.id, user]));
        const recentSignups = users
            .slice()
            .sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime())
            .slice(0, 8)
            .map((user) => ({
                id: user.id,
                email: user.email,
                name: userDisplayName(user),
                createdAt: user.created_at,
                plan: user.app_metadata?.plan || 'Starter',
            }));

        return res.json({
            metrics: {
                totalUsers: users.length,
                activeUsers,
                totalAutomations: triggers.length,
                totalDmsSent: totals.dms,
                totalContacts: totals.contacts,
                failedMessages: totals.failed,
                revenue: 0,
            },
            recentSignups,
            recentActivity: activity.map((item) => {
                const owner = userById.get(item.user_id);
                return {
                    id: item.id,
                    ownerEmail: owner?.email || 'Unknown user',
                    user: item.username || 'Unknown Instagram user',
                    keyword: item.keyword || item.trigger_keyword || 'Unknown',
                    status: item.status || 'Unknown',
                    createdAt: item.created_at,
                };
            }),
        });
    } catch (error) {
        return res.status(500).json({ error: 'Unable to load admin overview.' });
    }
}
