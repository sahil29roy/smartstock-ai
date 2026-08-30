import React, { useState, useRef, useEffect } from "react";
import { Send, Sparkles, MessageSquare, AlertCircle, RefreshCw, Database } from "lucide-react";
import { useAuth } from "@/components/auth/auth-provider";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "../ui/card";
import { ChatLoadingBubble } from "./ai-loading";
import { aiClient } from "@/lib/api/ai.client";
import { AskAIResponse } from "@/lib/ai/types";

interface Message {
  id: string;
  sender: "user" | "ai";
  text: string;
  sources?: string[];
  limitations?: string[];
  timestamp: Date;
  isError?: boolean;
}

export const AiChat = () => {
  const { user } = useAuth();
  const role = user?.role || "USER";

  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      sender: "ai",
      text: `Hello ${user?.name || "there"}! I am your SmartStock AI assistant. Ask me questions about inventory, sales trends, supplier payments, or general statistics, and I will analyze the system data for you.`,
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  // Role-aware suggestions
  const getSuggestions = (roleStr: string): string[] => {
    switch (roleStr) {
      case "ADMIN":
      case "MANAGER":
        return [
          "Are there any items at risk of running out this week?",
          "Summarize sales performance and trends for the past month.",
          "What is our current receivables summary?",
          "What are the top performing product categories?",
        ];
      case "SALES":
        return [
          "What are our top-selling products by revenue?",
          "Who are our top customers and their purchase totals?",
          "Show sales category performance summary.",
        ];
      case "WAREHOUSE":
        return [
          "Which products are currently below minimum stock?",
          "What are the recent stock movement activities?",
          "Do we have any open or pending purchase orders?",
        ];
      case "ACCOUNTS":
        return [
          "Summarize our active cash ledger balances.",
          "What are our total outstanding receivables?",
          "What are the pending supplier payment obligations?",
        ];
      default:
        return ["What is my role in SmartStock ERP?", "How do I access dashboard statistics?"];
    }
  };

  const handleSend = async (textToSend: string) => {
    const question = textToSend.trim();
    if (!question || loading) return;

    // Clear input
    setInput("");
    
    // Append user message
    const userMsgId = Math.random().toString();
    setMessages((prev) => [
      ...prev,
      {
        id: userMsgId,
        sender: "user",
        text: question,
        timestamp: new Date(),
      },
    ]);

    setLoading(true);

    try {
      const res = await aiClient.askAI(question);
      if (res.success && res.response) {
        setMessages((prev) => [
          ...prev,
          {
            id: Math.random().toString(),
            sender: "ai",
            text: res.response.answer,
            sources: res.response.sources,
            limitations: res.response.limitations,
            timestamp: new Date(),
          },
        ]);
      } else {
        throw new Error("Invalid response received from assistant.");
      }
    } catch (err: any) {
      console.error("AI Chat query failure:", err);
      const errMsg = err?.message || "An error occurred while calling the AI service. Please try again.";
      setMessages((prev) => [
        ...prev,
        {
          id: Math.random().toString(),
          sender: "ai",
          text: errMsg,
          timestamp: new Date(),
          isError: true,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSend(input);
  };

  const suggestions = getSuggestions(role);

  return (
    <div className="grid gap-6 grid-cols-1 lg:grid-cols-4 h-[calc(100vh-10rem)] max-h-[800px]">
      {/* Side Panel: Guidelines & Limitations */}
      <div className="lg:col-span-1 space-y-4 flex flex-col h-full overflow-y-auto pr-1 select-none">
        <Card className="border-border">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-wider">
              <Sparkles className="h-4 w-4" />
              <span>AI Access Profile</span>
            </div>
            <CardTitle className="text-sm mt-1.5">{user?.name}</CardTitle>
            <CardDescription className="text-[10px]">
              Assigned Role: <span className="font-semibold text-primary">{role}</span>
            </CardDescription>
          </CardHeader>
          <CardContent className="text-[11px] text-secondary-text pt-2 space-y-2 border-t border-border mt-3">
            <p>
              Your queries are analyzed inside the boundaries of your role.
            </p>
            <div className="flex flex-col gap-1 mt-1.5">
              <span className="font-bold text-[10px] uppercase text-foreground">Permitted Data Domains:</span>
              <div className="flex flex-wrap gap-1 mt-1">
                {role === "ADMIN" && ["Sales", "Inventory", "Procurement", "Finance", "Customers"].map(d => (
                  <span key={d} className="px-1.5 py-0.5 rounded bg-primary-very-light text-primary text-[9px] font-semibold border border-primary-light/10">{d}</span>
                ))}
                {role === "MANAGER" && ["Sales", "Inventory", "Procurement", "Customers"].map(d => (
                  <span key={d} className="px-1.5 py-0.5 rounded bg-primary-very-light text-primary text-[9px] font-semibold border border-primary-light/10">{d}</span>
                ))}
                {role === "SALES" && ["Sales", "Customers"].map(d => (
                  <span key={d} className="px-1.5 py-0.5 rounded bg-primary-very-light text-primary text-[9px] font-semibold border border-primary-light/10">{d}</span>
                ))}
                {role === "WAREHOUSE" && ["Inventory", "Procurement"].map(d => (
                  <span key={d} className="px-1.5 py-0.5 rounded bg-primary-very-light text-primary text-[9px] font-semibold border border-primary-light/10">{d}</span>
                ))}
                {role === "ACCOUNTS" && ["Finance"].map(d => (
                  <span key={d} className="px-1.5 py-0.5 rounded bg-primary-very-light text-primary text-[9px] font-semibold border border-primary-light/10">{d}</span>
                ))}
                {role === "USER" && <span className="text-secondary-text italic text-[10px]">None (Help only)</span>}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border border-dashed bg-background/50 flex-1">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-1.5 text-secondary-text font-bold text-[10px] uppercase tracking-wider">
              <AlertCircle className="h-3.5 w-3.5" />
              <span>Limitations & Disclaimers</span>
            </div>
          </CardHeader>
          <CardContent className="text-[10px] leading-relaxed text-secondary-text space-y-2.5">
            <p>
              SmartStock AI operates as a read-only analysis layer. It has **no capacity** to modify stock quantities, authorize dispatches, or generate financial records autonomously.
            </p>
            <p className="border-l-2 border-primary/20 pl-2 bg-background p-1.5 rounded">
              All insights, summaries, and forecasts generated are recommendations. Verify all numbers with authoritative records in their respective modules before execution.
            </p>
            <p>
              Security restrictions prevent search access to sensitive transaction files outside the active role profile.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Panel: Chat screen */}
      <Card className="lg:col-span-3 flex flex-col h-full border-border relative overflow-hidden">
        {/* Messages List Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((msg) => {
            const isUser = msg.sender === "user";
            return (
              <div
                key={msg.id}
                className={`flex gap-3 items-start ${isUser ? "flex-row-reverse" : "flex-row"} animate-fade-in`}
              >
                {/* Avatar Icon */}
                <div
                  className={`h-8 w-8 rounded-lg flex items-center justify-center shrink-0 border select-none ${
                    isUser
                      ? "bg-neutral-900 border-neutral-800 text-white dark:bg-neutral-800 dark:border-neutral-700"
                      : msg.isError
                      ? "bg-danger/10 border-danger/20 text-danger"
                      : "bg-primary-very-light border-primary-light/10 text-primary"
                  }`}
                >
                  {isUser ? <MessageSquare className="h-4 w-4" /> : <Sparkles className="h-4 w-4" />}
                </div>

                {/* Message Body */}
                <div className="flex flex-col max-w-[85%] gap-1.5">
                  <div
                    className={`p-3.5 rounded-lg text-xs leading-relaxed shadow-sm ${
                      isUser
                        ? "bg-primary text-white font-medium"
                        : msg.isError
                        ? "bg-danger/5 border border-danger/10 text-danger"
                        : "bg-surface border border-border text-foreground"
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{msg.text}</p>

                    {/* Sources and limitations for AI responses */}
                    {!isUser && !msg.isError && (msg.sources || msg.limitations) && (
                      <div className="mt-3 pt-2.5 border-t border-border flex flex-col gap-2 text-[10px]">
                        {msg.sources && msg.sources.length > 0 && (
                          <div className="flex items-center gap-1.5 text-secondary-text">
                            <Database className="h-3 w-3 shrink-0 text-primary" />
                            <span className="font-semibold text-foreground">Searched Domains:</span>
                            <span className="capitalize">{msg.sources.join(", ")}</span>
                          </div>
                        )}
                        {msg.limitations && msg.limitations.length > 0 && (
                          <div className="flex items-start gap-1.5 text-warning-dark dark:text-warning/80">
                            <AlertCircle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                            <div>
                              <span className="font-semibold">Context Limitations:</span>
                              <ul className="list-disc pl-3 mt-0.5 space-y-0.5">
                                {msg.limitations.map((lim, i) => (
                                  <li key={i}>{lim}</li>
                                ))}
                              </ul>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  <span className={`text-[9px] text-secondary-text px-1 ${isUser ? "text-right" : "text-left"}`}>
                    {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
            );
          })}

          {loading && <ChatLoadingBubble />}
          <div ref={messagesEndRef} />
        </div>

        {/* Suggested prompts panel */}
        {messages.length <= 2 && !loading && (
          <div className="px-4 py-3 border-t border-border bg-background/50 select-none">
            <span className="text-[10px] font-bold text-secondary-text uppercase tracking-wider block mb-2">
              Suggested Questions:
            </span>
            <div className="flex flex-wrap gap-2">
              {suggestions.map((sug, i) => (
                <button
                  key={i}
                  onClick={() => handleSend(sug)}
                  className="px-2.5 py-1.5 rounded-lg border border-border text-[11px] font-medium text-foreground hover:bg-surface hover:border-primary-light/35 transition-colors cursor-pointer text-left"
                >
                  {sug}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input box form */}
        <form onSubmit={handleSubmit} className="p-3 border-t border-border flex gap-2.5 bg-surface relative z-10">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={loading ? "AI is compiling context and answering..." : "Ask AI a question about your stock levels, sales trends..."}
            disabled={loading}
            maxLength={500}
            className="flex-1 h-10 border-border text-xs focus:ring-primary focus:border-primary"
          />
          <Button
            type="submit"
            disabled={loading || !input.trim()}
            className="h-10 px-4 bg-primary hover:bg-primary-dark text-white rounded-lg flex items-center justify-center shrink-0"
          >
            <Send className="h-3.5 w-3.5" />
          </Button>
        </form>
      </Card>
    </div>
  );
};
