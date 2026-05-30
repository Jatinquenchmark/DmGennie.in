import { supabase, getUser, ensureSettings, cors } from '../server/supabaseApi.js';
import { buildDashboardMetrics } from '../server/dashboardMetrics.js';

export default async function handler(req, res) {
    cors(req, res);
    if (req.method === 'OPTIONS') return res.status(200).end();

    const user = await getUser(req);
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    const action = String(req.query.action || 'dashboard');
    if (action !== 'dashboard' && action !== 'metrics') return res.status(400).json({ error: 'Unsupported dashboard action.' });

    const settings = await ensureSettings(user.id);
    const payload = await buildDashboardMetrics({ supabase, userId: user.id, user, settings });
    res.json(payload);
}
