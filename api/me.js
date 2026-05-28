import { getUser, getUserRole, cors } from './_supabase.js';

export default async function handler(req, res) {
    cors(res);
    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

    const user = await getUser(req);
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    const role = await getUserRole(user.id, user);

    return res.json({
        id: user.id,
        email: user.email,
        name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Creator',
        role,
    });
}
