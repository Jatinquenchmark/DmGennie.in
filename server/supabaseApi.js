import { createClient } from '@supabase/supabase-js';

export const supabase = createClient(
    process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { persistSession: false } }
);

export async function getUserId(req) {
    const user = await getUser(req);
    return user?.id || null;
}

export async function getUser(req) {
    const auth = req.headers.authorization || req.headers.Authorization;
    if (!auth || !auth.startsWith('Bearer ')) return null;
    const token = auth.split(' ')[1];
    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error || !user) return null;
    return user;
}

export async function getUserRole(userId, user) {
    const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .single();

    if (data?.role) return data.role;

    const appRole = user?.app_metadata?.role;
    if (appRole === 'admin' || appRole === 'user') return appRole;

    if (!error || error.code === 'PGRST116') {
        await supabase.from('user_roles').upsert({ user_id: userId, role: 'user', updated_at: new Date().toISOString() });
    }

    return 'user';
}

export async function requireAdmin(req, res) {
    const user = await getUser(req);
    if (!user) {
        res.status(401).json({ error: 'Unauthorized' });
        return null;
    }

    const role = await getUserRole(user.id, user);
    if (role !== 'admin') {
        res.status(403).json({ error: 'Access denied' });
        return null;
    }

    return { user, role };
}

export async function ensureSettings(userId) {
    const { data } = await supabase
        .from('user_settings')
        .select('*')
        .eq('user_id', userId)
        .single();
    if (data) return data;
    const { data: created } = await supabase
        .from('user_settings')
        .insert({ user_id: userId, subscription_plan: 'starter', subscription_status: 'inactive' })
        .select()
        .single();
    return created;
}

export function cors(res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
}
