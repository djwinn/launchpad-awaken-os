-- Add Phase 2 fields to user_progress table
ALTER TABLE public.user_progress 
ADD COLUMN IF NOT EXISTS ai_foundation_complete boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS ai_responder_active boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS reminders_configured boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS phase2_complete boolean DEFAULT false;