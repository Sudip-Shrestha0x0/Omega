import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, Plus, Trash2, Edit2, Check, X, Clock } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

interface Conversation {
  id: string;
  title: string;
  lastMessage: string;
  timestamp: Date;
  messageCount: number;
}

interface ChatHistorySidebarProps {
  isOpen: boolean;
  onClose: () => void;
  currentConversationId: string | null;
  onSelectConversation: (conversationId: string) => void;
  onNewChat: () => void;
}

const ChatHistorySidebar: React.FC<ChatHistorySidebarProps> = ({
  isOpen,
  onClose,
  currentConversationId,
  onSelectConversation,
  onNewChat,
}) => {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');

  useEffect(() => {
    if (user) {
      const stored = localStorage.getItem(`omega_conversations_${user.id}`);
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          setConversations(parsed.map((c: Omit<Conversation, 'timestamp'> & { timestamp: string }) => ({
            ...c,
            timestamp: new Date(c.timestamp),
          })));
        } catch (error) {
          // Silently handle
        }
      }
    }
  }, [user]);

  const handleDeleteConversation = (conversationId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setConversations(prev => prev.filter(c => c.id !== conversationId));
    if (user) {
      const updated = conversations.filter(c => c.id !== conversationId);
      localStorage.setItem(`omega_conversations_${user.id}`, JSON.stringify(updated));
      localStorage.removeItem(`omega_chat_history_${conversationId}`);
    }
    if (currentConversationId === conversationId) {
      onNewChat();
    }
  };

  const handleStartEdit = (conversation: Conversation, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(conversation.id);
    setEditingTitle(conversation.title);
  };

  const handleSaveEdit = (conversationId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (editingTitle.trim()) {
      setConversations(prev => prev.map(c => 
        c.id === conversationId ? { ...c, title: editingTitle.trim() } : c
      ));
      if (user) {
        const updated = conversations.map(c => 
          c.id === conversationId ? { ...c, title: editingTitle.trim() } : c
        );
        localStorage.setItem(`omega_conversations_${user.id}`, JSON.stringify(updated));
      }
    }
    setEditingId(null);
    setEditingTitle('');
  };

  const handleCancelEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(null);
    setEditingTitle('');
  };

  const formatTimestamp = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const groupedConversations = {
    today: conversations.filter(c => {
      const now = new Date();
      return c.timestamp.toDateString() === now.toDateString();
    }),
    yesterday: conversations.filter(c => {
      const now = new Date();
      const yesterday = new Date(now);
      yesterday.setDate(yesterday.getDate() - 1);
      return c.timestamp.toDateString() === yesterday.toDateString();
    }),
    week: conversations.filter(c => {
      const now = new Date();
      const weekAgo = new Date(now);
      weekAgo.setDate(weekAgo.getDate() - 7);
      const yesterday = new Date(now);
      yesterday.setDate(yesterday.getDate() - 1);
      return c.timestamp > weekAgo && c.timestamp < yesterday;
    }),
    older: conversations.filter(c => {
      const now = new Date();
      const weekAgo = new Date(now);
      weekAgo.setDate(weekAgo.getDate() - 7);
      return c.timestamp <= weekAgo;
    }),
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden"
          />
          <motion.div
            initial={{ x: -300 }}
            animate={{ x: 0 }}
            exit={{ x: -300 }}
            transition={{ type: 'spring', damping: 25 }}
            className="fixed left-0 top-0 bottom-0 w-80 bg-zinc-950 border-r border-zinc-800 z-50 flex flex-col"
          >
            <div className="p-4 border-b border-zinc-800">
              <button
                onClick={onNewChat}
                className="w-full bg-orange-500 hover:bg-orange-600 text-black hover:text-black py-3 rounded-lg font-semibold transition-all flex items-center justify-center gap-2"
              >
                <Plus className="w-5 h-5" />
                New Chat
              </button>
            </div>

            <div className="flex-1 overflow-auto p-4 space-y-6">
              {['today', 'yesterday', 'week', 'older'].map((group) => {
                const items = groupedConversations[group as keyof typeof groupedConversations];
                if (items.length === 0) return null;

                return (
                  <div key={group}>
                    <h3 className="text-xs font-semibold text-gray-500 uppercase mb-2 px-2">
                      {group === 'week' ? 'Previous 7 Days' : group}
                    </h3>
                    <div className="space-y-1">
                      {items.map((conversation) => (
                        <motion.div
                          key={conversation.id}
                          layout
                          onClick={() => onSelectConversation(conversation.id)}
                          className={`group relative p-3 rounded-lg cursor-pointer transition-all ${
                            currentConversationId === conversation.id
                              ? 'bg-orange-500/20 border border-orange-500/50'
                              : 'hover:bg-zinc-800 border border-transparent'
                          }`}
                        >
                          {editingId === conversation.id ? (
                            <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                              <input
                                type="text"
                                value={editingTitle}
                                onChange={(e) => setEditingTitle(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && handleSaveEdit(conversation.id, e as unknown as React.MouseEvent)}
                                className="flex-1 bg-zinc-800 border border-orange-500 text-white text-sm rounded px-2 py-1 focus:outline-none"
                                autoFocus
                              />
                              <button
                                onClick={(e) => handleSaveEdit(conversation.id, e)}
                                className="text-green-500 hover:text-green-400"
                              >
                                <Check className="w-4 h-4" />
                              </button>
                              <button
                                onClick={handleCancelEdit}
                                className="text-red-500 hover:text-red-400"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          ) : (
                            <>
                              <div className="flex items-start gap-2">
                                <MessageSquare className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium text-white truncate">
                                    {conversation.title}
                                  </p>
                                  <p className="text-xs text-gray-500 truncate">
                                    {conversation.lastMessage}
                                  </p>
                                  <div className="flex items-center gap-2 mt-1 text-xs text-gray-600">
                                    <Clock className="w-3 h-3" />
                                    <span>{formatTimestamp(conversation.timestamp)}</span>
                                    <span>·</span>
                                    <span>{conversation.messageCount} messages</span>
                                  </div>
                                </div>
                              </div>
                              <div className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                                <button
                                  onClick={(e) => handleStartEdit(conversation, e)}
                                  className="p-1 hover:bg-zinc-700 rounded text-gray-400 hover:text-white"
                                >
                                  <Edit2 className="w-3 h-3" />
                                </button>
                                <button
                                  onClick={(e) => handleDeleteConversation(conversation.id, e)}
                                  className="p-1 hover:bg-red-500/20 rounded text-gray-400 hover:text-red-500"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </div>
                            </>
                          )}
                        </motion.div>
                      ))}
                    </div>
                  </div>
                );
              })}

              {conversations.length === 0 && (
                <div className="text-center py-12">
                  <MessageSquare className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                  <p className="text-sm text-gray-500">No conversations yet</p>
                  <p className="text-xs text-gray-600 mt-1">Start a new chat to begin</p>
                </div>
              )}
            </div>

            <div className="p-4 border-t border-zinc-800">
              <p className="text-xs text-gray-600 text-center">
                Built by Sudip Stha
              </p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default ChatHistorySidebar;
