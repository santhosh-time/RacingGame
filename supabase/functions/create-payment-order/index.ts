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
  const razorpayKeyId = Deno.env.get("RAZORPAY_KEY_ID");
  const razorpayKeySecret = Deno.env.get("RAZORPAY_KEY_SECRET");
  const authHeader = request.headers.get("Authorization");

  if (!supabaseUrl || !serviceRoleKey || !razorpayKeyId || !razorpayKeySecret) {
    return jsonResponse({ error: "Payment service is not configured yet." }, 500);
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
  const amountPaise = Number(payload?.amountPaise || 100);
  if (!Number.isInteger(amountPaise) || amountPaise < 100) {
    return jsonResponse({ error: "Amount must be at least Rs.1." }, 400);
  }

  const racerName =
    String(user.user_metadata?.racer_name || "").trim() ||
    String(user.email || "").split("@")[0].trim().slice(0, 18) ||
    "Road Rider";

  const receipt = `viral-${user.id.slice(0, 8)}-${Date.now()}`;
  const authValue = btoa(`${razorpayKeyId}:${razorpayKeySecret}`);
  const razorpayResponse = await fetch("https://api.razorpay.com/v1/orders", {
    method: "POST",
    headers: {
      Authorization: `Basic ${authValue}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      amount: amountPaise,
      currency: "INR",
      receipt,
      notes: {
        user_id: user.id,
        product: "viral-racing-24-hour-pass",
      },
    }),
  });

  const orderData = await safeJsonResponse(razorpayResponse);
  if (!razorpayResponse.ok || !orderData?.id) {
    return jsonResponse({ error: "Could not create a payment order." }, 500);
  }

  const accessPassPayload = {
    user_id: user.id,
    racer_name: racerName,
    payment_status: "pending",
    amount_paise: amountPaise,
    currency: "INR",
    provider_order_id: orderData.id,
    provider_payment_id: null,
    provider_signature: null,
  };

  const { data: existingPass, error: existingPassError } = await adminClient
    .from("access_passes")
    .select("id, payment_status, valid_until, activated_at")
    .eq("user_id", user.id)
    .maybeSingle();

  if (existingPassError) {
    return jsonResponse({ error: `Could not inspect the access pass: ${existingPassError.message}` }, 500);
  }

  const nextAccessPayload = existingPass
    ? {
        ...accessPassPayload,
        payment_status: existingPass.payment_status || "pending",
        valid_until: existingPass.valid_until || null,
        activated_at: existingPass.activated_at || null,
      }
    : accessPassPayload;

  const { error: saveError } = existingPass
    ? await adminClient
        .from("access_passes")
        .update(nextAccessPayload)
        .eq("user_id", user.id)
    : await adminClient
        .from("access_passes")
        .insert(nextAccessPayload);

  if (saveError) {
    return jsonResponse({ error: `Could not prepare the access pass: ${saveError.message}` }, 500);
  }

  return jsonResponse({
    keyId: razorpayKeyId,
    orderId: orderData.id,
    amount: amountPaise,
    currency: "INR",
  });
});

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

async function safeJsonResponse(response: Response) {
  try {
    return await response.json();
  } catch {
    return null;
  }
}
