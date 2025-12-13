export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

export interface UserInfo {
  name: string;
  email: string;
}

export interface Conversation {
  id: string;
  user_email: string;
  user_name: string | null;
  messages: Message[];
  current_stage: string;
  completed: boolean;
  output: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

export type AppView = 'landing' | 'context' | 'chat' | 'output';
