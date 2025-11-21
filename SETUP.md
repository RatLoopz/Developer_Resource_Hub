# Developer Resource Hub - Setup Guide

Welcome to the Developer Resource Hub, a comprehensive platform for discovering and sharing AI tools and resources. This guide will walk you through setting up the application, which features user authentication, role-based access control, and robust admin management capabilities.

## Features

### User Features

- **Secure Authentication**: Email/password authentication powered by Supabase with robust security measures
- **Password Recovery**: Simple password reset process via email verification
- **Resource Submission**: Authenticated users can submit new AI tools, websites, and resources
- **Advanced Browsing**: View all active resources with powerful search and category filtering capabilities
- **Profile Management**: Easy-to-use interface for updating user profile information and preferences

### Admin Features

- **Comprehensive Dashboard**: Centralized admin interface for managing all resources and their status
- **Resource Management**: Efficiently change link status (active/inactive/broken) or remove outdated resources
- **User Administration**: View user roles and manage permissions with granular control
- **Real-time Synchronization**: Instant updates across all connected users for seamless collaboration

## Prerequisites

Before you begin, ensure you have the following installed and configured:

- **Node.js**: Version 18 or higher with npm or pnpm package manager
- **Supabase Account**: A free or paid account at [supabase.com](https://supabase.com)
- **Vercel Account** (Optional): For deployment to production environment at [vercel.com](https://vercel.com)
- **Git**: For version control and repository management
- **Basic Knowledge**: Familiarity with React/Next.js and SQL concepts is helpful

## Setup Instructions

### 1. Clone and Install Dependencies

First, clone the repository and install the required dependencies:

```bash
git clone https://github.com/your-username/Developer_Resource_Hub.git
cd Developer_Resource_Hub

# Using npm
npm install

# Or using pnpm (recommended)
pnpm install
```

### 2. Configure Supabase Backend

Supabase provides the backend services for authentication and data storage:

1. Navigate to [supabase.com](https://supabase.com) and sign in or create a new account
2. Click "New Project" and configure your project settings:
   - Choose a name for your project (e.g., "Developer Resource Hub")
   - Select a database region closest to your users
   - Set a strong database password
3. Wait for the project to initialize (typically 1-2 minutes)
4. Once ready, navigate to **Settings > API** in your project dashboard
5. Copy the following credentials:
   - **Project URL** → Will be used as `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** key → Will be used as `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### 3. Configure Environment Variables

Create a `.env.local` file in the root directory of your project to store your Supabase credentials:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Development Environment
NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL=http://localhost:3000

# (Optional) Production Environment (for later deployment)
# NEXT_PUBLIC_PROD_SUPABASE_REDIRECT_URL=https://your-domain.vercel.app
```

Replace the placeholder values with the actual credentials obtained from your Supabase project.

### 4. Set Up Database Schema

The application requires a specific database schema to function correctly. The schema is defined in `scripts/001_create_tables.sql`. You have two options to set it up:

**Option A: Using Supabase Dashboard (Recommended for first-time setup)**

1. Navigate to your Supabase project dashboard
2. Click **SQL Editor** in the left sidebar
3. Click **New Query** to open a new query window
4. Open the `scripts/001_create_tables.sql` file in your code editor
5. Copy the entire contents of the file
6. Paste it into the SQL editor in Supabase
7. Click **Run** to execute the SQL commands
8. Verify that all tables were created successfully

**Option B: Using the migration script**

```bash
# Run the migration script
npm run migrate
```

This option requires the Supabase CLI to be installed and configured with your project.

### 5. Create an Admin Account

To access admin features, you need to promote a user account to admin status:

1. Start your development server (see step 6)
2. Navigate to `http://localhost:3000/auth/register` and create a new account
3. Check your email and click the verification link to activate your account
4. Log in to your Supabase dashboard
5. Navigate to **SQL Editor** in the left sidebar
6. Click **New Query** and run the following SQL command:

```sql
UPDATE public.profiles
SET role = 'admin'
WHERE email = 'your-email@example.com';
```

Replace `your-email@example.com` with the email you used to register the account.

7. Log out and back in to your application to refresh your permissions

### 6. Launch the Development Server

You're now ready to start the development server:

```bash
# Using npm
npm run dev

# Or using pnpm
pnpm dev
```

Once the server is running, open [http://localhost:3000](http://localhost:3000) in your browser to access the application.

You can now:

- Register a new user account
- Log in with your credentials
- Submit new resources
- Access the admin dashboard (if you've set up an admin account)

## User Flows

### Registration & Email Verification

The user registration process follows a secure email verification workflow:

1. User navigates to the registration page and provides their email and password
2. Upon submission, the system sends a confirmation email with a verification link
3. User clicks the verification link to activate their account
4. Once verified, the user can log in and access all platform features

### Resource Submission

Authenticated users can contribute to the resource hub through a streamlined submission process:

1. User navigates to the "Submit Resource" section from their dashboard
2. User completes the submission form with:
   - Resource name and URL
   - Detailed description
   - Relevant categories for classification
   - Optional icon for visual identification
3. The submitted resource is created with `status: 'active'` by default
4. The resource immediately appears on the homepage for all users to discover

### Administrative Management

Administrators have comprehensive control over platform content through a dedicated dashboard:

1. Admin logs in and accesses the Admin Dashboard from the user menu
2. The dashboard displays all submitted resources with their current status
3. Admins can perform the following actions:
   - Change resource status to "active", "inactive", or "broken"
   - Remove inappropriate or outdated resources
   - Review user submissions for quality assurance
4. Non-admin users only see resources with "active" status, ensuring a quality experience

## Database Schema

The application uses a PostgreSQL database with the following primary tables:

### profiles Table

Stores user profile information and permissions:

- `id` (UUID, Primary Key) - References auth.users table
- `email` (text) - User's registered email address
- `full_name` (text) - User's display name
- `role` (text) - User permission level: 'user' or 'admin'
- `created_at` (timestamp) - Account creation timestamp
- `updated_at` (timestamp) - Last profile update timestamp

### links Table

Stores all submitted resources with their metadata:

- `id` (UUID, Primary Key) - Unique identifier for each resource
- `user_id` (UUID, Foreign Key) - References the submitting user
- `name` (text) - Resource display name
- `url` (text) - Direct URL to the resource
- `description` (text) - Brief description of the resource
- `categories` (text[]) - Array of category tags for filtering
- `icon_url` (text) - External URL to resource icon
- `icon_data_url` (text) - Base64 encoded icon for fallback
- `status` (text) - Resource status: 'active', 'inactive', or 'broken'
- `created_at` (timestamp) - Resource submission timestamp
- `updated_at` (timestamp) - Last modification timestamp

## Row Level Security (RLS)

The application implements Supabase's Row Level Security (RLS) to ensure data privacy and integrity:

### profiles Table Security

- **Self-Access Policy**: Users can only view and modify their own profile information
- **Admin Override**: Administrators have read access to all profiles for user management

### links Table Security

- **Public Access to Active Resources**: All visitors can view resources with `status: 'active'`
- **Creator Control**: Users can view, edit, and delete their own submitted resources
- **Administrative Oversight**: Admins have full control over all resources regardless of status

These security policies ensure that user data remains private while maintaining an open platform for resource sharing.

## Deployment

### Deploy to Vercel

Vercel provides an optimal hosting solution for Next.js applications with automatic deployments from Git:

1. **Prepare Your Repository**:

   - Commit all changes to your local Git repository
   - Push your code to GitHub (or GitLab/Bitbucket)

2. **Connect to Vercel**:

   - Navigate to [vercel.com](https://vercel.com) and sign in
   - Click "New Project" to begin the deployment process
   - Import your repository using the Git provider integration

3. **Configure Project Settings**:

   - Vercel will automatically detect the Next.js framework
   - Ensure the build command is set to `npm run build` or `pnpm build`
   - Set the output directory to `.next` (default for Next.js)

4. **Add Environment Variables**:

   - Navigate to the "Environment Variables" section
   - Add the following variables from your development environment:
     - `NEXT_PUBLIC_SUPABASE_URL`
     - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
     - `NEXT_PUBLIC_PROD_SUPABASE_REDIRECT_URL` (set to your deployment URL)

5. **Deploy**:
   - Click "Deploy" to initiate the build and deployment process
   - Vercel will provide you with a production URL upon completion

### Configure Email Authentication

After successful deployment, update your Supabase authentication settings:

1. Navigate to your Supabase project dashboard
2. Go to **Authentication > Settings**
3. Update the "Site URL" to your production domain
4. Add your production URL to the "Redirect URLs" list
5. Update the email template redirect URLs if necessary

This ensures that email verification and password reset links direct users to your production environment.

## Troubleshooting

### Authentication Issues

**"User not authenticated" error**

- Ensure you have completed the email verification process by clicking the link in your registration email
- Verify your Supabase session is still valid by checking browser local storage
- Clear browser cookies and try logging out and back in
- Check that your environment variables are correctly configured

**Email verification not working**

- Check your spam or junk folder for the verification email
- Verify the `NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL` environment variable matches your local development URL
- Confirm your Supabase project's email settings are properly configured in Authentication > Settings

### Resource Display Issues

**Resources not appearing on homepage**

- Confirm the resource status is set to 'active' in the database
- Verify Row Level Security (RLS) policies are correctly implemented
- Check the browser console for any JavaScript errors
- Ensure the Supabase connection is working by testing the API endpoints

### Administrative Access Issues

**Admin dashboard not accessible**

- Verify your user role is set to 'admin' in the profiles table
- Try logging out and clearing browser cache, then logging back in
- Check that the middleware is correctly protecting admin routes
- Ensure your authentication token has the necessary claims

## Support

If you encounter any issues or have questions about the Developer Resource Hub, we recommend the following resources:

### Documentation

1. **Supabase Documentation**: Comprehensive guides for authentication, database management, and real-time subscriptions

   - [supabase.com/docs](https://supabase.com/docs)

2. **Next.js Documentation**: Detailed information about the React framework used in this project

   - [nextjs.org/docs](https://nextjs.org/docs)

3. **Project Wiki**: Additional documentation specific to this application
   - [GitHub Wiki](https://github.com/your-username/Developer_Resource_Hub/wiki)

### Community Support

1. **GitHub Issues**: Report bugs or request features

   - [Create an Issue](https://github.com/your-username/Developer_Resource_Hub/issues)

2. **GitHub Discussions**: Ask questions and share ideas with the community
   - [Join the Discussion](https://github.com/your-username/Developer_Resource_Hub/discussions)

## License

This project is licensed under the MIT License, which permits reuse, modification, and distribution under specific conditions. For full details, see the [LICENSE](https://github.com/your-username/Developer_Resource_Hub/blob/main/LICENSE) file in the repository.

### Key Points

- ✅ Commercial use is permitted
- ✅ Modification and distribution are allowed
- ✅ Private use is permitted
- ⚠️ Must include the original copyright and license notice
- ❌ Liability is disclaimed
- ❌ No warranty is provided
