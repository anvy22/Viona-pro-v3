"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useAuth } from "@clerk/nextjs";
import { useSelectedOrg } from "@/hooks/useOrgStore";
import ChatMessage from "./ChatMessages";
import ChatInput from "./ChatInput";
import type { ChatMessage as Message, AgentOutput } from "../types";
import { Plus } from "lucide-react";

// WebSocket message types
type WSMessageType = "connected" | "stream" | "complete" | "tool_update" | "error";

interface WSMessage {
    type: WSMessageType;
    session_id?: string;
    message_id?: string;
    output?: AgentOutput;
    delta?: string;
    tool?: string;
    status?: string;
    message?: string;
}

const AI_AGENT_WS_URL = process.env.NEXT_PUBLIC_AI_AGENT_WS_URL || "ws://localhost:8000";

interface ChatWindowProps {
    chatId: string;
    onNewChat?: () => void;
}

export default function ChatWindow({ chatId, onNewChat }: ChatWindowProps) {
    const { getToken } = useAuth();
    const selectedOrgId = useSelectedOrg();

    const [messages, setMessages] = useState<Message[]>([]);
    const [streamingContent, setStreamingContent] = useState<string>("");
    const [isConnected, setIsConnected] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const wsRef = useRef<WebSocket | null>(null);
    const bottomRef = useRef<HTMLDivElement>(null);
    const reconnectTimeoutRef = useRef<NodeJS.Timeout>();
    const streamingMessageIdRef = useRef<string | null>(null);

    // Scroll to bottom on new messages or streaming content
    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages, streamingContent]);

    // Connect to WebSocket
    const connect = useCallback(async () => {
        if (!selectedOrgId) return;

        try {
            const token = await getToken();
            if (!token) {
                setError("Authentication required");
                return;
            }

            if (wsRef.current) {
                wsRef.current.close();
            }

            const wsUrl = `${AI_AGENT_WS_URL}/ws/chat?token=${token}&org_id=${selectedOrgId}`;
            const ws = new WebSocket(wsUrl);

            ws.onopen = () => {
                setIsConnected(true);
                setError(null);
            };

            ws.onmessage = (event) => {
                const data: WSMessage = JSON.parse(event.data);
                handleWSMessage(data);
            };

            ws.onerror = () => {
                setError("Connection error");
                setIsConnected(false);
            };

            ws.onclose = () => {
                setIsConnected(false);
                reconnectTimeoutRef.current = setTimeout(() => {
                    if (selectedOrgId) connect();
                }, 5000);
            };

            wsRef.current = ws;
        } catch {
            setError("Failed to connect");
        }
    }, [getToken, selectedOrgId]);

    // Handle incoming WebSocket messages
    const handleWSMessage = (data: WSMessage) => {
        switch (data.type) {
            case "connected":
                break;

            case "stream":
                // Append streaming text
                if (data.delta) {
                    setStreamingContent(prev => prev + data.delta);
                }
                break;

            case "tool_update":
                // Show tool status in streaming
                if (data.status === "running") {
                    setStreamingContent(`Analyzing ${data.tool?.replace(/_/g, " ")}...`);
                }
                break;

            case "complete":
                setIsLoading(false);
                setStreamingContent("");
                if (data.output) {
                    setMessages(prev => [
                        ...prev,
                        {
                            id: data.message_id || crypto.randomUUID(),
                            role: "assistant",
                            content: data.output.summary,
                            agentOutput: data.output
                        }
                    ]);
                }
                streamingMessageIdRef.current = null;
                break;

            case "error":
                setIsLoading(false);
                setStreamingContent("");
                setMessages(prev => [
                    ...prev,
                    {
                        id: crypto.randomUUID(),
                        role: "assistant",
                        content: data.message || "An error occurred"
                    }
                ]);
                break;
        }
    };

    // Connect on mount
    useEffect(() => {
        connect();
        return () => {
            if (reconnectTimeoutRef.current) {
                clearTimeout(reconnectTimeoutRef.current);
            }
            if (wsRef.current) {
                wsRef.current.close();
            }
        };
    }, [connect]);

    // Handle sending messages
    const handleSend = (content: string) => {
        if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
            setError("Not connected");
            return;
        }

        // Add user message
        const userMessage: Message = {
            id: crypto.randomUUID(),
            role: "user",
            content
        };
        setMessages(prev => [...prev, userMessage]);
        setIsLoading(true);
        setStreamingContent("");
        streamingMessageIdRef.current = crypto.randomUUID();

        // Send to server
        wsRef.current.send(JSON.stringify({
            type: "message",
            content,
            message_id: streamingMessageIdRef.current
        }));
    };

    // Handle new chat
    const handleNewChat = () => {
        setMessages([]);
        setStreamingContent("");
        setError(null);
        onNewChat?.();
    };

    return (
        <div className="flex flex-col flex-1 min-h-0">
            {/* Header with New Chat */}
            <div className="flex items-center justify-between px-6 py-3">
                <button
                    onClick={handleNewChat}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors rounded-lg hover:bg-muted/50"
                >
                    <Plus className="w-4 h-4" />
                    New Chat
                </button>

                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    {isConnected ? (
                        <span className="flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                            Connected
                        </span>
                    ) : (
                        <span className="flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                            Connecting...
                        </span>
                    )}
                </div>
            </div>

            {/* Error banner */}
            {error && (
                <div className="px-6 py-2 text-sm text-red-500 text-center">
                    {error}
                </div>
            )}

            {/* Messages area - clean, no boxed panels */}
            <div className="flex-1 overflow-y-auto">
                <div className="max-w-3xl mx-auto px-6 py-8 space-y-6">
                    {/* Empty state */}
                    {messages.length === 0 && !streamingContent && (
                        <div className="text-center py-20">
                            <h2 className="text-2xl font-semibold text-foreground mb-2">
                                How can I help you today?
                            </h2>
                            <p className="text-muted-foreground">
                                Ask me about your inventory, orders, or business analytics.
                            </p>
                        </div>
                    )}

                    {/* Messages */}
                    {messages.map(msg => (
                        <ChatMessage key={msg.id} message={msg} />
                    ))}

                    {/* Streaming content */}
                    {streamingContent && (
                        <div className="space-y-2">
                            <div className="text-xs font-medium text-muted-foreground">Viona</div>
                            <div className="text-foreground leading-relaxed whitespace-pre-wrap">
                                {streamingContent}
                                <span className="inline-block w-2 h-4 bg-foreground/60 ml-1 animate-pulse" />
                            </div>
                        </div>
                    )}

                    {/* Loading indicator */}
                    {isLoading && !streamingContent && (
                        <div className="space-y-2">
                            <div className="text-xs font-medium text-muted-foreground">Viona</div>
                            <div className="flex items-center gap-1">
                                <span className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                                <span className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                                <span className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                            </div>
                        </div>
                    )}

                    <div ref={bottomRef} className="h-8" />
                </div>
            </div>

            {/* Input area - subtle separator only */}
            <div className="border-t border-border/30">
                <div className="max-w-3xl mx-auto px-6 py-4">
                    <ChatInput
                        onSend={handleSend}
                        disabled={isLoading || !isConnected}
                    />
                </div>
            </div>
        </div>
    );
}
