import axios from 'axios';
import { createClient } from '@supabase/supabase-js';

const API_VERSION = 'v25.0';
const IG_ACCOUNT_ID = '17841429173707253';

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

        // 1. Get token from Supabase
        const { data: settingsRows, error } = await supabase
            .from('user_settings')
            .select('*')
            .eq('instagram_account_id', IG_ACCOUNT_ID)
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
                error: 'No connected Instagram account found'
            });
        }

        const token = settingsRows[0].page_access_token;
        console.log('[meta-test-comments] Token fetched, starting media scan...');

        // 2. Fetch all media for the account
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
                error: 'No media found for this account',
                app: 'DMGENNIE-LIVE'
            });
        }

        // 3. Loop through each media and check for comments
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
                console.log(`[meta-test-comments] Media ${media.id} → ${comments.length} comment(s)`);

                testedMedia.push({
                    media_id: media.id,
                    permalink: media.permalink,
                    media_type: media.media_type,
                    caption: media.caption?.slice(0, 60) || '',
                    comments_found: comments.length
                });

                // First media with comments wins
                if (comments.length > 0 && !matchedResult) {
                    matchedResult = {
                        matched_media_id: media.id,
                        permalink: media.permalink,
                        media_type: media.media_type,
                        comments_found: comments.length,
                        comments: comments
                    };
                }
            } catch (commentErr) {
                const errDetail = commentErr.response?.data?.error || commentErr.message;
                console.error(`[meta-test-comments] Error fetching comments for ${media.id}:`, errDetail);
                testedMedia.push({
                    media_id: media.id,
                    permalink: media.permalink,
                    media_type: media.media_type,
                    comments_found: 0,
                    error: errDetail
                });
            }
        }

        // 4. Return result
        if (matchedResult) {
            return res.status(200).json({
                success: true,
                app: 'DMGENNIE-LIVE',
                permission_tested: 'instagram_business_manage_comments',
                ...matchedResult,
                all_tested_media: testedMedia
            });
        }

        // No comments found on any post
        return res.status(200).json({
            success: false,
            app: 'DMGENNIE-LIVE',
            permission_tested: 'instagram_business_manage_comments',
            message: 'API calls made successfully but no comments found on any post. Meta should still register the API calls.',
            total_media_tested: testedMedia.length,
            all_tested_media: testedMedia
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