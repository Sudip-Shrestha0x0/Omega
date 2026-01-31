import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Trash2, MessageSquare, Calendar, Search, AlertCircle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { Link } from 'react-router-dom';
import { useToast } from '../../hooks/use-toast';

const UserHistory = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [conversations, setConversations] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (user) {
      const stored = localStorage.getItem(`omega_conversations_${user.id}`);
      if (stored) {
        setConversations(JSON.parse(stored));
      }
    }
  }, [user]);

  const handleDelete = (id: string) => {
    const updated = conversations.filter(c => c.id !== id);
    setConversations(updated);
    localStorage.setItem(`omega_conversations_${user?.id}`, JSON.stringify(updated));
    localStorage.removeItem(`omega_chat_history_${id}`);
    toast({ description: 'Conversation deleted' });
  };

  const handleClearAll = () => {
    if (window.confirm('Are you sure you want to delete all chat history? This cannot be undone.')) {
      // Remove individual chat histories
      conversations.forEach(c => {
        localStorage.removeItem(`omega_chat_history_${c.id}`);
      });
      // Clear list
      setConversations([]);
      localStorage.removeItem(`omega_conversations_${user?.id}`);
      toast({ description: 'All history cleared' });
    }
  };

  const filteredConversations = conversations.filter(c => 
    c.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (c.lastMessage && c.lastMessage.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="flex flex-col h-full w-full bg-black">
      <header className="flex items-center justify-between sticky top-0 z-10 gap-4 border-b border-zinc-800 bg-black px-6 py-4">
        <div className="flex items-center gap-4">
          <SidebarTrigger />
          <div>
            <h1 className="text-2xl font-bold text-white">Chat History</h1>
            <p className="text-sm text-gray-400">Manage your past conversations</p>
          </div>
        </div>
        {conversations.length > 0 && (
          <button
            onClick={handleClearAll}
            className="flex items-center gap-2 px-4 py-2 bg-red-500/10 text-red-500 hover:bg-red-500/20 rounded-lg transition-colors text-sm font-medium"
          >
            <Trash2 className="w-4 h-4" />
            Clear All History
          </button>
        )}
      </header>

      <main className="flex-1 overflow-auto p-6">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
            <input
              type="text"
              placeholder="Search conversations..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-800 text-white rounded-lg pl-10 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>

          <div className="space-y-4">
            <AnimatePresence>
              {filteredConversations.length > 0 ? (
                filteredConversations.map((chat) => (
                  <motion.div
                    key={chat.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, height: 0 }}
                    className="group flex items-center justify-between bg-zinc-900 border border-zinc-800 p-4 rounded-lg hover:border-zinc-700 transition-all"
                  >
                    <Link to="/dashboard/chat" state={{ conversationId: chat.id }} className="flex-1 min-w-0 mr-4">
                      <h3 className="font-semibold text-white truncate mb-1">{chat.title || 'New Conversation'}</h3>
                      <p className="text-sm text-gray-400 truncate">{chat.lastMessage || 'No messages'}</p>
                      <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                        <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {new Date(chat.timestamp).toLocaleDateString()}</span>
                        <span className="flex items-center gap-1"><MessageSquare className="w-3 h-3" /> {chat.messageCount || 0} messages</span>
                      </div>
                    </Link>
                    <button
                      onClick={() => handleDelete(chat.id)}
                      className="p-2 text-gray-500 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                      title="Delete conversation"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </motion.div>
                ))
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <AlertCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No conversations found</p>
                </div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </main>
    </div>
  );
};

export default UserHistory;