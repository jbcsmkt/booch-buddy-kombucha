import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { ChatConversation, ChatMessage, ChatContextType } from '../types/chat';
import { chatService } from '../services/placeholderServices';
import { useAuth } from './AuthContext';

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const useChat = () => {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
};

interface ChatProviderProps {
  children: ReactNode;
}

export const ChatProvider: React.FC<ChatProviderProps> = ({ children }) => {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [currentConversation, setCurrentConversation] = useState<ChatConversation | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    if (user) {
      loadConversations();
    }
  }, [user]);

  const loadConversations = async () => {
    try {
      setIsLoading(true);
      const convs = await chatService.getConversations();
      setConversations(convs);
    } catch (error) {
      console.error('Failed to load conversations:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const createConversation = async (title?: string, batchId?: string): Promise<ChatConversation> => {
    try {
      const conversation = await chatService.createConversation(title, batchId);
      setConversations(prev => [conversation, ...prev]);
      return conversation;
    } catch (error) {
      console.error('Failed to create conversation:', error);
      throw error;
    }
  };

  const selectConversation = async (conversationId: number) => {
    try {
      setIsLoading(true);
      const conversation = conversations.find(c => c.id === conversationId);
      if (!conversation) throw new Error('Conversation not found');
      
      setCurrentConversation(conversation);
      const msgs = await chatService.getMessages(conversationId);
      setMessages(msgs);
    } catch (error) {
      console.error('Failed to select conversation:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const sendMessage = async (content: string) => {
    if (!currentConversation) return;

    try {
      setIsSending(true);
      
      // Add user message immediately
      const userMessage: ChatMessage = {
        id: Date.now(), // Temporary ID
        conversation_id: currentConversation.id,
        role: 'user',
        content,
        created_at: new Date().toISOString()
      };
      setMessages(prev => [...prev, userMessage]);

      // Send to API and get response
      const newMessages = await chatService.sendMessage(currentConversation.id, content);
      
      // Replace with actual messages from server
      setMessages(prev => {
        const withoutTemp = prev.filter(m => m.id !== userMessage.id);
        return [...withoutTemp, ...newMessages];
      });

    } catch (error) {
      console.error('Failed to send message:', error);
      // Remove the temporary message on error
      setMessages(prev => prev.filter(m => m.id !== Date.now()));
      throw error;
    } finally {
      setIsSending(false);
    }
  };

  const deleteConversation = async (conversationId: number) => {
    try {
      await chatService.deleteConversation(conversationId);
      setConversations(prev => prev.filter(c => c.id !== conversationId));
      
      if (currentConversation?.id === conversationId) {
        setCurrentConversation(null);
        setMessages([]);
      }
    } catch (error) {
      console.error('Failed to delete conversation:', error);
      throw error;
    }
  };

  const value: ChatContextType = {
    conversations,
    currentConversation,
    messages,
    isLoading,
    isSending,
    createConversation,
    selectConversation,
    sendMessage,
    deleteConversation,
    loadConversations
  };

  return (
    <ChatContext.Provider value={value}>
      {children}
    </ChatContext.Provider>
  );
};