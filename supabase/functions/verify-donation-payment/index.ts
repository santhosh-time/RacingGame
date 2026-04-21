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

  const razorpayKeySecret = Deno.env.get("RAZORPAY_KEY_SECRET");
  if (!razorpayKeySecret) {
    return jsonResponse({ error: "Donation verification is not configured yet." }, 500);
  }

  const payload = await safeJson(request);
  const orderId = String(payload?.razorpay_order_id || "").trim();
  const paymentId = String(payload?.razorpay_payment_id || "").trim();
  const signature = String(payload?.razorpay_signature || "").trim();

  if (!orderId || !paymentId || !signature) {
    return jsonResponse({ error: "Donation details are incomplete." }, 400);
  }

  const dataToSign = `${orderId}|${paymentId}`;
  const expectedSignature = await createHmacHex(razorpayKeySecret, dataToSign);
  if (expectedSignature !== signature) {
    return jsonResponse({ error: "Donation signature did not match." }, 400);
  }

  return jsonResponse({
    message: "Donation confirmed.",
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
