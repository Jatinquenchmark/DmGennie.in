# DMGennie - Instagram Automation & Lead Generation Dashboard

DMGennie is a powerful, creator-focused Instagram automation workspace designed to capture leads, automate direct messages (DMs) from comment keywords, and monitor account performance metrics. 

---

## 🚀 Key Features

### 1. Navigation & Workspace Layout
* **Left Sidebar**: Positioned flush against the left viewport edge for maximum workspace utilization.
* **Sidebar Plan & Usage**: Displays a collapsible plan & usage progress card (minimized by default for Starter plan users).
* **Permanent Pro Upgrade CTA**: Prominently features a golden Pro upgrade button right below plan usage (hidden once upgraded).
* **Clean Routing**: Integrated tabs for seamless page transitions between Dashboard, Automations, Inbox, Contacts, Analytics, and Settings.

### 2. Homepage Welcome Experience
* **Welcome Hero**: A clean dashboard hero card personalizing the experience for the user.
* **Pro Features Showcase**: Dynamically replaces the "Upgrade to Pro" card for Pro members with active navigation links to Pro-only capabilities (Analytics, Contacts, Automations).
* **Horizontal Start Here Checklist**: Positioned below the main description, tracking onboarding milestones (Instagram connection, first automation, test send, first lead). Automatically hides once all 4 onboarding steps are completed.
* **Quick Actions**: Prominent cards facilitating fast creation of "Auto DM from Comments", "Grow Followers", "Generate Leads", and "Story Automation".

### 3. Floating Recent Activity Overlay
* **Interactive Activity Launcher**: A thin, vertically-centered pill floating on the right viewport edge.
* **Hover-to-Expand**: Automatically slides out an activity log overlay on hover and collapses 500ms after the pointer leaves the container.
* **Actionable Entries**: Log entries link directly to the user's Inbox for immediate response.
* **Instagram-Style Notification Badge**: Displays a red notification bubble representing unseen events, with custom threshold-rounding logic:
  * **Under 10**: Exact count (e.g. `5`)
  * **10 - 99**: Rounded down to nearest 10 (e.g., `10+`, `20+`)
  * **100 - 999**: Rounded down to nearest 100 (e.g., `100+`, `200+`)
  * **1,000 - 4,999**: Rounded down to nearest 250 (e.g., `1000+`, `1250+`)
  * **5,000 - 9,999**: Rounded down to nearest 500 (e.g., `5000+`, `5500+`)
  * **10,000+**: Displayed as `10k+`
* **Auto-Clear**: Clears the badge notification bubble after the panel remains open for 2 seconds.

### 4. Performance Snapshot (Metric Grid)
* **Unified Metrics Layout**: A full-width continuous grid at the bottom of the page separating metrics (DMs Sent, Leads Collected, Followers, Failed Messages) with neat borders.
* **Time Range Selector**: Dropdown selector supporting `7 days`, `1 month`, `3 months`, `6 months`, `1 year`, `5 years`, and `All time`.
  * **Smart Account-Age Gating**: Options exceeding the user's account age (tracked via `session.user.created_at`) are automatically disabled and grayed out.
* **Activity Hover Overlays**: Hovering over any metric card launches a smooth upward-expanding overlay containing the 5 most recent activities of that type.

### 5. Premium Gold Theme Accent
* All premium triggers, Pro badge layouts, checkout modal cards, and upgrade actions share a consistent golden gradient style (`goldCtaCls` / `goldCrownCls`) coupled with amber borders and backgrounds to highlight subscription value.

---

## 🛠️ Technology Stack

* **Frontend**: React, TypeScript, Vite, Tailwind CSS, shadcn-ui, Framer Motion, Lucide icons.
* **Backend**: Node.js, Express.
* **Database & Authentication**: Supabase (PostgreSQL database, Auth, & Service Role API).
* **Payment Gateway**: Razorpay (Subscriptions, Coupons, & Webhooks).

---

## 💻 Local Development Setup

### Prerequisites
* Ensure you have Node.js and npm installed.

### Installation Steps

1. Clone the repository and navigate into it:
   ```bash
   git clone <YOUR_GIT_URL>
   cd DmGennie
   ```

2. Install the project dependencies:
   ```bash
   npm install
   ```

3. Create a `.env.local` or `.env` file in the root directory and specify your Supabase keys:
   ```env
   VITE_SUPABASE_URL=https://your-project.id.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key
   ```

4. Start the frontend development server:
   ```bash
   npm run dev
   ```

---

## 🔑 Backend & Billing Configuration

### 1. Admin Account Setup
DMGennie supports a backend-verified admin role. Configure environment variables on the backend:
```env
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
ADMIN_EMAIL=admin@dmgennie.in
ADMIN_PASSWORD=your-strong-admin-password
```

Apply the admin roles migration in `supabase/migrations/20260528000000_admin_roles.sql` to create `public.user_roles`, and seed/update the admin user:
```bash
npm run seed:admin
```

Admins logging in from `/signup` or `/signin` are redirected to the admin panel (`/admin`), while normal users are routed directly to `/dashboard`.

### 2. Razorpay Pro Intro Offer Setup
DMGennie supports a ₹1 first-month introductory offer, renewing at standard monthly prices thereafter.

Add backend variables:
```env
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

Apply the migration in `supabase/migrations/20260528010000_pro_intro_offer.sql` to track if users have redeemed the intro offer. Point Razorpay webhooks to `/api/billing/webhook` to record `has_used_pro_intro_offer=true` on successful payment.
