-- Add location_id column to user_progress table
ALTER TABLE public.user_progress 
ADD COLUMN location_id text;