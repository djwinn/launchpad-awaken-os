-- Drop the existing policy that allows all access
DROP POLICY IF EXISTS "Service role can manage conversations" ON public.conversations;

-- Create proper policy that only allows service_role access
-- This ensures only edge functions (using service_role key) can access conversations
CREATE POLICY "Service role can manage conversations" 
ON public.conversations 
FOR ALL 
TO service_role
USING (true)
WITH CHECK (true);

-- Ensure anon and authenticated roles cannot access conversations directly
-- By not creating any policies for them, access is denied by default when RLS is enabled