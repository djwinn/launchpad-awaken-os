import { supabase } from '@/integrations/supabase/client';
import type { Message, Conversation } from '@/types/chat';
import type { Json } from '@/integrations/supabase/types';

export async function findIncompleteConversation(email: string): Promise<Conversation | null> {
  const { data, error } = await supabase
    .from('conversations')
    .select('*')
    .eq('user_email', email)
    .eq('completed', false)
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error('Error finding conversation:', error);
    return null;
  }

  if (!data) return null;

  // Parse messages from JSON
  const messages = Array.isArray(data.messages) 
    ? (data.messages as unknown as Message[])
    : [];

  return {
    ...data,
    messages,
    output: data.output as Record<string, unknown> | null,
  };
}

export async function createConversation(email: string, name: string): Promise<string | null> {
  const { data, error } = await supabase
    .from('conversations')
    .insert({
      user_email: email,
      user_name: name,
      messages: [] as unknown as Json,
      current_stage: 'intro',
      completed: false,
    })
    .select('id')
    .single();

  if (error) {
    console.error('Error creating conversation:', error);
    return null;
  }

  return data.id;
}

export async function updateConversationMessages(
  conversationId: string,
  messages: Message[]
): Promise<boolean> {
  console.log('Saving messages to conversation:', conversationId, 'count:', messages.length);
  
  const { error } = await supabase
    .from('conversations')
    .update({
      messages: messages as unknown as Json,
    })
    .eq('id', conversationId);

  if (error) {
    console.error('Error updating conversation:', error);
    return false;
  }

  console.log('Messages saved successfully');
  return true;
}

export async function markConversationComplete(
  conversationId: string,
  output: Record<string, unknown>
): Promise<boolean> {
  const { error } = await supabase
    .from('conversations')
    .update({
      completed: true,
      output: output as unknown as Json,
    })
    .eq('id', conversationId);

  if (error) {
    console.error('Error marking conversation complete:', error);
    return false;
  }

  return true;
}

export async function deleteConversation(conversationId: string): Promise<boolean> {
  const { error } = await supabase
    .from('conversations')
    .delete()
    .eq('id', conversationId);

  if (error) {
    console.error('Error deleting conversation:', error);
    return false;
  }

  return true;
}
