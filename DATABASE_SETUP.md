# Database Setup Guide

This guide explains how to set up the Supabase database schema for the Sica Frontend authentication system.

## Required Database Schema

### 1. Profiles Table

The `profiles` table extends the default Supabase `auth.users` table with additional user information.

```sql
-- Create a table for public profiles
create table profiles (
  id uuid references auth.users on delete cascade not null primary key,
  updated_at timestamp with time zone,
  username text unique,
  full_name text,
  avatar_url text,
  website text,

  constraint username_length check (char_length(username) >= 3)
);

-- Set up Row Level Security (RLS)
alter table profiles enable row level security;

create policy "Public profiles are viewable by everyone." on profiles
  for select using (true);

create policy "Users can insert their own profile." on profiles
  for insert with check (auth.uid() = id);

create policy "Users can update own profile." on profiles
  for update using (auth.uid() = id);

-- This trigger automatically creates a profile entry when a new user signs up via Supabase Auth.
create function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, avatar_url)
  values (new.id, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url');
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
```

### 2. Chat-related Tables (for MCP functionality)

```sql
-- Create chats table for storing chat sessions
create table chats (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  title text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table chats enable row level security;

-- Create policies
create policy "Users can view own chats" on chats
  for select using (auth.uid() = user_id);

create policy "Users can insert own chats" on chats
  for insert with check (auth.uid() = user_id);

create policy "Users can update own chats" on chats
  for update using (auth.uid() = user_id);

create policy "Users can delete own chats" on chats
  for delete using (auth.uid() = user_id);

-- Create messages table for storing chat messages
create table messages (
  id uuid default gen_random_uuid() primary key,
  chat_id uuid references chats(id) on delete cascade not null,
  role text not null check (role in ('user', 'assistant')),
  content text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table messages enable row level security;

-- Create policies (users can access messages from their own chats)
create policy "Users can view messages from own chats" on messages
  for select using (
    exists (
      select 1 from chats 
      where chats.id = messages.chat_id 
      and chats.user_id = auth.uid()
    )
  );

create policy "Users can insert messages to own chats" on messages
  for insert with check (
    exists (
      select 1 from chats 
      where chats.id = messages.chat_id 
      and chats.user_id = auth.uid()
    )
  );

-- Create indexes for performance
create index idx_chats_user_id on chats(user_id);
create index idx_chats_created_at on chats(created_at desc);
create index idx_messages_chat_id on messages(chat_id);
create index idx_messages_created_at on messages(created_at);
```

## Setup Instructions

### 1. Using Supabase Dashboard

1. Go to your [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Navigate to the **SQL Editor**
4. Copy and paste the SQL schema above
5. Click **Run** to execute

### 2. Using Supabase CLI

If you have the Supabase CLI installed:

```bash
# Initialize Supabase (if not already done)
supabase init

# Create a new migration
supabase migration new setup_auth_schema

# Add the SQL code to the migration file
# Then apply the migration
supabase db push
```

### 3. Verify Setup

After running the SQL, verify the setup:

1. **Check Tables**: Go to **Table Editor** in Supabase Dashboard
2. **Verify RLS**: Ensure Row Level Security is enabled on all tables
3. **Test Policies**: Try signing up a new user to see if a profile is automatically created

## Environment Variables

Make sure your `.env.local` file contains:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key

# Database URL (for Drizzle/Neon if used)
DATABASE_URL=postgresql://postgres.your-project:[YOUR_PASSWORD]@aws-0-eu-central-1.pooler.supabase.com:6543/postgres
```

## OAuth Provider Configuration

### 1. Google OAuth

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create/select a project
3. Enable Google+ API
4. Create OAuth 2.0 credentials
5. Add authorized redirect URIs:
   - `https://your-project.supabase.co/auth/v1/callback`
   - `http://localhost:3000/auth/callback` (for development)

### 2. GitHub OAuth

1. Go to GitHub → Settings → Developer settings → OAuth Apps
2. Create a new OAuth App
3. Set Authorization callback URL:
   - `https://your-project.supabase.co/auth/v1/callback`

### 3. Configure in Supabase

1. Go to **Authentication** → **Providers** in Supabase Dashboard
2. Enable and configure each provider with your client credentials

## Testing

### 1. Basic Authentication

```bash
# Start the development server
npm run dev

# Test the flow:
# 1. Visit http://localhost:3000
# 2. Should redirect to /login
# 3. Sign up with email/password
# 4. Check profile was created in database
# 5. Sign out and sign in again
```

### 2. OAuth Testing

- Test Google OAuth flow
- Test GitHub OAuth flow  
- Verify user profiles are created correctly

### 3. Database Verification

```sql
-- Check profiles table
select * from profiles;

-- Check chats (after creating some)
select * from chats;

-- Check RLS is working
-- Should only return current user's data when authenticated
```

## Troubleshooting

### Common Issues

1. **Profile not created automatically**
   - Check the trigger function exists
   - Verify the trigger is attached to `auth.users`
   - Check Supabase logs for errors

2. **RLS blocking access**
   - Verify policies are correctly defined
   - Check user authentication status
   - Test policies in SQL editor

3. **OAuth not working**
   - Verify redirect URLs match exactly
   - Check provider configuration in Supabase
   - Test with browser dev tools for errors

### Useful SQL Queries

```sql
-- Check if trigger exists
SELECT * FROM information_schema.triggers 
WHERE trigger_name = 'on_auth_user_created';

-- Check RLS policies
SELECT * FROM pg_policies WHERE tablename IN ('profiles', 'chats', 'messages');

-- Test profile creation manually
INSERT INTO auth.users (id, email) VALUES (gen_random_uuid(), 'test@example.com');
```

## Production Considerations

1. **Security**
   - Review and test all RLS policies
   - Ensure proper HTTPS configuration
   - Set up proper CORS settings

2. **Performance**
   - Monitor database indexes
   - Set up proper connection pooling
   - Consider read replicas for high traffic

3. **Backup**
   - Enable automatic backups in Supabase
   - Test restore procedures
   - Document recovery processes

This schema setup follows Supabase best practices and integrates seamlessly with the authentication system we've built.




