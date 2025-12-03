export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

export interface UserInfo {
  name: string;
  email: string;
}

export type AppView = 'landing' | 'chat' | 'output';
