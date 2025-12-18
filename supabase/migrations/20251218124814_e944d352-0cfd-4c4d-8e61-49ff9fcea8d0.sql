-- Lock down conversations table to prevent any public access

-- Ensure Row Level Security is enabled
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;

-- Remove any existing policies (defensive: drop all policies on this table)
DO $$
DECLARE
  pol record;
BEGIN
  FOR pol IN
    SELECT policyname
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'conversations'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.conversations', pol.policyname);
  END LOOP;
END
$$;

-- Revoke all table privileges from public/anon/authenticated roles
REVOKE ALL ON TABLE public.conversations FROM PUBLIC;
REVOKE ALL ON TABLE public.conversations FROM anon;
REVOKE ALL ON TABLE public.conversations FROM authenticated;

-- Ensure service_role retains full access (used by backend functions)
GRANT ALL ON TABLE public.conversations TO service_role;

-- Allow only service_role to operate on this table via an explicit RLS policy
CREATE POLICY "Service role can manage conversations"
ON public.conversations
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);
