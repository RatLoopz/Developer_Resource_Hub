# 🤖 Telegram Bot → Reels Vault Integration Guide

> **Goal:** Instagram par reel dekho → Telegram bot ko link bhejo → Apne aap vault mein save ho jaye.  
> **Learning Goal:** Aage bhi aise koi bot banana ho toh yahi steps follow karo.

---

## 🧠 Architecture (Pehle samjho, phir karo)

```
[You on Phone]
     │
     │ Share/Paste reel link
     ▼
[Telegram Bot]
     │
     │ HTTPS POST (webhook)
     ▼
[Your Next.js App]  ← /api/telegram/webhook/route.ts
     │
     ├─► Microlink API  (fetch title + thumbnail)
     │
     └─► Supabase DB   (insert into reels table)
```

**Key concept — Webhook vs Polling:**
- **Polling:** Bot repeatedly asks Telegram "koi message aaya?" (slow, resource-heavy)
- **Webhook:** Telegram khud aapke server ko call karta hai jab message aata hai (instant, preferred ✅)

---

## 📋 Step 1 — Telegram Bot Banao (@BotFather)

1. Telegram open karo, search karo **`@BotFather`** (blue tick wala)
2. Send karo: `/newbot`
3. BotFather puchega:
   - **Name:** `Reels Vault Bot` (display name, kuch bhi)
   - **Username:** `reelsvault_bot` (unique, `_bot` se end hona chahiye)
4. BotFather dega: `HTTP API Token` — yeh save karo!

```
Example token: 7412936541:AAF_xK9mVz2qnBLsomething_long_string
```

> [!IMPORTANT]
> Yeh token secret hai — kabhi GitHub par push mat karo!

---

## 📋 Step 2 — Apna Telegram User ID Pata Karo

Yeh important hai taaki sirf aap hi bot use kar sako (security).

1. Telegram par search karo **`@userinfobot`**
2. `/start` bhejo
3. Woh reply karega: `Id: 123456789` — yeh note karo

---

## 📋 Step 3 — Supabase Service Role Key Lao

Admin panel mein RLS bypass karne ke liye service role key chahiye (bot ke paas user session nahi hoti).

1. **[Supabase Dashboard](https://supabase.com/dashboard)** → Apna project → **Settings → API**
2. `service_role` key copy karo (yeh bhi secret hai!)

---

## 📋 Step 4 — BOT_DEFAULT_USER_ID Nikalo

Bot jab reel save karega, usse ek `user_id` chahiye (database `NOT NULL` constraint).  
Apna Supabase user ID lo:

1. Supabase Dashboard → **Authentication → Users**
2. Apna account dhundo → UUID copy karo
3. Yahi `BOT_DEFAULT_USER_ID` banega

---

## 📋 Step 5 — `.env.local` Update Karo

```bash
# File: /mnt/data2/RatLoopz/Developer_Resource_Hub/.env.local

# (Already existing)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...

# (NEW — add these)
SUPABASE_SERVICE_ROLE_KEY=eyJ...your_service_role_key...
TELEGRAM_BOT_TOKEN=7412936541:AAF_xK9mVz...
TELEGRAM_SECRET_TOKEN=mera_random_secret_123   # kuch bhi type karo, yaad rakhna
TELEGRAM_ALLOWED_USER_ID=123456789             # Step 2 se mila number
BOT_DEFAULT_USER_ID=uuid-from-supabase-auth    # Step 4 se mila UUID
```

> [!CAUTION]
> `.env.local` gitignore mein hai — safe hai. Lekin production deploy karte waqt yeh env vars **Vercel/platform ke dashboard** mein set karne padte hain.

---

## 📋 Step 6 — Code Already Ready Hai ✅

Webhook route already bana diya hai:

📄 [`app/api/telegram/webhook/route.ts`](file:///mnt/data2/RatLoopz/Developer_Resource_Hub/app/api/telegram/webhook/route.ts)

**Yeh kya karta hai:**
1. Telegram ka secret token verify karta hai (unauthorized requests block)
2. Message mein Instagram URL dhundhta hai (regex se)
3. Sirf aapka Telegram ID allow karta hai
4. Microlink se title + thumbnail fetch karta hai
5. Supabase mein save karta hai
6. Telegram par confirm reply bhejta hai ✅ / ❌

---

## 📋 Step 7 — App Deploy Karo (Webhook needs public HTTPS URL)

> [!IMPORTANT]
> Telegram webhook sirf **public HTTPS URL** par kaam karta hai.  
> `localhost` par kaam nahi karega! Deploy karna padega.

**Option A — Vercel (Recommended, free):**
```bash
# Vercel CLI install
npm i -g vercel

# Project root mein:
vercel

# Env vars set karo:
vercel env add TELEGRAM_BOT_TOKEN
vercel env add TELEGRAM_SECRET_TOKEN
vercel env add TELEGRAM_ALLOWED_USER_ID
vercel env add SUPABASE_SERVICE_ROLE_KEY
vercel env add BOT_DEFAULT_USER_ID
```

**Option B — Local testing ke liye ngrok:**
```bash
# ngrok install karo: https://ngrok.com
ngrok http 3000

# Milega kuch aisa:
# https://abc123.ngrok-free.app
```

---

## 📋 Step 8 — Webhook Register Karo (Telegram ko URL batao)

Apna deployed URL ready hai? Ab Telegram ko batao:

```bash
# Browser mein yeh URL paste karo ya curl se run karo:

curl "https://api.telegram.org/bot<TELEGRAM_BOT_TOKEN>/setWebhook" \
  -d "url=https://YOUR_DOMAIN.vercel.app/api/telegram/webhook" \
  -d "secret_token=mera_random_secret_123"
```

**Response agar sahi gaya:**
```json
{"ok": true, "result": true, "description": "Webhook was set"}
```

**Verify karo:**
```bash
curl "https://api.telegram.org/bot<TOKEN>/getWebhookInfo"
```

---

## 📋 Step 9 — Test Karo!

1. Telegram kholo
2. Apna bot dhundo (`@reelsvault_bot`)
3. `/start` bhejo — greeting milega
4. Koi Instagram reel link paste karo:
   ```
   https://www.instagram.com/reel/ABC123/
   ```
5. Bot reply karega: `✅ Saved! [Reel Title]`
6. Website → Reels Vault → Naya reel appear! 🎉

---

## 🔁 Reusable Pattern — Kisi bhi Bot ke liye

Aage kabhi bhi naya bot banana ho toh yahi steps:

```
Step 1: @BotFather → /newbot → TOKEN lao
Step 2: @userinfobot → apna USER_ID lao
Step 3: Webhook route banao  →  /api/<service>/webhook/route.ts
Step 4: Env vars set karo
Step 5: Deploy karo (Vercel/ngrok)
Step 6: setWebhook API call karo
Step 7: Test!
```

### Webhook Route Template (Copy karo kisi bhi project mein):

```typescript
// app/api/<botname>/webhook/route.ts
export async function POST(req: Request) {
  // 1. Verify secret token
  if (req.headers.get("x-telegram-bot-api-secret-token") !== process.env.SECRET)
    return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { message } = await req.json();
  const chatId = message.chat.id;
  const text = message.text || "";

  // 2. Your logic here
  // ...

  // 3. Reply
  await fetch(`https://api.telegram.org/bot${process.env.TOKEN}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text: "Done!" }),
  });

  return Response.json({ ok: true });
}
```

---

## 🐛 Common Errors & Fixes

| Error | Cause | Fix |
|-------|-------|-----|
| `401 Unauthorized` | Secret token mismatch | `.env` mein `TELEGRAM_SECRET_TOKEN` check karo |
| Bot reply nahi karta | Webhook registered nahi | Step 8 dobara karo, `getWebhookInfo` check karo |
| `user_id violation` | `BOT_DEFAULT_USER_ID` missing/wrong | Supabase Auth se sahi UUID lo |
| `permission denied for table reels` | Service role key missing | `SUPABASE_SERVICE_ROLE_KEY` set karo |
| Localhost pe kaam nahi | Webhook needs public URL | ngrok ya Vercel use karo |

---

## 📱 Mobile Workflow (Final UX)

```
Instagram app → Share → Telegram → @reelsvault_bot
                                          ↓
                              Bot: "✅ Saved! [Title]"
                                          ↓
                        Website pe visit karo → Reel dikhega!
```

Total time: **~3 seconds** vs pehle ka 30-second copy-paste flow 🚀
