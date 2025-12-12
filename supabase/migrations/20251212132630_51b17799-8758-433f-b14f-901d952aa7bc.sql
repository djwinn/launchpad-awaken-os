-- Add columns to track individual Phase 1 setup items
ALTER TABLE public.user_progress
ADD COLUMN IF NOT EXISTS profile_complete boolean NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS calendar_connected boolean NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS booking_page_created boolean NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS contract_prepared boolean NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS payments_connected boolean NOT NULL DEFAULT false;