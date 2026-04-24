import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = 'force-dynamic';

const INSTAGRAM_URL_REGEX = /https?:\/\/(www\.)?instagram\.com\/(reel|p|tv)\/[A-Za-z0-9_-]+\/?(\?[^\s]*)?/gi;

// Admin Supabase client — uses service role to bypass RLS
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

async function sendTelegramMessage(chatId: number, text: string) {
  try {
    await fetch(
      `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chat_id: chatId, text, parse_mode: "Markdown" }),
      }
    );
  } catch (err) {
    console.error("Error sending TG message:", err);
  }
}

async function fetchReelMeta(url: string) {
  try {
    const res = await fetch(
      `https://api.microlink.io?url=${encodeURIComponent(url)}`
    );
    const data = await res.json();
    if (data.status === "success") {
      return {
        title: data.data.title || "Instagram Reel",
        thumbnail_url: data.data.image?.url || null,
      };
    }
  } catch (err) {
    console.error("Error fetching reel meta:", err);
  }
  return { title: "Instagram Reel", thumbnail_url: null };
}

export async function POST(req: Request) {
  console.log("-----------------------------------------");
  console.log("RECEIVED TELEGRAM WEBHOOK POST REQUEST");
  console.log("-----------------------------------------");
  try {
    const secretToken = req.headers.get("x-telegram-bot-api-secret-token");
    console.log("Secret Token received:", secretToken ? "YES" : "NO");
    
    // 1. Secret Token check
    if (process.env.TELEGRAM_SECRET_TOKEN && secretToken !== process.env.TELEGRAM_SECRET_TOKEN) {
      console.warn("Unauthorized webhook attempt: Secret token mismatch");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    console.log("Body payload received:", JSON.stringify(body).slice(0, 100) + "...");
    const message = body?.message;
    if (!message) {
      console.log("No 'message' object in body. Ignoring.");
      return NextResponse.json({ ok: true, note: "No message found" });
    }

    const chatId: number = message.chat.id;
    const fromId: string = String(message.from?.id);
    const text: string = message.text || message.caption || "";

    console.log(`From ID: ${fromId}, Chat ID: ${chatId}, Text: ${text}`);

    // 2. Allowed User check
    const allowedId = process.env.TELEGRAM_ALLOWED_USER_ID;
    if (allowedId && fromId !== allowedId) {
      console.warn(`Unauthorized user: ${fromId}. Expected: ${allowedId}`);
      await sendTelegramMessage(chatId, "⛔ You are not authorized to use this bot.");
      return NextResponse.json({ ok: true, note: "Unauthorized user" });
    }

    // 3. Handle /start
    if (text.startsWith("/start")) {
      console.log("Handling /start command");
      await sendTelegramMessage(
        chatId,
        "👋 *Reels Vault Bot*\n\nSend me any Instagram Reel link and I'll save it to your vault automatically."
      );
      return NextResponse.json({ ok: true });
    }

    // 4. Extract URL
    const matches = text.match(INSTAGRAM_URL_REGEX);
    if (!matches || matches.length === 0) {
      console.log("No Instagram link found in text.");
      await sendTelegramMessage(chatId, "❓ Please send a valid Instagram Reel link.");
      return NextResponse.json({ ok: true });
    }

    const reelUrl = matches[0];
    console.log("Detected Reel URL:", reelUrl);
    await sendTelegramMessage(chatId, "⏳ Saving to your vault...");

    // 5. Fetch Metadata
    console.log("Fetching metadata via Microlink...");
    const meta = await fetchReelMeta(reelUrl);
    console.log("Metadata results:", JSON.stringify(meta));

    // 6. DB Insert
    const userId = process.env.BOT_DEFAULT_USER_ID;
    if (!userId) {
      console.error("CRITICAL: BOT_DEFAULT_USER_ID is not defined in env variables!");
      await sendTelegramMessage(chatId, "❌ Setup Error: `BOT_DEFAULT_USER_ID` missing in server.");
      return NextResponse.json({ ok: true });
    }

    console.log(`Attempting Supabase insert for user: ${userId}`);
    const { error: insertError } = await supabaseAdmin.from("reels").insert({
      user_id: userId,
      original_url: reelUrl,
      thumbnail_url: meta.thumbnail_url,
      title: meta.title,
      notes: "Saved via Telegram",
    });

    if (insertError) {
      console.error("Supabase insert error details:", JSON.stringify(insertError));
      await sendTelegramMessage(chatId, `❌ Database Error: ${insertError.message}`);
    } else {
      console.log("Successfully inserted reel!");
      await sendTelegramMessage(
        chatId,
        `✅ *Saved!*\n\n*${meta.title}*\n\n[View in Vault](${reelUrl})`
      );
    }

    console.log("Webhook request finished successfully.");
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error("CRITICAL Webhook route error:", err);
    return NextResponse.json({ error: "Internal Server Error", details: err.message }, { status: 500 });
  }
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const testMode = searchParams.get("test");

  if (testMode === "true") {
    const userId = process.env.BOT_DEFAULT_USER_ID;
    if (!userId) return NextResponse.json({ error: "BOT_DEFAULT_USER_ID missing" });

    const { data, error } = await supabaseAdmin.from("reels").insert({
      user_id: userId,
      original_url: "https://www.instagram.com/reel/C-test-test/",
      title: "Test Connection",
      notes: "Self-test via URL"
    }).select();

    return NextResponse.json({ 
      source: "Self-Test Mode",
      env_check: {
        has_supabase_url: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
        has_service_role: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
        has_tg_token: !!process.env.TELEGRAM_BOT_TOKEN,
        bot_user_id: userId
      },
      db_result: error ? { status: "ERROR", msg: error.message } : { status: "OK", data }
    });
  }

  return NextResponse.json({ 
    status: "Telegram Webhook Active", 
    timestamp: new Date().toISOString(),
    env_keys_verify: {
      tg_token_prefix: process.env.TELEGRAM_BOT_TOKEN?.slice(0, 5) + "...",
      allowed_id: process.env.TELEGRAM_ALLOWED_USER_ID,
      supabase_url: process.env.NEXT_PUBLIC_SUPABASE_URL
    }
  });
}
