import { supabase } from '@/integrations/supabase/client';
import type { Message, Conversation } from '@/types/chat';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

export async function findIncompleteConversation(email: string, locationId: string): Promise<Conversation | null> {
  try {
    const response = await fetch(
      `${SUPABASE_URL}/functions/v1/manage-conversations?action=find_incomplete&email=${encodeURIComponent(email)}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'X-Location-ID': locationId,
        },
      }
    );

    if (!response.ok) {
      console.error('Error finding conversation:', response.status);
      return null;
    }

    const { data } = await response.json();
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
  } catch (error) {
    console.error('Error finding conversation:', error);
    return null;
  }
}

export async function createConversation(email: string, name: string, locationId: string): Promise<string | null> {
  try {
    const response = await fetch(
      `${SUPABASE_URL}/functions/v1/manage-conversations`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Location-ID': locationId,
        },
        body: JSON.stringify({
          action: 'create',
          email,
          name,
        }),
      }
    );

    if (!response.ok) {
      console.error('Error creating conversation:', response.status);
      return null;
    }

    const { data } = await response.json();
    return data?.id || null;
  } catch (error) {
    console.error('Error creating conversation:', error);
    return null;
  }
}

export async function updateConversationMessages(
  conversationId: string,
  messages: Message[],
  locationId: string
): Promise<boolean> {
  try {
    console.log('Saving messages to conversation:', conversationId, 'count:', messages.length);
    
    const response = await fetch(
      `${SUPABASE_URL}/functions/v1/manage-conversations`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Location-ID': locationId,
        },
        body: JSON.stringify({
          action: 'update_messages',
          conversationId,
          messages,
        }),
      }
    );

    if (!response.ok) {
      console.error('Error updating conversation:', response.status);
      return false;
    }

    console.log('Messages saved successfully');
    return true;
  } catch (error) {
    console.error('Error updating conversation:', error);
    return false;
  }
}

export async function markConversationComplete(
  conversationId: string,
  output: Record<string, unknown>,
  locationId: string
): Promise<boolean> {
  try {
    const response = await fetch(
      `${SUPABASE_URL}/functions/v1/manage-conversations`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Location-ID': locationId,
        },
        body: JSON.stringify({
          action: 'mark_complete',
          conversationId,
          output,
        }),
      }
    );

    if (!response.ok) {
      console.error('Error marking conversation complete:', response.status);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error marking conversation complete:', error);
    return false;
  }
}

export async function deleteConversation(conversationId: string, locationId: string): Promise<boolean> {
  try {
    const response = await fetch(
      `${SUPABASE_URL}/functions/v1/manage-conversations`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Location-ID': locationId,
        },
        body: JSON.stringify({
          action: 'delete',
          conversationId,
        }),
      }
    );

    if (!response.ok) {
      console.error('Error deleting conversation:', response.status);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error deleting conversation:', error);
    return false;
  }
}
