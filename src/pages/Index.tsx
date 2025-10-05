import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Trash2 } from "lucide-react";

interface Message {
  text: string;
  alignment: "left" | "right";
  time: string;
}

const STORAGE_KEY = "ceo-ai-chat-history";
const SYSTEM_PROMPT = "Y'ello, I am Mr Smile Foundation your AI developer for MOBILE AI and I am a software engineer.";

const Index = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageInput, setMessageInput] = useState("");
  const [receiving, setReceiving] = useState(false);
  const [typing, setTyping] = useState(false);
  const chatboxRef = useRef<HTMLDivElement>(null);
  const websocketRef = useRef<WebSocket | null>(null);
  const chatIdRef = useRef(crypto.randomUUID());
  const currentMessageRef = useRef("");
  const sendSoundRef = useRef<HTMLAudioElement | null>(null);
  const receiveSoundRef = useRef<HTMLAudioElement | null>(null);

  const getCurrentTime = () => {
    const d = new Date();
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const saveChatHistory = (msgs: Message[]) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(msgs));
  };

  const loadChatHistory = () => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return null;
    try {
      return JSON.parse(saved) as Message[];
    } catch (e) {
      console.warn("Failed to load chat history:", e);
      return null;
    }
  };

  const scrollToBottom = () => {
    if (chatboxRef.current) {
      chatboxRef.current.scrollTop = chatboxRef.current.scrollHeight;
    }
  };

  const connectWebSocket = (message: string, initChat: boolean) => {
    setReceiving(true);
    setTyping(true);
    currentMessageRef.current = "";

    websocketRef.current = new WebSocket("wss://backend.buildpicoapps.com/api/chatbot/chat");

    websocketRef.current.addEventListener("open", () => {
      websocketRef.current?.send(
        JSON.stringify({
          chatId: chatIdRef.current,
          appId: "word-almost",
          systemPrompt: SYSTEM_PROMPT,
          message: initChat ? "A very short welcome message from the MR SMILE AI" : message,
        })
      );
    });

    websocketRef.current.onmessage = (event) => {
      receiveSoundRef.current?.play();
      currentMessageRef.current += event.data;
      
      setMessages((prev) => {
        const newMessages = [...prev];
        if (newMessages.length > 0 && newMessages[newMessages.length - 1].alignment === "left") {
          newMessages[newMessages.length - 1] = {
            ...newMessages[newMessages.length - 1],
            text: currentMessageRef.current,
          };
        } else {
          newMessages.push({
            text: currentMessageRef.current,
            alignment: "left",
            time: getCurrentTime(),
          });
        }
        return newMessages;
      });
      
      scrollToBottom();
    };

    websocketRef.current.onclose = () => {
      setTyping(false);
      setReceiving(false);
      setMessages((prev) => {
        saveChatHistory(prev);
        return prev;
      });
    };

    websocketRef.current.onerror = () => {
      setTyping(false);
      setReceiving(false);
    };
  };

  const handleSend = () => {
    if (!receiving && messageInput.trim() !== "") {
      sendSoundRef.current?.play();
      const messageText = messageInput.trim();
      const newMessage: Message = {
        text: messageText,
        alignment: "right",
        time: getCurrentTime(),
      };
      
      const updatedMessages = [...messages, newMessage];
      setMessages(updatedMessages);
      saveChatHistory(updatedMessages);
      setMessageInput("");
      scrollToBottom();
      
      connectWebSocket(messageText, false);
    } else if (receiving && websocketRef.current) {
      websocketRef.current.close(1000);
      setReceiving(false);
      setTyping(false);
    }
  };

  const handleClear = () => {
    setMessages([]);
    localStorage.removeItem(STORAGE_KEY);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !receiving && messageInput.trim() !== "") {
      e.preventDefault();
      handleSend();
    }
  };

  useEffect(() => {
    const history = loadChatHistory();
    if (history && history.length > 0) {
      setMessages(history);
    } else {
      connectWebSocket("", true);
    }

    // Create audio elements
    sendSoundRef.current = new Audio("data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBTGH0fPTgjMGHm7A7+OZTA0PVa3m7q9aFg1Lp+Txunr/BAMm3Pj6/wD/BAMm3Pj6/wD/BAMm3Pj6/wD/BAMm3Pj6");
    receiveSoundRef.current = new Audio("data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBTGH0fPTgjMGHm7A7+OZTA0PVa3m7q9aFg1Lp+Txunr/BAMm3Pj6/wD/BAMm3Pj6/wD/BAMm3Pj6/wD/BAMm3Pj6");

    return () => {
      websocketRef.current?.close();
    };
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-4xl h-[90vh] flex flex-col glassmorphism rounded-3xl neon-border overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-primary/30 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-neon">NeonCode AI</h1>
            <p className="text-sm text-cyan mt-1">Mr Smile Foundation • Mobile AI Developer</p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleClear}
            className="text-destructive hover:text-destructive hover:bg-destructive/10 transition-all"
            title="Clear Chat"
          >
            <Trash2 className="h-5 w-5" />
          </Button>
        </div>

        {/* Chat Messages */}
        <div
          ref={chatboxRef}
          className="flex-1 overflow-y-auto p-6 space-y-4 scrollbar-thin scrollbar-thumb-primary/30 scrollbar-track-transparent"
        >
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex ${msg.alignment === "left" ? "justify-start" : "justify-end"} animate-fade-slide-in`}
            >
              <div className="flex flex-col max-w-[75%]">
                <div
                  className={`inline-block p-4 rounded-2xl text-sm whitespace-pre-line ${
                    msg.alignment === "left"
                      ? "glassmorphism text-cyan border border-cyan/30 cyan-glow"
                      : "bg-primary text-primary-foreground neon-glow"
                  }`}
                >
                  {msg.text}
                </div>
                <span className="text-xs text-muted-foreground mt-1 px-2">
                  {msg.time}
                </span>
              </div>
            </div>
          ))}
          
          {typing && (
            <div className="flex justify-start animate-pulse-glow">
              <div className="glassmorphism text-cyan border border-cyan/30 px-4 py-3 rounded-2xl text-sm">
                <span className="inline-flex items-center gap-1">
                  Mr Smile is typing
                  <span className="animate-pulse">.</span>
                  <span className="animate-pulse animation-delay-200">.</span>
                  <span className="animate-pulse animation-delay-400">.</span>
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className="p-6 border-t border-primary/30">
          <div className="flex gap-3">
            <Input
              value={messageInput}
              onChange={(e) => setMessageInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type your message..."
              disabled={receiving}
              className="flex-1 bg-input border-2 border-primary/50 focus:border-primary focus:neon-glow text-foreground placeholder:text-muted-foreground rounded-xl px-4 py-6 text-base transition-all"
            />
            <Button
              onClick={handleSend}
              disabled={!receiving && messageInput.trim() === ""}
              className={`px-8 py-6 rounded-xl font-bold text-base transition-all ${
                receiving
                  ? "bg-gradient-to-r from-destructive to-red-600 hover:from-red-600 hover:to-destructive text-white shadow-[0_0_20px_rgba(239,68,68,0.5)]"
                  : "bg-gradient-to-r from-primary to-accent hover:from-accent hover:to-primary text-primary-foreground neon-glow hover:shadow-[0_0_30px_rgba(0,255,65,0.6)]"
              }`}
            >
              {receiving ? "Cancel" : "Ask AI!"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
