-- Add social capture columns to user_progress
ALTER TABLE public.user_progress 
ADD COLUMN IF NOT EXISTS social_message_complete boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS social_accounts_connected boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS social_capture_active boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS social_capture_toolkit text;