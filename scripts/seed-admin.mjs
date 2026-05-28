import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const adminEmail = process.env.ADMIN_EMAIL;
const adminPassword = process.env.ADMIN_PASSWORD;

function required(name, value) {
  if (!value) {
    throw new Error(`${name} is required. Add it to your server environment or local .env file.`);
  }
}

required('SUPABASE_URL or VITE_SUPABASE_URL', supabaseUrl);
required('SUPABASE_SERVICE_ROLE_KEY', serviceRoleKey);
required('ADMIN_EMAIL', adminEmail);
required('ADMIN_PASSWORD', adminPassword);

if (adminPassword === 'change_this_strong_password') {
  throw new Error('ADMIN_PASSWORD must be changed from the .env.example placeholder.');
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

async function seedAdmin() {
  const existing = await findUserByEmail(adminEmail);
  let adminUser = existing;

  if (!adminUser) {
    const { data, error } = await supabase.auth.admin.createUser({
      email: adminEmail,
      password: adminPassword,
      email_confirm: true,
      app_metadata: { role: 'admin', plan: 'Admin' },
      user_metadata: { full_name: 'DMGenie Admin' },
    });

    if (error) throw error;
    adminUser = data.user;
    console.log(`Created admin user: ${adminEmail}`);
  } else {
    const { data, error } = await supabase.auth.admin.updateUserById(adminUser.id, {
      app_metadata: { ...(adminUser.app_metadata || {}), role: 'admin', plan: 'Admin' },
    });

    if (error) throw error;
    adminUser = data.user;
    console.log(`Admin user already exists: ${adminEmail}`);
  }

  const { error: roleError } = await supabase
    .from('user_roles')
    .upsert({ user_id: adminUser.id, role: 'admin', updated_at: new Date().toISOString() });

  if (roleError) {
    throw new Error(`Unable to upsert admin role. Run the Supabase migration first. Details: ${roleError.message}`);
  }

  console.log(`Admin role confirmed for ${adminEmail}`);
}

seedAdmin().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
