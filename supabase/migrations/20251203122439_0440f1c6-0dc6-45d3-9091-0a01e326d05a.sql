-- Drop existing overly permissive policies
DROP POLICY IF EXISTS "Anyone can read conversations by email" ON public.conversations;
DROP POLICY IF EXISTS "Anyone can insert conversations" ON public.conversations;
DROP POLICY IF EXISTS "Anyone can update conversations" ON public.conversations;

-- Create secure policies based on authenticated user's email
CREATE POLICY "Users can read own conversations"
ON public.conversations FOR SELECT
TO authenticated
USING (auth.jwt() ->> 'email' = user_email);

CREATE POLICY "Users can insert own conversations"
ON public.conversations FOR INSERT
TO authenticated
WITH CHECK (auth.jwt() ->> 'email' = user_email);

CREATE POLICY "Users can update own conversations"
ON public.conversations FOR UPDATE
TO authenticated
USING (auth.jwt() ->> 'email' = user_email)
WITH CHECK (auth.jwt() ->> 'email' = user_email);

CREATE POLICY "Users can delete own conversations"
ON public.conversations FOR DELETE
TO authenticated
USING (auth.jwt() ->> 'email' = user_email);