# Developer_Resource_Hub - Setup Guide

This is a fully functional Developer_Resource_Hub with user authentication, role-based access control, and admin management features.

## Features

### User Features

- **Sign Up & Login**: Email/password authentication with Supabase
- **Forgot Password**: Password reset via email
- **Submit Links**: Authenticated users can submit new AI tools and websites
- **Browse Links**: View all active links with search and category filtering
- **Profile Management**: Update user profile information

### Admin Features

- **Admin Dashboard**: View all links (active, inactive, broken)
- **Link Management**: Change link status (active/broken) or delete links
- **User Management**: View user roles and manage permissions
- **Real-time Updates**: See changes instantly across all users

## Prerequisites

- Node.js 18+ and npm/pnpm
- Supabase account (free tier works)
- Vercel account (optional, for deployment)

## Setup Instructions

### 1. Clone and Install

\`\`\`bash
git clone <your-repo-url>
cd ai-links-hub
npm install

# or

pnpm install
\`\`\`

### 2. Set Up Supabase

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Wait for the project to initialize
3. Go to **Settings > API** and copy:
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### 3. Configure Environment Variables

Create a `.env.local` file in the root directory:

\`\`\`env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL=http://localhost:3000
\`\`\`

### 4. Run Database Migrations

The database schema is defined in `scripts/001_create_tables.sql`. You have two options:

**Option A: Using Supabase Dashboard (Recommended for first-time setup)**

1. Go to your Supabase project
2. Click **SQL Editor** in the left sidebar
3. Click **New Query**
4. Copy the entire contents of `scripts/001_create_tables.sql`
5. Paste it into the SQL editor
6. Click **Run**

**Option B: Using the migration script**
\`\`\`bash
npm run migrate
\`\`\`

### 5. Create an Admin User

1. Sign up a new account at `http://localhost:3000/auth/register`
2. Verify your email
3. Go to your Supabase dashboard
4. Navigate to **SQL Editor** and run:

\`\`\`sql
UPDATE public.profiles
SET role = 'admin'
WHERE email = 'your-email@example.com';
\`\`\`

### 6. Start Development Server

\`\`\`bash
npm run dev
\`\`\`

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

\`\`\`
app/
├── page.tsx # Homepage with link grid
├── auth/
│ ├── login/ # Login page
│ ├── register/ # Registration page
│ ├── forgot-password/ # Password reset request
│ ├── reset-password/ # Password reset form
│ ├── callback/ # Email verification callback
│ └── error/ # Auth error page
├── admin/ # Admin dashboard (protected)
├── profile/ # User profile page (protected)
└── submit-link/ # Link submission form (protected)

components/
├── auth/
│ └── user-menu.tsx # User dropdown menu
├── links/
│ ├── links-provider.tsx # Supabase data provider
│ ├── links-grid.tsx # Link grid display
│ └── link-card.tsx # Individual link card
├── filters-bar.tsx # Search and category filters
└── site-header.tsx # Navigation header

lib/
└── supabase/
├── client.ts # Browser Supabase client
├── server.ts # Server Supabase client
└── middleware.ts # Auth middleware

scripts/
└── 001_create_tables.sql # Database schema

middleware.ts # Next.js middleware for auth
\`\`\`

## User Flows

### Registration & Email Verification

1. User signs up with email and password
2. Confirmation email is sent
3. User clicks link in email to verify
4. User can now log in and submit links

### Submitting a Link

1. Authenticated user clicks "Submit Link"
2. Fills in: name, URL, description, categories, icon
3. Link is created with `status: 'active'`
4. Link appears immediately on homepage

### Admin Management

1. Admin logs in and clicks user menu → "Admin Dashboard"
2. Sees all links with their status
3. Can change status to "broken" or delete links
4. Non-admin users won't see broken links

## Database Schema

### profiles table

- `id` (UUID, PK) - References auth.users
- `email` (text) - User email
- `full_name` (text) - User's full name
- `role` (text) - 'user' or 'admin'
- `created_at`, `updated_at` (timestamps)

### links table

- `id` (UUID, PK)
- `user_id` (UUID, FK) - Who submitted the link
- `name` (text) - Website name
- `url` (text) - Website URL
- `description` (text) - Short description
- `categories` (text[]) - Array of categories
- `icon_url` (text) - Icon URL
- `icon_data_url` (text) - Base64 encoded icon
- `status` (text) - 'active', 'inactive', or 'broken'
- `created_at`, `updated_at` (timestamps)

## Row Level Security (RLS)

All tables have RLS enabled:

- **profiles**: Users can only view/edit their own profile
- **links**:
  - Everyone can view active links
  - Users can view/edit/delete their own links
  - Admins can view/edit/delete all links

## Deployment

### Deploy to Vercel

1. Push your code to GitHub
2. Go to [vercel.com](https://vercel.com)
3. Click "New Project" and import your repository
4. Add environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
5. Click "Deploy"

### Update Email Redirect URL

After deploying, update the redirect URL in `.env.local`:

\`\`\`env
NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL=https://your-domain.vercel.app
\`\`\`

## Troubleshooting

### "User not authenticated" error

- Make sure you've verified your email
- Check that your Supabase session is valid
- Try logging out and back in

### Links not appearing

- Check that the link status is 'active'
- Verify RLS policies are correctly set up
- Check browser console for errors

### Admin dashboard not accessible

- Verify your user role is 'admin' in the profiles table
- Try logging out and back in

### Email verification not working

- Check spam folder
- Verify `NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL` is correct
- Check Supabase email settings

## Support

For issues or questions:

1. Check the [Supabase documentation](https://supabase.com/docs)
2. Review the [Next.js documentation](https://nextjs.org/docs)
3. Open an issue on GitHub

## License

MIT
