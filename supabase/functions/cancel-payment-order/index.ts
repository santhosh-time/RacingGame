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
  const authHeader = request.headers.get("Authorization");

  if (!supabaseUrl || !serviceRoleKey) {
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
  const orderId = String(payload?.razorpay_order_id || "").trim();

  if (!orderId) {
    return jsonResponse({ error: "Order id is required." }, 400);
  }

  const { error } = await adminClient
    .from("access_pass_transactions")
    .update({
      transaction_status: "cancelled",
      failure_reason: "Checkout was closed before payment completed.",
    })
    .eq("user_id", user.id)
    .eq("provider_order_id", orderId)
    .eq("transaction_status", "pending");

  if (error) {
    return jsonResponse({ error: `Could not mark the payment as cancelled: ${error.message}` }, 500);
  }

  return jsonResponse({ message: "Payment marked as cancelled." });
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
