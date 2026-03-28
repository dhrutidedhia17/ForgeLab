"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  MessageCircle,
  X,
  Send,
  Loader2,
  Sparkles,
  Radio,
  WifiOff,
} from "lucide-react";
import type { ResearchResult } from "@/types/pipeline";
import { buildSetupMessage } from "@/lib/ai/live";

interface Message {
  role: "user" | "assistant";
  content: string;
  timestamp: number;
}

interface LiveAssistantProps {
  buildContext?: {
    prompt?: string;
    research?: ResearchResult | null;
    category?: string;
  };
}

export default function LiveAssistant({ buildContext }: LiveAssistantProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isWaitingResponse, setIsWaitingResponse] = useState(false);
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null);

  const wsRef = useRef<WebSocket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const currentResponseRef = useRef<string>("");
  const setupCompleteRef = useRef(false);

  // Scroll to bottom when new messages appear
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Check availability on mount
  useEffect(() => {
    async function checkAvailability() {
      try {
        const res = await fetch("/api/live-token", { method: "POST" });
        const data = await res.json();
        setIsAvailable(data.available);
      } catch {
        setIsAvailable(false);
      }
    }
    checkAvailability();
  }, []);

  // Build context string for the system prompt
  const getContextString = useCallback(() => {
    if (!buildContext?.research) return undefined;
    const r = buildContext.research;
    const materials = r.materials
      .map((m) => `${m.name} (${m.quantity}, ${m.specification})`)
      .join("\n  - ");
    const steps = r.steps
      .map((s) => `${s.stepNumber}. ${s.title}: ${s.description}`)
      .join("\n  ");
    return `PROJECT: ${buildContext.prompt || r.title}
CATEGORY: ${buildContext.category || "Other"}
TITLE: ${r.title}
OVERVIEW: ${r.overview}
DIFFICULTY: ${r.difficulty}
TIME: ${r.estimatedTime}
MATERIALS:\n  - ${materials}
TOOLS: ${r.tools.join(", ")}
STEPS:\n  ${steps}
SAFETY: ${r.safetyNotes.join("; ")}`;
  }, [buildContext]);

  // Connect to Live API
  const connect = useCallback(async () => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;
    setIsConnecting(true);
    setupCompleteRef.current = false;

    try {
      const res = await fetch("/api/live-token", { method: "POST" });
      const data = await res.json();
      if (!data.available || !data.wsUrl) {
        setIsConnecting(false);
        setIsAvailable(false);
        return;
      }

      const ws = new WebSocket(data.wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        // Send setup message
        const setup = buildSetupMessage(getContextString());
        ws.send(JSON.stringify(setup));
      };

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);

          // Handle setup complete
          if (msg.setupComplete) {
            setupCompleteRef.current = true;
            setIsConnected(true);
            setIsConnecting(false);
            return;
          }

          // Handle model responses
          if (msg.serverContent) {
            const parts = msg.serverContent?.modelTurn?.parts || [];
            for (const part of parts) {
              if (part.text) {
                currentResponseRef.current += part.text;
                // Update the last assistant message
                setMessages((prev) => {
                  const last = prev[prev.length - 1];
                  if (last?.role === "assistant") {
                    return [
                      ...prev.slice(0, -1),
                      { ...last, content: currentResponseRef.current },
                    ];
                  }
                  return [
                    ...prev,
                    {
                      role: "assistant",
                      content: currentResponseRef.current,
                      timestamp: Date.now(),
                    },
                  ];
                });
              }
            }

            // Check if turn is complete
            if (msg.serverContent?.turnComplete) {
              setIsWaitingResponse(false);
              currentResponseRef.current = "";
            }
          }
        } catch {
          // Ignore parse errors
        }
      };

      ws.onclose = () => {
        setIsConnected(false);
        setIsConnecting(false);
        setupCompleteRef.current = false;
        wsRef.current = null;
      };

      ws.onerror = () => {
        setIsConnected(false);
        setIsConnecting(false);
        wsRef.current = null;
      };
    } catch {
      setIsConnecting(false);
    }
  }, [getContextString]);

  // Disconnect
  const disconnect = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    setIsConnected(false);
    setupCompleteRef.current = false;
  }, []);

  // Auto-connect when panel opens
  useEffect(() => {
    if (isOpen && !isConnected && !isConnecting && isAvailable) {
      connect();
    }
  }, [isOpen, isConnected, isConnecting, isAvailable, connect]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  // Send message
  const sendMessage = useCallback(() => {
    const text = input.trim();
    if (
      !text ||
      !wsRef.current ||
      wsRef.current.readyState !== WebSocket.OPEN ||
      !setupCompleteRef.current
    )
      return;

    // Add user message
    setMessages((prev) => [
      ...prev,
      { role: "user", content: text, timestamp: Date.now() },
    ]);
    setInput("");
    setIsWaitingResponse(true);
    currentResponseRef.current = "";

    // Send to Live API
    wsRef.current.send(
      JSON.stringify({
        clientContent: {
          turns: [
            {
              role: "user",
              parts: [{ text }],
            },
          ],
          turnComplete: true,
        },
      })
    );

    inputRef.current?.focus();
  }, [input]);

  if (isAvailable === false) return null;

  return (
    <>
      {/* Floating trigger button */}
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsOpen(true)}
            className="fixed bottom-6 right-6 z-50 h-14 w-14 rounded-2xl bg-brand-gradient shadow-[0_0_30px_rgba(249,115,22,0.3)] flex items-center justify-center text-white transition-shadow hover:shadow-[0_0_40px_rgba(249,115,22,0.5)]"
            title="AI Build Assistant (Gemini Live)"
          >
            <MessageCircle className="h-6 w-6" />
            {isConnected && (
              <span className="absolute -top-1 -right-1 h-3.5 w-3.5 rounded-full bg-emerald-400 border-2 border-warm-200" />
            )}
          </motion.button>
        )}
      </AnimatePresence>

      {/* Chat panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: "spring", damping: 25, stiffness: 400 }}
            className="fixed bottom-6 right-6 z-50 w-[380px] max-h-[520px] flex flex-col glass rounded-2xl border border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.5)]"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-brand-gradient flex items-center justify-center">
                  <Sparkles className="h-4 w-4 text-white" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-white">
                    AI Build Assistant
                  </h3>
                  <div className="flex items-center gap-1.5">
                    {isConnected ? (
                      <>
                        <Radio className="h-3 w-3 text-emerald-400" />
                        <span className="text-[10px] text-emerald-400 font-medium">
                          Gemini Live
                        </span>
                      </>
                    ) : isConnecting ? (
                      <>
                        <Loader2 className="h-3 w-3 text-clay-300 animate-spin" />
                        <span className="text-[10px] text-clay-300 font-medium">
                          Connecting...
                        </span>
                      </>
                    ) : (
                      <>
                        <WifiOff className="h-3 w-3 text-gray-500" />
                        <span className="text-[10px] text-gray-500 font-medium">
                          Disconnected
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="h-8 w-8 rounded-lg flex items-center justify-center text-gray-500 hover:text-white hover:bg-white/10 transition-all"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 min-h-[300px] max-h-[360px]">
              {messages.length === 0 && (
                <div className="text-center py-10">
                  <Sparkles className="h-8 w-8 text-clay-300/50 mx-auto mb-3" />
                  <p className="text-sm text-gray-500">
                    {isConnected
                      ? "Ask me anything about your build!"
                      : "Connecting to Gemini Live..."}
                  </p>
                  {isConnected && buildContext?.research && (
                    <p className="text-xs text-gray-600 mt-2">
                      I have context about your{" "}
                      <span className="text-clay-300">
                        {buildContext.research.title
                          .replace("Build Guide: ", "")
                          .slice(0, 40)}
                      </span>{" "}
                      project
                    </p>
                  )}
                </div>
              )}

              {messages.map((msg, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
                      msg.role === "user"
                        ? "bg-clay-400/20 text-clay-100 rounded-br-md"
                        : "bg-white/5 text-gray-300 rounded-bl-md"
                    }`}
                  >
                    {msg.content}
                  </div>
                </motion.div>
              ))}

              {isWaitingResponse && messages[messages.length - 1]?.role !== "assistant" && (
                <div className="flex justify-start">
                  <div className="bg-white/5 rounded-2xl rounded-bl-md px-4 py-3">
                    <Loader2 className="h-4 w-4 text-clay-300 animate-spin" />
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="px-3 pb-3 pt-1">
              <div className="flex items-center gap-2 glass rounded-xl px-3 py-2 border border-white/5">
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                  placeholder={
                    isConnected
                      ? "Ask about your build..."
                      : "Connecting..."
                  }
                  disabled={!isConnected}
                  className="flex-1 bg-transparent text-sm text-white placeholder-gray-600 outline-none disabled:opacity-50"
                />
                <button
                  onClick={sendMessage}
                  disabled={!input.trim() || !isConnected}
                  className="h-8 w-8 rounded-lg bg-brand-gradient flex items-center justify-center text-white disabled:opacity-30 transition-opacity hover:shadow-[0_0_15px_rgba(249,115,22,0.3)]"
                >
                  <Send className="h-3.5 w-3.5" />
                </button>
              </div>
              {!isConnected && !isConnecting && (
                <button
                  onClick={connect}
                  className="w-full mt-2 text-xs text-clay-300 hover:text-clay-200 transition-colors"
                >
                  Click to reconnect
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
