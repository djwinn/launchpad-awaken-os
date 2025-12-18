-- Drop the overly permissive policy that allows ALL operations
DROP POLICY IF EXISTS "Allow public access to accounts" ON public.accounts;

-- Create more restrictive policies
-- Allow SELECT for account lookups by location_id (needed for app functionality)
CREATE POLICY "Allow select accounts"
ON public.accounts
FOR SELECT
USING (true);

-- Allow INSERT for creating new accounts
CREATE POLICY "Allow insert accounts"
ON public.accounts
FOR INSERT
WITH CHECK (true);

-- Allow UPDATE for updating phase progress
CREATE POLICY "Allow update accounts"
ON public.accounts
FOR UPDATE
USING (true)
WITH CHECK (true);

-- Note: DELETE is intentionally NOT allowed - no policy means no delete access