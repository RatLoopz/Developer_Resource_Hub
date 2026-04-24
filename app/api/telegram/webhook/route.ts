import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// ─── Telegram Webhook Handler ───────────────────────────────
// Flow: Telegram → POST /api/telegram/webhook → parse URL → Microlink → Supabase
//
// Env vars needed:
//   TELEGRAM_BOT_TOKEN      — from @BotFather
//   TELEGRAM_SECRET_TOKEN   — any random string you set when registering webhook
//   TELEGRAM_ALLOWED_USER_ID — your Telegram numeric user ID (security)
//   SUPABASE_SERVICE_ROLE_KEY — service role key (bypasses RLS)
//   BOT_DEFAULT_USER_ID     — the Supabase auth user ID to store reels under
// ────────────────────────────────────────────────────────────

const INSTAGRAM_URL_REGEX =
  /https?:\/\/(www\.)?instagram\.com\/(reel|p|tv)\/[A-Za-z0-9_-]+\/?(\?[^\s]*)?/gi;

// Admin Supabase client — uses service role to bypass RLS
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

async function sendTelegramMessage(chatId: number, text: string) {
  await fetch(
    `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text, parse_mode: "Markdown" }),
    }
  );
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
  } catch {}
  return { title: "Instagram Reel", thumbnail_url: null };
}

export async function POST(req: Request) {
  try {
    // 1. Verify secret token (set when registering webhook)
    const secretToken = req.headers.get("x-telegram-bot-api-secret-token");
    if (secretToken !== process.env.TELEGRAM_SECRET_TOKEN) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const message = body?.message;
    if (!message) return NextResponse.json({ ok: true }); // ignore non-message updates

    const chatId: number = message.chat.id;
    const fromId: string = String(message.from?.id);
    const text: string = message.text || message.caption || "";

    // 2. Check if sender is allowed (only your Telegram account)
    const allowedId = process.env.TELEGRAM_ALLOWED_USER_ID;
    if (allowedId && fromId !== allowedId) {
      await sendTelegramMessage(chatId, "⛔ You are not authorized to use this bot.");
      return NextResponse.json({ ok: true });
    }

    // 3. Handle /start command
    if (text.startsWith("/start")) {
      await sendTelegramMessage(
        chatId,
        "👋 *Reels Vault Bot*\n\nSend me any Instagram Reel link and I'll save it to your vault automatically.\n\n_Just paste or forward the link here!_"
      );
      return NextResponse.json({ ok: true });
    }

    // 4. Extract Instagram URL from text
    const matches = text.match(INSTAGRAM_URL_REGEX);
    if (!matches || matches.length === 0) {
      await sendTelegramMessage(
        chatId,
        "❓ No Instagram Reel link found in your message.\n\nSend a link like:\n`https://www.instagram.com/reel/ABC123/`"
      );
      return NextResponse.json({ ok: true });
    }

    const reelUrl = matches[0];
    await sendTelegramMessage(chatId, "⏳ Saving reel...");

    // 5. Fetch metadata via Microlink
    const meta = await fetchReelMeta(reelUrl);

    // 6. Save to Supabase (using service role — no session needed)
    const userId = process.env.BOT_DEFAULT_USER_ID;
    if (!userId) {
      await sendTelegramMessage(chatId, "❌ Bot not configured: BOT_DEFAULT_USER_ID missing.");
      return NextResponse.json({ ok: true });
    }

    const { error } = await supabaseAdmin.from("reels").insert({
      user_id: userId,
      original_url: reelUrl,
      thumbnail_url: meta.thumbnail_url,
      title: meta.title,
      notes: "Saved via Telegram Bot",
    });

    if (error) {
      await sendTelegramMessage(chatId, `❌ Failed to save: ${error.message}`);
    } else {
      await sendTelegramMessage(
        chatId,
        `✅ *Saved!*\n\n*${meta.title}*\n\n[View on Instagram](${reelUrl})`
      );
    }

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error("[Telegram Webhook Error]", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

// Telegram only sends POSTs — return 405 for anything else
export async function GET() {
  return NextResponse.json({ status: "Telegram webhook active" });
}
