import { supabase, getUser, ensureSettings, cors } from '../_supabase.js';
import { buildDashboardMetrics } from '../../server/dashboardMetrics.js';

export default async function handler(req, res) {
    cors(res);
    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

    const user = await getUser(req);
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    const settings = await ensureSettings(user.id);
    const payload = await buildDashboardMetrics({ supabase, userId: user.id, user, settings });

    return res.json(payload);
}
