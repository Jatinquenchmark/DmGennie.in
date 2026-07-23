import crypto from 'crypto';
import axios from 'axios';
import { supabase, getUserId, ensureSettings, cors } from '../server/supabaseApi.js';

const API_VERSION = 'v25.0';
const PRIMARY_INSTAGRAM_REDIRECT_URI = 'https://dm-gennie-in.vercel.app/auth/instagram/callback';
const INSTAGRAM_BUSINESS_SCOPES = [
    'instagram_business_basic',
    'instagram_business_manage_comments',
    'instagram_business_manage_messages',
];
const INSTAGRAM_AUTH_LIMIT = 10;
const INSTAGRAM_AUTH_WINDOW_MS = 60 * 1000;
// ponytail: per-instance in-memory limiter — resets on cold start and isn't shared
// across serverless instances, so it throttles bursts but isn't a hard global cap.
// Move to a Supabase/Redis-backed counter if real abuse is observed.
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
    // Prefer a dedicated secret; fall back to the Instagram client secret (always set for
    // OAuth). Avoid the service-role key so a leak of one secret doesn't compromise the other.
    return process.env.OAUTH_STATE_SECRET || process.env.INSTAGRAM_CLIENT_SECRET;
}

function getInstagramAppId() {
    return process.env.INSTAGRAM_CLIENT_ID;
}

function getInstagramClientSecret() {
    return process.env.INSTAGRAM_CLIENT_SECRET;
}

function getInstagramRedirectUri() {
    return process.env.INSTAGRAM_REDIRECT_URI?.trim() || '';
}

function isValidInstagramRedirectUri(redirectUri) {
    return redirectUri === PRIMARY_INSTAGRAM_REDIRECT_URI;
}

function redirectToInstagramSettings(res, params) {
    const query = new URLSearchParams({ tab: 'instagram', ...params });
    return res.redirect(`/dashboard/settings?${query.toString()}`);
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

    const appId = getInstagramAppId();
    const redirectUri = getInstagramRedirectUri();
    if (!appId) return res.status(500).json({ error: 'Instagram app is not configured.' });
    if (!redirectUri) return res.status(500).json({ error: 'Instagram redirect URI is not configured.' });
    if (!isValidInstagramRedirectUri(redirectUri)) {
        console.error('[Instagram OAuth] Invalid INSTAGRAM_REDIRECT_URI:', redirectUri);
        return res.status(500).json({ error: 'Instagram redirect URI does not match the configured Meta callback.' });
    }
    const scopes = INSTAGRAM_BUSINESS_SCOPES.join(',');
    const state = createOAuthState(userId);
    if (!state) return res.status(500).json({ error: 'Instagram connection is not configured.' });
    const instagramAuthUrl = `https://www.instagram.com/oauth/authorize?client_id=${encodeURIComponent(appId)}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=${encodeURIComponent(scopes)}&state=${encodeURIComponent(state)}`;

    console.log('INSTAGRAM_REDIRECT_URI:', process.env.INSTAGRAM_REDIRECT_URI);
    console.log('Instagram OAuth URL:', instagramAuthUrl);
    console.log('[Instagram OAuth] OAuth URL generated:', instagramAuthUrl);
    console.log('[Instagram OAuth] Redirect URI:', redirectUri);
    console.log('[Instagram OAuth] Scopes:', scopes);

    return res.json({ url: instagramAuthUrl });
}

async function exchangeCodeForShortToken({ appId, appSecret, redirectUri, code }) {
    const body = new URLSearchParams({
        client_id: appId,
        client_secret: appSecret,
        grant_type: 'authorization_code',
        redirect_uri: redirectUri,
        code,
    });

    const response = await axios.post('https://api.instagram.com/oauth/access_token', body, {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });
    return response.data;
}

async function exchangeForLongLivedToken({ appSecret, accessToken }) {
    const response = await axios.get('https://graph.instagram.com/access_token', {
        params: {
            grant_type: 'ig_exchange_token',
            client_secret: appSecret,
            access_token: accessToken,
        },
    });
    return response.data;
}

async function fetchInstagramProfile(accessToken) {
    try {
        const response = await axios.get(`https://graph.instagram.com/${API_VERSION}/me`, {
            params: {
                fields: 'id,user_id,username,account_type,profile_picture_url,followers_count,media_count',
                access_token: accessToken,
            },
        });
        return response.data;
    } catch (error) {
        console.warn('[Instagram OAuth] Full profile fetch failed, retrying basic fields:', error.response?.data || error.message);
        const response = await axios.get(`https://graph.instagram.com/${API_VERSION}/me`, {
            params: {
                fields: 'id,user_id,username',
                access_token: accessToken,
            },
        });
        return response.data;
    }
}

async function saveInstagramConnection(userId, payload) {
    await ensureSettings(userId);
    const now = new Date().toISOString();
    const fullUpdates = {
        page_access_token: payload.accessToken,
        instagram_access_token: payload.accessToken,
        instagram_account_id: payload.instagramUserId,
        instagram_user_id: payload.instagramUserId,
        instagram_username: payload.username || '',
        instagram_handle: payload.username ? `@${payload.username}` : '',
        instagram_profile_picture_url: payload.profilePictureUrl || null,
        instagram_account_type: payload.accountType || null,
        instagram_token_expires_at: payload.expiresAt || null,
        instagram_permissions: INSTAGRAM_BUSINESS_SCOPES,
        instagram_connection_status: 'connected',
        instagram_connected_at: now,
        instagram_last_synced_at: now,
        followers: payload.followersCount || 0,
        updated_at: now,
    };

    const { error } = await supabase.from('user_settings').update(fullUpdates).eq('user_id', userId);
    if (!error) {
        console.log('[Instagram OAuth] Database save success:', { userId, instagramUserId: payload.instagramUserId, username: payload.username });
        return;
    }

    console.warn('[Instagram OAuth] Full database save failed, retrying legacy fields:', error.message);
    const legacyUpdates = {
        page_access_token: payload.accessToken,
        instagram_account_id: payload.instagramUserId,
        instagram_handle: payload.username ? `@${payload.username}` : '',
        followers: payload.followersCount || 0,
        updated_at: now,
    };
    const retry = await supabase.from('user_settings').update(legacyUpdates).eq('user_id', userId);
    if (retry.error) {
        console.error('[Instagram OAuth] Database save failure:', retry.error.message);
        throw retry.error;
    }

    console.log('[Instagram OAuth] Database save success with legacy fields:', { userId, instagramUserId: payload.instagramUserId, username: payload.username });
}

async function instagramCallbackHandler(req, res) {
    if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

    const { code, state, error } = req.query;
    console.log('Callback path hit:', req.url || req.headers['x-original-url'] || '/auth/instagram/callback');
    console.log('[Instagram OAuth] Callback hit');
    console.log('[Instagram OAuth] Code received:', Boolean(code));
    console.log('Code received:', Boolean(code));
    if (error) {
        console.warn('[Instagram OAuth] Meta returned error:', error);
        return redirectToInstagramSettings(res, { error: 'meta_oauth_failed' });
    }
    if (!code || !state) return redirectToInstagramSettings(res, { error: 'missing_params' });

    const userId = parseOAuthState(state);
    if (!userId) return redirectToInstagramSettings(res, { error: 'invalid_state' });

    const appId = getInstagramAppId();
    const appSecret = getInstagramClientSecret();
    const redirectUri = getInstagramRedirectUri();
    if (!appId || !appSecret) {
        console.error('[Instagram OAuth] Missing app ID or app secret');
        return redirectToInstagramSettings(res, { error: 'oauth_not_configured' });
    }
    if (!redirectUri || !isValidInstagramRedirectUri(redirectUri)) {
        console.error('[Instagram OAuth] Invalid callback INSTAGRAM_REDIRECT_URI:', redirectUri || 'MISSING');
        return redirectToInstagramSettings(res, { error: 'redirect_uri_mismatch' });
    }

    try {
        let shortTokenData;
        try {
            shortTokenData = await exchangeCodeForShortToken({ appId, appSecret, redirectUri, code: String(code) });
        } catch (tokenError) {
            console.error('Token exchange failure:', tokenError.response?.data || tokenError.message);
            console.error('[Instagram OAuth] Short-lived token exchange failure:', tokenError.response?.data || tokenError.message);
            return redirectToInstagramSettings(res, { error: 'token_exchange_failed' });
        }
        console.log('Token exchange success:', Boolean(shortTokenData?.access_token));
        console.log('[Instagram OAuth] Short-lived token exchange success:', Boolean(shortTokenData?.access_token));
        if (!shortTokenData?.access_token) {
            return redirectToInstagramSettings(res, { error: 'token_exchange_failed' });
        }

        let longTokenData;
        try {
            longTokenData = await exchangeForLongLivedToken({ appSecret, accessToken: shortTokenData.access_token });
        } catch (tokenError) {
            console.error('Token exchange failure:', tokenError.response?.data || tokenError.message);
            console.error('[Instagram OAuth] Long-lived token exchange failure:', tokenError.response?.data || tokenError.message);
            return redirectToInstagramSettings(res, { error: 'token_exchange_failed' });
        }
        console.log('[Instagram OAuth] Long-lived token exchange success:', Boolean(longTokenData?.access_token));
        const accessToken = longTokenData?.access_token || shortTokenData.access_token;
        const expiresAt = longTokenData?.expires_in
            ? new Date(Date.now() + Number(longTokenData.expires_in) * 1000).toISOString()
            : null;

        let profile;
        try {
            profile = await fetchInstagramProfile(accessToken);
        } catch (profileError) {
            console.error('[Instagram OAuth] Instagram profile fetch failure:', profileError.response?.data || profileError.message);
            return redirectToInstagramSettings(res, { error: 'profile_fetch_failed' });
        }
        console.log('[Instagram OAuth] Instagram profile fetch success:', { id: profile?.id || profile?.user_id || shortTokenData?.user_id, username: profile?.username || '' });
        const instagramUserId = String(profile?.user_id || profile?.id || shortTokenData?.user_id || '');
        if (!instagramUserId) return redirectToInstagramSettings(res, { error: 'profile_fetch_failed' });

        try {
            await saveInstagramConnection(userId, {
                accessToken,
                expiresAt,
                instagramUserId,
                username: profile?.username || '',
                profilePictureUrl: profile?.profile_picture_url || null,
                accountType: profile?.account_type || null,
                followersCount: profile?.followers_count || 0,
            });
            console.log('Supabase save success:', true);
        } catch (saveError) {
            console.error('Supabase save failure:', saveError.message || saveError);
            console.error('[Instagram OAuth] Database save failure:', saveError.message || saveError);
            return redirectToInstagramSettings(res, { error: 'database_save_failed' });
        }

        return redirectToInstagramSettings(res, { connected: 'true' });
    } catch (err) {
        console.error('[Instagram OAuth] Token exchange/profile/database failure:', err.response?.data || err.message);
        return redirectToInstagramSettings(res, { error: 'token_exchange_failed' });
    }
}

async function disconnectHandler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    const userId = await getUserId(req);
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const fullDisconnect = {
        page_access_token: '',
        instagram_access_token: '',
        instagram_account_id: '',
        instagram_user_id: '',
        instagram_username: '',
        instagram_handle: '',
        instagram_token_expires_at: null,
        instagram_permissions: [],
        instagram_connection_status: 'disconnected',
        updated_at: new Date().toISOString(),
    };
    const { error } = await supabase.from('user_settings').update(fullDisconnect).eq('user_id', userId);
    if (error) {
        console.warn('[Instagram OAuth] Full disconnect failed, retrying legacy fields:', error.message);
        await supabase.from('user_settings').update({
            page_access_token: '',
            instagram_account_id: '',
            instagram_handle: '',
            updated_at: new Date().toISOString(),
        }).eq('user_id', userId);
    }

    return res.json({ success: true });
}

const MEDIA_GRADIENTS = [
    'from-[#5B4DFF] via-[#8A3FFC] to-[#F05A8A]',
    'from-[#2B1635] via-[#7A2E57] to-[#F3B8D0]',
    'from-[#111827] via-[#4C1D95] to-[#5B4DFF]',
    'from-emerald-900 via-teal-600 to-cyan-300',
    'from-amber-100 via-white to-[#FFF7DA]',
];

function mediaTypeLabel(type) {
    if (type === 'VIDEO') return 'Reel';
    if (type === 'CAROUSEL_ALBUM') return 'Carousel';
    return 'Post';
}

function titleFromCaption(caption, fallback) {
    const text = String(caption || '').trim().replace(/\s+/g, ' ');
    if (!text) return fallback;
    return text.length > 40 ? `${text.slice(0, 40)}…` : text;
}

function mapPost(item, index) {
    const likes = item.like_count;
    const comments = item.comments_count;
    let metric = 'Recent';
    if (typeof likes === 'number') metric = `${likes.toLocaleString()} likes`;
    else if (typeof comments === 'number') metric = `${comments.toLocaleString()} comments`;
    return {
        id: item.id,
        title: titleFromCaption(item.caption, mediaTypeLabel(item.media_type)),
        type: mediaTypeLabel(item.media_type),
        caption: item.caption || '',
        color: MEDIA_GRADIENTS[index % MEDIA_GRADIENTS.length],
        metric,
        thumbnailUrl: item.thumbnail_url || item.media_url || '',
    };
}

function mapStory(item, index) {
    return {
        id: item.id,
        title: titleFromCaption(item.caption, 'Story'),
        type: 'Post',
        caption: item.caption || '',
        color: MEDIA_GRADIENTS[index % MEDIA_GRADIENTS.length],
        metric: 'Active story',
        thumbnailUrl: item.thumbnail_url || item.media_url || '',
    };
}

async function mediaHandler(req, res) {
    if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

    const userId = await getUserId(req);
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const settings = await ensureSettings(userId);
    const { page_access_token, instagram_account_id } = settings;
    // Not connected: respond 200 so the client can render the "connect your account" state.
    if (!page_access_token || !instagram_account_id) {
        return res.status(200).json({ connected: false, posts: [], stories: [] });
    }

    const base = `https://graph.instagram.com/${API_VERSION}/${instagram_account_id}`;
    const fetchEdge = async (edge, fields) => {
        try {
            const response = await axios.get(`${base}/${edge}`, {
                params: { fields, access_token: page_access_token, limit: 25 },
            });
            return Array.isArray(response.data?.data) ? response.data.data : [];
        } catch (error) {
            // Stories in particular require extra permissions and may not be available; treat as empty.
            console.error(`[media] ${edge} fetch failed:`, error.response?.data?.error?.message || error.message);
            return [];
        }
    };

    const [posts, stories] = await Promise.all([
        fetchEdge('media', 'id,caption,media_type,media_url,thumbnail_url,permalink,like_count,comments_count,timestamp'),
        fetchEdge('stories', 'id,caption,media_type,media_url,thumbnail_url,permalink,timestamp'),
    ]);

    return res.json({
        connected: true,
        posts: posts.map(mapPost),
        stories: stories.map(mapStory),
    });
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
        const profile = await fetchInstagramProfile(page_access_token);
        await supabase.from('user_settings').update({
            followers: profile.followers_count || 0,
            instagram_username: profile.username || String(settings.instagram_handle || '').replace(/^@/, ''),
            instagram_handle: profile.username ? `@${profile.username}` : settings.instagram_handle,
            instagram_last_synced_at: new Date().toISOString(),
        }).eq('user_id', userId);
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
    if (action === 'media') return mediaHandler(req, res);
    return res.status(400).json({ error: 'Unsupported auth action.' });
}
