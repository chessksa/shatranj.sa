import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Content-Type': 'application/json; charset=utf-8',
};

function reply(payload: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: corsHeaders,
  });
}

function invalidCredentials() {
  return reply({ error: 'Invalid username or password' }, 401);
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return reply({ error: 'Method not allowed' }, 405);
  }

  let body: { username?: unknown; password?: unknown };
  try {
    body = await req.json();
  } catch {
    return invalidCredentials();
  }

  const username = String(body.username ?? '').trim().toLowerCase();
  const password = String(body.password ?? '');

  if (!/^[a-z0-9_]{3,20}$/.test(username) || password.length < 8) {
    return invalidCredentials();
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY');

  if (!supabaseUrl || !serviceRoleKey || !anonKey) {
    console.error('Missing Supabase function environment variables');
    return reply({ error: 'Login service unavailable' }, 503);
  }

  const admin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: registryRow, error: registryError } = await admin
    .from('username_registry')
    .select('user_id')
    .eq('username', username)
    .maybeSingle();

  if (registryError || !registryRow?.user_id) {
    if (registryError) console.error('username lookup failed', registryError.message);
    return invalidCredentials();
  }

  const { data: userData, error: userError } = await admin.auth.admin.getUserById(
    registryRow.user_id,
  );

  const userEmail = userData?.user?.email;
  if (userError || !userEmail) {
    if (userError) console.error('auth user lookup failed', userError.message);
    return invalidCredentials();
  }

  const publicClient = createClient(supabaseUrl, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: loginData, error: loginError } = await publicClient.auth.signInWithPassword({
    email: userEmail,
    password,
  });

  if (loginError || !loginData.session) {
    return invalidCredentials();
  }

  return new Response(JSON.stringify({
    access_token: loginData.session.access_token,
    refresh_token: loginData.session.refresh_token,
    expires_at: loginData.session.expires_at ?? null,
  }), {
    status: 200,
    headers: corsHeaders,
  });
});
