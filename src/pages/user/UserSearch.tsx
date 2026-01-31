import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Search, ExternalLink, Clock, Sparkles } from 'lucide-react';
import { aiService } from '../../services/aiService';
import { useToast } from '../../hooks/use-toast';

const UserSearch = () => {
  const { toast } = useToast();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<string[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchHistory, setSearchHistory] = useState<string[]>([]);

  const handleSearch = async () => {
    if (!query.trim()) return;

    setIsSearching(true);
    const searchResults = await aiService.searchInternet(query);
    setResults(searchResults);
    setSearchHistory(prev => [query, ...prev.slice(0, 9)]);
    setIsSearching(false);

    toast({
      title: 'Search completed',
      description: `Found ${searchResults.length} results for "${query}"`,
    });
  };

  return (
    <div className="flex flex-col h-full w-full">
      <header className="flex items-center sticky top-0 z-10 gap-4 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-6 py-4">
        <SidebarTrigger />
        <div>
          <h1 className="text-2xl font-bold">Internet Search</h1>
          <p className="text-sm text-muted-foreground">Real-time web search powered by AI</p>
        </div>
      </header>

      <main className="flex-1 overflow-auto p-6">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <div className="flex gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  placeholder="Search the internet..."
                  className="w-full bg-secondary border-0 rounded-lg pl-12 pr-4 py-4 focus:outline-none focus:ring-2 focus:ring-primary"
                  disabled={isSearching}
                />
              </div>
              <button
                onClick={handleSearch}
                disabled={isSearching || !query.trim()}
                className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-4 rounded-lg font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isSearching ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-primary-foreground border-t-transparent" />
                ) : (
                  <>
                    <Search className="w-5 h-5" />
                    Search
                  </>
                )}
              </button>
            </div>
          </motion.div>

          <AnimatePresence>
            {results.length > 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-4"
              >
                <div className="flex items-center gap-2 text-muted-foreground mb-6">
                  <Sparkles className="w-4 h-4 text-primary" />
                  <span>Found {results.length} results in 0.5 seconds</span>
                </div>

                {results.map((result, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="bg-card border p-6 rounded-lg hover:border-primary/50 transition-all group"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold mb-2 group-hover:text-primary transition-colors">
                          Search Result {index + 1}
                        </h3>
                        <p className="text-muted-foreground mb-4">{result}</p>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            Just now
                          </span>
                          <span>Relevance: {Math.floor(95 - index * 5)}%</span>
                        </div>
                      </div>
                      <button className="text-primary hover:text-primary/80 transition-colors">
                        <ExternalLink className="w-5 h-5" />
                      </button>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          {results.length === 0 && !isSearching && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-12"
            >
              <Search className="w-16 h-16 text-primary mx-auto mb-4 opacity-50" />
              <h2 className="text-xl font-bold mb-2">Start Searching</h2>
              <p className="text-muted-foreground">Enter a query to search the internet</p>

              {searchHistory.length > 0 && (
                <div className="mt-8">
                  <h3 className="text-sm font-semibold text-muted-foreground mb-4">Recent Searches</h3>
                  <div className="flex flex-wrap gap-2 justify-center">
                    {searchHistory.map((item, index) => (
                      <button
                        key={index}
                        onClick={() => setQuery(item)}
                        className="bg-secondary hover:bg-accent px-4 py-2 rounded-lg text-sm transition-colors"
                      >
                        {item}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </div>
      </main>
    </div>
  );
};

export default UserSearch;
