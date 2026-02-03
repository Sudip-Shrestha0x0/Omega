import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation, useNavigate } from 'react-router-dom';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Send, User, Paperclip, X, FileText, Image as ImageIcon, Code, Trash2, Edit2, Check, RefreshCw, ThumbsUp, ThumbsDown, Copy, Square, Download, Plus, Brain, ChevronDown, ChevronRight } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { aiService, ChatMessage } from '../../services/aiService';
import { useToast } from '../../hooks/use-toast';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const STORAGE_KEY = 'omega_chat_history';

const CodeBlock = React.memo(({ language, code }: { language: string; code: string }) => {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    toast({ description: 'Code copied to clipboard', duration: 2000 });
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="my-4 rounded-lg overflow-hidden border border-zinc-800 bg-zinc-950 w-full min-w-0" style={{ maxWidth: '100%' }}>
      <div className="flex items-center justify-between px-3 sm:px-4 py-2 bg-zinc-900 border-b border-zinc-800">
        <span className="text-xs text-zinc-400 font-mono truncate">{language || 'code'}</span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1 text-xs text-zinc-400 hover:text-white transition-colors flex-shrink-0 ml-2"
        >
          {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
          <span className="hidden sm:inline">{copied ? 'Copied' : 'Copy code'}</span>
        </button>
      </div>
      <div className="p-3 sm:p-4" style={{ maxWidth: '100%', overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
        <SyntaxHighlighter
          language={language || 'text'}
          style={vscDarkPlus}
          customStyle={{
            margin: 0,
            padding: 0,
            background: 'transparent',
            fontSize: '0.75rem',
            overflowX: 'auto',
            maxWidth: '100%',
          }}
          codeTagProps={{
            style: {
              maxWidth: '100%',
              display: 'block',
            }
          }}
          wrapLongLines={false}
        >
          {code}
        </SyntaxHighlighter>
      </div>
    </div>
  );
});

const SkeletonLoader = () => (
  <div className="space-y-3">
    <div className="flex items-center gap-2 text-orange-500">
      <Brain className="w-4 h-4 animate-pulse" />
      <span className="text-sm font-medium">Thinking...</span>
    </div>
    <div className="space-y-2 w-48">
      <div className="h-3 bg-zinc-700 rounded w-3/4 animate-pulse"></div>
      <div className="h-3 bg-zinc-700 rounded w-full animate-pulse" style={{ animationDelay: '0.1s' }}></div>
      <div className="h-3 bg-zinc-700 rounded w-5/6 animate-pulse" style={{ animationDelay: '0.2s' }}></div>
    </div>
  </div>
);

const ThinkingDisplay = React.memo(({ content, isOpen, onToggle }: { content: string; isOpen: boolean; onToggle: () => void }) => (
  <div className="mb-4 border border-zinc-700/50 rounded-lg overflow-hidden bg-black/20">
    <button
      onClick={onToggle}
      className="w-full flex items-center gap-2 p-3 hover:bg-white/5 transition-colors text-xs text-zinc-400 font-medium select-none"
    >
      <Brain className="w-4 h-4 text-orange-500" />
      <span>Thought Process</span>
      {isOpen ? <ChevronDown className="w-4 h-4 ml-auto opacity-50" /> : <ChevronRight className="w-4 h-4 ml-auto opacity-50" />}
    </button>
    {isOpen && (
      <div className="p-4 text-zinc-400 text-sm font-mono whitespace-pre-wrap border-t border-zinc-700/30 max-h-64 overflow-y-auto">
        {content}
      </div>
    )}
  </div>
));

// TypewriterText now only animates when explicitly triggered via shouldAnimate prop
const TypewriterText = React.memo(({ text, shouldAnimate }: { text: string; shouldAnimate: boolean }) => {
  // Animation state
  const hasAnimatedRef = useRef(false);
  const [displayedText, setDisplayedText] = useState(() => shouldAnimate ? '' : text);

  useEffect(() => {
    // Only animate if shouldAnimate is true and we haven't animated yet
    if (!shouldAnimate || hasAnimatedRef.current) {
      // If not animating, ensure full text is shown
      if (displayedText !== text) {
        setDisplayedText(text);
      }
      return;
    }

    if (displayedText.length < text.length) {
      const timeout = setTimeout(() => {
        setDisplayedText(text.substring(0, displayedText.length + 1));
      }, 10);
      return () => clearTimeout(timeout);
    } else {
      // Animation complete
      hasAnimatedRef.current = true;
    }
  }, [text, displayedText, shouldAnimate]);

  // Parse bold markdown
  const parseMarkdown = (content: string) => {
    const parts = content.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={i} className="text-orange-500">{part.slice(2, -2)}</strong>;
      }
      return part;
    });
  };

  return <span>{parseMarkdown(displayedText)}</span>;
});

const UserChat = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [attachedFiles, setAttachedFiles] = useState<File[]>([]);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editingContent, setEditingContent] = useState('');
  const [currentConversationId, setCurrentConversationId] = useState<string>(`conv-${Date.now()}`);
  const [thinkingOpenStates, setThinkingOpenStates] = useState<Record<string, boolean>>({});
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const loadedMessageIdsRef = useRef<Set<string>>(new Set());

  // Parse thinking tags
  const parseThinkingContent = useCallback((content: string) => {
    const thinkMatch = content.match(/<think>([\s\S]*?)(?:<\/think>|$)/);
    const hasThinking = !!thinkMatch;
    const thinkingContent = thinkMatch ? thinkMatch[1].trim() : '';
    let mainContent = content;
    if (hasThinking) {
      if (content.includes('</think>')) {
        mainContent = content.replace(/<think>[\s\S]*?<\/think>/, '').trim();
      } else {
        mainContent = '';
      }
    }
    return { hasThinking, thinkingContent, mainContent };
  }, []);

  // Toggle thinking panel for a message
  const toggleThinkingPanel = useCallback((messageId: string) => {
    setThinkingOpenStates(prev => ({
      ...prev,
      [messageId]: !prev[messageId]
    }));
  }, []);

  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    const username = user?.username || 'there';
    
    if (hour >= 5 && hour < 12) {
      return `Good morning, ${username}`;
    } else if (hour >= 12 && hour < 17) {
      return `Good afternoon, ${username}`;
    } else if (hour >= 17 && hour < 22) {
      return `Good evening, ${username}`;
    } else {
      return `Good night, ${username}`;
    }
  }, [user?.username]);

  const handleNewChat = useCallback(() => {
    setMessages([]);
    setInput('');
    setAttachedFiles([]);
    setEditingMessageId(null);
    setEditingContent('');
    loadedMessageIdsRef.current.clear();
    animatedMessagesRef.current.clear();
    const newId = `conv-${Date.now()}`;
    setCurrentConversationId(newId);
    // Reset and navigate to new chat
    navigate('/dashboard/chat', { replace: true });
    toast({
      description: 'Started a new conversation',
      duration: 2000,
    });
  }, [navigate, toast]);

  useEffect(() => {
    const conversationId = (location.state as { conversationId?: string })?.conversationId;
    const isNewChat = (location.state as { newChat?: boolean })?.newChat;

    if (isNewChat) {
      handleNewChat();
    } else if (conversationId) {
      setCurrentConversationId(conversationId);
    }
  }, [location, handleNewChat]);

  useEffect(() => {
    if (user && currentConversationId) {
      const stored = localStorage.getItem(`${STORAGE_KEY}_${currentConversationId}`);
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          const loadedMessages = parsed.map((m: { timestamp: string } & Omit<ChatMessage, 'timestamp'>) => ({
            ...m,
            timestamp: new Date(m.timestamp),
          }));
          // Skip animation for loaded messages
          loadedMessages.forEach((m: ChatMessage) => {
            loadedMessageIdsRef.current.add(m.id);
          });
          setMessages(loadedMessages);
        } catch (error) {
          // Ignore load errors
        }
      }
    }
  }, [user, currentConversationId]);

  useEffect(() => {
    if (user && messages.length > 0 && currentConversationId) {
      localStorage.setItem(`${STORAGE_KEY}_${currentConversationId}`, JSON.stringify(messages));
      
      const conversations = JSON.parse(localStorage.getItem(`omega_conversations_${user.id}`) || '[]');
      const existingIndex = conversations.findIndex((c: { id: string }) => c.id === currentConversationId);
      
      const conversationData = {
        id: currentConversationId,
        title: messages[0]?.content.substring(0, 50) || 'New conversation',
        lastMessage: messages[messages.length - 1]?.content.substring(0, 100) || '',
        timestamp: new Date(),
        messageCount: messages.length,
      };
      
      if (existingIndex >= 0) {
        conversations[existingIndex] = conversationData;
      } else {
        conversations.unshift(conversationData);
      }
      
      localStorage.setItem(`omega_conversations_${user.id}`, JSON.stringify(conversations));
    }
  }, [messages, user, currentConversationId, isLoading]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      const validFiles = files.filter(file => {
        if (file.type.startsWith('image/') && file.size > 200 * 1024) {
          toast({
            title: 'File Too Large',
            description: `${file.name} exceeds the 200KB limit for image analysis.`,
            variant: 'destructive',
          });
          return false;
        }
        return true;
      });
      setAttachedFiles(prev => [...prev, ...validFiles]);
      toast({
        title: 'Files attached',
        description: `${files.length} file(s) ready to upload`,
        duration: 2000,
      });
    }
  };

  const removeFile = (index: number) => {
    setAttachedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const getFileIcon = (file: File) => {
    if (file.type.startsWith('image/')) return ImageIcon;
    if (file.type.includes('text') || file.type.includes('code')) return Code;
    return FileText;
  };

  const handleSend = async () => {
    if ((!input.trim() && attachedFiles.length === 0) || !user) return;

    const userMessage: ChatMessage = {
      id: `msg-${Date.now()}-user`,
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
      attachments: attachedFiles.length > 0 ? attachedFiles.map(f => ({
        name: f.name,
        type: f.type,
        size: f.size,
      })) : undefined,
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setAttachedFiles([]);
    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = '48px';
    }
    setIsLoading(true);
    
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      const response = await aiService.chat(user.id, userMessage.content, attachedFiles.length > 0 ? attachedFiles : undefined, controller.signal);
      setMessages(prev => [...prev, response]);
    } catch (error) {
      if (error instanceof Error && error.name !== 'AbortError') {
        toast({
          title: 'Error',
          description: error.message || 'Failed to get response. Please try again.',
          variant: 'destructive',
          duration: 2000,
        });
      }
    }

    abortControllerRef.current = null;
    setIsLoading(false);
  };

  const handleDeleteMessage = (messageId: string) => {
    setMessages(prev => prev.filter(m => m.id !== messageId));
    toast({
      title: 'Message deleted',
      description: 'Message removed from chat history',
      duration: 2000,
    });
  };

  const handleEditMessage = (messageId: string, content: string) => {
    setEditingMessageId(messageId);
    setEditingContent(content);
  };

  const handleSaveEdit = async (messageId: string) => {
    if (!editingContent.trim() || !user) return;

    const messageIndex = messages.findIndex(m => m.id === messageId);
    if (messageIndex === -1) return;

    const updatedMessages = [...messages];
    updatedMessages[messageIndex] = {
      ...updatedMessages[messageIndex],
      content: editingContent.trim(),
    };

    const messagesAfterEdit = updatedMessages.slice(0, messageIndex + 1);
    setMessages(messagesAfterEdit);
    setEditingMessageId(null);
    setEditingContent('');
    setIsLoading(true);
    
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      const response = await aiService.chat(user.id, editingContent.trim(), undefined, controller.signal);
      setMessages(prev => [...prev, response]);
    } catch (error) {
      if (error instanceof Error && error.name !== 'AbortError') {
        toast({
          title: 'Error',
          description: error.message || 'Failed to get response. Please try again.',
          variant: 'destructive',
          duration: 2000,
        });
      }
    }

    abortControllerRef.current = null;
    setIsLoading(false);
  };

  const handleCancelEdit = () => {
    setEditingMessageId(null);
    setEditingContent('');
  };

  const handleRegenerate = async () => {
    if (isLoading || !user) return;

    const lastUserIndex = messages.map(m => m.role).lastIndexOf('user');
    if (lastUserIndex === -1) return;

    const lastUserMessage = messages[lastUserIndex];
    
    // Remove all messages after the last user message
    setMessages(prev => prev.slice(0, lastUserIndex + 1));
    setIsLoading(true);
    
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      const response = await aiService.chat(user.id, lastUserMessage.content, undefined, controller.signal);
      setMessages(prev => [...prev, response]);
    } catch (error) {
      if (error instanceof Error && error.name !== 'AbortError') {
        toast({
          title: 'Error',
          description: error.message || 'Failed to regenerate response.',
          variant: 'destructive',
          duration: 2000,
        });
      }
    }
    abortControllerRef.current = null;
    setIsLoading(false);
  };

  // Skip animation for loaded messages
  const animatedMessagesRef = useRef<Set<string>>(new Set());

  const renderMessageContent = useCallback((content: string, messageId: string, shouldAnimate: boolean) => {
    // Always render with full markdown support for professional formatting
    return (
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          code({ className, children, ...props }) {
            const match = /language-(\w+)/.exec(className || '');
            const isInline = !match;

            if (isInline) {
              return (
                <code className="bg-zinc-800 px-1.5 py-0.5 rounded text-sm text-orange-300 font-mono" {...props}>
                  {children}
                </code>
              );
            }

            return (
              <CodeBlock
                language={match[1]}
                code={String(children).replace(/\n$/, '')}
              />
            );
          },
          h1: ({ children }) => <h2 className="text-xl font-bold text-orange-500 mt-4 mb-2">{children}</h2>,
          h2: ({ children }) => <h3 className="text-lg font-bold text-orange-400 mt-3 mb-2">{children}</h3>,
          h3: ({ children }) => <h4 className="text-base font-bold text-orange-300 mt-2 mb-1">{children}</h4>,
          p: ({ children }) => <p className="mb-2 leading-relaxed">{children}</p>,
          ul: ({ children }) => <ul className="list-disc list-inside mb-2 space-y-1 ml-2">{children}</ul>,
          ol: ({ children }) => <ol className="list-decimal list-inside mb-2 space-y-1 ml-2">{children}</ol>,
          li: ({ children }) => <li className="text-gray-200">{children}</li>,
          strong: ({ children }) => <strong className="font-bold text-orange-400">{children}</strong>,
          em: ({ children }) => <em className="italic text-gray-300">{children}</em>,
          blockquote: ({ children }) => (
            <blockquote className="border-l-4 border-orange-500 pl-4 italic my-2 text-gray-400 bg-zinc-800/50 py-2 rounded-r">
              {children}
            </blockquote>
          ),
          a: ({ href, children }) => (
            <a href={href} className="text-orange-400 hover:text-orange-300 underline" target="_blank" rel="noopener noreferrer">
              {children}
            </a>
          ),
          table: ({ children }) => (
            <div className="overflow-x-auto my-2">
              <table className="min-w-full border border-zinc-700 rounded">{children}</table>
            </div>
          ),
          th: ({ children }) => <th className="px-3 py-2 bg-zinc-800 text-left text-sm font-semibold text-orange-400 border-b border-zinc-700">{children}</th>,
          td: ({ children }) => <td className="px-3 py-2 text-sm text-gray-300 border-b border-zinc-700">{children}</td>,
        }}
      >
        {content}
      </ReactMarkdown>
    );
  }, []);

  const handleStopGeneration = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
      setIsLoading(false);
      toast({
        description: 'Generation stopped.',
        duration: 2000,
      });
    }
  };

  const handleFeedback = async (messageId: string, type: 'positive' | 'negative') => {
    setMessages(prev => prev.map(m => {
      if (m.id === messageId) {
        return { ...m, feedback: m.feedback === type ? undefined : type };
      }
      return m;
    }));

    try {
      await aiService.sendFeedback(messageId, type);
      toast({
        title: 'Feedback sent',
        description: 'Thank you for your feedback!',
        duration: 2000,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to send feedback.',
        variant: 'destructive',
        duration: 2000,
      });
    }
  };

  const handleDownloadChat = () => {
    if (messages.length === 0) return;

    const content = messages.map(m => {
      const role = m.role === 'user' ? 'User' : 'Omega';
      const time = new Date(m.timestamp).toLocaleString();
      return `### ${role} (${time})\n\n${m.content}\n\n---\n`;
    }).join('\n');

    const blob = new Blob([content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `omega-chat-${new Date().toISOString().slice(0, 10)}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col h-full w-full bg-black">
      {/* Sticky header */}
      <header className="sticky top-0 flex-shrink-0 flex items-center justify-between z-20 gap-2 sm:gap-4 border-b border-zinc-800 bg-black px-3 sm:px-6 py-4">
        <div className="flex items-center gap-2 sm:gap-4 min-w-0">
          <SidebarTrigger />
          <div className="min-w-0">
            <h1 className="text-xl sm:text-2xl font-bold text-white">Ω Chat</h1>
            <p className="text-xs sm:text-sm text-gray-400 truncate">Powered by Omega</p>
          </div>
        </div>
        <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
          <button
            onClick={handleNewChat}
            className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors"
            title="New Chat"
          >
            <Plus className="w-5 h-5" />
          </button>
          {messages.length > 0 && (
            <button
              onClick={handleDownloadChat}
              className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors"
              title="Download Chat"
            >
              <Download className="w-5 h-5" />
            </button>
          )}
        </div>
      </header>

      <main className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden p-3 sm:p-6 bg-black scrollbar-hide scroll-smooth">
        <div className="max-w-4xl mx-auto space-y-4 min-h-full">
          {messages.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-12"
            >
              <div className="w-24 h-24 bg-orange-500/10 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-orange-500/20">
                <span className="text-6xl text-orange-500">Ω</span>
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">{greeting}</h2>
              <p className="text-gray-400 mb-6">Ask me anything, I'm here to help</p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8 max-w-2xl mx-auto">
                {[
                  { icon: Code, text: 'Generate code', prompt: 'Write a React component for a todo list' },
                  { icon: FileText, text: 'Analyze files', prompt: 'Help me analyze a document' },
                  { icon: User, text: 'Get answers', prompt: 'Explain quantum computing' },
                ].map((item, i) => (
                  <button
                    key={i}
                    onClick={() => setInput(item.prompt)}
                    className="p-4 bg-zinc-900 border border-zinc-800 rounded-lg hover:bg-zinc-800 hover:border-orange-500/50 transition-all text-left group"
                  >
                    <item.icon className="w-6 h-6 text-orange-500 mb-2 group-hover:scale-110 transition-transform" />
                    <p className="font-medium text-white">{item.text}</p>
                  </button>
                ))}
              </div>
            </motion.div>
          ) : (
            <AnimatePresence>
              {messages.map((message, index) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, x: message.role === 'user' ? 20 : -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className={`flex gap-4 group ${message.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
                >
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                    message.role === 'user' ? 'bg-orange-500' : 'bg-zinc-800 border border-zinc-700'
                  }`}>
                    {message.role === 'user' ? (
                      user?.avatar ? (
                        <img src={user.avatar} alt="User" className="w-full h-full rounded-full object-cover" />
                      ) : (
                        <User className="w-5 h-5 text-black" />
                      )
                    ) : (
                      <span className="text-lg font-bold text-orange-500">Ω</span>
                    )}
                  </div>
                  <div className={`flex-1 ${message.role === 'user' ? 'text-right' : 'text-left'}`}>
                    {editingMessageId === message.id && message.role === 'user' ? (
                      <div className="inline-block max-w-[85%] sm:max-w-[75%]">
                        <textarea
                          value={editingContent}
                          onChange={(e) => setEditingContent(e.target.value)}
                          className="w-full bg-zinc-900 border border-orange-500 text-white rounded-lg p-4 focus:outline-none focus:ring-2 focus:ring-orange-500 min-h-[100px]"
                          autoFocus
                        />
                        <div className="flex gap-2 mt-2 justify-end">
                          <button
                            onClick={handleCancelEdit}
                            className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg transition-colors"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={() => handleSaveEdit(message.id)}
                            className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition-colors flex items-center gap-2"
                          >
                            <Check className="w-4 h-4" />
                            Save & Resend
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className={`inline-block max-w-[85%] sm:max-w-[75%] p-4 rounded-2xl relative group overflow-hidden ${
                        message.role === 'user'
                          ? 'bg-orange-500 text-white'
                          : 'bg-zinc-900 border border-zinc-800 text-white'
                      }`} style={{ wordBreak: 'break-word', overflowWrap: 'break-word' }}>
                        {/* Show thinking/reasoning panel for assistant messages */}
                        {message.role === 'assistant' && (() => {
                          const { hasThinking, thinkingContent, mainContent } = parseThinkingContent(message.content);
                          if (hasThinking) {
                            return (
                              <>
                                <ThinkingDisplay
                                  content={thinkingContent}
                                  isOpen={thinkingOpenStates[message.id] ?? true}
                                  onToggle={() => toggleThinkingPanel(message.id)}
                                />
                                <div className="whitespace-pre-wrap min-w-0 overflow-x-auto">{renderMessageContent(mainContent, message.id, index === messages.length - 1)}</div>
                              </>
                            );
                          }
                          return <div className="whitespace-pre-wrap min-w-0 overflow-x-auto">{renderMessageContent(message.content, message.id, index === messages.length - 1)}</div>;
                        })()}
                        {/* For user messages, just render content normally */}
                        {message.role === 'user' && (
                          <div className="whitespace-pre-wrap min-w-0">{renderMessageContent(message.content, message.id, false)}</div>
                        )}
                        {message.attachments && message.attachments.length > 0 && (
                          <div className="mt-2 pt-2 border-t border-current/20">
                            {message.attachments.map((att, i) => (
                              <div key={i} className="text-sm opacity-80">
                                📎 {att.name}
                              </div>
                            ))}
                          </div>
                        )}
                        {message.role === 'user' && (
                          <div className="absolute -bottom-8 right-0 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2 z-10">
                            <button
                              onClick={() => handleEditMessage(message.id, message.content)}
                              className="bg-zinc-800 hover:bg-zinc-700 text-white rounded-full p-2 border border-zinc-700"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteMessage(message.id)}
                              className="bg-zinc-800 hover:bg-red-900/50 text-red-500 rounded-full p-2 border border-zinc-700"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                        {message.role === 'assistant' && (
                          <button
                            onClick={() => handleDeleteMessage(message.id)}
                            className="absolute -top-3 -right-3 opacity-0 group-hover:opacity-100 transition-opacity bg-zinc-800 hover:bg-red-900/50 text-red-500 border border-zinc-700 rounded-full p-1.5 z-10 shadow-lg"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    )}
                    
                    {message.role === 'assistant' && index === messages.length - 1 && !isLoading && (
                      <div className="mt-2 flex flex-col sm:flex-row items-start sm:items-center sm:justify-between gap-2 px-1">
                        <div className="flex items-center gap-1 flex-wrap">
                          <button
                            onClick={handleRegenerate}
                            className="p-1.5 text-zinc-500 hover:text-white hover:bg-zinc-800 rounded-md transition-colors"
                            title="Regenerate response"
                          >
                            <RefreshCw className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleFeedback(message.id, 'positive')}
                            className={`p-1.5 hover:text-white hover:bg-zinc-800 rounded-md transition-colors ${message.feedback === 'positive' ? 'text-green-500' : 'text-zinc-500'}`}
                            title="Good response"
                          >
                            <ThumbsUp className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleFeedback(message.id, 'negative')}
                            className={`p-1.5 hover:text-white hover:bg-zinc-800 rounded-md transition-colors ${message.feedback === 'negative' ? 'text-red-500' : 'text-zinc-500'}`}
                            title="Bad response"
                          >
                            <ThumbsDown className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(message.content);
                              toast({ description: 'Copied to clipboard', duration: 2000 });
                            }}
                            className="p-1.5 text-zinc-500 hover:text-white hover:bg-zinc-800 rounded-md transition-colors"
                            title="Copy"
                          >
                            <Copy className="w-4 h-4" />
                          </button>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-zinc-500 whitespace-nowrap">
                          <span>Generated by Omega</span>
                          <div className="w-1.5 h-1.5 rounded-full bg-orange-500" />
                        </div>
                      </div>
                    )}

                    <p className="text-xs text-gray-500 mt-1 px-2">
                      {new Date(message.timestamp).toLocaleTimeString()}
                    </p>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          )}
          {isLoading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex gap-4"
            >
              <div className="w-10 h-10 bg-zinc-800 border border-zinc-700 rounded-full flex items-center justify-center">
                <span className="text-lg font-bold text-orange-500">Ω</span>
              </div>
              <div className="flex-1">
                <div className="inline-block bg-zinc-900 border border-zinc-800 p-4 rounded-2xl"><SkeletonLoader /></div>
              </div>
            </motion.div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </main>

      <footer className="sticky bottom-0 flex-shrink-0 z-20 border-t border-zinc-800 bg-black p-3 sm:p-6 w-full">
        <div className="max-w-4xl mx-auto">
          {attachedFiles.length > 0 && (
            <div className="mb-4 flex flex-wrap gap-2">
              {attachedFiles.map((file, index) => {
                const FileIcon = getFileIcon(file);
                return (
                  <div key={index} className="flex items-center gap-2 bg-zinc-900 border border-zinc-800 px-3 py-2 rounded-lg hover:bg-zinc-800 transition-colors">
                    <FileIcon className="w-4 h-4 text-orange-500" />
                    <span className="text-sm text-white">{file.name}</span>
                    <button
                      onClick={() => removeFile(index)}
                      className="text-gray-400 hover:text-white transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
          <div className="flex gap-2 sm:gap-4">
            <input
              ref={fileInputRef}
              type="file"
              multiple
              onChange={handleFileSelect}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 hover:border-orange-500/50 rounded-lg transition-all self-end flex-shrink-0"
            >
              <Paperclip className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
            </button>
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => {
                setInput(e.target.value);
                // Auto-resize textarea
                e.target.style.height = 'auto';
                e.target.style.height = Math.min(e.target.scrollHeight, 200) + 'px';
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder="Message Omega..."
              className="flex-1 bg-zinc-900 border border-zinc-800 text-white placeholder:text-gray-500 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none overflow-y-auto max-h-[200px]"
              disabled={isLoading}
              rows={1}
              style={{ minHeight: '48px' }}
            />
            {isLoading ? (
              <button
                onClick={handleStopGeneration}
                className="flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-all self-end flex-shrink-0"
                title="Stop generating"
              >
                <Square className="w-4 h-4 sm:w-5 sm:h-5 fill-current" />
              </button>
            ) : (
              <button
                onClick={handleSend}
                disabled={!input.trim() && attachedFiles.length === 0}
                className="flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed self-end flex-shrink-0"
              >
                <Send className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            )}
          </div>
        </div>
      </footer>
    </div>
  );
};

export default UserChat;
