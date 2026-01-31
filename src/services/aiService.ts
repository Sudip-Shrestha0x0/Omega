declare global {
  interface Window {
    puter: {
      ai: {
        chat: (
          message: string,
          attachmentOrOptions?: string | { model?: string; stream?: boolean; temperature?: number },
          options?: { model?: string; stream?: boolean; temperature?: number }
        ) => Promise<{ message: { content: string } }>;
        txt2img: (options: { prompt: string; model?: string; provider?: string }) => Promise<HTMLImageElement>;
      };
    };
  }
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  attachments?: Array<{
    name: string;
    type: string;
    size: number;
  }>;
  feedback?: 'positive' | 'negative';
}

interface AIProvider {
  name: string;
  enabled: boolean;
  priority: number;
  supportsImages: boolean;
  chat: (
    userId: string,
    message: string,
    files?: File[],
    signal?: AbortSignal,
  ) => Promise<ChatMessage>;
}

interface MessageContentPart {
  type: "text" | "image_url";
  text?: string;
  image_url?: { url: string };
}

interface LLMMessage {
  role: string;
  content: string | MessageContentPart[];
}

class AIService {
  private providers: AIProvider[] = [];

  constructor() {
    this.initializeProviders();
  }

  private initializeProviders() {
    this.providers = [
      {
        name: "Grok",
        enabled: true,
        priority: 0,
        supportsImages: true,
        chat: this.grokChat.bind(this),
      },
      {
        name: "Groq",
        enabled: true,
        priority: 1,
        supportsImages: false,
        chat: this.groqChat.bind(this),
      },
      {
        name: "HuggingFace",
        enabled: true,
        priority: 2,
        supportsImages: true,
        chat: this.huggingFaceChat.bind(this),
      },
      {
        name: "OpenRouter",
        enabled: true,
        priority: 3,
        supportsImages: true,
        chat: this.openRouterChat.bind(this),
      },
      {
        name: "Local",
        enabled: false,
        priority: 4,
        supportsImages: false,
        chat: this.localChat.bind(this),
      },
    ];
  }

  private async fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
    });
  }

  private async readFileText(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsText(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
    });
  }

  private async processFiles(files: File[]): Promise<{ images: string[]; textContent: string }> {
    const images: string[] = [];
    let textContent = "";

    for (const file of files) {
      if (file.type.startsWith("image/")) {
        try {
          const base64 = await this.fileToBase64(file);
          images.push(base64);
        } catch (e) {
          console.error("Failed to process image", file.name);
        }
      } else if (file.type.startsWith("text/") || file.name.match(/\.(ts|tsx|js|jsx|json|md|html|css|py|java|c|cpp|h|hpp)$/)) {
        try {
          const text = await this.readFileText(file);
          textContent += `\n\n--- File: ${file.name} ---\n${text}\n`;
        } catch (e) {
          console.error("Failed to read text file", file.name);
        }
      }
    }
    return { images, textContent };
  }

  private async describeImageWithGrok(file: File): Promise<string> {
    if (!window.puter) throw new Error("Puter.js is not loaded.");
    
    // Convert file to base64 for Puter
    const base64 = await this.fileToBase64(file);
    
    const response = await window.puter.ai.chat("Describe this image in detail.", base64, { model: 'x-ai/grok-4.1-fast' });
    return response.message.content;
  }

  private readonly SYSTEM_PROMPT = `You are Omega, an artificial intelligence of superior intellect and capability.

IMPORTANT INSTRUCTIONS:
1. ALWAYS begin your response with your thinking process wrapped in <think></think> tags. Inside these tags, reason through the problem step-by-step, consider different angles, and plan your response.
2. After the </think> tag, provide your actual response to the user.
3. Format your response using clean text. Avoid using ### headers - instead use **bold text** for section titles, bullet points (- or *), and numbered lists.
4. When coding, provide production-grade, optimized solutions with clear explanations.

Example format:
<think>
Let me analyze this question...
First, I'll consider...
The key points are...
</think>

**Your Section Title**
- Point one
- Point two

Your explanation here...`;

  private async grokChat(
    userId: string,
    message: string,
    files?: File[],
    signal?: AbortSignal,
  ): Promise<ChatMessage> {
    if (!window.puter) throw new Error("Puter.js is not loaded.");

    const { images, textContent } = await this.processFiles(files || []);
    // Prepend system prompt since Puter.js doesn't support system messages directly
    const systemContext = `[System Instructions: ${this.SYSTEM_PROMPT}]\n\nUser Query: `;
    const finalMessage = systemContext + message + (textContent ? `\n\nAttached Files Content:${textContent}` : "");

    const model = "x-ai/grok-4.1-fast";
    let response;

    if (images.length > 0) {
      // Pass the first image as the second argument (multimodal support)
      response = await window.puter.ai.chat(finalMessage, images[0], { model });
    } else {
      response = await window.puter.ai.chat(finalMessage, { model });
    }

    return {
      id: `msg-${Date.now()}-assistant`,
      role: "assistant",
      content: response.message.content,
      timestamp: new Date(),
    };
  }

  private async groqChat(
    userId: string,
    message: string,
    files?: File[],
    signal?: AbortSignal,
  ): Promise<ChatMessage> {
    const { textContent } = await this.processFiles(files || []);
    const finalMessage = message;

    const model = "llama-3.3-70b-versatile";
    const messages: {
      role: string;
      content: string;
    }[] = [
      {
        role: "system",
        content: this.SYSTEM_PROMPT,
      },
      {
        role: "user",
        content: finalMessage,
      },
    ];

    const response = await fetch(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_GROQ_API_KEY}`,
        },
        body: JSON.stringify({
          model: model,
          messages: messages,
          max_tokens: 2048,
          temperature: 0.7,
        }),
        signal,
      },
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: { message: response.statusText } }));
      throw new Error(errorData.error?.message || `Groq API Error: ${response.status}`);
    }

    const data = await response.json();
    const content =
      data.choices[0]?.message?.content || "No response generated.";

    return {
      id: `msg-${Date.now()}-assistant`,
      role: "assistant",
      content,
      timestamp: new Date(),
    };
  }

  private async huggingFaceChat(
    userId: string,
    message: string,
    files?: File[],
    signal?: AbortSignal,
  ): Promise<ChatMessage> {
    const { images, textContent } = await this.processFiles(files || []);
    
    // Use Kimi-K2.5 for images, Kimi-K2-Thinking for text
    const hasImages = images.length > 0;
    const model = hasImages ? "moonshotai/Kimi-K2.5" : "moonshotai/Kimi-K2-Thinking";

    const messages: LLMMessage[] = [
      {
        role: "system",
        content: this.SYSTEM_PROMPT
      }
    ];

    if (hasImages) {
      const content: MessageContentPart[] = [{ type: "text", text: message + (textContent ? `\n\nAttached Files Content:${textContent}` : "") }];
      for (const img of images) {
        content.push({
          type: "image_url",
          image_url: { url: img }
        });
      }
      messages.push({ role: "user", content });
    } else {
      messages.push({ role: "user", content: message + (textContent ? `\n\nAttached Files Content:${textContent}` : "") });
    }

    const response = await fetch(
      `https://api-inference.huggingface.co/models/${model}/v1/chat/completions`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_HUGGINGFACE_API_KEY}`,
        },
        body: JSON.stringify({
          model: model,
          messages: messages,
          max_tokens: 2048,
          stream: false
        }),
        signal,
      },
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: response.statusText }));
      throw new Error(typeof errorData === 'string' ? errorData : (errorData.error || `HF API Error: ${response.status}`));
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content || "No response generated.";

    return {
      id: `msg-${Date.now()}-assistant`,
      role: "assistant",
      content,
      timestamp: new Date(),
    };
  }

  private async openRouterChat(
    userId: string,
    message: string,
    files?: File[],
    signal?: AbortSignal,
  ): Promise<ChatMessage> {
    const { images, textContent } = await this.processFiles(files || []);
    
    const messages: LLMMessage[] = [
      {
        role: "system",
        content: this.SYSTEM_PROMPT,
      }
    ];

    if (images.length > 0) {
      const content: MessageContentPart[] = [{ type: "text", text: message + (textContent ? `\n\nAttached Files Content:${textContent}` : "") }];
      for (const img of images) {
        content.push({
          type: "image_url",
          image_url: { url: img }
        });
      }
      messages.push({ role: "user", content });
    } else {
      messages.push({ role: "user", content: message + (textContent ? `\n\nAttached Files Content:${textContent}` : "") });
    }

    // Use a model that supports vision if images are present, or a standard free one
    const model = images.length > 0 ? "google/gemini-2.0-flash-exp:free" : "mistralai/mistral-7b-instruct:free";

    const response = await fetch(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_OPENROUTER_API_KEY}`,
          "HTTP-Referer": window.location.origin,
        },
        body: JSON.stringify({
          model: model,
          messages: messages,
        }),
        signal,
      },
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: { message: response.statusText } }));
      throw new Error(errorData.error?.message || `OpenRouter API Error: ${response.status}`);
    }

    const data = await response.json();
    const content =
      data.choices[0]?.message?.content || "No response generated.";

    return {
      id: `msg-${Date.now()}-assistant`,
      role: "assistant",
      content,
      timestamp: new Date(),
    };
  }

  private async localChat(
    userId: string,
    message: string,
    files?: File[],
    signal?: AbortSignal,
  ): Promise<ChatMessage> {
    await new Promise((resolve) => setTimeout(resolve, 500));

    const responses: { [key: string]: string } = {
      hello: "Hello! How can I assist you today?",
      hi: "Hi there! What can I help you with?",
      "how are you":
        "I'm functioning perfectly! Ready to help you with anything.",
      "what can you do":
        "I can help with code generation, answer questions, analyze documents, and much more. Just ask!",
      code: 'Here\'s a sample React component:\n\n```jsx\nimport React, { useState } from "react";\n\nconst TodoList = () => {\n  const [todos, setTodos] = useState([]);\n  const [input, setInput] = useState("");\n\n  const addTodo = () => {\n    if (input.trim()) {\n      setTodos([...todos, { id: Date.now(), text: input }]);\n      setInput("");\n    }\n  };\n\n  return (\n    <div>\n      <input value={input} onChange={(e) => setInput(e.target.value)} />\n      <button onClick={addTodo}>Add</button>\n      <ul>\n        {todos.map(todo => <li key={todo.id}>{todo.text}</li>)}\n      </ul>\n    </div>\n  );\n};\n\nexport default TodoList;\n```',
    };

    const lowerMessage = message.toLowerCase();
    for (const [key, response] of Object.entries(responses)) {
      if (lowerMessage.includes(key)) {
        return {
          id: `msg-${Date.now()}-assistant`,
          role: "assistant",
          content: response,
          timestamp: new Date(),
        };
      }
    }

    const contextualResponse = `I understand you're asking about "${message}". 

Here's what I can help you with:

1. **Code Generation**: I can write code in JavaScript, Python, TypeScript, React, and more.
2. **Problem Solving**: Ask me technical questions or explain complex concepts.
3. **Document Analysis**: Share files and I'll help analyze them.
4. **Internet Search**: I can search for information online.

What would you like me to help you with specifically?`;

    return {
      id: `msg-${Date.now()}-assistant`,
      role: "assistant",
      content: contextualResponse,
      timestamp: new Date(),
    };
  }

  private async retryOperation<T>(
    operation: () => Promise<T>,
    maxRetries: number = 3,
    delay: number = 1000,
  ): Promise<T> {
    let lastError: unknown;

    for (let i = 0; i < maxRetries; i++) {
      try {
        return await operation();
      } catch (error) {
        if (error.name === 'AbortError') {
          throw error;
        }
        lastError = error;
        if (i < maxRetries - 1) {
          await new Promise((resolve) =>
            setTimeout(resolve, delay * Math.pow(2, i)),
          );
        }
      }
    }

    throw lastError;
  }

  async chat(
    userId: string,
    message: string,
    files?: File[],
    signal?: AbortSignal,
  ): Promise<ChatMessage> {
    let baseMessage = message;
    let imageDescription = '';
    let extractedTextForFallback = '';

    if (files && files.length > 0) {
      // Process text files first
      const textFiles = files.filter(f => !f.type.startsWith('image/'));
      const { textContent } = await this.processFiles(textFiles);
      if (textContent) {
        baseMessage += `\n\n--- Attached File Content ---\n${textContent}\n--- End File Content ---`;
      }
    }

    const sortedProviders = this.providers
      .filter((p) => p.enabled)
      .sort((a, b) => a.priority - b.priority);

    const imageFiles = files?.filter(f => f.type.startsWith('image/')) || [];

    for (const provider of sortedProviders) {
      try {
        let messageToSend = baseMessage;
        let filesToSend = files;

        // If provider supports images, pass them directly
        if (provider.supportsImages && imageFiles.length > 0) {
           // Provider handles images, no need to change message
        } 
        // If provider does NOT support images but we have images, we need to extract text
        else if (!provider.supportsImages && imageFiles.length > 0) {
           if (!extractedTextForFallback) {
             try {
                const firstImage = imageFiles[0];
                extractedTextForFallback = await this.describeImageWithGrok(firstImage);
                imageDescription = `[System: The user has attached an image. The extracted text from the image is: "${extractedTextForFallback}"]\n\n`;
             } catch (e) {
                console.error("Image analysis fallback failed:", e);
                imageDescription = `[System: Failed to analyze the attached image.]\n\n`;
             }
           }
           messageToSend = imageDescription + baseMessage;
           // Don't pass image files to a provider that doesn't support them to avoid confusion/errors
           filesToSend = files?.filter(f => !f.type.startsWith('image/'));
        }

        return await this.retryOperation(() => provider.chat(userId, messageToSend, filesToSend, signal));
      } catch (error) {
        console.warn(`Provider ${provider.name} failed:`, error);
        // If this was the last provider, re-throw the error so the UI sees it
        if (provider.priority === sortedProviders[sortedProviders.length - 1].priority) {
           throw error;
        }
      }
    }
    throw new Error("All AI providers failed to respond.");
  }

  async generateCodeCompletion(
    language: string,
    context: string,
  ): Promise<string> {
    const message = `Generate ${language} code for: ${context}`;
    const response = await this.chat("system", message);
    return response.content;
  }

  async generateCode(prompt: string, language: string): Promise<string> {
    const message = `Generate ${language} code for: ${prompt}`;
    const response = await this.chat("system", message);
    return response.content;
  }

  async generateImage(prompt: string): Promise<string> {
    if (!window.puter) throw new Error("Puter.js is not loaded.");
    const imageElement = await window.puter.ai.txt2img({
      prompt,
      model: 'grok-2-image',
      provider: 'xai',
    });
    return imageElement.src;
  }

  async searchInternet(query: string): Promise<string[]> {
    const message = `Search the internet for: ${query}`;
    const response = await this.chat("system", message);
    return [
      response.content,
      "Additional search result...",
      "More information about " + query,
    ];
  }

  async sendFeedback(messageId: string, type: 'positive' | 'negative'): Promise<void> {
    // Simulate server request
    await new Promise((resolve) => setTimeout(resolve, 500));
    console.log(`Feedback sent for message ${messageId}: ${type}`);
  }
}

export const aiService = new AIService();
