import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

// Creates (or repairs) a Pro test account that can actually sign in with email + password.
//
// Why this exists: setting `subscription_plan = 'pro'` on a user_settings row directly in
// Supabase does NOT create a login. If the auth user was made via Google OAuth (or a raw
// SQL insert), it has no email/password identity, so email+password sign-in fails with
// "Invalid email or password". Going through the Auth admin API sets the bcrypt password
// and email identity correctly, then we mark the account Pro.
//
// Usage: set PRO_TEST_EMAIL and PRO_TEST_PASSWORD, then `npm run seed:pro`.

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const proEmail = process.env.PRO_TEST_EMAIL;
const proPassword = process.env.PRO_TEST_PASSWORD;

function required(name, value) {
  if (!value) {
    throw new Error(`${name} is required. Add it to your server environment or local .env file.`);
  }
}

required('SUPABASE_URL or VITE_SUPABASE_URL', supabaseUrl);
required('SUPABASE_SERVICE_ROLE_KEY', serviceRoleKey);
required('PRO_TEST_EMAIL', proEmail);
required('PRO_TEST_PASSWORD', proPassword);

if (proPassword.length < 8) {
  throw new Error('PRO_TEST_PASSWORD must be at least 8 characters.');
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false },
});

async function findUserByEmail(email) {
  let page = 1;
  const perPage = 1000;

  while (true) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage });
    if (error) throw error;

    const found = (data?.users || []).find((user) => user.email?.toLowerCase() === email.toLowerCase());
    if (found) return found;
    if ((data?.users || []).length < perPage) return null;
    page += 1;
  }
}

async function seedProUser() {
  const existing = await findUserByEmail(proEmail);
  let proUser = existing;

  if (!proUser) {
    const { data, error } = await supabase.auth.admin.createUser({
      email: proEmail,
      password: proPassword,
      email_confirm: true,
      app_metadata: { plan: 'pro', subscription_status: 'active' },
      user_metadata: { full_name: 'DMGennie Pro Tester' },
    });

    if (error) throw error;
    proUser = data.user;
    console.log(`Created Pro test user: ${proEmail}`);
  } else {
    // Reset the password + confirm email so an OAuth-only or half-created account can now
    // sign in with email + password, and mark it Pro.
    const { data, error } = await supabase.auth.admin.updateUserById(proUser.id, {
      password: proPassword,
      email_confirm: true,
      app_metadata: { ...(proUser.app_metadata || {}), plan: 'pro', subscription_status: 'active' },
    });

    if (error) throw error;
    proUser = data.user;
    console.log(`Updated existing user to Pro + reset password: ${proEmail}`);
  }

  // getSubscriptionState() marks a user Pro when subscription_plan='pro', status='active',
  // and current_period_end is in the future. Set a 1-year window so it stays Pro.
  const now = new Date();
  const periodEnd = new Date(now.getTime());
  periodEnd.setFullYear(periodEnd.getFullYear() + 1);

  const { error: settingsError } = await supabase
    .from('user_settings')
    .upsert({
      user_id: proUser.id,
      subscription_plan: 'pro',
      subscription_status: 'active',
      current_period_start: now.toISOString(),
      current_period_end: periodEnd.toISOString(),
      updated_at: now.toISOString(),
    }, { onConflict: 'user_id' });

  if (settingsError) {
    throw new Error(`Unable to upsert Pro subscription in user_settings. Details: ${settingsError.message}`);
  }

  console.log(`Pro subscription confirmed for ${proEmail} (active until ${periodEnd.toISOString().slice(0, 10)}).`);
  console.log('You can now sign in at /signup?mode=signin with this email and password.');
}

seedProUser().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
