import { cors } from '../server/supabaseApi.js';

// Lightweight endpoint that reports the requester's country, derived from the
// hosting edge's geo headers. Used by the client to detect a major network/location
// change (a security signal) and end the session. No auth required — returns no
// sensitive data, only a 2-letter country code.
export default function handler(req, res) {
    cors(req, res);
    if (req.method === 'OPTIONS') return res.status(200).end();

    const country = req.headers['x-vercel-ip-country']
        || req.headers['cf-ipcountry']
        || req.headers['x-country-code']
        || 'unknown';

    return res.json({ country: String(country).toUpperCase() });
}
