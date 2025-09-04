-- Updated Supabase Database Setup for Scira Frontend Authentication
-- Compatible with Drizzle Schema

-- ============================================================================
-- 0. CLEANUP AND PREPARATION
-- ============================================================================

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Drop existing tables (careful with this in production!)
DROP TABLE IF EXISTS public.messages;
DROP TABLE IF EXISTS public.chats;
DROP TABLE IF EXISTS public.profiles;

-- ============================================================================
-- 1. PROFILES TABLE
-- ============================================================================

-- Create profiles table with comprehensive schema
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  username text UNIQUE,
  full_name text,
  company_name text,
  avatar_url text,
  website text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  
  CONSTRAINT username_length CHECK (char_length(username) >= 3)
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for profiles
CREATE POLICY "Public profiles are viewable by everyone." ON public.profiles
  FOR SELECT USING (true);

CREATE POLICY "Users can insert their own profile." ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile." ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can delete own profile." ON public.profiles
  FOR DELETE USING (auth.uid() = id);

-- ============================================================================
-- 2. CHATS TABLE (Updated for Drizzle compatibility)
-- ============================================================================

-- Create chats table matching Drizzle schema
CREATE TABLE public.chats (
  id text PRIMARY KEY NOT NULL,
  user_id text NOT NULL,
  title text NOT NULL DEFAULT 'New Chat',
  created_at timestamp DEFAULT now() NOT NULL,
  updated_at timestamp DEFAULT now() NOT NULL
);

-- Enable RLS for chats
ALTER TABLE public.chats ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for chats (updated for text user_id)
CREATE POLICY "Users can view own chats" ON public.chats
  FOR SELECT USING (auth.uid()::text = user_id);

CREATE POLICY "Users can insert own chats" ON public.chats
  FOR INSERT WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can update own chats" ON public.chats
  FOR UPDATE USING (auth.uid()::text = user_id);

CREATE POLICY "Users can delete own chats" ON public.chats
  FOR DELETE USING (auth.uid()::text = user_id);

-- ============================================================================
-- 3. MESSAGES TABLE (Updated for Drizzle compatibility)
-- ============================================================================

-- Create messages table matching Drizzle schema with JSON parts
CREATE TABLE public.messages (
  id text PRIMARY KEY NOT NULL,
  chat_id text REFERENCES public.chats(id) ON DELETE CASCADE NOT NULL,
  role text NOT NULL CHECK (role IN ('user', 'assistant', 'system', 'tool')),
  parts jsonb NOT NULL, -- Changed from 'content text' to 'parts jsonb'
  created_at timestamp DEFAULT now() NOT NULL
);

-- Enable RLS for messages
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for messages (updated for text-based IDs)
CREATE POLICY "Users can view messages from own chats" ON public.messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.chats 
      WHERE chats.id = messages.chat_id 
      AND chats.user_id = auth.uid()::text
    )
  );

CREATE POLICY "Users can insert messages to own chats" ON public.messages
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.chats 
      WHERE chats.id = messages.chat_id 
      AND chats.user_id = auth.uid()::text
    )
  );

CREATE POLICY "Users can update messages in own chats" ON public.messages
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.chats 
      WHERE chats.id = messages.chat_id 
      AND chats.user_id = auth.uid()::text
    )
  );

CREATE POLICY "Users can delete messages from own chats" ON public.messages
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.chats 
      WHERE chats.id = messages.chat_id 
      AND chats.user_id = auth.uid()::text
    )
  );

-- ============================================================================
-- 4. INDEXES FOR PERFORMANCE
-- ============================================================================

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_profiles_username ON public.profiles(username);
CREATE INDEX IF NOT EXISTS idx_profiles_updated_at ON public.profiles(updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_chats_user_id ON public.chats(user_id);
CREATE INDEX IF NOT EXISTS idx_chats_created_at ON public.chats(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_chats_updated_at ON public.chats(updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_messages_chat_id ON public.messages(chat_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON public.messages(created_at DESC);

-- ============================================================================
-- 5. TRIGGER AND FUNCTION FOR NEW USER REGISTRATION
-- ============================================================================

-- Create function to handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  -- Insert a new profile when a new user is created
  INSERT INTO public.profiles (
    id, 
    full_name, 
    avatar_url,
    created_at
  )
  VALUES (
    new.id, 
    new.raw_user_meta_data->>'full_name', 
    new.raw_user_meta_data->>'avatar_url',
    now()
  )
  ON CONFLICT (id) DO NOTHING;
  
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for automatic profile creation
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================================
-- 6. CHAT MANAGEMENT FUNCTION
-- ============================================================================

-- Function to update chat updated_at timestamp when messages are added
CREATE OR REPLACE FUNCTION public.update_chat_timestamp()
RETURNS trigger AS $$
BEGIN
  UPDATE public.chats 
  SET updated_at = now()
  WHERE id = NEW.chat_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update chat timestamp when messages are added
CREATE TRIGGER update_chat_timestamp_trigger
  AFTER INSERT ON public.messages
  FOR EACH ROW EXECUTE FUNCTION public.update_chat_timestamp();

-- ============================================================================
-- 7. UTILITY FUNCTIONS (Updated for text IDs)
-- ============================================================================

-- Function to get user's chat count
CREATE OR REPLACE FUNCTION public.get_user_chat_count(user_text text)
RETURNS integer AS $$
BEGIN
  RETURN (
    SELECT COUNT(*)
    FROM public.chats
    WHERE user_id = user_text
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user's latest chats
CREATE OR REPLACE FUNCTION public.get_user_latest_chats(user_text text, chat_limit integer DEFAULT 10)
RETURNS TABLE(
  id text,
  title text,
  created_at timestamp,
  updated_at timestamp,
  message_count bigint
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.id,
    c.title,
    c.created_at,
    c.updated_at,
    COUNT(m.id) as message_count
  FROM public.chats c
  LEFT JOIN public.messages m ON c.id = m.chat_id
  WHERE c.user_id = user_text
  GROUP BY c.id, c.title, c.created_at, c.updated_at
  ORDER BY c.updated_at DESC
  LIMIT chat_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 8. STORAGE BUCKET SETUP
-- ============================================================================

-- Create storage buckets for user uploads
INSERT INTO storage.buckets (id, name, public) 
VALUES 
  ('avatars', 'avatars', true),
  ('chat-files', 'chat-files', false)
ON CONFLICT (id) DO NOTHING;

-- Create storage policies for avatars
CREATE POLICY "Avatar images are publicly accessible" ON storage.objects
  FOR SELECT USING (bucket_id = 'avatars');

CREATE POLICY "Users can upload their own avatar" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'avatars' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can update their own avatar" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'avatars' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete their own avatar" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'avatars' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Create storage policies for chat files
CREATE POLICY "Users can view their own chat files" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'chat-files' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can upload their own chat files" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'chat-files' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Return success message
SELECT 'Updated database setup complete - Compatible with Drizzle schema' AS status;



