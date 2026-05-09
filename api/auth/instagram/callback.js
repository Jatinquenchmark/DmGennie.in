import axios from 'axios';
import { supabase, cors } from '../../_supabase.js';

export default async function handler(req, res) {
    cors(res);
    if (req.method === 'OPTIONS') return res.status(200).end();

    const { code, state, error } = req.query;
    const FRONTEND_URL = process.env.FRONTEND_URL || 'https://www.dmgennie.in';

    if (error) return res.redirect(`${FRONTEND_URL}/dashboard?instagram=error&reason=${error}`);
    if (!code || !state) return res.redirect(`${FRONTEND_URL}/dashboard?instagram=error&reason=missing_params`);

    let userId;
    try {
        const decoded = JSON.parse(Buffer.from(state, 'base64').toString());
    } catch {
        return res.redirect(`${FRONTEND_URL}/dashboard?instagram=error&reason=invalid_state`);
    }

    const appId = process.env.META_APP_ID;
    const appSecret = process.env.META_APP_SECRET;
    const redirectUri = process.env.META_REDIRECT_URI;

    try {
        const tokenRes = await axios.get('https://graph.facebook.com/v25.0/oauth/access_token', {
            params: { client_id: appId, client_secret: appSecret, redirect_uri: redirectUri, code }
        });
        const shortToken = tokenRes.data.access_token;

        const longTokenRes = await axios.get('https://graph.facebook.com/v25.0/oauth/access_token', {
            params: { grant_type: 'fb_exchange_token', client_id: appId, client_secret: appSecret, fb_exchange_token: shortToken }
        });
        const longToken = longTokenRes.data.access_token;

        const pagesRes = await axios.get('https://graph.facebook.com/v25.0/me/accounts', {
            params: { access_token: longToken, fields: 'id,name,access_token,instagram_business_account' }
        });

        const pages = pagesRes.data.data || [];
        let igAccountId = null, pageAccessToken = null, igHandle = null;

        for (const page of pages) {
            if (page.instagram_business_account) {
                igAccountId = page.instagram_business_account.id;
                pageAccessToken = page.access_token;
                try {
                    const igProfile = await axios.get(`https://graph.facebook.com/v25.0/${igAccountId}`, {
                        params: { fields: 'username,name', access_token: pageAccessToken }
                    });
                    igHandle = '@' + igProfile.data.username;
                } catch { }
                break;
            }
        }

        if (!igAccountId || !pageAccessToken) {
            return res.redirect(`${FRONTEND_URL}/dashboard?instagram=error&reason=no_ig_account`);
        }

        await supabase.from('user_settings').update({
            page_access_token: pageAccessToken,
            instagram_account_id: igAccountId,
            instagram_handle: igHandle || '',
            app_secret: appSecret,
            updated_at: new Date().toISOString(),
        }).eq('user_id', userId);

        return res.redirect(`${FRONTEND_URL}/dashboard?instagram=connected&handle=${encodeURIComponent(igHandle || igAccountId)}`);
    } catch (err) {
        console.error('OAuth error:', err.response?.data || err.message);
        return res.redirect(`${FRONTEND_URL}/dashboard?instagram=error&reason=token_exchange_failed`);
    }
}
