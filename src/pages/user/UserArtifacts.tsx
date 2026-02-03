import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Code, Copy, Check, Download } from 'lucide-react';
import { aiService } from '../../services/aiService';
import { useToast } from '../../hooks/use-toast';

const UserArtifacts = () => {
  const { toast } = useToast();
  const [prompt, setPrompt] = useState('');
  const [language, setLanguage] = useState('javascript');
  const [generatedCode, setGeneratedCode] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);

  const languages = [
    { value: 'javascript', label: 'JavaScript' },
    { value: 'python', label: 'Python' },
    { value: 'typescript', label: 'TypeScript' },
    { value: 'react', label: 'React' },
  ];

  const handleGenerate = async () => {
    if (!prompt.trim()) return;

    setIsGenerating(true);
    const code = await aiService.generateCode(prompt, language);
    setGeneratedCode(code);
    setIsGenerating(false);

    toast({
      title: 'Code generated!',
      description: `Your ${language} code is ready.`,
    });
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedCode);
    setCopied(true);
    toast({
      title: 'Copied!',
      description: 'Code copied to clipboard.',
    });
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const extensions: Record<string, string> = {
      javascript: 'js',
      python: 'py',
      typescript: 'ts',
      react: 'jsx',
    };
    const blob = new Blob([generatedCode], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `generated.${extensions[language]}`;
    a.click();
    toast({
      title: 'Downloaded!',
      description: 'Code saved to your device.',
    });
  };

  return (
    <div className="flex flex-col h-full w-full bg-black">
      {/* Sticky header - stays visible while scrolling */}
      <header className="sticky top-0 flex-shrink-0 flex items-center z-20 gap-2 sm:gap-4 border-b border-zinc-800 bg-black px-3 sm:px-6 py-4">
        <SidebarTrigger />
        <div className="min-w-0">
          <h1 className="text-xl sm:text-2xl font-bold text-white">Code Generator</h1>
          <p className="text-xs sm:text-sm text-gray-400 truncate">Create production-ready code with AI</p>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto overflow-x-hidden scrollbar-hide p-3 sm:p-6 bg-black">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-6">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-6"
            >
              <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-lg">
                <h2 className="text-xl font-bold mb-4 text-white">What do you want to build?</h2>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2 text-white">
                      Language
                    </label>
                    <select
                      value={language}
                      onChange={(e) => setLanguage(e.target.value)}
                      className="w-full bg-zinc-800 border-0 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-orange-500 text-white"
                    >
                      {languages.map((lang) => (
                        <option key={lang.value} value={lang.value}>
                          {lang.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2 text-white">
                      Describe your code
                    </label>
                    <textarea
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value)}
                      placeholder="E.g., Create a function that validates email addresses..."
                      rows={8}
                      className="w-full bg-zinc-800 border-0 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none text-white placeholder:text-gray-500"
                    />
                  </div>

                  <button
                    onClick={handleGenerate}
                    disabled={isGenerating || !prompt.trim()}
                    className="w-full bg-orange-500 hover:bg-orange-600 text-white py-3 rounded-lg font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {isGenerating ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Code className="w-5 h-5" />
                        Generate Code
                      </>
                    )}
                  </button>
                </div>
              </div>

              <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-lg">
                <h3 className="text-lg font-bold mb-3 text-white">Examples</h3>
                <div className="space-y-2">
                  {[
                    'Create a React component for a todo list',
                    'Build a Python function to parse JSON',
                    'Write TypeScript code for form validation',
                  ].map((example, index) => (
                    <button
                      key={index}
                      onClick={() => setPrompt(example)}
                      className="w-full text-left bg-zinc-800 hover:bg-zinc-700 px-4 py-3 rounded-lg text-sm transition-colors text-white"
                    >
                      {example}
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-zinc-900 border border-zinc-800 p-6 rounded-lg flex flex-col"
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-white">Generated Code</h2>
                {generatedCode && (
                  <div className="flex gap-2">
                    <button
                      onClick={handleCopy}
                      className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
                    >
                      {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    </button>
                    <button
                      onClick={handleDownload}
                      className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>

              <div className="flex-1 bg-zinc-800 rounded-lg p-4 overflow-auto">
                {generatedCode ? (
                  <pre className="text-sm font-mono whitespace-pre-wrap text-white">
                    {generatedCode}
                  </pre>
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-400">
                    <div className="text-center">
                      <Code className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>Your generated code will appear here</p>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default UserArtifacts;
