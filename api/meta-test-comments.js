import axios from 'axios';
import { createClient } from '@supabase/supabase-js';

const API_VERSION = 'v25.0';

function getSupabase() {
    return createClient(
        process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY,
        { auth: { persistSession: false } }
    );
}

export default async function handler(req, res) {
    try {
        const supabase = getSupabase();

        const { data: settingsRows, error } = await supabase
            .from('user_settings')
            .select('*')
            .eq('instagram_account_id', '17841429173707253')
            .eq('user_id', '37251c49-e364-4829-beb5-accb1391841a')
            .not('page_access_token', 'is', null)
            .limit(1);

        if (error) {
            console.error('[meta-test-comments] Supabase error:', error);
            return res.status(500).json({ success: false, error });
        }

        if (!settingsRows || settingsRows.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'No connected Instagram account found for dmgenie.in'
            });
        }

        const settings = settingsRows[0];
        const token = settings.page_access_token;
        const mediaId = '17972490116901523';

        console.log('[meta-test-comments] Running comments API test', {
            igAccountId: settings.instagram_account_id,
            hasToken: !!token,
            tokenStart: token?.slice(0, 10),
            mediaId
        });

        const response = await axios.get(
            `https://graph.instagram.com/${API_VERSION}/${mediaId}/comments`,
            {
                params: {
                    fields: 'id,text,username,timestamp',
                    access_token: token
                }
            }
        );

        console.log('[meta-test-comments] Success:', response.data);

        return res.status(200).json({
            success: true,
            app: 'DMGENNIE-LIVE',
            permission_tested: 'instagram_business_manage_comments',
            media_id: mediaId,
            data: response.data
        });
    } catch (err) {
        const error = err.response?.data?.error || err.message;
        console.error('[meta-test-comments] Failed:', error);
        return res.status(500).json({
            success: false,
            error
        });
    }
}