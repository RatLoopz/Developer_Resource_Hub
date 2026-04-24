# 🤖 Telegram Bot → Reels Vault Integration Guide (v3.0 Multi-User)

> **Pro Goal:** Instagram par reel dekho → Telegram bot ko link bhejo → Woh aapke **personal vault** mein apne aap save ho jaye.  
> **Key Upgrade:** Ab koi bhi registered user bot ko apne account ke saath link kar sakta hai!

---

## 🧠 Architecture (Multi-User System)

```
[User on Website]
     │
     └─► Profile Page → Generate Unique Token (DRH-A1B2C)
             │
[User on Telegram]
     │
     └─► Send: /start DRH-A1B2C
             │
[Next.js Backend]
     │
     ├─► Verify Token → Match with User Profile
     ├─► Save Telegram ID in DB (Account Linked ✅)
     │
[Future Interaction]
     │
     └─► Paste Reel Link → Bot identifies user via DB lookup → Saves to THEIR vault.
```

---

## 📋 Step 1 — Initial Env Setup

Puranay single-user env vars ko delete karein aur sirf basics rakhein:

```bash
# File: .env.local (Sync with Vercel as well)

# Supabase Auth & DB
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=... # Important: For bot backend

# Telegram Credentials (@BotFather se)
TELEGRAM_BOT_TOKEN=...
TELEGRAM_BOT_USERNAME=reelsvault_bot

# Webhook Security (Random String)
TELEGRAM_SECRET_TOKEN=mera_random_secret_123
```

---

## 📋 Step 2 — Database Migration

Multi-user support ke liye `profiles` table ko update karna padega taaki IDs store ho sakein.

**Run in Supabase SQL Editor:**
```sql
alter table public.profiles
  add column if not exists telegram_id text unique,
  add column if not exists telegram_link_token text unique;

create index if not exists idx_profiles_telegram_id on public.profiles (telegram_id);
```

---

## 📋 Step 3 — Bot Linking Flow (User Perspective)

Ab bot restrict nahi hai, koi bhi ye steps follow karke use link kar sakta hai:

1.  **Website par jao:** Login karke **Profile** page par jao.
2.  **Link Telegram:** "Link Telegram Account" button par click karo.
3.  **Token Copy:** Aapko ek command milegi, e.g., `/start DRH-7F8E3A`.
4.  **Bot par jao:** Telegram bot kholo aur wahi command paste kardo.
5.  **Success:** Bot reply karega: *"✅ Linked Successfully!"*

---

## 📋 Step 4 — Webhook Register Karo

Agar aapne URL change kiya hai ya pehli baar kar rahe hain:

```bash
curl "https://api.telegram.org/bot<YOUR_TOKEN>/setWebhook" \
  -d "url=https://YOUR_DOMAIN.vercel.app/api/telegram/webhook" \
  -d "secret_token=mera_random_secret_123"
```

---

## 📋 Step 5 — Implementation Highlights (Code)

### 1. Linking API (`/api/telegram/generate-token`)
Yeh API user ke liye unique code generate karti hai aur profile mein save karti hai.

### 2. Deep-Link Webhook
Humne `/start` command ko smart banaya hai. Agar user `/start <token>` bhejta hai, toh bot database lookup karke linking complete kar deta hai.

### 3. Smart Lookup
Jab koi link aata hai, bot `message.from.id` ko find karta hai `profiles` table mein. Isse use pata chalta hai ki reel kiski vault mein save karni hai.

---

## 🔁 Clean-up Check

Ab aap in variables ko remove kar sakte hain (Useless ENVs):
- ❌ `TELEGRAM_ALLOWED_USER_ID`: Ab bot database se ID dekhta hai.
- ❌ `BOT_DEFAULT_USER_ID`: Ab bot owner ke user_id ki jagah har user ka apna ID use karta hai.

---

## 🐛 Troubleshooting

| Problem | Solution |
|---------|----------|
| Bot says "Account Not Linked" | Profile page par ja kar naya token generate karein aur `/start <TOKEN>` bhejien. |
| DB Error (Foreign Key) | Ensure karein ki user website par already registered/logged-in hai. |
| Webhook Mismatch | Ensure `TELEGRAM_SECRET_TOKEN` Vercel aur `setWebhook` command mein exact match ho. |

---

### 📱 Final UX Workflow
**User 1** saves a reel → Website shows it in User 1's vault.  
**User 2** saves a reel → Website shows it in User 2's vault.  
**Total Security + Multi-user scalability!** 🚀
