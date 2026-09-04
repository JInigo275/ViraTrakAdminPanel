import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

function loadEnv(file) {
  try {
    const raw = fs.readFileSync(file, 'utf8');
    const lines = raw.split(/\r?\n/).filter(Boolean);
    const env = {};
    for (const line of lines) {
      const idx = line.indexOf('=');
      if (idx === -1) continue;
      const k = line.slice(0, idx).trim();
      const v = line.slice(idx + 1).trim();
      env[k] = v.replace(/^"|"$/g, '');
    }
    return env;
  } catch (e) {
    return {};
  }
}

const env = { ...loadEnv('.env'), ...loadEnv('.env.local') };
const url = env.VITE_SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const key = env.VITE_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!url || !key) {
  console.error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY');
  process.exit(2);
}

const supabase = createClient(url, key, {
  auth: { persistSession: false },
});

async function run() {
  try {
    console.log('Testing connection to', url);

    const { data: users, error: uErr } = await supabase.from('users').select('*').limit(5);
    if (uErr) console.error('users query error:', uErr);
    else console.log('users rows:', users?.length ?? 0, users);

    const { data: drivers, error: dErr } = await supabase.from('driver').select('*').limit(5);
    if (dErr) console.error('driver query error:', dErr);
    else console.log('driver rows:', drivers?.length ?? 0, drivers);

    const { data: alerts, error: aErr } = await supabase.from('alert').select('alert_id').limit(5);
    if (aErr) console.error('alert query error:', aErr);
    else console.log('alert rows:', alerts?.length ?? 0);

  } catch (e) {
    console.error('Unexpected error:', e);
  }
}

run().then(() => process.exit(0));
