import { createClient } from "npm:@supabase/supabase-js@2.112.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Content-Type": "application/json; charset=utf-8",
};

function json(status: number, body: Record<string, unknown>) {
  return new Response(JSON.stringify(body), { status, headers: corsHeaders });
}

function text(value: unknown) {
  return String(value ?? "").trim();
}

function validEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function validMobile(value: string) {
  return /^(05[0-9]{8}|\+[1-9][0-9]{7,14})$/.test(value);
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: corsHeaders });
  if (req.method !== "POST") return json(405, { ok: false, error: "method_not_allowed" });

  const authHeader = req.headers.get("Authorization") || "";
  if (!authHeader.startsWith("Bearer ")) return json(401, { ok: false, error: "authentication_required" });

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !serviceRoleKey) return json(500, { ok: false, error: "server_configuration_error" });

  const userClient = createClient(supabaseUrl, serviceRoleKey, {
    global: { headers: { Authorization: authHeader } },
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
  const serviceClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });

  const { data: accessData, error: accessError } = await userClient.rpc("admin_get_access");
  const access = Array.isArray(accessData) ? accessData[0] : accessData;
  if (accessError || !access) return json(403, { ok: false, error: "admin_access_required" });
  if (access.role !== "owner") return json(403, { ok: false, error: "owner_access_required" });

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return json(400, { ok: false, error: "invalid_json" });
  }

  const action = text(body.action);

  if (action === "create_player") {
    const email = text(body.email).toLowerCase();
    const password = text(body.password);
    const name = text(body.name);
    const mobile = text(body.mobile).replace(/[\s-]/g, "");
    const country = text(body.country);
    const city = text(body.city);
    const genderRaw = text(body.gender);
    const gender = genderRaw === "" ? null : genderRaw;
    const rating = Number(body.rating ?? 1500);

    if (!validEmail(email)) return json(400, { ok: false, error: "invalid_email" });
    if (password.length < 8) return json(400, { ok: false, error: "password_too_short" });
    if (name.length < 2 || name.length > 60) return json(400, { ok: false, error: "invalid_name" });
    if (!validMobile(mobile)) return json(400, { ok: false, error: "invalid_mobile" });
    if (!country || !city) return json(400, { ok: false, error: "country_and_city_required" });
    if (gender !== null && !["male", "female"].includes(gender)) return json(400, { ok: false, error: "invalid_gender" });
    if (!Number.isInteger(rating) || rating < 100 || rating > 5000) return json(400, { ok: false, error: "invalid_rating" });

    const { data: created, error: createError } = await serviceClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });
    if (createError || !created.user) {
      const message = String(createError?.message || "create_user_failed");
      return json(400, { ok: false, error: message.includes("already") ? "email_already_exists" : "create_user_failed" });
    }

    const authUserId = created.user.id;
    const { data: playerId, error: profileError } = await userClient.rpc("admin_create_player_profile", {
      p_auth_user_id: authUserId,
      p_name: name,
      p_mobile: mobile,
      p_country: country,
      p_city: city,
      p_gender: gender,
      p_rating: rating,
    });

    if (profileError) {
      await serviceClient.auth.admin.deleteUser(authUserId);
      return json(400, { ok: false, error: String(profileError.message || "create_profile_failed") });
    }

    return json(200, { ok: true, player_id: playerId, auth_user_id: authUserId });
  }

  if (action === "delete_player") {
    const playerId = text(body.player_id);
    const reason = text(body.reason);
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(playerId)) {
      return json(400, { ok: false, error: "invalid_player_id" });
    }
    if (reason.length < 3) return json(400, { ok: false, error: "reason_required" });

    const { data: targetData, error: targetError } = await userClient.rpc("admin_get_player_delete_target", { p_player_id: playerId });
    const target = Array.isArray(targetData) ? targetData[0] : targetData;
    if (targetError || !target) return json(404, { ok: false, error: "player_not_found" });

    const authUserId = target.auth_user_id ? String(target.auth_user_id) : null;
    if (authUserId) {
      const { data: existing, error: lookupError } = await serviceClient.auth.admin.getUserById(authUserId);
      if (lookupError && !String(lookupError.message || "").toLowerCase().includes("not found")) {
        return json(500, { ok: false, error: "auth_lookup_failed" });
      }
      if (existing?.user) {
        const { error: deleteAuthError } = await serviceClient.auth.admin.deleteUser(authUserId);
        if (deleteAuthError) return json(500, { ok: false, error: "auth_delete_failed" });
      }
    }

    const { error: deleteProfileError } = await userClient.rpc("admin_delete_player_data", {
      p_player_id: playerId,
      p_reason: reason,
      p_expected_auth_user_id: authUserId,
    });
    if (deleteProfileError) return json(500, { ok: false, error: String(deleteProfileError.message || "player_delete_failed") });

    return json(200, { ok: true, player_id: playerId });
  }

  return json(400, { ok: false, error: "unsupported_action" });
});
