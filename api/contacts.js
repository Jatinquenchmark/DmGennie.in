import { supabase, cors, getUser } from './_supabase.js';
import { buildContactsPayload } from '../server/contactsData.js';

export default async function handler(req, res) {
    cors(res);
    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

    const user = await getUser(req);
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    try {
        const payload = await buildContactsPayload({ supabase, userId: user.id });
        return res.json(payload);
    } catch (error) {
        console.error('[contacts] Unable to load contacts:', error?.message || error);
        return res.status(500).json({ error: 'Unable to load contacts.' });
    }
}
