import crypto from 'crypto';
import axios from 'axios';
import { supabase, getUserId, ensureSettings, cors } from '../server/supabaseApi.js';

const API_VERSION = 'v25.0';
const INSTAGRAM_AUTH_LIMIT = 10;
const INSTAGRAM_AUTH_WINDOW_MS = 60 * 1000;
const instagramAuthHits = new Map();

function getClientIp(req) {
    const forwardedFor = req.headers['x-forwarded-for'];
    if (typeof forwardedFor === 'string' && forwardedFor.trim()) {
        return forwardedFor.split(',')[0].trim();
    }
    return req.headers['x-real-ip'] || req.socket?.remoteAddress || 'unknown';
}

function isInstagramAuthRateLimited(req) {
    const ip = getClientIp(req);
    const now = Date.now();
    const hit = instagramAuthHits.get(ip);

    if (!hit || now - hit.windowStartedAt >= INSTAGRAM_AUTH_WINDOW_MS) {
        instagramAuthHits.set(ip, { count: 1, windowStartedAt: now });
        return false;
    }

    hit.count += 1;
    instagramAuthHits.set(ip, hit);
    return hit.count > INSTAGRAM_AUTH_LIMIT;
}

function timingSafeEqualText(left, right) {
    const leftBuffer = Buffer.from(left);
    const rightBuffer = Buffer.from(right);
    return leftBuffer.length === rightBuffer.length && crypto.timingSafeEqual(leftBuffer, rightBuffer);
}

function getOAuthStateSecret() {
    return process.env.META_APP_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY;
}

function createOAuthState(userId) {
    const secret = getOAuthStateSecret();
    if (!secret) return null;

    const payload = {
        userId,
        expiresAt: Date.now() + 10 * 60 * 1000,
    };
    const encoded = Buffer.from(JSON.stringify(payload)).toString('base64url');
    const signature = crypto.createHmac('sha256', secret).update(encoded).digest('base64url');
    return `${encoded}.${signature}`;
}

function parseOAuthState(state) {
    const secret = getOAuthStateSecret();
    if (!secret || typeof state !== 'string') return null;

    const [encoded, signature] = state.split('.');
    if (!encoded || !signature) return null;

    const expected = crypto.createHmac('sha256', secret).update(encoded).digest('base64url');
    if (!timingSafeEqualText(signature, expected)) return null;

    try {
        const payload = JSON.parse(Buffer.from(encoded, 'base64url').toString());
        if (!payload.userId || !payload.expiresAt || payload.expiresAt < Date.now()) return null;
        return payload.userId;
    } catch {
        return null;
    }
}

async function instagramAuthHandler(req, res) {
    if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

    const userId = await getUserId(req);
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const appId = process.env.META_APP_ID;
    const redirectUri = process.env.META_REDIRECT_URI || `${process.env.APP_URL}/api/auth?action=callback`;
    const scopes = [
        'instagram_basic',
        'instagram_manage_comments',
        'instagram_manage_messages',
        'pages_show_list',
        'pages_read_engagement',
    ].join(',');
    const state = createOAuthState(userId);
    if (!state) return res.status(500).json({ error: 'Instagram connection is not configured.' });
    const authUrl = `https://www.facebook.com/dialog/oauth?client_id=${appId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${scopes}&state=${encodeURIComponent(state)}&response_type=code`;

    return res.json({ url: authUrl });
}

async function instagramCallbackHandler(req, res) {
    if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

    const { code, state, error } = req.query;
    const frontendUrl = process.env.FRONTEND_URL || 'https://www.dmgennie.in';
    if (error) return res.redirect(`${frontendUrl}/dashboard?instagram=error&reason=${encodeURIComponent(String(error))}`);
    if (!code || !state) return res.redirect(`${frontendUrl}/dashboard?instagram=error&reason=missing_params`);

    const userId = parseOAuthState(state);
    if (!userId) return res.redirect(`${frontendUrl}/dashboard?instagram=error&reason=invalid_state`);

    const appId = process.env.META_APP_ID;
    const appSecret = process.env.META_APP_SECRET;
    const redirectUri = process.env.META_REDIRECT_URI || `${process.env.APP_URL}/api/auth?action=callback`;

    try {
        const tokenRes = await axios.get(`https://graph.facebook.com/${API_VERSION}/oauth/access_token`, {
            params: { client_id: appId, client_secret: appSecret, redirect_uri: redirectUri, code },
        });
        const shortToken = tokenRes.data.access_token;

        const longTokenRes = await axios.get(`https://graph.facebook.com/${API_VERSION}/oauth/access_token`, {
            params: { grant_type: 'fb_exchange_token', client_id: appId, client_secret: appSecret, fb_exchange_token: shortToken },
        });
        const longToken = longTokenRes.data.access_token;

        const pagesRes = await axios.get(`https://graph.facebook.com/${API_VERSION}/me/accounts`, {
            params: { access_token: longToken, fields: 'id,name,access_token,instagram_business_account' },
        });

        const pages = pagesRes.data.data || [];
        let igAccountId = null;
        let pageAccessToken = null;
        let igHandle = null;

        for (const page of pages) {
            if (page.instagram_business_account) {
                igAccountId = page.instagram_business_account.id;
                pageAccessToken = page.access_token;
                try {
                    const igProfile = await axios.get(`https://graph.facebook.com/${API_VERSION}/${igAccountId}`, {
                        params: { fields: 'username,name', access_token: pageAccessToken },
                    });
                    igHandle = `@${igProfile.data.username}`;
                } catch { }
                break;
            }
        }

        if (!igAccountId || !pageAccessToken) {
            return res.redirect(`${frontendUrl}/dashboard?instagram=error&reason=no_ig_account`);
        }

        await supabase.from('user_settings').update({
            page_access_token: pageAccessToken,
            instagram_account_id: igAccountId,
            instagram_handle: igHandle || '',
            app_secret: appSecret,
            updated_at: new Date().toISOString(),
        }).eq('user_id', userId);

        return res.redirect(`${frontendUrl}/dashboard?instagram=connected&handle=${encodeURIComponent(igHandle || igAccountId)}`);
    } catch (err) {
        console.error('OAuth error:', err.response?.data || err.message);
        return res.redirect(`${frontendUrl}/dashboard?instagram=error&reason=token_exchange_failed`);
    }
}

async function disconnectHandler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    const userId = await getUserId(req);
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    await supabase.from('user_settings').update({
        page_access_token: '',
        instagram_account_id: '',
        instagram_handle: '',
        updated_at: new Date().toISOString(),
    }).eq('user_id', userId);

    return res.json({ success: true });
}

async function profileHandler(req, res) {
    if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

    const userId = await getUserId(req);
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const settings = await ensureSettings(userId);
    const { page_access_token, instagram_account_id } = settings;
    if (!page_access_token || !instagram_account_id) {
        return res.status(400).json({ error: 'Instagram account not connected.' });
    }

    try {
        const response = await axios.get(
            `https://graph.instagram.com/${API_VERSION}/${instagram_account_id}`,
            { params: { fields: 'id,username,name,followers_count,media_count,profile_picture_url', access_token: page_access_token } }
        );
        const profile = response.data;
        await supabase.from('user_settings').update({ followers: profile.followers_count || 0 }).eq('user_id', userId);
        return res.json(profile);
    } catch (error) {
        console.error('Instagram profile load failed:', error.response?.data || error.message);
        return res.status(500).json({ error: 'Unable to load Instagram profile.' });
    }
}

export default async function handler(req, res) {
    cors(req, res);
    if (req.method === 'OPTIONS') return res.status(200).end();

    const action = String(req.query.action || 'instagram');
    if (action === 'instagram' && isInstagramAuthRateLimited(req)) {
        return res.status(429).json({
            error: 'Too Many Requests',
            message: 'Too many Instagram connection attempts. Please try again in a minute.',
        });
    }

    if (action === 'instagram') return instagramAuthHandler(req, res);
    if (action === 'callback') return instagramCallbackHandler(req, res);
    if (action === 'disconnect') return disconnectHandler(req, res);
    if (action === 'profile') return profileHandler(req, res);
    return res.status(400).json({ error: 'Unsupported auth action.' });
}
