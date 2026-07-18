import { supabase, cors, getUser, ensureSettings } from '../server/supabaseApi.js';
import { buildContactsPayload } from '../server/contactsData.js';
import { isProUser, proRequiredPayload } from '../server/billingConfig.js';

function csvEscape(value) {
    let text = String(value ?? '');
    // Prevent CSV formula/DDE injection: a leading =, +, -, @, tab or CR makes
    // spreadsheets execute the cell. Prefix a single quote to neutralize it.
    if (/^[=+\-@\t\r]/.test(text)) {
        text = `'${text}`;
    }
    return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

function buildContactsCsv(contacts) {
    const headers = ['Name', 'Username', 'Email', 'Source', 'Relationship', 'Last Interaction', 'Joined Date'];
    const body = contacts.map((contact) => [
        contact.name,
        contact.username,
        contact.email,
        contact.source,
        contact.relationship,
        contact.lastInteractionLabel || contact.lastInteraction,
        contact.joined,
    ].map(csvEscape).join(','));
    return [headers.join(','), ...body].join('\n');
}

export default async function handler(req, res) {
    cors(req, res);
    if (req.method === 'OPTIONS') return res.status(200).end();
    const action = String(req.query.action || 'list');
    if (!['list', 'metrics', 'refresh', 'export'].includes(action)) return res.status(400).json({ error: 'Unsupported contacts action.' });
    if ((action === 'refresh' && req.method !== 'POST') || (action !== 'refresh' && req.method !== 'GET')) {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const user = await getUser(req);
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    try {
        const payload = await buildContactsPayload({ supabase, userId: user.id });
        if (action === 'metrics') return res.json({ metrics: payload.metrics });
        if (action === 'export') {
            await ensureSettings(user.id);
            if (!(await isProUser(supabase, user.id, user))) {
                return res.status(403).json(proRequiredPayload('Upgrade to Pro to export contacts.'));
            }
            res.setHeader('Content-Type', 'text/csv; charset=utf-8');
            res.setHeader('Content-Disposition', 'attachment; filename="dmgennie-contacts.csv"');
            return res.send(buildContactsCsv(payload.contacts));
        }
        return res.json(payload);
    } catch (error) {
        console.error('[contacts] Unable to load contacts:', error?.message || error);
        return res.status(500).json({ error: 'Unable to load contacts.' });
    }
}
