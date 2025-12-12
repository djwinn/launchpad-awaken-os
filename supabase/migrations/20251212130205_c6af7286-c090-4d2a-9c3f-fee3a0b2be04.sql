-- Create user_progress table to track dashboard phases
CREATE TABLE public.user_progress (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_email TEXT NOT NULL UNIQUE,
  phase1_progress INTEGER NOT NULL DEFAULT 0 CHECK (phase1_progress >= 0 AND phase1_progress <= 5),
  phase1_complete BOOLEAN NOT NULL DEFAULT false,
  phase2_complete BOOLEAN NOT NULL DEFAULT false,
  funnels_created INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_progress ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can read own progress"
ON public.user_progress
FOR SELECT
USING ((auth.jwt() ->> 'email'::text) = user_email);

CREATE POLICY "Users can insert own progress"
ON public.user_progress
FOR INSERT
WITH CHECK ((auth.jwt() ->> 'email'::text) = user_email);

CREATE POLICY "Users can update own progress"
ON public.user_progress
FOR UPDATE
USING ((auth.jwt() ->> 'email'::text) = user_email)
WITH CHECK ((auth.jwt() ->> 'email'::text) = user_email);

-- Trigger to update updated_at
CREATE TRIGGER update_user_progress_updated_at
BEFORE UPDATE ON public.user_progress
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();