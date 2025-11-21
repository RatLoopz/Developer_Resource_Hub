# Developer_Resource_Hub

_A fully functional, responsive website for storing and organizing links to AI tools and useful websites with user authentication and admin management._

## Features

### User Features

- **Authentication**: Email/password signup, login, and password reset
- **Submit Links**: Authenticated users can submit AI tools and websites
- **Browse & Search**: View all active links with full-text search
- **Filter by Category**: Multi-select category filtering with "match all" or "match any" modes
- **User Profile**: Manage personal profile information
- **Real-time Updates**: See new links instantly via Supabase subscriptions

### Admin Features

- **Admin Dashboard**: View all links (active, inactive, broken)
- **Link Management**: Change link status or delete unworking tools
- **User Management**: View user roles and permissions
- **Real-time Monitoring**: See all changes across the platform instantly

## Tech Stack

- **Frontend**: Next.js 16 (App Router), React 19, TypeScript
- **Styling**: Tailwind CSS v4, shadcn/ui components
- **Authentication**: Supabase Auth (email/password)
- **Database**: Supabase PostgreSQL with Row-Level Security
- **Real-time**: Supabase Realtime subscriptions
- **Deployment**: Vercel

## Quick Start

### Prerequisites

- Node.js 18+
- Supabase account (free tier works)

### Setup

1. **Clone and install**
   \`\`\`bash
   git clone <repo-url>
   cd ai-links-hub
   npm install
   \`\`\`

2. **Configure Supabase**

   - Create a project at [supabase.com](https://supabase.com)
   - Copy your Project URL and anon key from Settings > API
   - Create `.env.local`:
     \`\`\`env
     NEXT_PUBLIC_SUPABASE_URL=your_url
     NEXT_PUBLIC_SUPABASE_ANON_KEY=your_key
     NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL=http://localhost:3000
     \`\`\`

3. **Run database migrations**

   - Go to Supabase SQL Editor
   - Copy contents of `scripts/001_create_tables.sql`
   - Execute the SQL

4. **Create admin user**

   - Sign up at `http://localhost:3000/auth/register`
   - Verify your email
   - In Supabase, run:
     \`\`\`sql
     UPDATE public.profiles SET role = 'admin' WHERE email = 'your-email@example.com';
     \`\`\`

5. **Start development**
   \`\`\`bash
   npm run dev
   \`\`\`
   Open [http://localhost:3000](http://localhost:3000)

## Project Structure

\`\`\`
app/
├── page.tsx # Homepage with link grid
├── auth/ # Authentication pages
│ ├── login/
│ ├── register/
│ ├── forgot-password/
│ ├── reset-password/
│ └── callback/
├── admin/ # Admin dashboard (protected)
├── profile/ # User profile (protected)
└── submit-link/ # Link submission (protected)

components/
├── auth/user-menu.tsx # User dropdown
├── links/ # Link display components
├── filters-bar.tsx # Search & filter
└── site-header.tsx # Navigation

lib/supabase/ # Supabase clients & middleware
scripts/ # Database migrations
\`\`\`

## Database Schema

### profiles

- `id` (UUID, PK) - References auth.users
- `email` (text)
- `full_name` (text)
- `role` (text) - 'user' or 'admin'
- `created_at`, `updated_at`

### links

- `id` (UUID, PK)
- `user_id` (UUID, FK)
- `name`, `url`, `description` (text)
- `categories` (text[])
- `icon_url`, `icon_data_url` (text)
- `status` (text) - 'active', 'inactive', or 'broken'
- `created_at`, `updated_at`

## Security

- **Row-Level Security (RLS)**: All tables protected with RLS policies
- **User Isolation**: Users can only view/edit their own data
- **Admin Access**: Admins can manage all links
- **Email Verification**: Required for account activation
- **Password Reset**: Secure email-based password recovery

## Deployment

### Deploy to Vercel

1. Push to GitHub
2. Import repository on [vercel.com](https://vercel.com)
3. Add environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Deploy

## User Flows

### Registration

1. User signs up with email/password
2. Verification email sent
3. User clicks link to verify
4. Account activated, can now submit links

### Submitting a Link

1. Authenticated user clicks "Submit Link"
2. Fills form: name, URL, description, categories, icon
3. Link created with status 'active'
4. Appears immediately on homepage

### Admin Management

1. Admin logs in → User menu → "Admin Dashboard"
2. View all links with their status
3. Change status to 'broken' or delete
4. Non-admins won't see broken links

## Troubleshooting

**"User not authenticated"**

- Verify email is confirmed
- Check Supabase session is valid
- Try logging out and back in

**Links not appearing**

- Ensure link status is 'active'
- Check RLS policies in Supabase
- Check browser console for errors

**Admin dashboard not accessible**

- Verify user role is 'admin' in profiles table
- Log out and back in

## Support

- [Supabase Docs](https://supabase.com/docs)
- [Next.js Docs](https://nextjs.org/docs)
- [shadcn/ui](https://ui.shadcn.com)

## License

MIT
