import { supabase, requireAdmin, cors } from '../server/supabaseApi.js';
import { formatNumber, listAuthUsers, userDisplayName, userPlan, userRole } from '../server/adminUtils.js';

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

async function overviewHandler(_req, res) {
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
        recentSignups: users
            .slice()
            .sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime())
            .slice(0, 8)
            .map((user) => ({
                id: user.id,
                email: user.email,
                name: userDisplayName(user),
                createdAt: user.created_at,
                plan: user.app_metadata?.plan || 'Starter',
            })),
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
}

async function usersHandler(req, res) {
    if (req.method === 'GET') {
        const [users, settingsResult, rolesResult] = await Promise.all([
            listAuthUsers(supabase),
            supabase.from('user_settings').select('*'),
            supabase.from('user_roles').select('*'),
        ]);
        const query = String(req.query.search || '').trim().toLowerCase();
        const settingsByUser = new Map((settingsResult.data || []).map((row) => [row.user_id, row]));
        const roles = rolesResult.data || [];
        return res.json({
            users: users
                .map((user) => mapUser(user, settingsByUser, roles))
                .filter((user) => !query || `${user.name} ${user.email} ${user.instagramHandle}`.toLowerCase().includes(query)),
        });
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
}

async function automationsHandler(req, res) {
    if (req.method === 'GET') {
        const [users, triggersResult, activityResult] = await Promise.all([
            listAuthUsers(supabase),
            supabase.from('triggers').select('*').order('created_at', { ascending: false }),
            supabase.from('activity_log').select('user_id,trigger_keyword,status'),
        ]);
        const userById = new Map(users.map((user) => [user.id, user]));
        const activity = activityResult.data || [];
        return res.json({
            automations: (triggersResult.data || []).map((trigger) => {
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
            }),
        });
    }

    if (req.method === 'PUT') {
        const { id, enabled } = req.body || {};
        if (!id || typeof enabled !== 'boolean') return res.status(400).json({ error: 'Missing automation update.' });
        const { error } = await supabase.from('triggers').update({ enabled }).eq('id', id);
        if (error) throw error;
        return res.json({ success: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });
}

async function contactsHandler(_req, res) {
    const [users, activityResult] = await Promise.all([
        listAuthUsers(supabase),
        supabase.from('activity_log').select('*').order('created_at', { ascending: false }).limit(1000),
    ]);
    const userById = new Map(users.map((user) => [user.id, user]));
    return res.json({
        contacts: (activityResult.data || []).map((item) => {
            const owner = userById.get(item.user_id);
            return {
                id: item.id,
                ownerId: item.user_id,
                ownerEmail: owner?.email || 'Unknown user',
                ownerName: owner ? userDisplayName(owner) : 'Unknown user',
                instagramUser: item.username || 'Unknown Instagram user',
                email: 'No email captured',
                source: item.trigger_keyword ? `Keyword: ${item.trigger_keyword}` : 'Unknown source',
                keyword: item.keyword || item.trigger_keyword || 'Unknown',
                status: item.status || 'Unknown',
                joinedAt: item.created_at,
            };
        }),
    });
}

export default async function handler(req, res) {
    cors(res);
    if (req.method === 'OPTIONS') return res.status(200).end();

    const admin = await requireAdmin(req, res);
    if (!admin) return;

    const action = String(req.query.action || 'overview');
    try {
        if (action === 'overview') return overviewHandler(req, res);
        if (action === 'users') return usersHandler(req, res);
        if (action === 'automations') return automationsHandler(req, res);
        if (action === 'contacts') return contactsHandler(req, res);
        return res.status(400).json({ error: 'Unsupported admin action.' });
    } catch (error) {
        console.error('[admin] Request failed:', error?.message || error);
        return res.status(500).json({ error: 'Unable to load admin data.' });
    }
}
