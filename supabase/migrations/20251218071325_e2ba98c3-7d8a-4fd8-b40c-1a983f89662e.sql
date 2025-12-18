-- Add location_id column to conversations table
ALTER TABLE public.conversations ADD COLUMN IF NOT EXISTS location_id text;

-- Create index for location_id lookups
CREATE INDEX IF NOT EXISTS idx_conversations_location_id ON public.conversations(location_id);

-- Drop existing RLS policies that use auth.jwt()
DROP POLICY IF EXISTS "Users can delete own conversations" ON public.conversations;
DROP POLICY IF EXISTS "Users can insert own conversations" ON public.conversations;
DROP POLICY IF EXISTS "Users can read own conversations" ON public.conversations;
DROP POLICY IF EXISTS "Users can update own conversations" ON public.conversations;

-- Create new RLS policy for service role only (like accounts table)
CREATE POLICY "Service role can manage conversations"
ON public.conversations
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);