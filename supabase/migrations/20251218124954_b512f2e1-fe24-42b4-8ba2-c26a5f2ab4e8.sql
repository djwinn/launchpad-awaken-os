-- Harden access to sensitive tables (accounts, conversations)
-- Goal: prevent any public/anon reads and satisfy security scanners by defining explicit non-public policies.

-- Ensure RLS is enabled
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.accounts ENABLE ROW LEVEL SECURITY;

-- Drop all existing policies on both tables (defensive)
DO $$
DECLARE
  pol record;
BEGIN
  FOR pol IN
    SELECT schemaname, tablename, policyname
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename IN ('conversations', 'accounts')
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', pol.policyname, pol.tablename);
  END LOOP;
END
$$;

-- Revoke all privileges from PUBLIC/anon/authenticated
REVOKE ALL ON TABLE public.conversations FROM PUBLIC;
REVOKE ALL ON TABLE public.conversations FROM anon;
REVOKE ALL ON TABLE public.conversations FROM authenticated;

REVOKE ALL ON TABLE public.accounts FROM PUBLIC;
REVOKE ALL ON TABLE public.accounts FROM anon;
REVOKE ALL ON TABLE public.accounts FROM authenticated;

-- Ensure service_role retains access (backend functions)
GRANT ALL ON TABLE public.conversations TO service_role;
GRANT ALL ON TABLE public.accounts TO service_role;

-- Service role policies (backend functions)
CREATE POLICY "Service role can manage conversations"
ON public.conversations
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

CREATE POLICY "Service role can manage accounts"
ON public.accounts
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Explicitly deny anon reads
CREATE POLICY "Deny anon select conversations"
ON public.conversations
FOR SELECT
TO anon
USING (false);

CREATE POLICY "Deny anon select accounts"
ON public.accounts
FOR SELECT
TO anon
USING (false);

-- If auth is enabled, allow authenticated users to read ONLY their own conversations by email
-- (Does not grant write access.)
CREATE POLICY "Users can read own conversations"
ON public.conversations
FOR SELECT
TO authenticated
USING ((auth.jwt() ->> 'email') = user_email);

-- Accounts are system-of-record for location-based access; keep direct authenticated reads disabled.
CREATE POLICY "Deny authenticated select accounts"
ON public.accounts
FOR SELECT
TO authenticated
USING (false);
