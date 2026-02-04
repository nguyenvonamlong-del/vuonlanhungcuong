import { useState, useRef, useEffect } from "react";
import { MessageCircle, X, Send, Bot, User, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useApp } from "@/context/AppContext";
import { useChatbot } from "@/context/ChatbotContext";
import { cn } from "@/lib/utils";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt?: string;
}

interface ChatSession {
  conversation: {
    id: string;
    title: string;
    userType: string;
  };
  messages: Message[];
}

export function Chatbot() {
  const { language, user } = useApp();
  const { isOpen, openChatbot, closeChatbot } = useChatbot();
  const [messages, setMessages] = useState<Message[]>([]);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const isAdmin = user?.role === "ADMIN";

  useEffect(() => {
    if (isOpen && !conversationId) {
      initSession();
    }
  }, [isOpen, conversationId]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const initSession = async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/chat/session", {
        method: "POST",
        credentials: "include"
      });
      if (!response.ok) throw new Error("Failed to init session");
      const data: ChatSession = await response.json();
      setConversationId(data.conversation.id);
      setMessages(data.messages);
    } catch (error) {
      console.error("Error initializing chat session:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!input.trim() || !conversationId || isStreaming) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input.trim()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setIsStreaming(true);

    const assistantMessage: Message = {
      id: (Date.now() + 1).toString(),
      role: "assistant",
      content: ""
    };
    setMessages(prev => [...prev, assistantMessage]);

    try {
      const response = await fetch("/api/chat/message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ conversationId, message: userMessage.content })
      });

      if (!response.ok) throw new Error("Failed to send message");

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) throw new Error("No response body");

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split("\n");

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const data = JSON.parse(line.slice(6));
              if (data.content) {
                setMessages(prev => {
                  const updated = [...prev];
                  const lastMsg = updated[updated.length - 1];
                  if (lastMsg.role === "assistant") {
                    lastMsg.content += data.content;
                  }
                  return updated;
                });
              }
            } catch (e) {}
          }
        }
      }
    } catch (error) {
      console.error("Error sending message:", error);
      setMessages(prev => {
        const updated = [...prev];
        const lastMsg = updated[updated.length - 1];
        if (lastMsg.role === "assistant" && !lastMsg.content) {
          lastMsg.content = language === "vi" 
            ? "Xin lỗi, đã có lỗi xảy ra. Vui lòng thử lại."
            : "Sorry, an error occurred. Please try again.";
        }
        return updated;
      });
    } finally {
      setIsStreaming(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const placeholder = language === "vi" 
    ? (isAdmin ? "Hỏi về doanh nghiệp..." : "Hỏi về đơn hàng, sản phẩm...")
    : (isAdmin ? "Ask about business..." : "Ask about orders, products...");

  const title = language === "vi"
    ? (isAdmin ? "Trợ lý quản lý" : "Trợ lý khách hàng")
    : (isAdmin ? "Admin Assistant" : "Customer Support");

  const welcomeMessage = language === "vi"
    ? (isAdmin 
        ? "Xin chào! Tôi có thể giúp bạn về tồn kho, đơn hàng, doanh thu, và kỹ thuật viên." 
        : "Xin chào! Tôi có thể giúp bạn về sản phẩm, đặt hàng, và theo dõi đơn hàng.")
    : (isAdmin 
        ? "Hello! I can help you with inventory, orders, revenue, and technician information." 
        : "Hello! I can help you with products, ordering, and order tracking.");

  return (
    <>
      {!isOpen && (
        <Button
          size="lg"
          className="fixed bottom-6 right-6 z-50 h-14 w-14 rounded-full shadow-lg"
          onClick={openChatbot}
          data-testid="button-chatbot-open"
        >
          <MessageCircle className="h-6 w-6" />
        </Button>
      )}

      {isOpen && (
        <Card className="fixed bottom-6 right-6 z-50 w-80 sm:w-96 shadow-2xl flex flex-col max-h-[500px]">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 gap-2 pb-3 border-b">
            <div className="flex items-center gap-2">
              <div className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center",
                isAdmin ? "bg-amber-500/20" : "bg-primary/20"
              )}>
                <Bot className={cn("h-4 w-4", isAdmin ? "text-amber-500" : "text-primary")} />
              </div>
              <CardTitle className="text-base">{title}</CardTitle>
            </div>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={closeChatbot}
              data-testid="button-chatbot-close"
            >
              <X className="h-4 w-4" />
            </Button>
          </CardHeader>

          <CardContent className="flex-1 p-0 overflow-hidden">
            <ScrollArea className="h-72 p-4" ref={scrollRef}>
              {isLoading ? (
                <div className="flex items-center justify-center h-full">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <div className="space-y-4">
                  {messages.length === 0 && (
                    <div className="text-center text-sm text-muted-foreground py-8">
                      <Bot className="h-10 w-10 mx-auto mb-3 text-primary/50" />
                      <p>{welcomeMessage}</p>
                    </div>
                  )}
                  {messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={cn(
                        "flex gap-2",
                        msg.role === "user" ? "flex-row-reverse" : "flex-row"
                      )}
                    >
                      <div className={cn(
                        "w-7 h-7 rounded-full flex items-center justify-center shrink-0",
                        msg.role === "user" ? "bg-primary" : "bg-muted"
                      )}>
                        {msg.role === "user" 
                          ? <User className="h-3.5 w-3.5 text-primary-foreground" />
                          : <Bot className="h-3.5 w-3.5 text-muted-foreground" />
                        }
                      </div>
                      <div className={cn(
                        "rounded-lg px-3 py-2 text-sm max-w-[80%]",
                        msg.role === "user" 
                          ? "bg-primary text-primary-foreground" 
                          : "bg-muted"
                      )}>
                        {msg.content || (
                          <span className="inline-flex items-center gap-1">
                            <Loader2 className="h-3 w-3 animate-spin" />
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </CardContent>

          <CardFooter className="p-3 border-t">
            <div className="flex w-full gap-2">
              <Input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={placeholder}
                disabled={isStreaming || isLoading}
                className="flex-1"
                data-testid="input-chat-message"
              />
              <Button
                size="icon"
                onClick={sendMessage}
                disabled={!input.trim() || isStreaming || isLoading}
                data-testid="button-chat-send"
              >
                {isStreaming ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
          </CardFooter>
        </Card>
      )}
    </>
  );
}
