-- Add Phase 3 tracking columns
ALTER TABLE public.user_progress 
ADD COLUMN IF NOT EXISTS funnel_craft_complete boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS funnel_build_complete boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS funnel_blueprint text;