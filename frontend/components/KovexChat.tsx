import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Loader2, MessageCircle, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ScrollArea } from '@/components/ui/scroll-area';
import ReactMarkdown from 'react-markdown';
import backend from '~backend/client';

interface Message {
  id: string;
  type: 'user' | 'bot';
  content: string;
  timestamp: Date;
}

export function KovexChat() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      type: 'bot',
      content: `Hello! I'm **Kovex AI**, your legal information assistant. I'm here to help you understand legal concepts and terminology in simple, clear language.

I can help you with:
- Legal definitions and concepts
- General legal principles
- Understanding legal terminology
- Explaining legal processes

**Important:** I provide general legal information only and do not offer legal advice. For specific legal matters, always consult with a qualified attorney.

What legal topic would you like to learn about today?`,
      timestamp: new Date(),
    },
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = async () => {
    const message = inputMessage.trim();
    if (!message || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: message,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);
    setError(null);

    try {
      const response = await backend.legal.chat({ message });
      
      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'bot',
        content: response.response,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      console.error('❌ Chat error:', error);
      setError(
        error instanceof Error 
          ? `Chat failed: ${error.message}` 
          : 'Chat failed. Please try again.'
      );
      
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'bot',
        content: "I apologize, but I'm experiencing technical difficulties right now. Please try again in a moment, or feel free to ask your question again.",
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <Card className="bg-gray-900 border-gray-800 h-[600px] flex flex-col">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center space-x-3 text-white">
          <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
            <Bot className="w-5 h-5 text-white" />
          </div>
          <div>
            <span>Kovex AI</span>
            <p className="text-sm text-gray-400 font-normal">Legal Information Assistant</p>
          </div>
        </CardTitle>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col p-0">
        {error && (
          <div className="px-6 pb-4">
            <Alert className="bg-red-950/30 border-red-800/30">
              <AlertCircle className="h-4 w-4 text-red-400" />
              <AlertDescription className="text-red-100">
                {error}
              </AlertDescription>
            </Alert>
          </div>
        )}

        <div ref={scrollAreaRef} className="flex-1 px-6 overflow-y-auto scroll-area">
          <div className="space-y-4 pb-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-lg px-4 py-3 ${
                    message.type === 'user'
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-800 text-gray-100 border border-gray-700'
                  }`}
                >
                  <div className="flex items-start space-x-2">
                    {message.type === 'bot' && (
                      <div className="w-6 h-6 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                        <Bot className="w-3 h-3 text-white" />
                      </div>
                    )}
                    {message.type === 'user' && (
                      <div className="w-6 h-6 bg-purple-700 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                        <User className="w-3 h-3 text-white" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      {message.type === 'bot' ? (
                        <div className="prose prose-sm prose-invert max-w-none">
                          <ReactMarkdown
                            components={{
                              p: ({ children }) => <p className="mb-2 last:mb-0 text-gray-100">{children}</p>,
                              strong: ({ children }) => <strong className="text-white font-semibold">{children}</strong>,
                              em: ({ children }) => <em className="text-blue-300">{children}</em>,
                              ul: ({ children }) => <ul className="list-disc list-inside mb-2 text-gray-100">{children}</ul>,
                              ol: ({ children }) => <ol className="list-decimal list-inside mb-2 text-gray-100">{children}</ol>,
                              li: ({ children }) => <li className="mb-1 text-gray-100">{children}</li>,
                              code: ({ children }) => (
                                <code className="bg-gray-700 text-blue-300 px-1 py-0.5 rounded text-sm">
                                  {children}
                                </code>
                              ),
                              blockquote: ({ children }) => (
                                <blockquote className="border-l-4 border-blue-500 pl-4 italic text-gray-300 my-2">
                                  {children}
                                </blockquote>
                              ),
                            }}
                          >
                            {message.content}
                          </ReactMarkdown>
                        </div>
                      ) : (
                        <p className="text-white">{message.content}</p>
                      )}
                      <div className="flex justify-between items-center mt-2">
                        <span className="text-xs text-gray-400">
                          {formatTime(message.timestamp)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="max-w-[80%] rounded-lg px-4 py-3 bg-gray-800 text-gray-100 border border-gray-700">
                  <div className="flex items-center space-x-2">
                    <div className="w-6 h-6 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                      <Bot className="w-3 h-3 text-white" />
                    </div>
                    <div className="flex items-center space-x-2">
                      <Loader2 className="w-4 h-4 animate-spin text-blue-400" />
                      <span className="text-gray-300">Kovex AI is thinking...</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>

        <div className="border-t border-gray-800 p-4">
          <div className="flex space-x-2">
            <Input
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask Kovex AI about legal concepts..."
              className="flex-1 bg-gray-800 border-gray-700 text-white placeholder-gray-500"
              disabled={isLoading}
            />
            <Button
              onClick={sendMessage}
              disabled={!inputMessage.trim() || isLoading}
              className="bg-purple-600 hover:bg-purple-700 disabled:opacity-50"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </Button>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            Press Enter to send • Kovex AI provides general legal information only
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
