import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (request.method !== "POST") {
    return jsonResponse({ error: "Method not allowed." }, 405);
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const razorpayKeySecret = Deno.env.get("RAZORPAY_KEY_SECRET");
  const authHeader = request.headers.get("Authorization");

  if (!supabaseUrl || !serviceRoleKey || !razorpayKeySecret) {
    return jsonResponse({ error: "Payment verification is not configured yet." }, 500);
  }

  if (!authHeader) {
    return jsonResponse({ error: "Missing authorization header." }, 401);
  }

  const adminClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const token = authHeader.replace("Bearer ", "").trim();
  const {
    data: { user },
    error: userError,
  } = await adminClient.auth.getUser(token);

  if (userError || !user) {
    return jsonResponse({ error: "Could not verify this racer." }, 401);
  }

  const payload = await safeJson(request);
  const orderId = String(payload?.razorpay_order_id || "").trim();
  const paymentId = String(payload?.razorpay_payment_id || "").trim();
  const signature = String(payload?.razorpay_signature || "").trim();

  if (!orderId || !paymentId || !signature) {
    return jsonResponse({ error: "Payment details are incomplete." }, 400);
  }

  const racerName =
    String(user.user_metadata?.racer_name || "").trim() ||
    String(user.email || "").split("@")[0].trim().slice(0, 18) ||
    "Road Rider";

  const dataToSign = `${orderId}|${paymentId}`;
  const expectedSignature = await createHmacHex(razorpayKeySecret, dataToSign);
  if (expectedSignature !== signature) {
    return jsonResponse({ error: "Payment signature did not match." }, 400);
  }

  const { data: existingPass } = await adminClient
    .from("access_passes")
    .select("valid_until")
    .eq("user_id", user.id)
    .maybeSingle();

  const currentExpiryMs = existingPass?.valid_until ? new Date(existingPass.valid_until).getTime() : 0;
  const baseTimeMs = Math.max(Date.now(), Number.isNaN(currentExpiryMs) ? 0 : currentExpiryMs);
  const validUntil = new Date(baseTimeMs + 24 * 60 * 60 * 1000).toISOString();
  const activatedAt = new Date().toISOString();

  const accessPassPayload = {
    user_id: user.id,
    racer_name: racerName,
    payment_status: "paid",
    amount_paise: 100,
    currency: "INR",
    provider_order_id: orderId,
    provider_payment_id: paymentId,
    provider_signature: signature,
    valid_until: validUntil,
    activated_at: activatedAt,
  };

  const { data: existingPassRow, error: existingPassError } = await adminClient
    .from("access_passes")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (existingPassError) {
    return jsonResponse({ error: `Could not inspect the access pass: ${existingPassError.message}` }, 500);
  }

  const { error: updateError } = existingPassRow
    ? await adminClient
        .from("access_passes")
        .update(accessPassPayload)
        .eq("user_id", user.id)
    : await adminClient
        .from("access_passes")
        .insert(accessPassPayload);

  if (updateError) {
    return jsonResponse({ error: `Could not activate the access pass: ${updateError.message}` }, 500);
  }

  return jsonResponse({
    message: "Access activated.",
    validUntil,
  });
});

async function createHmacHex(secret: string, message: string) {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(message));
  return Array.from(new Uint8Array(signature))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

function jsonResponse(payload: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
    },
  });
}

async function safeJson(request: Request) {
  try {
    return await request.json();
  } catch {
    return null;
  }
}
