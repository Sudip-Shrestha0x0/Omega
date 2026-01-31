import React, { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Brain, ChevronDown, ChevronRight } from 'lucide-react';
import { ChatMessage } from '../services/aiService';

interface MessageBubbleProps {
  message: ChatMessage;
  isLast: boolean;
}

// wrapping the component in React.memo to prevent it from re-rendering if its props haven't changed.
// A key optimization to stop the animation from restarting when the parent component updates.
export const MessageBubble: React.FC<MessageBubbleProps> = React.memo(({ message, isLast }) => {
  // Refs to track animation state - calculated once on mount and never change
  const isFresh = useRef<boolean>(Date.now() - new Date(message.timestamp).getTime() < 100);
  const hasAnimated = useRef<boolean>(false);
  const initialContent = useRef<string>(message.content);

  // Determine if the typewriter effect should run based on message properties.
  // Only animate if: it's fresh, it's the last message, it's an assistant message, and we haven't animated yet
  const shouldAnimate = isLast && message.role === 'assistant' && isFresh.current && !hasAnimated.current;

  // State for the content that is actually displayed on screen.
  // Initialize with full content if not animating, empty string only if we should animate
  const [displayedContent, setDisplayedContent] = useState(() => {
    if (shouldAnimate) {
      return '';
    }
    return message.content;
  });

  // State for reasoning toggle
  const [isReasoningOpen, setIsReasoningOpen] = useState(true);

  useEffect(() => {
    // If the content changed externally (e.g., streaming) after initial render, update it
    if (initialContent.current !== message.content && !shouldAnimate) {
      setDisplayedContent(message.content);
      initialContent.current = message.content;
    }
  }, [message.content, shouldAnimate]);

  useEffect(() => {
    // Only run animation if we should animate and haven't finished yet
    if (!shouldAnimate) {
      return;
    }

    // This effect handles the typewriter animation using a chain of timeouts
    if (displayedContent.length < message.content.length) {
      const timeoutId = setTimeout(() => {
        // Append the next character. Using substring is robust against streaming content changes.
        setDisplayedContent(message.content.substring(0, displayedContent.length + 1));
      }, 15); // Typing speed

      // Cleanup the timeout if the component unmounts or dependencies change.
      return () => clearTimeout(timeoutId);
    } else {
      // Animation complete
      hasAnimated.current = true;
    }
  }, [displayedContent, message.content, shouldAnimate]);

  // If animation is not needed and content doesn't match, sync it
  useEffect(() => {
    if (!shouldAnimate && displayedContent !== message.content) {
      setDisplayedContent(message.content);
    }
  }, [shouldAnimate, displayedContent, message.content]);

  // Extract reasoning content if present
  const thinkMatch = displayedContent.match(/<think>([\s\S]*?)(?:<\/think>|$)/);
  const hasThink = !!thinkMatch;
  const reasoningContent = thinkMatch ? thinkMatch[1] : '';
  
  let mainContent = displayedContent;
  if (hasThink) {
    if (displayedContent.includes('</think>')) {
      mainContent = displayedContent.replace(/<think>[\s\S]*?<\/think>/, '').trim();
    } else {
      mainContent = '';
    }
  }

  return (
    <div className={`p-4 rounded-lg ${message.role === 'user' ? 'bg-blue-600' : 'bg-gray-800'}`}>
      {hasThink && (
        <div className="mb-4 border border-gray-700/50 rounded-lg overflow-hidden bg-black/20">
          <button 
            onClick={() => setIsReasoningOpen(!isReasoningOpen)}
            className="w-full flex items-center gap-2 p-2 hover:bg-white/5 transition-colors text-xs text-gray-400 font-medium select-none"
          >
            <Brain className="w-3.5 h-3.5 text-orange-500" />
            <span>Thought Process</span>
            {isReasoningOpen ? <ChevronDown className="w-3.5 h-3.5 ml-auto opacity-50" /> : <ChevronRight className="w-3.5 h-3.5 ml-auto opacity-50" />}
          </button>
          {isReasoningOpen && (
            <div className="p-3 text-gray-400 text-sm font-mono whitespace-pre-wrap border-t border-gray-700/30 animate-in slide-in-from-top-2 duration-200">
              {reasoningContent}
              {shouldAnimate && !displayedContent.includes('</think>') && (
                 <span className="inline-block w-1.5 h-3.5 ml-1 bg-orange-500 align-middle animate-pulse"/>
              )}
            </div>
          )}
        </div>
      )}
      <div className="text-gray-100 max-w-none leading-relaxed">
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={{
            h1: ({node, ...props}) => <h1 className="text-2xl font-bold mt-6 mb-4 text-orange-500 border-b border-gray-700 pb-2" {...props} />,
            h2: ({node, ...props}) => <h2 className="text-xl font-bold mt-5 mb-3 text-orange-400" {...props} />,
            h3: ({node, ...props}) => <h3 className="text-lg font-bold mt-4 mb-2 text-orange-300" {...props} />,
            h4: ({node, ...props}) => <h4 className="text-base font-bold mt-3 mb-2 text-orange-200" {...props} />,
            p: ({node, ...props}) => <p className="mb-3" {...props} />,
            ul: ({node, ...props}) => <ul className="list-disc list-inside mb-4 space-y-1 text-gray-300" {...props} />,
            ol: ({node, ...props}) => <ol className="list-decimal list-inside mb-4 space-y-1 text-gray-300" {...props} />,
            li: ({node, ...props}) => <li className="ml-2" {...props} />,
            blockquote: ({node, ...props}) => <blockquote className="border-l-4 border-orange-500 pl-4 italic my-4 text-gray-400 bg-gray-900/50 py-2 rounded-r" {...props} />,
            a: ({node, ...props}) => <a className="text-orange-400 hover:text-orange-300 hover:underline transition-colors" target="_blank" rel="noopener noreferrer" {...props} />,
            strong: ({node, ...props}) => <strong className="font-bold text-white" {...props} />,
            code({ className, children, node, ...rest }: React.ComponentPropsWithoutRef<'code'> & { node?: unknown }) {
            // 1. Detect if it's a code block vs inline code
            const match = /language-(\w+)/.exec(className || '');
            const isInline = !match;

            if (isInline) {
                return (
                <code 
                    className="bg-gray-900 px-1.5 py-0.5 rounded text-sm text-orange-300 font-mono border border-gray-700" 
                    {...rest}
                >
                    {children}
                </code>
                );
            }

            return (
                <div className="my-4 rounded-lg overflow-hidden border border-gray-700 bg-gray-950">
                <div className="bg-gray-900 px-4 py-2 text-xs text-gray-400 border-b border-gray-700 flex justify-between">
                    <span className="uppercase tracking-widest">{match[1]}</span>
                </div>
                <pre className="p-4 overflow-x-auto text-sm text-gray-300 font-mono scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent">
                    <code className={className} {...rest}>
                    {children}
                    </code>
                </pre>
                </div>
            );
            },

            table: ({node, ...props}) => <div className="overflow-x-auto my-4 rounded border border-gray-700"><table className="min-w-full divide-y divide-gray-700" {...props} /></div>,
            th: ({node, ...props}) => <th className="px-4 py-3 bg-gray-900 text-left text-xs font-medium text-orange-400 uppercase tracking-wider" {...props} />,
            td: ({node, ...props}) => <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-300 border-t border-gray-700" {...props} />,
          }}
        >
          {mainContent}
        </ReactMarkdown>
      </div>
    </div>
  );
});