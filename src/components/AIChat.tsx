import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, Send, Plus, Trash2, Bot, User, Loader } from 'lucide-react';
import { useChat } from '../contexts/ChatContext';
import { format } from 'date-fns';

interface AIChatProps {
  isOpen: boolean;
  onClose: () => void;
  batchId?: string;
}

export const AIChat: React.FC<AIChatProps> = ({ isOpen, onClose, batchId }) => {
  const {
    conversations,
    currentConversation,
    messages,
    isLoading,
    isSending,
    createConversation,
    selectConversation,
    sendMessage,
    deleteConversation
  } = useChat();

  const [newMessage, setNewMessage] = useState('');
  const [showConversations, setShowConversations] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const handleCreateConversation = async () => {
    try {
      const title = batchId ? `Batch Discussion` : 'New Brewing Chat';
      const conversation = await createConversation(title, batchId);
      await selectConversation(conversation.id);
      setShowConversations(false);
    } catch (error) {
      console.error('Failed to create conversation:', error);
      alert(`Error: ${error instanceof Error ? error.message : 'Unknown error occurred'}`);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || isSending) return;

    try {
      await sendMessage(newMessage);
      setNewMessage('');
    } catch (error) {
      console.error('Failed to send message:', error);
      alert('Chat features require database configuration.');
    }
  };

  const handleSelectConversation = async (conversationId: number) => {
    await selectConversation(conversationId);
    setShowConversations(false);
  };

  const handleDeleteConversation = async (conversationId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this conversation?')) {
      try {
        await deleteConversation(conversationId);
      } catch (error) {
        console.error('Failed to delete conversation:', error);
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl h-5/6 flex flex-col mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-2">
            <Bot className="text-brewing-amber" size={24} />
            <h2 className="text-xl font-semibold text-gray-800">
              AI Brewing Assistant
              {batchId && <span className="text-sm text-gray-500 ml-2">(Batch Context)</span>}
            </h2>
          </div>
          <div className="flex items-center gap-2">
            {currentConversation && (
              <button
                onClick={() => setShowConversations(true)}
                className="text-gray-600 hover:text-gray-800 transition-colors px-3 py-1 rounded"
              >
                Conversations
              </button>
            )}
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors text-2xl"
            >
              ×
            </button>
          </div>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Conversations Sidebar */}
          {showConversations && (
            <div className="w-1/3 border-r flex flex-col">
              <div className="p-4 border-b">
                <div className="space-y-2">
                  <button
                    onClick={() => {
                      console.log('API_BASE_URL:', 'http://localhost:8080/api');
                      fetch('http://localhost:8080/api/health')
                        .then(res => res.json())
                        .then(data => console.log('Health check:', data))
                        .catch(err => console.error('Health check failed:', err));
                    }}
                    className="w-full bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm"
                  >
                    Test API
                  </button>
                  <button
                    onClick={handleCreateConversation}
                    className="w-full bg-brewing-amber hover:bg-brewing-copper text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
                  >
                    <Plus size={16} />
                    New Chat
                  </button>
                </div>
              </div>
              
              <div className="flex-1 overflow-y-auto">
                {isLoading ? (
                  <div className="p-4 text-center">
                    <Loader className="animate-spin mx-auto mb-2" size={20} />
                    <p className="text-gray-500 text-sm">Loading conversations...</p>
                  </div>
                ) : conversations.length === 0 ? (
                  <div className="p-4 text-center text-gray-500">
                    <MessageSquare className="mx-auto mb-2" size={32} />
                    <p>No conversations yet</p>
                    <p className="text-xs">Start a new chat to get brewing advice!</p>
                  </div>
                ) : (
                  conversations.map((conversation) => (
                    <div
                      key={conversation.id}
                      onClick={() => handleSelectConversation(conversation.id)}
                      className={`p-3 border-b cursor-pointer hover:bg-gray-50 transition-colors ${
                        currentConversation?.id === conversation.id ? 'bg-blue-50 border-blue-200' : ''
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-gray-800 truncate">
                            {conversation.title}
                          </h4>
                          <p className="text-xs text-gray-500">
                            {format(new Date(conversation.updated_at), 'MMM dd, HH:mm')}
                          </p>
                        </div>
                        <button
                          onClick={(e) => handleDeleteConversation(conversation.id, e)}
                          className="text-gray-400 hover:text-red-600 transition-colors ml-2"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Chat Area */}
          <div className="flex-1 flex flex-col">
            {currentConversation ? (
              <>
                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {messages.length === 0 ? (
                    <div className="text-center text-gray-500 mt-8">
                      <Bot className="mx-auto mb-4" size={48} />
                      <h3 className="text-lg font-medium mb-2">Welcome to your AI Brewing Assistant!</h3>
                      <p className="text-sm">
                        Ask me anything about kombucha brewing, fermentation troubleshooting, 
                        flavor suggestions, or get advice specific to your current batches.
                      </p>
                    </div>
                  ) : (
                    messages.map((message) => (
                      <div
                        key={message.id}
                        className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                      >
                        {message.role === 'assistant' && (
                          <div className="w-8 h-8 rounded-full bg-brewing-amber flex items-center justify-center flex-shrink-0">
                            <Bot size={16} className="text-white" />
                          </div>
                        )}
                        
                        <div
                          className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                            message.role === 'user'
                              ? 'bg-brewing-amber text-white'
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                          <p className="text-xs mt-1 opacity-70">
                            {format(new Date(message.created_at), 'HH:mm')}
                          </p>
                        </div>

                        {message.role === 'user' && (
                          <div className="w-8 h-8 rounded-full bg-gray-600 flex items-center justify-center flex-shrink-0">
                            <User size={16} className="text-white" />
                          </div>
                        )}
                      </div>
                    ))
                  )}
                  
                  {isSending && (
                    <div className="flex gap-3 justify-start">
                      <div className="w-8 h-8 rounded-full bg-brewing-amber flex items-center justify-center flex-shrink-0">
                        <Bot size={16} className="text-white" />
                      </div>
                      <div className="bg-gray-100 px-4 py-2 rounded-lg">
                        <div className="flex items-center gap-2">
                          <Loader className="animate-spin" size={14} />
                          <span className="text-sm text-gray-600">AI is thinking...</span>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  <div ref={messagesEndRef} />
                </div>

                {/* Message Input */}
                <div className="border-t p-4">
                  <form onSubmit={handleSendMessage} className="flex gap-2">
                    <input
                      type="text"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder="Ask about brewing, fermentation, flavoring..."
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brewing-amber focus:border-transparent"
                      disabled={isSending}
                    />
                    <button
                      type="submit"
                      disabled={!newMessage.trim() || isSending}
                      className="bg-brewing-amber hover:bg-brewing-copper text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors disabled:opacity-50"
                    >
                      <Send size={16} />
                    </button>
                  </form>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center text-gray-500">
                  <MessageSquare className="mx-auto mb-4" size={48} />
                  <h3 className="text-lg font-medium mb-2">Select a conversation</h3>
                  <p className="text-sm">Choose an existing chat or start a new one</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};