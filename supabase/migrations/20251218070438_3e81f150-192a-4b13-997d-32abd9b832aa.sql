-- Add DELETE policy for user_progress table (GDPR/CCPA compliance)
CREATE POLICY "Users can delete own progress"
ON public.user_progress FOR DELETE
USING ((auth.jwt() ->> 'email'::text) = user_email);