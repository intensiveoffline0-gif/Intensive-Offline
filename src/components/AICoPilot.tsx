import React, { useState, useRef, useEffect } from "react";
import { Student, ChatMessage } from "../types";
import { Send, Sparkles, MessageSquare, Bot, AlertCircle, CheckCircle } from "lucide-react";
import { motion } from "motion/react";

interface AICoPilotProps {
  students: Student[];
  rawCSV: string;
}

export function AICoPilot({ students, rawCSV }: AICoPilotProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      sender: "ai",
      text: `Hello there! I am your sales and coordination co-pilot. I have logged the current ${students.length} student records into my runtime context memory. 

You can ask me questions about active cohorts, placement stats, qualifications, gender ratios, district breakdowns, or individual student summaries! What can I fetch for you today?`,
      timestamp: new Date()
    }
  ]);
  const [inputValue, setInputValue] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorText, setErrorText] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Suggested prompt chips
  const suggestions = [
    "What is the overall placement rate?",
    "Which batch has the most active students?",
    "Tell me about student Konduri Vishesh",
    "List the students placed with Milestone Technologies",
    "How many students refunded or withdrew?"
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSendMessage = async (text: string) => {
    if (!text.trim() || isLoading) return;

    setErrorText(null);
    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: "user",
      text: text,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMsg]);
    setInputValue("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/ai/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: text,
          studentCSV: rawCSV,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "An issue occurred on our servers while formulating your answer.");
      }

      const aiMsg: ChatMessage = {
        id: `ai-${Date.now()}`,
        sender: "ai",
        text: data.answer,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, aiMsg]);
    } catch (err: any) {
      console.error(err);
      setErrorText(err.message || "Failed to contact coordination service.");
      
      const systemErrorMsg: ChatMessage = {
        id: `error-${Date.now()}`,
        sender: "ai",
        text: `⚠️ **Service Alert**: I encountered a problem accessing my AI thinking modules. \n\n*Error details: ${err.message || 'Verification issue'}*\n\nIf you see this error, please verify that your **GEMINI_API_KEY** is correctly configured inside your Settings > Secrets panel on the top right.`,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, systemErrorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 select-none leading-normal">
      
      {/* Left side: Guide and Prompt suggestions */}
      <div className="space-y-6 lg:col-span-1">
        <div className="bg-slate-900 text-white rounded-xl p-5 border border-slate-900 shadow-md">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="h-4 w-4 text-blue-400" />
            <h4 className="font-semibold text-xs tracking-widest uppercase">Co-Pilot Memory</h4>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed font-light">
            The AI accesses the current active database loaded in your browser cache memory. 
            When you import a custom CSV file, my context updates inside the chat engine instantly.
          </p>

          <div className="mt-4 pt-4 border-t border-slate-800 space-y-2.5 text-xs">
            <div className="flex justify-between items-center text-slate-400 font-medium">
              <span>Database Size</span>
              <span className="font-semibold text-slate-200">{students.length} students</span>
            </div>
            <div className="flex justify-between items-center text-slate-400 font-medium">
              <span>CSV Byte Size</span>
              <span className="font-semibold text-slate-200">{(rawCSV.length / 1024).toFixed(1)} KB</span>
            </div>
          </div>
        </div>

        {/* Suggestion Chips */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
          <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Quick Queries</h4>
          <div className="flex flex-col gap-2">
            {suggestions.map((prompt, idx) => (
              <button
                key={idx}
                onClick={() => handleSendMessage(prompt)}
                className="text-left text-xs bg-slate-50 hover:bg-blue-50 border border-slate-200 hover:border-blue-200 hover:text-blue-700 rounded-lg p-2.5 transition-all text-slate-700 font-semibold"
              >
                {prompt}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main chat window */}
      <div className="lg:col-span-3 flex flex-col bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden h-[540px]">
        {/* Chat header */}
        <div className="bg-slate-50 border-b border-slate-200 p-4 shrink-0 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 bg-blue-55/20 rounded-lg flex items-center justify-center text-blue-600 border border-blue-100">
              <Bot className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-850">Sales Intelligence Assistant</h3>
              <p className="text-[10px] text-slate-400 flex items-center gap-1">
                <span className="inline-block w-1.5 h-1.5 bg-emerald-500 rounded-full"></span>
                Instant contextual lookup active
              </p>
            </div>
          </div>
        </div>

        {/* Chat Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/20">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[85%] rounded-xl p-3.5 text-xs shadow-xs leading-relaxed ${
                  msg.sender === "user"
                    ? "bg-slate-900 text-white rounded-br-none"
                    : "bg-white border border-slate-200 text-slate-800 rounded-bl-none whitespace-pre-wrap"
                }`}
              >
                <div className="font-semibold text-[10px] uppercase opacity-65 mb-1 text-slate-400">
                  {msg.sender === "user" ? "SALES COORDINATOR" : "AI ENGINE"}
                </div>
                <p className="font-medium">{msg.text}</p>
              </div>
            </div>
          ))}

          {/* Typing Indicator */}
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-xs flex items-center gap-1.5 text-xs text-slate-400">
                <span className="font-bold text-slate-450 uppercase text-[9px]">Analyzing memory</span>
                <span className="flex gap-0.5">
                  <span className="h-1.5 w-1.5 bg-slate-450 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="h-1.5 w-1.5 bg-slate-450 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="h-1.5 w-1.5 bg-slate-450 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Message input column */}
        <div className="bg-slate-50 p-4 border-t border-slate-200 shrink-0">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage(inputValue);
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Ask a question about the active student dataset..."
              className="flex-1 bg-white border border-slate-200 text-xs rounded-xl px-4 py-3 text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500 transition-all font-medium"
            />
            <button
              type="submit"
              disabled={isLoading || !inputValue.trim()}
              className="bg-blue-600 border border-blue-650 disabled:opacity-50 text-white rounded-xl h-11 w-11 flex items-center justify-center shrink-0 hover:bg-blue-700 active:scale-95 transition-all text-xs"
            >
              <Send className="h-4 w-4" />
            </button>
          </form>
        </div>
        
      </div>
    </div>
  );
}
