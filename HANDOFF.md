# DMGenie — Session Handoff (2026-07-07)

Branch: `dev` (never touch `main`). All work below is committed and pushed to `dev`.
Latest commit: `00fd0bf`. Range for this session: `86c5398..00fd0bf` plus the earlier
feature/bugfix commits `5a8b273..86c5398`.

---

## 1. What was accomplished (high level)

1. **10 handoff feature/UI items** — all done and verified.
2. **3 pre-existing TypeScript/runtime bugs** — fixed; `tsc` is now clean (0 errors).
3. **Pro test account sign-in failure** — root-caused and fixed live.
4. **Full security audit** — 8 commits, every planned finding addressed.

---

## 2. Handoff feature items (all DONE)

| # | Item | Outcome | Commit |
|---|------|---------|--------|
| 1 | "Start Here" routes to correct page per step | Continue targets first incomplete step; chips clickable; deleted dead `StartHereStrip` | `5a8b273` |
| 2 | USD prices auto by location | `$15/$12/$1` outside India, `₹499/₹399/₹1` in India (timezone detect) | `975e66c` |
| 3 | Profile changes don't persist | Was a fake `setTimeout`; now `supabase.auth.updateUser` (name/phone survive reload) | `5a8b273` |
| 4 | Follow-up fixed 24h (Meta policy) | Removed editable delay; fixed "Sent after 24 hours" + 23h50m policy note | `5a8b273` |
| 5 | Remove multi-account UI | Dropped "Connect another"/"Add new IG"; Enterprise pointer; usage shows x/1 | `5a8b273` |
| 6 | Rate limits per Meta | Webhook blocks at 700/hr (Meta cap 750); logs `rate_limited` on error codes 4/17/32/613 | `a4ef3fc` |
| 7 | Improve login page | Differentiated errors (unconfirmed/existing/rate-limit), kept forgot-pw + loading | `8544604` |
| 8 | Dark-mode toggle (follows system) | `ThemeToggle` + pre-paint script in `index.html`; on header + login | `8544604` |
| 9 | Shared Instagram-light theme | Magenta→blue gradient tokens; white bg; rebranded landing, login, AND dashboard | `8544604`, `60a3290` |
| 10 | Collapsible sidebar | Full by default → 76px icon rail; main content expands; localStorage-persisted | `fbf6809` |

**User decisions captured** (asked via question tool):
- Currency: auto by location; USD amounts **$15 / $12 / $1**.
- Login: both visual polish + UX.
- Dark mode: marketing + login now.
- Theme: one Instagram-light palette across dashboard AND landing.

---

## 3. Pre-existing bugs fixed (commit `d667a1f`)

`npx tsc --noEmit -p tsconfig.app.json` had 3 latent errors → now **0**:
- `ReferralHeroCard` referenced out-of-scope `session` → added `const { session } = useAuth()`.
- `AlertCircle` used in JSX but never imported → added to lucide import.
- `buildAutomationAnalyticsRows` widened `status` to `string` → annotated `.map` callback return as `AnalyticsAutomationRow`.

---

## 4. Pro test account sign-in — the debugging journey (WHAT WORKED / WHAT DIDN'T)

**Symptom:** `prouser@dmgennie.in` / `<password in SECRETS.local.txt>` → "Invalid email or password". "Worked on the previous build."

**Hypotheses tried:**
- ❌ *Code broke auth* — ruled out; `getSubscriptionState` and sign-in logic untouched by the session's work.
- ❌ *Account is Pro but flags wrong* — ruled out; querying prod showed **no account has `subscription_plan='pro'`** at all, and the account `prouser@dmgennie.in` **didn't exist in prod**.
- ❌ *Email not confirmed* — ruled out; that would raise the new "confirm your email" error, not "invalid password".
- ✅ **ROOT CAUSE: the account existed only in the PAUSED `dmgennie-dev` Supabase project.** The current build authenticates against **prod** (`hajgunruaywbspzmlwow`), where it didn't exist. (Querying the dev project timed out — confirming it's paused.)

**Fix attempts:**
- ❌ *Single CTE inserting `auth.users` + `auth.identities` + `user_settings`* → failed with duplicate-key. A `handle_new_user()` trigger auto-inserts the `user_settings` row on `auth.users` insert, colliding with my manual insert.
- ✅ **Working approach:** (1) insert `auth.users` (password via `extensions.crypt(pw, extensions.gen_salt('bf'))`) + `auth.identities`; (2) then **UPDATE** the trigger-created `user_settings` row to Pro. Verified: `password_matches=true`, `is_pro=true`.
- ✅ Also added a repeatable script `scripts/seed-pro-user.mjs` (`npm run seed:pro`, env `PRO_TEST_EMAIL`/`PRO_TEST_PASSWORD`) that does this correctly via the Auth admin API for future accounts (commit `86c5398`).

**General lesson:** many prod accounts are **Google-OAuth-only** (`has_password=false`, no email identity) — they can't sign in with email+password, and setting a plan flag in a table row never creates a login.

---

## 5. Security audit — 8 commits (all pushed)

| Finding | Fix | Commit |
|---|---|---|
| C1: live IG token committed in `server/data.json` | Untracked + gitignored + deleted local copy | `d17e2c9` |
| C2/C3/C4: `user_settings` client access (free-Pro upgrade, token read, app_secret) | Migration `20260707120000` **revokes all anon/authenticated privileges** on the table; nulled app_secret; removed the write in `api/auth.js` | `4c630e3` |
| C5: webhook "any account" fallback (cross-tenant) | Strict match on `instagram_account_id` only | `27e5c91` |
| H2: client-settable `instagram_account_id`/`verify_token` | Removed from settings PUT map | `27e5c91` |
| H3: CSV formula injection | Prefix `'` on cells starting `= + - @ \t \r` | `9c012db` |
| M8/M9: error-detail leak + verbose logs | Generic API errors; count instead of keyword dump | `9c012db` |
| H4: no security headers | HSTS/nosniff/X-Frame-DENY/Referrer/Permissions + **CSP report-only** in `vercel.json` | `4c9de23` |
| H1: fake account deletion | Real `DELETE /api/me` (password re-auth OR typed-email for OAuth) + wired modal | `b059087` |
| M1–M5: OAuth-state secret, 8-char signup, drop VITE_MASTER, log hygiene | see commit | `d3370fd` |
| L5: npm audit | `npm audit fix` → **0 vulnerabilities** (form-data high, react-router moderate) | `00fd0bf` |

**Verified:** prod grants show `anon`/`authenticated` = zero privileges, `service_role` = full (API works). `tsc` clean, `billingConfig.test.mjs` passes, `vite build` OK.

---

## 6. OUTSTANDING — owner actions (cannot be done from code)

1. **Rotate the Meta page access token** — the old one is in git history; rotation is what truly closes C1.
2. **Set `OAUTH_STATE_SECRET`** in Vercel env (falls back to `META_APP_SECRET` if unset — nothing breaks meanwhile).
3. **Remove `VITE_MASTER_*`** from Vercel env if set (they're bundled into public JS).
4. **Set Supabase Auth min password length = 8** in the dashboard (client already enforces 8).
5. **Create the USD Razorpay plan/offer** and set `RAZORPAY_PRO_MONTHLY_PLAN_ID_USD` + `RAZORPAY_PRO_INTRO_OFFER_ID_USD`. Until then USD checkout returns a graceful "setup required" 501.
6. **Rotate/delete the Pro test account** `prouser@dmgennie.in` before launch (its password was shared in chat).

## 7. OUTSTANDING — deferred code work (safe to do next session)

- **Drop `user_settings.app_secret` column** — deferred so it doesn't break OAuth mid-deploy. Do it in a new migration AFTER the current `api/auth.js` (which no longer writes it) is deployed.
- **Flip CSP from report-only to enforcing** — after watching the browser console for violations post-deploy, change `Content-Security-Policy-Report-Only` → `Content-Security-Policy` in `vercel.json`.
- **Dashboard dark-mode variant** — the toggle works and dashboard adopted the light palette, but its dark styles aren't done (dashboard hardcodes light hex). Marketing/login also render light-only in dark mode for the same reason.

## 8. NOT done, with reasons (don't re-investigate blindly)

- **M6 referral fraud** — N/A: there's no `referrals` table / payout backend yet, so the stored `?ref` hint has nothing to credit. Existing TODOs are the marker.
- **M3 delete legacy `server/index.js` (1,187 lines)** — it's local-dev-only (nothing deploys it; Vercel runs `api/`). Only fixed its one real leak (verify-token log). Deleting risks the owner's local webhook/ngrok workflow — confirm with owner before removing.

---

## 9. Environment gotchas the next session MUST know

- **Two Supabase projects**: prod `hajgunruaywbspzmlwow` (ACTIVE), dev `gmsknlfrbmyhkbbxenmp` (PAUSED — queries time out). Deployed app uses prod.
- **`/api/*` are Vercel serverless functions** — the vite dev server (port **8080**) does NOT serve them. Currency/billing/dashboard fall back to client defaults locally. Verify server logic with `node server/billingConfig.test.mjs`.
- **Preview browser**: navigate the tab directly to `http://localhost:8080/...`; the 8081 proxy landed on chrome-error. `/dashboard-preview` shows the authed dashboard with no login.
- **`vite build` `@theme` warning is benign** (Tailwind v4 directive in a v3-config project; colors resolve via `tailwind.config.ts`).
- **Creating auth users via SQL**: a `handle_new_user()` trigger auto-creates the `user_settings` row — insert user+identity, then UPDATE settings (never INSERT).
- **Line endings**: git warns `LF will be replaced by CRLF` on commit (Windows). Harmless.

## 10. Key files touched this session

- `src/pages/Dashboard.tsx` (9k-line monolith — most UI work + rebrand + sidebar + deletion modal)
- `src/pages/Signup.tsx` (login UX + rebrand + 8-char pw), `src/components/Pricing.tsx`, `src/components/PageHeader.tsx`, `src/components/ThemeToggle.tsx` (new)
- `src/index.css`, `tailwind.config.ts`, `index.html` (theme tokens + pre-paint)
- `src/lib/utils.ts` (currency helpers)
- `server/billingConfig.js` (+`.test.mjs`), `api/billing.js`, `api/webhook.js`, `api/auth.js`, `api/me.js`, `api/contacts.js`, `api/triggers.js`
- `vercel.json` (headers/CSP), `.env.example`, `.gitignore`
- `supabase/migrations/20260707120000_lockdown_user_settings.sql` (new)
- `scripts/seed-pro-user.mjs` (new)
