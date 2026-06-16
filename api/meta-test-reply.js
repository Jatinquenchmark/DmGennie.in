import axios from 'axios';
import { createClient } from '@supabase/supabase-js';

const API_VERSION = 'v25.0';
const IG_ACCOUNT_ID = '17841429173707253';
const WORKING_USER_ID = '37251c49-e364-4829-beb5-accb1391841a';

function getSupabase() {
    return createClient(
        process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY,
        { auth: { persistSession: false } }
    );
}

export default async function handler(req, res) {
    try {
        const { commentId } = req.query;

        if (!commentId) {
            return res.status(400).json({
                success: false,
                error: 'Missing commentId. Use /api/meta-test-reply?commentId=REAL_COMMENT_ID'
            });
        }

        const supabase = getSupabase();

        const { data: settingsRows, error } = await supabase
            .from('user_settings')
            .select('*')
            .eq('instagram_account_id', IG_ACCOUNT_ID)
            .eq('user_id', WORKING_USER_ID)
            .not('page_access_token', 'is', null)
            .limit(1);

        if (error) {
            console.error('[meta-test-reply] Supabase error:', error);
            return res.status(500).json({
                success: false,
                stage: 'supabase_query',
                error
            });
        }

        if (!settingsRows || settingsRows.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'No connected Instagram account found for selected user.'
            });
        }

        const settings = settingsRows[0];
        const token = settings.page_access_token;

        console.log('[meta-test-reply] Sending test public reply', {
            commentId,
            instagram_account_id: settings.instagram_account_id,
            instagram_handle: settings.instagram_handle,
            user_id: settings.user_id,
            tokenStart: token?.slice(0, 10)
        });

        const response = await axios.post(
            `https://graph.instagram.com/${API_VERSION}/${commentId}/replies`,
            {
                message: 'Thanks for your comment! This is a DMGennie test reply for Meta App Review.',
                access_token: token
            },
            {
                headers: {
                    'Content-Type': 'application/json'
                }
            }
        );

        console.log('[meta-test-reply] Success:', response.data);

        return res.status(200).json({
            success: true,
            app: 'DMGENNIE-LIVE',
            permission_tested: 'instagram_business_manage_comments',
            action: 'POST comment reply',
            selected_user_id: settings.user_id,
            instagram_account_id: settings.instagram_account_id,
            instagram_handle: settings.instagram_handle,
            comment_id: commentId,
            meta_response: response.data
        });

    } catch (err) {
        const error = err.response?.data?.error || err.message;

        console.error('[meta-test-reply] Failed:', error);

        return res.status(500).json({
            success: false,
            stage: 'main_catch',
            error
        });
    }
}