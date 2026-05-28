import { supabase, requireAdmin, cors } from '../_supabase.js';
import { listAuthUsers, userDisplayName, userPlan, userRole } from '../../server/adminUtils.js';

function mapUser(user, settingsByUser, roles) {
    const settings = settingsByUser.get(user.id) || {};
    return {
        id: user.id,
        email: user.email,
        name: userDisplayName(user),
        role: userRole(user, roles),
        plan: userPlan(user),
        suspended: Boolean(user.banned_until && new Date(user.banned_until) > new Date()),
        connectedInstagram: Boolean(settings.page_access_token && settings.instagram_account_id),
        instagramHandle: settings.instagram_handle || 'Instagram not connected',
        dmsSent: settings.total_dms_sent || 0,
        contacts: settings.total_links_sent || 0,
        introOfferUsed: Boolean(settings.has_used_pro_intro_offer || user.app_metadata?.has_used_pro_intro_offer),
        proIntroStartedAt: settings.pro_intro_started_at || user.app_metadata?.pro_intro_started_at || null,
        subscriptionStatus: settings.subscription_status || user.app_metadata?.subscription_status || 'free',
        createdAt: user.created_at,
        lastSignInAt: user.last_sign_in_at,
    };
}

export default async function handler(req, res) {
    cors(res);
    if (req.method === 'OPTIONS') return res.status(200).end();

    const admin = await requireAdmin(req, res);
    if (!admin) return;

    try {
        if (req.method === 'GET') {
            const [users, settingsResult, rolesResult] = await Promise.all([
                listAuthUsers(supabase),
                supabase.from('user_settings').select('*'),
                supabase.from('user_roles').select('*'),
            ]);

            const query = String(req.query.search || '').trim().toLowerCase();
            const settingsByUser = new Map((settingsResult.data || []).map((row) => [row.user_id, row]));
            const roles = rolesResult.data || [];

            const rows = users
                .map((user) => mapUser(user, settingsByUser, roles))
                .filter((user) => !query || `${user.name} ${user.email} ${user.instagramHandle}`.toLowerCase().includes(query));

            return res.json({ users: rows });
        }

        if (req.method === 'PUT') {
            const { userId, action, plan } = req.body || {};
            if (!userId || !action) return res.status(400).json({ error: 'Missing user action.' });

            if (action === 'suspend') {
                const { error } = await supabase.auth.admin.updateUserById(userId, { banned_until: '2999-12-31T23:59:59.000Z' });
                if (error) throw error;
                return res.json({ success: true });
            }

            if (action === 'activate') {
                const { error } = await supabase.auth.admin.updateUserById(userId, { banned_until: null });
                if (error) throw error;
                return res.json({ success: true });
            }

            if (action === 'plan') {
                const safePlan = String(plan || 'Starter').slice(0, 40);
                const { data: { user }, error: userError } = await supabase.auth.admin.getUserById(userId);
                if (userError) throw userError;
                const { error } = await supabase.auth.admin.updateUserById(userId, {
                    app_metadata: { ...(user?.app_metadata || {}), plan: safePlan },
                });
                if (error) throw error;
                return res.json({ success: true });
            }

            return res.status(400).json({ error: 'Unsupported admin action.' });
        }

        return res.status(405).json({ error: 'Method not allowed' });
    } catch (error) {
        return res.status(500).json({ error: 'Unable to update admin users.' });
    }
}
