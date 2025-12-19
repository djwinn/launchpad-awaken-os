-- Create coach_profiles table
CREATE TABLE public.coach_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  location_id TEXT NOT NULL UNIQUE,
  
  -- Core identity
  coach_name TEXT,
  business_name TEXT,
  instagram_handle TEXT,
  website_url TEXT,
  
  -- Who they help
  ideal_client_description TEXT,
  ideal_client_demographics TEXT,
  ideal_client_situation TEXT,
  
  -- The problem
  main_problem TEXT,
  problem_feels_like TEXT,
  what_theyve_tried TEXT,
  
  -- The transformation
  transformation TEXT,
  unique_approach TEXT,
  
  -- Their story
  origin_story TEXT,
  credibility_points TEXT,
  
  -- Offer structure
  service_type TEXT,
  offer_name TEXT,
  offer_description TEXT,
  offer_price TEXT,
  offer_duration TEXT,
  call_to_action TEXT,
  booking_link TEXT,
  
  -- Lead magnet
  lead_magnet_idea TEXT,
  lead_magnet_format TEXT,
  lead_magnet_title TEXT,
  
  -- Contract specifics
  session_format TEXT,
  session_duration TEXT,
  payment_terms TEXT,
  cancellation_policy TEXT,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create generated_outputs table
CREATE TABLE public.generated_outputs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  location_id TEXT NOT NULL UNIQUE,
  
  -- Phase 1
  contract_draft TEXT,
  
  -- Phase 2
  post_caption TEXT,
  dm_template TEXT,
  landing_page_headline TEXT,
  landing_page_subheadline TEXT,
  landing_page_button TEXT,
  delivery_email TEXT,
  followup_email TEXT,
  
  -- Phase 3
  full_landing_page TEXT,
  lead_magnet_pdf_content TEXT,
  email_sequence JSONB,
  thank_you_page TEXT,
  booking_page_copy TEXT,
  offer_copy TEXT,
  intake_form_questions JSONB,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Enable RLS
ALTER TABLE public.coach_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.generated_outputs ENABLE ROW LEVEL SECURITY;

-- RLS policies for coach_profiles (service role can manage all)
CREATE POLICY "Service role can manage coach_profiles" 
ON public.coach_profiles 
FOR ALL 
TO service_role
USING (true) 
WITH CHECK (true);

-- Deny direct access from anon/authenticated (access via edge functions only)
CREATE POLICY "Deny anon select coach_profiles" 
ON public.coach_profiles 
FOR SELECT 
TO anon
USING (false);

CREATE POLICY "Deny authenticated select coach_profiles" 
ON public.coach_profiles 
FOR SELECT 
TO authenticated
USING (false);

-- RLS policies for generated_outputs
CREATE POLICY "Service role can manage generated_outputs" 
ON public.generated_outputs 
FOR ALL 
TO service_role
USING (true) 
WITH CHECK (true);

CREATE POLICY "Deny anon select generated_outputs" 
ON public.generated_outputs 
FOR SELECT 
TO anon
USING (false);

CREATE POLICY "Deny authenticated select generated_outputs" 
ON public.generated_outputs 
FOR SELECT 
TO authenticated
USING (false);

-- Auto-update timestamp triggers
CREATE TRIGGER coach_profiles_updated_at
  BEFORE UPDATE ON public.coach_profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER generated_outputs_updated_at
  BEFORE UPDATE ON public.generated_outputs
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();