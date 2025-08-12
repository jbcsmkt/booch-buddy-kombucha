export interface ChatConversation {
  id: number;
  user_id: string;
  batch_id?: string;
  title: string;
  created_at: string;
  updated_at: string;
}

export interface ChatMessage {
  id: number;
  conversation_id: number;
  role: 'user' | 'assistant' | 'system';
  content: string;
  metadata?: any;
  created_at: string;
}

export interface ChatContextType {
  conversations: ChatConversation[];
  currentConversation: ChatConversation | null;
  messages: ChatMessage[];
  isLoading: boolean;
  isSending: boolean;
  createConversation: (title?: string, batchId?: string) => Promise<ChatConversation>;
  selectConversation: (conversationId: number) => Promise<void>;
  sendMessage: (content: string) => Promise<void>;
  deleteConversation: (conversationId: number) => Promise<void>;
  loadConversations: () => Promise<void>;
}