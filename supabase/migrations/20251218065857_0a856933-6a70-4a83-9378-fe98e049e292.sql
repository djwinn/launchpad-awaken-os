-- Drop the existing permissive policies on accounts table
DROP POLICY IF EXISTS "Allow select accounts" ON public.accounts;
DROP POLICY IF EXISTS "Allow insert accounts" ON public.accounts;
DROP POLICY IF EXISTS "Allow update accounts" ON public.accounts;

-- Create service-role-only policy for all operations
-- This restricts direct client access - all operations must go through edge functions
CREATE POLICY "Service role can manage accounts"
ON public.accounts FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Note: The manage-accounts edge function uses service_role key to handle all account operations
-- No direct client access to the accounts table is allowed anymore