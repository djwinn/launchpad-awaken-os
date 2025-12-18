-- Create accounts table for location-based authentication
CREATE TABLE public.accounts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  location_id TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE NULL,
  is_demo BOOLEAN NOT NULL DEFAULT false,
  demo_name TEXT NULL,
  demo_email TEXT NULL,
  demo_business TEXT NULL,
  phase_1_complete BOOLEAN NOT NULL DEFAULT false,
  phase_2_complete BOOLEAN NOT NULL DEFAULT false,
  phase_3_complete BOOLEAN NOT NULL DEFAULT false,
  phase_1_data JSONB NULL DEFAULT '{}'::jsonb,
  phase_2_data JSONB NULL DEFAULT '{}'::jsonb,
  phase_3_data JSONB NULL DEFAULT '{}'::jsonb
);

-- Create index on location_id for fast lookups
CREATE INDEX idx_accounts_location_id ON public.accounts(location_id);

-- Create index on demo_email for checking existing demo accounts
CREATE INDEX idx_accounts_demo_email ON public.accounts(demo_email) WHERE demo_email IS NOT NULL;

-- Enable Row Level Security
ALTER TABLE public.accounts ENABLE ROW LEVEL SECURITY;

-- Create policy to allow public read/write (since auth is handled by locationId/GHL)
-- The app handles authentication via locationId, not Supabase auth
CREATE POLICY "Allow public access to accounts"
ON public.accounts
FOR ALL
USING (true)
WITH CHECK (true);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_accounts_updated_at
BEFORE UPDATE ON public.accounts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();