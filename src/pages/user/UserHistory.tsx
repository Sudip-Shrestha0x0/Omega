import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { MessageSquare, Clock, Trash2, Search, Calendar } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../hooks/use-toast';

interface Conversation {
  id: string;
  title: string;
  lastMessage: string;
  timestamp: Date;
  messageCount: number;
}

const UserHistory = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (user) {
      const stored = localStorage.getItem(`omega_conversations_${user.id}`);
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          setConversations(parsed.map((c: any) => ({
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
    toast({
      title: 'Conversation deleted',
      description: 'Chat history has been removed',
      duration: 2000,
    });
  };

  const handleOpenConversation = (conversationId: string) => {
    navigate('/dashboard/chat', { state: { conversationId } });
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

  const filteredConversations = conversations.filter(c =>
    c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.lastMessage.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const groupedConversations = {
    today: filteredConversations.filter(c => {
      const now = new Date();
      return c.timestamp.toDateString() === now.toDateString();
    }),
    yesterday: filteredConversations.filter(c => {
      const now = new Date();
      const yesterday = new Date(now);
      yesterday.setDate(yesterday.getDate() - 1);
      return c.timestamp.toDateString() === yesterday.toDateString();
    }),
    week: filteredConversations.filter(c => {
      const now = new Date();
      const weekAgo = new Date(now);
      weekAgo.setDate(weekAgo.getDate() - 7);
      const yesterday = new Date(now);
      yesterday.setDate(yesterday.getDate() - 1);
      return c.timestamp > weekAgo && c.timestamp < yesterday;
    }),
    older: filteredConversations.filter(c => {
      const now = new Date();
      const weekAgo = new Date(now);
      weekAgo.setDate(weekAgo.getDate() - 7);
      return c.timestamp <= weekAgo;
    }),
  };

  return (
    <div className="flex flex-col h-full w-full bg-black">
      <header className="flex items-center sticky top-0 z-10 gap-4 border-b border-zinc-800 bg-black px-6 py-4">
        <SidebarTrigger />
        <div>
          <h1 className="text-2xl font-bold text-white">Chat History</h1>
          <p className="text-sm text-gray-400">View and manage your conversations</p>
        </div>
      </header>

      <main className="flex-1 overflow-auto p-6 bg-black">
        <div className="max-w-4xl mx-auto space-y-6">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative"
          >
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search conversations..."
              className="w-full bg-zinc-900 border border-zinc-800 text-white rounded-lg pl-12 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </motion.div>

          {conversations.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-20"
            >
              <MessageSquare className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-white mb-2">No conversations yet</h2>
              <p className="text-gray-400 mb-6">Start chatting to see your history here</p>
              <button
                onClick={() => navigate('/dashboard/chat')}
                className="bg-orange-500 hover:bg-orange-600 text-black hover:text-black px-6 py-3 rounded-lg font-semibold transition-all inline-flex items-center gap-2"
              >
                <MessageSquare className="w-5 h-5" />
                Start New Chat
              </button>
            </motion.div>
          ) : (
            <div className="space-y-8">
              {['today', 'yesterday', 'week', 'older'].map((group) => {
                const items = groupedConversations[group as keyof typeof groupedConversations];
                if (items.length === 0) return null;

                return (
                  <motion.div
                    key={group}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <div className="flex items-center gap-3 mb-4">
                      <Calendar className="w-4 h-4 text-orange-500" />
                      <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">
                        {group === 'week' ? 'Previous 7 Days' : group}
                      </h2>
                    </div>
                    <div className="grid gap-3">
                      {items.map((conversation) => (
                        <motion.div
                          key={conversation.id}
                          whileHover={{ scale: 1.02 }}
                          onClick={() => handleOpenConversation(conversation.id)}
                          className="group bg-zinc-900 border border-zinc-800 hover:border-orange-500/50 p-6 rounded-lg cursor-pointer transition-all"
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex items-start gap-4 flex-1 min-w-0">
                              <div className="w-10 h-10 bg-orange-500/20 rounded-full flex items-center justify-center flex-shrink-0">
                                <MessageSquare className="w-5 h-5 text-orange-500" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <h3 className="text-base font-semibold text-white mb-1 truncate">
                                  {conversation.title}
                                </h3>
                                <p className="text-sm text-gray-400 line-clamp-2 mb-3">
                                  {conversation.lastMessage}
                                </p>
                                <div className="flex items-center gap-4 text-xs text-gray-600">
                                  <div className="flex items-center gap-1">
                                    <Clock className="w-3 h-3" />
                                    <span>{formatTimestamp(conversation.timestamp)}</span>
                                  </div>
                                  <span>·</span>
                                  <span>{conversation.messageCount} messages</span>
                                </div>
                              </div>
                            </div>
                            <button
                              onClick={(e) => handleDeleteConversation(conversation.id, e)}
                              className="opacity-0 group-hover:opacity-100 transition-opacity p-2 hover:bg-red-500/20 rounded-lg text-gray-400 hover:text-red-500"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default UserHistory;
