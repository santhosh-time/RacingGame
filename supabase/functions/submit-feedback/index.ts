import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import nodemailer from "npm:nodemailer@6.9.16";

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
  const smtpHost = Deno.env.get("SMTP_HOST");
  const smtpPort = Number(Deno.env.get("SMTP_PORT") || "465");
  const smtpUser = Deno.env.get("SMTP_USER");
  const smtpPass = Deno.env.get("SMTP_PASS");
  const smtpFrom = Deno.env.get("SMTP_FROM") || smtpUser;
  const feedbackTo = Deno.env.get("FEEDBACK_TO") || smtpFrom;

  if (!supabaseUrl || !serviceRoleKey) {
    return jsonResponse({ error: "Server configuration is missing." }, 500);
  }

  if (!smtpHost || !smtpUser || !smtpPass || !smtpFrom || !feedbackTo) {
    return jsonResponse({ error: "Feedback email settings are missing." }, 500);
  }

  const adminClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  const payload = await safeJson(request);
  const racerName = String(payload?.racerName || "Guest Player").trim().slice(0, 50) || "Guest Player";
  const email = String(payload?.email || "").trim().slice(0, 160);
  const feedbackText = String(payload?.message || "").trim().slice(0, 600);
  const rating = Number(payload?.rating || 5);
  const vehicleName = String(payload?.vehicle || "").trim().slice(0, 40);
  const playMode = String(payload?.playMode || "guest").trim().slice(0, 20) || "guest";
  const bestScore = Number(payload?.bestScore || 0);

  if (!feedbackText) {
    return jsonResponse({ error: "Feedback message is required." }, 400);
  }

  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    return jsonResponse({ error: "Rating must be between 1 and 5." }, 400);
  }

  let userId: string | null = null;
  const authHeader = request.headers.get("Authorization");
  if (authHeader) {
    const token = authHeader.replace("Bearer ", "").trim();
    if (token) {
      const {
        data: { user },
      } = await adminClient.auth.getUser(token);
      userId = user?.id ?? null;
    }
  }

  const { error: insertError } = await adminClient
    .from("feedback_submissions")
    .insert({
      user_id: userId,
      racer_name: racerName,
      email: email || null,
      rating,
      feedback_text: feedbackText,
      vehicle_name: vehicleName || null,
      best_score: Number.isFinite(bestScore) ? bestScore : 0,
      play_mode: playMode,
    });

  if (insertError) {
    return jsonResponse({ error: "Could not store feedback right now." }, 500);
  }

  const transporter = nodemailer.createTransport({
    host: smtpHost,
    port: smtpPort,
    secure: smtpPort === 465,
    auth: {
      user: smtpUser,
      pass: smtpPass,
    },
  });

  const subject = `Viral Racing Game feedback from ${racerName}`;
  const text = [
    "New feedback from Viral Racing Game",
    "",
    `Racer: ${racerName}`,
    `Email: ${email || "Not provided"}`,
    `Mode: ${playMode}`,
    `Rating: ${rating}/5`,
    `Vehicle: ${vehicleName || "Not provided"}`,
    `Best score: ${Number.isFinite(bestScore) ? bestScore : 0}`,
    "",
    "Message:",
    feedbackText,
  ].join("\n");

  try {
    await transporter.sendMail({
      from: smtpFrom,
      to: feedbackTo,
      replyTo: email || undefined,
      subject,
      text,
    });
  } catch {
    return jsonResponse({ error: "Feedback was saved, but the email could not be sent." }, 500);
  }

  return jsonResponse({ message: "Feedback saved and emailed." });
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
