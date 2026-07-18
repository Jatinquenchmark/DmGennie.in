-- Security lockdown for user_settings (audit findings C2, C3, C4).
--
-- Context: the frontend never queries user_settings directly — every read/write goes
-- through service-role API endpoints (/api/me, /api/auth, /api/webhook). The anon-key
-- client only uses supabase.auth.*. So the table needs no anon/authenticated access at
-- all. Leaving the default PostgREST grants in place let a logged-in user, from the
-- browser console, (a) self-upgrade to Pro by updating subscription_plan, and
-- (b) read page_access_token / instagram_access_token / razorpay ids off their own row.

-- C2: the global Meta app secret was being copied into a per-user column. Wipe the
-- values now. (The column itself is dropped in a follow-up migration AFTER the code that
-- writes it — api/auth.js — is deployed, to avoid breaking OAuth connect mid-deploy.)
update public.user_settings set app_secret = null where app_secret is not null;

-- C3 + C4: remove all client role access. The RLS policies stay in place as
-- defense-in-depth; the service role (used by the API) bypasses RLS and is unaffected.
-- The handle_new_user() trigger runs as definer/auth admin, so signup is unaffected.
revoke all privileges on table public.user_settings from anon;
revoke all privileges on table public.user_settings from authenticated;
