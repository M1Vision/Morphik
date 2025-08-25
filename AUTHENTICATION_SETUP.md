# Authentication Setup Guide

This guide explains how to set up Supabase authentication for the Sica Frontend.

## 🔧 Environment Setup

### 1. Create `.env.local` file

Create a `.env.local` file in the root of the Sica Frontend directory with the following content:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://mohsljimdduthwjhygkp.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1vaHNsamltZGR1dGh3amh5Z2twIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYxMDgwMDUsImV4cCI6MjA3MTY4NDAwNX0.jacpTDGtJByh8xUvUgu9CofMK08af1yFjfGtDzvL7o4

# Database URL (for Drizzle)
DATABASE_URL=postgresql://postgres.mohsljimdduthwjhygkp:[YOUR_PASSWORD]@aws-0-eu-central-1.pooler.supabase.com:6543/postgres

# Optional: API Keys for AI providers (for MCP functionality)
# OPENAI_API_KEY=your_openai_api_key
# ANTHROPIC_API_KEY=your_anthropic_api_key
# GOOGLE_GENERATIVE_AI_API_KEY=your_google_api_key
```

**Important**: Replace `[YOUR_PASSWORD]` with your actual Supabase database password.

### 2. Install Dependencies

The required dependencies are already included in package.json:
- `@supabase/supabase-js` ^2.56.0
- `@supabase/auth-ui-react` ^0.4.7  
- `@supabase/auth-ui-shared` ^0.1.8
- `@supabase/ssr` ^0.7.0
- `@supabase/auth-helpers-nextjs` ^0.10.0

**Note**: We're using local Auth UI components (`lib/auth-ui-local/`) instead of the deprecated `@supabase/auth-ui-react` package as mentioned in the [Supabase documentation](https://supabase.com/docs/guides/auth/auth-helpers/auth-ui). The local components provide better customization and are maintained for this project.

## 🏗️ Architecture Overview

### Authentication Flow
1. **Unauthenticated users** → Redirected to `/login`
2. **Login page** → Supabase Auth UI with email/password and OAuth providers
3. **Successful auth** → Redirected to main app (`/`)
4. **Main app** → Protected by middleware, shows chat interface

### Key Components

1. **AuthProvider** (`lib/context/auth-context.tsx`)
   - Manages authentication state
   - Provides user session throughout the app

2. **Login Page** (`app/login/page.tsx`)
   - Local Auth UI components with multiple providers
   - Email/password, magic link, and OAuth support
   - Auto-redirects if already authenticated

3. **Middleware** (`middleware.ts`)
   - Protects routes
   - Handles redirects for auth/unauth users

4. **UserProfile** (`components/user-profile.tsx`)
   - User dropdown in sidebar
   - Profile info and logout functionality

5. **Local Auth UI** (`lib/auth-ui-local/`)
   - Custom Auth components based on Supabase patterns
   - EmailAuth, SocialAuth, ForgottenPassword, MagicLink, UpdatePassword
   - Integrated with shadcn/ui components

## 🔒 Security Features

- **Route Protection**: Middleware blocks access to main app without auth
- **Session Management**: Automatic session refresh
- **OAuth Support**: Google, GitHub providers configured
- **Secure Cookies**: Server-side session handling

## 🎨 UI Features

- **Themed Auth UI**: Matches app design system
- **Loading States**: Smooth transitions during auth
- **Error Handling**: User-friendly error messages
- **Responsive Design**: Works on all devices

## 🧪 Testing

### 1. Start the Development Server
```bash
npm run dev
```

### 2. Test Authentication Flow
1. Visit `http://localhost:3000`
2. Should redirect to `/login`
3. Sign up/sign in with email or OAuth
4. Should redirect to main chat interface
5. Verify user profile in sidebar
6. Test logout functionality

### 3. Test Route Protection
- Try accessing `/` without auth → Should redirect to login
- Try accessing `/login` with auth → Should redirect to main app

## 🐛 Troubleshooting

### Common Issues

1. **Environment Variables Not Working**
   - Ensure `.env.local` is in the project root
   - Restart the development server after changes
   - Check browser network tab for 400/401 errors

2. **OAuth Providers Not Working**
   - Configure OAuth providers in Supabase dashboard
   - Add correct redirect URLs in provider settings
   - Verify callback URL: `http://localhost:3000/auth/callback`

3. **Database Connection Issues**
   - Verify DATABASE_URL has correct password
   - Check Supabase project status
   - Test connection with `npm run db:studio`

4. **Session Not Persisting**
   - Check browser cookies are enabled
   - Verify Supabase project configuration
   - Check middleware.ts is running correctly

### Debug Mode

Add to `.env.local` for debugging:
```env
NEXT_PUBLIC_DEBUG_AUTH=true
```

## 🚀 Production Deployment

### Environment Variables
Set these in your deployment platform:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `DATABASE_URL`

### Supabase Configuration
1. Add production URLs to Supabase Auth settings
2. Configure OAuth provider redirect URLs
3. Set up proper email templates
4. Enable email confirmations if needed

### Security Checklist
- [ ] Use HTTPS in production
- [ ] Configure proper CORS settings
- [ ] Set up email verification
- [ ] Review OAuth provider settings
- [ ] Enable RLS policies in Supabase

## 🗄️ Database Setup

**Important**: You need to set up the database schema before using authentication. See `DATABASE_SETUP.md` for complete instructions.

Key requirements:
- `profiles` table with RLS policies
- `chats` and `messages` tables for MCP functionality  
- Automatic profile creation trigger
- OAuth provider configuration

## 📚 Additional Resources

- [Supabase Auth Documentation](https://supabase.com/docs/guides/auth)
- [Next.js Authentication](https://nextjs.org/docs/authentication)
- [Supabase Auth UI (Deprecated)](https://supabase.com/docs/guides/auth/auth-helpers/auth-ui)
- [Database Setup Guide](./DATABASE_SETUP.md) - **Must read**

