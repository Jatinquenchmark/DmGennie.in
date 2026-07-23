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
        const supabase = getSupabase();

        // 1. Get exact working DMGennie account row/token from Supabase
        const { data: settingsRows, error } = await supabase
            .from('user_settings')
            .select('*')
            .eq('instagram_account_id', IG_ACCOUNT_ID)
            .eq('user_id', WORKING_USER_ID)
            .not('page_access_token', 'is', null)
            .limit(1);

        if (error) {
            console.error('[meta-test-comments] Supabase error:', error);
            return res.status(500).json({
                success: false,
                stage: 'supabase_query',
                error
            });
        }

        if (!settingsRows || settingsRows.length === 0) {
            return res.status(404).json({
                success: false,
                stage: 'supabase_query',
                error: 'No connected Instagram account found for this user_id and instagram_account_id'
            });
        }

        const settings = settingsRows[0];
        const token = settings.page_access_token;

        console.log('[meta-test-comments] Token fetched, starting media scan...', {
            instagram_account_id: settings.instagram_account_id,
            instagram_handle: settings.instagram_handle,
            user_id: settings.user_id,
            tokenStart: token?.slice(0, 10)
        });

        // IMPORTANT:
        // Supabase token starts with IGAAS..., so use graph.instagram.com, not graph.facebook.com.

        // 2. Fetch media from Instagram Graph API
        const mediaRes = await axios.get(
            `https://graph.instagram.com/${API_VERSION}/${IG_ACCOUNT_ID}/media`,
            {
                params: {
                    fields: 'id,caption,media_type,permalink',
                    access_token: token
                }
            }
        );

        const mediaList = mediaRes.data?.data || [];
        console.log(`[meta-test-comments] Found ${mediaList.length} media items`);

        if (mediaList.length === 0) {
            return res.status(200).json({
                success: false,
                app: 'DMGENNIE-LIVE',
                permission_tested: 'instagram_business_manage_comments',
                selected_user_id: settings.user_id,
                instagram_account_id: settings.instagram_account_id,
                instagram_handle: settings.instagram_handle,
                message: 'No media found for this Instagram account.'
            });
        }

        // 3. Loop through media and fetch comments for each post/reel
        const testedMedia = [];
        let matchedResult = null;

        for (const media of mediaList) {
            console.log(`[meta-test-comments] Checking media ${media.id} | ${media.permalink}`);

            try {
                const commentsRes = await axios.get(
                    `https://graph.instagram.com/${API_VERSION}/${media.id}/comments`,
                    {
                        params: {
                            fields: 'id,text,username,timestamp',
                            access_token: token
                        }
                    }
                );

                const comments = commentsRes.data?.data || [];

                console.log(`[meta-test-comments] Media ${media.id} -> ${comments.length} comment(s)`);

                testedMedia.push({
                    media_id: media.id,
                    permalink: media.permalink,
                    media_type: media.media_type,
                    caption: media.caption?.slice(0, 100) || '',
                    comments_found: comments.length
                });

                if (comments.length > 0 && !matchedResult) {
                    matchedResult = {
                        matched_media_id: media.id,
                        permalink: media.permalink,
                        media_type: media.media_type,
                        caption: media.caption || '',
                        comments_found: comments.length,
                        comments
                    };
                }
            } catch (commentErr) {
                const errDetail = commentErr.response?.data?.error || commentErr.message;

                console.error(`[meta-test-comments] Error fetching comments for ${media.id}:`, errDetail);

                testedMedia.push({
                    media_id: media.id,
                    permalink: media.permalink,
                    media_type: media.media_type,
                    caption: media.caption?.slice(0, 100) || '',
                    comments_found: 0,
                    error: errDetail
                });
            }
        }

        // 4. If any media has comments, return that as matched result
        if (matchedResult) {
            return res.status(200).json({
                success: true,
                app: 'DMGENNIE-LIVE',
                permission_tested: 'instagram_business_manage_comments',
                selected_user_id: settings.user_id,
                instagram_account_id: settings.instagram_account_id,
                instagram_handle: settings.instagram_handle,
                ...matchedResult,
                all_tested_media: testedMedia
            });
        }

        // 5. No comments found, but API calls were successful
        return res.status(200).json({
            success: false,
            app: 'DMGENNIE-LIVE',
            permission_tested: 'instagram_business_manage_comments',
            selected_user_id: settings.user_id,
            instagram_account_id: settings.instagram_account_id,
            instagram_handle: settings.instagram_handle,
            message: 'API calls made successfully, but no comments were returned for any scanned media.',
            total_media_tested: testedMedia.length,
            all_tested_media: testedMedia
        });

    } catch (err) {
        const error = err.response?.data?.error || err.message;

        console.error('[meta-test-comments] Failed:', error);

        return res.status(500).json({
            success: false,
            stage: 'main_catch',
            error
        });
    }
}