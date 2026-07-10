// ============================
// MetaDress — AIChat.tsx
// Personal AI stylist chat widget
// ============================

import { useEffect, useRef, useState } from "react";
import { API } from "@/lib/luxe/data";

interface ChatMessage {
  role: "user" | "bot";
  content: string;
  typing?: boolean;
}

const OFFLINE_REPLY =
  "I'm your MetaDress stylist! I can help with outfit ideas, size guidance, and virtual try-on recommendations. If the AI server is offline, try again later.";

export default function AIChat() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "bot",
      content:
        "Hi! 👋 I'm your personal AI stylist. Ask me anything — outfit ideas, sizing help, or style tips!",
    },
  ]);
  const historyRef = useRef<{ role: string; content: string }[]>([]);
  const messagesRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = messagesRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, open]);

  const sendAIMessage = async () => {
    const message = input.trim();
    if (!message) return;

    historyRef.current.push({ role: "user", content: message });
    setInput("");
    setMessages((prev) => [
      ...prev,
      { role: "user", content: message },
      { role: "bot", content: "", typing: true },
    ]);

    try {
      const token = localStorage.getItem("metadress_token");
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const res = await fetch(`${API}/meta-ai/chat`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          message,
          conversationHistory: historyRef.current.slice(-10),
        }),
      });

      const data = await res.json();
      const reply = data.reply || "I'm having trouble connecting. Please try again!";
      historyRef.current.push({ role: "assistant", content: reply });

      setMessages((prev) => [...prev.filter((m) => !m.typing), { role: "bot", content: reply }]);
    } catch {
      setMessages((prev) => [
        ...prev.filter((m) => !m.typing),
        { role: "bot", content: OFFLINE_REPLY },
      ]);
    }
  };

  return (
    <>
      <div
        className="ai-chat-btn"
        id="aiChatBtn"
        title="Chat with AI Stylist"
        onClick={() => setOpen((o) => !o)}
      >
        <div className="ai-avatar">
          <i className="fas fa-robot"></i>
        </div>
        <span className="ai-label">Style AI</span>
        <div className="ai-pulse"></div>
      </div>

      <div className={`ai-chat-window ${open ? "open" : ""}`} id="aiChatWindow">
        <div className="ai-chat-header">
          <div className="ai-header-info">
            <div className="ai-avatar-sm"><i className="fas fa-robot"></i></div>
            <div>
              <strong>MetaDress Style AI</strong>
              <span>Powered by AI styling intelligence</span>
            </div>
          </div>
          <button id="aiChatClose" onClick={() => setOpen(false)}>
            <i className="fas fa-times"></i>
          </button>
        </div>
        <div className="ai-messages" id="aiMessages" ref={messagesRef}>
          {messages.map((m, i) => (
            <div key={i} className={`ai-msg ${m.role === "user" ? "ai-msg-user" : "ai-msg-bot"}`}>
              <div className="msg-bubble">
                {m.typing ? (
                  <div className="ai-typing">
                    <span></span><span></span><span></span>
                  </div>
                ) : (
                  m.content
                )}
              </div>
            </div>
          ))}
        </div>
        <div className="ai-input-row">
          <input
            type="text"
            id="aiInput"
            placeholder="Ask your AI stylist..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                sendAIMessage();
              }
            }}
          />
          <button id="aiSendBtn" onClick={sendAIMessage}>
            <i className="fas fa-paper-plane"></i>
          </button>
        </div>
      </div>
    </>
  );
}
