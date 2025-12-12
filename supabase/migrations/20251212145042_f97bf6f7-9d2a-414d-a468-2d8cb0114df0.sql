-- Add AI foundation data columns to user_progress
ALTER TABLE public.user_progress 
ADD COLUMN IF NOT EXISTS ai_foundation_data jsonb DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS knowledge_base_content text,
ADD COLUMN IF NOT EXISTS bot_instructions text;