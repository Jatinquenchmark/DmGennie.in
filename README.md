# Welcome to your Lovable project

## Project info

**URL**: https://lovable.dev/projects/1169db3a-30f3-49bc-bd0b-9cda42ae0ebe

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/1169db3a-30f3-49bc-bd0b-9cda42ae0ebe) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## Admin account setup

DMGennie supports a backend-verified admin role. Admin passwords must live only in the server environment and must never be added to frontend code.

1. Add server-side environment variables:

```sh
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
ADMIN_EMAIL=admin@dmgennie.in
ADMIN_PASSWORD=your-strong-admin-password
```

2. Run the Supabase migration in `supabase/migrations/20260528000000_admin_roles.sql` to create `public.user_roles`.

3. Seed or update the admin account:

```sh
npm run seed:admin
```

4. Start the app and sign in from `/signup` using the admin email/password. Admins are redirected to `/admin`; normal users continue to `/dashboard`.

Admin API routes verify the authenticated user role on the backend before returning platform data. Normal users cannot access `/api/admin/*` data.

## Pro intro offer setup

DMGennie supports a first-month Pro intro offer: ₹1 for the first month, then the normal Pro monthly price from server config.

1. Add server-side billing variables:

```sh
PRO_MONTHLY_PRICE_INR=499
PRO_ANNUAL_MONTHLY_PRICE_INR=399
PRO_INTRO_FIRST_MONTH_INR=1
RAZORPAY_KEY_ID=rzp_live_or_test_key
RAZORPAY_KEY_SECRET=your-razorpay-secret
VITE_RAZORPAY_KEY_ID=rzp_live_or_test_key
RAZORPAY_PRO_MONTHLY_PLAN_ID=plan_T3Eh01YnuLdoWF
RAZORPAY_PRO_FIRST_MONTH_OFFER_ID=offer_xxxxx # optional
RAZORPAY_WEBHOOK_SECRET=your-razorpay-webhook-secret
```

2. Run `supabase/migrations/20260528010000_pro_intro_offer.sql` so each user can be marked as having used the intro offer.

3. Configure the Razorpay monthly Pro plan to renew at `PRO_MONTHLY_PRICE_INR`, and configure the Razorpay offer/coupon so only the first month is ₹1.

4. Point Razorpay webhooks to `/api/billing/webhook`. The webhook marks `has_used_pro_intro_offer=true` only after a successful subscription charge/payment event, so users cannot reuse the ₹1 offer repeatedly.

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/1169db3a-30f3-49bc-bd0b-9cda42ae0ebe) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/features/custom-domain#custom-domain)
