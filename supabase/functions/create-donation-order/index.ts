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

  const razorpayKeyId = Deno.env.get("RAZORPAY_KEY_ID");
  const razorpayKeySecret = Deno.env.get("RAZORPAY_KEY_SECRET");

  if (!razorpayKeyId || !razorpayKeySecret) {
    return jsonResponse({ error: "Donation service is not configured yet." }, 500);
  }

  const payload = await safeJson(request);
  const amountPaise = Number(payload?.amountPaise || 0);
  const donorName = String(payload?.donorName || "Guest Racer").trim().slice(0, 40) || "Guest Racer";
  const donorEmail = String(payload?.donorEmail || "").trim().slice(0, 120);

  if (!Number.isInteger(amountPaise) || amountPaise < 100) {
    return jsonResponse({ error: "Donation amount must be at least Rs.1." }, 400);
  }

  const receipt = `donation-${Date.now()}`;
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
        product: "viral-racing-donation",
        donor_name: donorName,
        donor_email: donorEmail,
      },
    }),
  });

  const orderData = await safeJsonResponse(razorpayResponse);
  if (!razorpayResponse.ok || !orderData?.id) {
    return jsonResponse({ error: "Could not create a donation order." }, 500);
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
