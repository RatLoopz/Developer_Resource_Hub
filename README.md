<div align="center">
  <h1>Developer Resource Hub</h1>
  <p><em>A comprehensive platform for discovering, organizing, and sharing AI tools and developer resources</em></p>
  <p>
    <a href="#features">Features</a> •
    <a href="#tech-stack">Tech Stack</a> •
    <a href="#quick-start">Quick Start</a> •
    <a href="#deployment">Deployment</a>
  </p>
</div>

---

## ✨ Features

### 👤 User Features

- **🔐 Authentication**: Secure email/password signup, login, and password reset
- **📝 Submit Links**: Authenticated users can submit AI tools and websites
- **🔍 Browse & Search**: View all active links with powerful full-text search
- **🏷️ Filter by Category**: Multi-select category filtering with "match all" or "match any" modes
- **👤 User Profile**: Manage personal profile information
- **⚡ Real-time Updates**: See new links instantly via Supabase subscriptions

### 🛡️ Admin Features

- **📊 Admin Dashboard**: View all links (active, inactive, broken)
- **🔗 Link Management**: Change link status or delete unworking tools
- **👥 User Management**: View user roles and permissions
- **📈 Real-time Monitoring**: See all changes across the platform instantly

---

## 🛠️ Tech Stack

| Component          | Technology                                                                                                                                                                                                                                                   |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Frontend**       | <img src="https://img.shields.io/badge/Next.js-16-black?logo=next.js" alt="Next.js"> <img src="https://img.shields.io/badge/React-19-blue?logo=react" alt="React"> <img src="https://img.shields.io/badge/TypeScript-blue?logo=typescript" alt="TypeScript"> |
| **Styling**        | <img src="https://img.shields.io/badge/Tailwind%20CSS-4-38B2AC?logo=tailwindcss" alt="Tailwind CSS"> <img src="https://img.shields.io/badge/shadcn/ui-000000?logo=shadcnui" alt="shadcn/ui">                                                                 |
| **Authentication** | <img src="https://img.shields.io/badge/Supabase-3ECF8E?logo=supabase" alt="Supabase Auth">                                                                                                                                                                   |
| **Database**       | <img src="https://img.shields.io/badge/PostgreSQL-4169E1?logo=postgresql" alt="PostgreSQL"> with Row-Level Security                                                                                                                                          |
| **Real-time**      | <img src="https://img.shields.io/badge/Supabase%20Realtime-3ECF8E?logo=supabase" alt="Supabase Realtime">                                                                                                                                                    |
| **Deployment**     | <img src="https://img.shields.io/badge/Vercel-000000?logo=vercel" alt="Vercel">                                                                                                                                                                              |

---

## 🚀 Quick Start

### Prerequisites

- <img src="https://img.shields.io/badge/Node.js-18+-green?logo=node.js" alt="Node.js"> 18+
- <img src="https://img.shields.io/badge/Supabase-Free%20Tier-3ECF8E?logo=supabase" alt="Supabase"> account (free tier works)

### Setup

1. **Clone and install**

   ```bash
   git clone https://github.com/yourusername/Developer_Resource_Hub.git
   cd Developer_Resource_Hub
   npm install
   ```

2. **Configure Supabase**

   - Create a project at [supabase.com](https://supabase.com)
   - Copy your Project URL and anon key from Settings > API
   - Create `.env.local`:
     ```env
     NEXT_PUBLIC_SUPABASE_URL=your_url
     NEXT_PUBLIC_SUPABASE_ANON_KEY=your_key
     NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL=http://localhost:3000
     ```

3. **Run database migrations**

   - Go to Supabase SQL Editor
   - Copy contents of `scripts/001_create_tables.sql`
   - Execute the SQL

4. **Create admin user**

   - Sign up at `http://localhost:3000/auth/register`
   - Verify your email
   - In Supabase, run:
     ```sql
     UPDATE public.profiles SET role = 'admin' WHERE email = 'your-email@example.com';
     ```

5. **Start development**
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000)

---

## 📁 Project Structure

```
app/
├── page.tsx               # Homepage with link grid
├── auth/                  # Authentication pages
│ ├── login/
│ ├── register/
│ ├── forgot-password/
│ ├── reset-password/
│ └── callback/
├── admin/                 # Admin dashboard (protected)
├── profile/               # User profile (protected)
└── submit-link/           # Link submission (protected)

components/
├── auth/user-menu.tsx     # User dropdown
├── links/                 # Link display components
├── filters-bar.tsx        # Search & filter
└── site-header.tsx        # Navigation

lib/supabase/              # Supabase clients & middleware
scripts/                   # Database migrations
```

---

## 🔒 Security

- **🛡️ Row-Level Security (RLS)**: All tables protected with RLS policies
- **👤 User Isolation**: Users can only view/edit their own data
- **👑 Admin Access**: Admins can manage all links
- **✉️ Email Verification**: Required for account activation
- **🔐 Password Reset**: Secure email-based password recovery

---

## 🌐 Deployment

### Deploy to Vercel

1. Push to GitHub
2. Import repository on [vercel.com](https://vercel.com)
3. Add environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Deploy

---

## 🧩 Troubleshooting

### "User not authenticated"

- Verify email is confirmed
- Check Supabase session is valid
- Try logging out and back in

### Links not appearing

- Ensure link status is 'active'
- Check RLS policies in Supabase
- Check browser console for errors

### Admin dashboard not accessible

- Verify user role is 'admin' in profiles table
- Log out and back in

---

## 📚 Resources & Support

- <img src="https://img.shields.io/badge/Supabase-Docs-3ECF8E?logo=supabase" alt="Supabase Docs"> [Supabase Docs](https://supabase.com/docs)
- <img src="https://img.shields.io/badge/Next.js-Docs-black?logo=next.js" alt="Next.js Docs"> [Next.js Docs](https://nextjs.org/docs)
- <img src="https://img.shields.io/badge/shadcn/ui-Documentation-000000?logo=shadcnui" alt="shadcn/ui"> [shadcn/ui](https://ui.shadcn.com)

---

## 📄 License

<img src="https://img.shields.io/badge/License-MIT-green" alt="License"> MIT
