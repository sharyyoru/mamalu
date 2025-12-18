"use client";

import { useState, useRef, useEffect } from "react";
import { MessageCircle, X, Send, Loader2, MinusCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Message {
  id: string;
  text: string;
  sender: "user" | "system";
  timestamp: Date;
}

export function LiveChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      text: "Hi! 👋 Welcome to Mamalu Kitchen! How can we help you today?",
      sender: "system",
      timestamp: new Date(),
    },
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [userInfo, setUserInfo] = useState({ name: "", email: "", phone: "" });
  const [showForm, setShowForm] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmitInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userInfo.name || !userInfo.email) return;

    setIsLoading(true);
    try {
      // Create lead and inquiry in database
      const response = await fetch("/api/inquiries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: userInfo.name,
          email: userInfo.email,
          phone: userInfo.phone,
          source: "livechat",
          type: "website_chat",
          message: "Started a live chat conversation",
        }),
      });

      if (response.ok) {
        setShowForm(false);
        setMessages((prev) => [
          ...prev,
          {
            id: Date.now().toString(),
            text: `Thanks ${userInfo.name}! I'm here to help. What would you like to know about our cooking classes?`,
            sender: "system",
            timestamp: new Date(),
          },
        ]);
      }
    } catch (error) {
      console.error("Error submitting info:", error);
    }
    setIsLoading(false);
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputValue,
      sender: "user",
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");
    setIsLoading(true);

    try {
      // Save message to inquiries
      await fetch("/api/inquiries/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: userInfo.email,
          message: inputValue,
          sender: "user",
        }),
      });

      // Auto-response based on keywords
      setTimeout(() => {
        let response = "Thanks for your message! Our team will get back to you shortly. In the meantime, feel free to browse our classes at /classes.";
        
        const lowerMsg = inputValue.toLowerCase();
        if (lowerMsg.includes("class") || lowerMsg.includes("book")) {
          response = "We have amazing cooking classes for kids, families, and adults! You can browse and book at our Classes page. Would you like me to help you find a specific type of class?";
        } else if (lowerMsg.includes("price") || lowerMsg.includes("cost")) {
          response = "Our class prices vary depending on the type. Kids classes start from AED 120, Family classes from AED 200. Check our Classes page for current pricing!";
        } else if (lowerMsg.includes("birthday") || lowerMsg.includes("party")) {
          response = "Birthday parties at Mamalu Kitchen are amazing! Kids love making their own pizzas and treats. Contact us for custom party packages!";
        } else if (lowerMsg.includes("location") || lowerMsg.includes("where")) {
          response = "We're located in Dubai! You can find our exact location and directions on our Contact page.";
        }

        setMessages((prev) => [
          ...prev,
          {
            id: (Date.now() + 1).toString(),
            text: response,
            sender: "system",
            timestamp: new Date(),
          },
        ]);
        setIsLoading(false);
      }, 1000);
    } catch (error) {
      console.error("Error sending message:", error);
      setIsLoading(false);
    }
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-50 w-16 h-16 bg-gradient-to-r from-amber-500 to-orange-500 rounded-full shadow-2xl flex items-center justify-center text-white hover:from-amber-600 hover:to-orange-600 transition-all hover:scale-110 animate-bounce"
        style={{ animationDuration: '2s' }}
      >
        <MessageCircle className="h-7 w-7" />
        <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-[10px] font-bold">
          1
        </span>
      </button>
    );
  }

  return (
    <div
      className={`fixed bottom-6 right-6 z-50 bg-white rounded-2xl shadow-2xl overflow-hidden transition-all duration-300 ${
        isMinimized ? "w-80 h-14" : "w-96 h-[500px]"
      }`}
    >
      {/* Header */}
      <div className="bg-gradient-to-r from-amber-500 to-orange-500 p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
            <MessageCircle className="h-5 w-5 text-white" />
          </div>
          <div>
            <h3 className="font-bold text-white">Mamalu Kitchen</h3>
            <p className="text-amber-100 text-xs">We typically reply instantly</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsMinimized(!isMinimized)}
            className="text-white/80 hover:text-white transition-colors"
          >
            <MinusCircle className="h-5 w-5" />
          </button>
          <button
            onClick={() => setIsOpen(false)}
            className="text-white/80 hover:text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>

      {!isMinimized && (
        <>
          {/* Messages */}
          <div className="flex-1 h-[340px] overflow-y-auto p-4 space-y-4 bg-gradient-to-b from-amber-50/50 to-white">
            {showForm ? (
              <form onSubmit={handleSubmitInfo} className="space-y-3">
                <p className="text-sm text-stone-600 mb-4">
                  Please share your details so we can assist you better:
                </p>
                <input
                  type="text"
                  placeholder="Your Name *"
                  value={userInfo.name}
                  onChange={(e) => setUserInfo({ ...userInfo, name: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-stone-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 outline-none text-sm"
                  required
                />
                <input
                  type="email"
                  placeholder="Email Address *"
                  value={userInfo.email}
                  onChange={(e) => setUserInfo({ ...userInfo, email: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-stone-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 outline-none text-sm"
                  required
                />
                <input
                  type="tel"
                  placeholder="Phone Number (optional)"
                  value={userInfo.phone}
                  onChange={(e) => setUserInfo({ ...userInfo, phone: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-stone-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 outline-none text-sm"
                />
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white"
                >
                  {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Start Chat"}
                </Button>
              </form>
            ) : (
              <>
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[80%] p-3 rounded-2xl ${
                        msg.sender === "user"
                          ? "bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-br-md"
                          : "bg-white border border-stone-100 text-stone-700 rounded-bl-md shadow-sm"
                      }`}
                    >
                      <p className="text-sm">{msg.text}</p>
                      <p className={`text-[10px] mt-1 ${msg.sender === "user" ? "text-amber-100" : "text-stone-400"}`}>
                        {msg.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </div>
                  </div>
                ))}
                {isLoading && (
                  <div className="flex justify-start">
                    <div className="bg-white border border-stone-100 p-3 rounded-2xl rounded-bl-md shadow-sm">
                      <div className="flex gap-1">
                        <span className="w-2 h-2 bg-amber-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                        <span className="w-2 h-2 bg-amber-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                        <span className="w-2 h-2 bg-amber-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </>
            )}
          </div>

          {/* Input */}
          {!showForm && (
            <div className="p-4 border-t border-stone-100 bg-white">
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Type a message..."
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-stone-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 outline-none text-sm"
                />
                <Button
                  onClick={handleSendMessage}
                  disabled={isLoading || !inputValue.trim()}
                  className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white px-4"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
