-- Create conversations table for saving and resuming chats
CREATE TABLE public.conversations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_email TEXT NOT NULL,
  user_name TEXT,
  messages JSONB DEFAULT '[]'::jsonb,
  current_stage TEXT DEFAULT 'intro',
  completed BOOLEAN DEFAULT false,
  output JSONB DEFAULT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index on user_email for faster lookups
CREATE INDEX idx_conversations_user_email ON public.conversations(user_email);

-- Create index for finding incomplete conversations
CREATE INDEX idx_conversations_incomplete ON public.conversations(user_email, completed) WHERE completed = false;

-- Enable Row Level Security
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read their own conversations (by email)
CREATE POLICY "Anyone can read conversations by email"
ON public.conversations
FOR SELECT
USING (true);

-- Allow anyone to insert conversations
CREATE POLICY "Anyone can insert conversations"
ON public.conversations
FOR INSERT
WITH CHECK (true);

-- Allow anyone to update conversations
CREATE POLICY "Anyone can update conversations"
ON public.conversations
FOR UPDATE
USING (true);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_conversations_updated_at
BEFORE UPDATE ON public.conversations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();