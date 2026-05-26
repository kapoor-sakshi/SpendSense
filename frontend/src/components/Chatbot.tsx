'use client';

import React, { useState, useRef, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { MessageSquare, X, Send, Bot, User, Sparkles } from 'lucide-react';
import { useApp } from '../context/AppContext';

export const Chatbot: React.FC = () => {
  const pathname = usePathname();
  const { user, triggerAIChat } = useApp();
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Array<{ sender: 'bot' | 'user'; text: string }>>([]);
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const hasNoData = !user || !user.banks || user.banks.length === 0;

  // Initialize welcome message dynamically depending on user and onboarding status
  useEffect(() => {
    if (user && user.name) {
      if (hasNoData) {
        setMessages([
          { 
            sender: 'bot', 
            text: `Hello ${user.name}! I'm SpendSense AI, your financial assistant. I noticed you haven't connected a bank account yet. I can act as your onboarding guide! Let me know if you have questions about linking bank statements, registering UPI IDs, or starting manual transaction ledgers.` 
          }
        ]);
      } else {
        setMessages([
          { 
            sender: 'bot', 
            text: `Hello ${user.name}! I'm SpendSense AI, your financial assistant. Ask me questions about your monthly spending, connected bank accounts, active EMIs, Groww investment margins, or tips to optimize your savings.` 
          }
        ]);
      }
    }
  }, [user?.name, hasNoData]);

  // Auto-scroll to bottom of chats
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  // Hide chatbot on landing or auth screens
  const isAuthOrLanding = pathname === '/' || pathname === '/login' || pathname === '/signup';
  if (isAuthOrLanding) return null;

  const handleSend = async (textToSend?: string) => {
    const text = textToSend || input;
    if (!text.trim()) return;

    setMessages(prev => [...prev, { sender: 'user', text }]);
    if (!textToSend) setInput('');
    setLoading(true);

    try {
      const reply = await triggerAIChat(text);
      setMessages(prev => [...prev, { sender: 'bot', text: reply }]);
    } catch (error) {
      setMessages(prev => [...prev, { sender: 'bot', text: 'Sorry, I encountered an issue connecting to my NLP models. Please try again.' }]);
    } finally {
      setLoading(false);
    }
  };

  const samplePrompts = hasNoData ? [
    "How do I link a bank account?",
    "What bank institutions are supported?",
    "Can I parse transactions from my statement?",
    "Is my financial data secured?"
  ] : [
    "What is my combined bank balance?",
    "Suggest steps to increase my credit score.",
    "Show my Groww portfolio P/L gains.",
    "Give active suggestions to reduce debt."
  ];

  return (
    <>
      {/* Floating Action Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 w-14 h-14 rounded-full bg-gradient-to-tr from-purple-600 via-indigo-600 to-blue-500 flex items-center justify-center text-white shadow-lg hover:shadow-purple-500/25 transition-all duration-300 transform hover:scale-110 active:scale-95 z-45 cursor-pointer border border-white/10"
      >
        <MessageSquare className="w-6 h-6 animate-pulse" />
      </button>

      {/* Slide-out Panel */}
      <div 
        className={`
          fixed top-0 right-0 w-96 h-screen bg-white/95 backdrop-blur-2xl border-l border-slate-200/80 shadow-2xl flex flex-col z-50 transition-transform duration-300 ease-out
          ${isOpen ? 'translate-x-0' : 'translate-x-full'}
        `}
      >
        {/* Chat Header */}
        <div className="p-4 border-b border-slate-200/80 bg-gradient-to-r from-purple-50 via-indigo-50/50 to-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center text-purple-600">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-800 text-sm">SpendSense Advisor</h3>
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                <span className="text-[10px] text-slate-500">Gemini LLM Active</span>
              </div>
            </div>
          </div>
          <button 
            onClick={() => setIsOpen(false)}
            className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Message timeline */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((msg, index) => (
            <div key={index} className={`flex items-start gap-2.5 ${msg.sender === 'user' ? 'flex-row-reverse' : ''}`}>
              <div className={`
                w-8 h-8 rounded-lg flex items-center justify-center shrink-0 text-xs font-semibold
                ${msg.sender === 'user' ? 'bg-indigo-600 text-white' : 'bg-purple-100 text-purple-600 border border-purple-200'}
              `}>
                {msg.sender === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
              </div>
              <div className={`
                max-w-[75%] rounded-2xl px-4 py-2.5 text-xs leading-relaxed shadow-sm
                ${msg.sender === 'user' 
                  ? 'bg-indigo-600 text-white rounded-tr-none' 
                  : 'bg-slate-100 text-slate-700 border border-slate-200/50 rounded-tl-none'}
              `}>
                <p className="whitespace-pre-line">
                  {msg.text.split('**').map((chunk, i) => i % 2 === 1 ? <strong key={i} className={`font-bold ${msg.sender === 'user' ? 'text-white' : 'text-slate-900'}`}>{chunk}</strong> : chunk)}
                </p>
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex items-start gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-purple-100 border border-purple-200 flex items-center justify-center text-purple-600">
                <Bot className="w-4 h-4" />
              </div>
              <div className="bg-slate-100 border border-slate-200/50 text-slate-400 rounded-2xl rounded-tl-none px-4 py-2.5 text-xs flex items-center gap-1.5 shadow-sm">
                <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Suggestions overlay */}
        {messages.length === 1 && (
          <div className="px-4 py-3 bg-slate-50 border-t border-slate-200/80">
            <p className="text-[10px] text-slate-400 mb-2 uppercase tracking-widest font-mono font-bold">Suggested Questions</p>
            <div className="flex flex-col gap-1.5">
              {samplePrompts.map((p, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSend(p)}
                  className="text-left text-[11px] text-slate-600 hover:text-slate-950 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 transition-colors cursor-pointer truncate shadow-sm"
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input box */}
        <div className="p-4 border-t border-slate-200/80 bg-white flex items-center gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Ask anything..."
            className="flex-1 bg-slate-50 border border-slate-200/80 rounded-xl px-4 py-2.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-purple-500 focus:bg-white transition-all shadow-inner"
          />
          <button
            onClick={() => handleSend()}
            className="w-10 h-10 rounded-xl bg-purple-600 hover:bg-purple-500 flex items-center justify-center text-white shrink-0 shadow-md hover:shadow-purple-500/10 active:scale-95 transition-all cursor-pointer"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </>
  );
};

export default Chatbot;
