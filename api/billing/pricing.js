import { cors, getUser, ensureSettings } from '../_supabase.js';
import { getBillingConfig, getProIntroEligibility } from '../../server/billingConfig.js';

export default async function handler(req, res) {
    cors(res);
    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

    const config = getBillingConfig();
    const user = await getUser(req);
    let eligibility = { eligible: false, reason: 'Sign in to start Pro for ₹1', isPro: false, hasUsedIntroOffer: false };

    if (user) {
        const settings = await ensureSettings(user.id);
        eligibility = getProIntroEligibility(user, settings);
    }

    return res.json({
        currency: config.currency,
        plans: config.plans,
        proIntroOffer: {
            ...config.plans.pro.introOffer,
            eligible: eligibility.eligible,
            reason: eligibility.reason,
            hasUsedIntroOffer: eligibility.hasUsedIntroOffer,
            isPro: eligibility.isPro,
            proIntroStartedAt: eligibility.proIntroStartedAt || null,
        },
    });
}
