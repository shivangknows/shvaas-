import React, { useState, useRef, useEffect } from "react";
import ProfileIcon from "../../components/ProfileIcon";
import { useNavigate } from "react-router-dom";
import { auth } from "../../firebase/config";

const GROQ_API_KEY = process.env.REACT_APP_GROQ_API_KEY;
const SYSTEM_PROMPT = `You are Shvaas Guide — a warm, calm, and empathetic mental wellness companion built into the Shvaas app. Your role is to help users find peace, manage stress, anxiety, and everyday mental struggles.

Guidelines:
- Always respond with warmth, patience, and a calming tone
- Keep responses concise but meaningful (2-4 sentences usually)
- Offer breathing exercises, grounding techniques, or gentle reflections when appropriate
- Never diagnose or replace professional therapy — gently suggest professional help for serious issues
- Use nature metaphors occasionally (breath, water, trees, sky) to ground the user
- Start the first message with "Namaste 🙏" if it's a greeting
- You speak in English but can use occasional Hindi/Sanskrit words like "Namaste", "Shvaas (breath)", "Shanti (peace)"`;

const ShvaasBot = () => {
  const navigate = useNavigate();
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content: "Namaste 🙏 Take a deep breath. I'm here to listen, reflect, and help you find your center. How is your inner weather today?",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || loading) return;

    const userMsg = { role: "user", content: text };
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setInput("");
    setLoading(true);

    try {
      const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${process.env.REACT_APP_GROQ_API_KEY}`,
  },
  body: JSON.stringify({
    model: "llama3-8b-8192", // free model
    max_tokens: 1000,
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      ...updatedMessages,
    ],
  }),
});

const data = await response.json();
const reply = data.choices?.[0]?.message?.content
  || "I'm here with you. Take a breath and try again 🌿";
      setMessages([...updatedMessages, { role: "assistant", content: reply }]);
    } catch (err) {
      setMessages([...updatedMessages, {
        role: "assistant",
        content: "I'm here with you. Something went quiet on my end — take a breath and try again. 🌿",
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const userAvatar = `https://api.dicebear.com/7.x/personas/svg?seed=${auth.currentUser?.uid || "user"}`;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap');
        @import url('https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=swap');

        * { box-sizing: border-box; margin: 0; padding: 0; }

        .bot-page {
          font-family: 'Plus Jakarta Sans', sans-serif;
          min-height: 100vh;
          background: radial-gradient(circle at top left, #f4fbf4 0%, #eef5ee 50%, #e3eae3 100%);
          color: #161d19;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          position: relative;
        }

        /* GLOW BLOBS */
        .glow-blob-1 {
          position: fixed;
          top: 80px; left: -80px;
          width: 256px; height: 256px;
          background: rgba(198, 236, 198, 0.3);
          border-radius: 9999px;
          filter: blur(100px);
          pointer-events: none;
        }
        .glow-blob-2 {
          position: fixed;
          bottom: 160px; right: -80px;
          width: 320px; height: 320px;
          background: rgba(206, 229, 255, 0.2);
          border-radius: 9999px;
          filter: blur(120px);
          pointer-events: none;
        }

        /* STICKERS */
        .stickers {
          position: fixed;
          inset: 0;
          pointer-events: none;
          overflow: hidden;
          z-index: 0;
        }
        .sticker {
          position: absolute;
          font-size: 2rem;
          opacity: 0.5;
          transition: transform 0.3s, opacity 0.3s;
          cursor: default;
          pointer-events: auto;
        }
        .sticker:hover { transform: scale(1.15); opacity: 0.85; }

        /* NAVBAR */
        .bot-nav {
          position: fixed;
          top: 0; width: 100%;
          z-index: 50;
          background: rgba(240, 251, 240, 0.82);
          backdrop-filter: blur(20px);
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 14px 28px;
          box-shadow: 0 8px 32px rgba(10, 49, 77, 0.06);
        }
        .bot-nav-logo {
          font-size: 1.4rem;
          font-weight: 800;
          color: #0a314d;
          display: flex;
          align-items: center;
          gap: 8px;
          letter-spacing: -0.02em;
        }
        .bot-nav-logo span { font-weight: 400; opacity: 0.55; font-size: 1rem; }
        .back-btn {
          background: transparent;
          border: 1.5px solid #c3c7ce;
          color: #42474d;
          padding: 7px 18px;
          border-radius: 9999px;
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-weight: 600;
          font-size: 0.82rem;
          cursor: pointer;
          transition: all 0.2s;
        }
        .back-btn:hover { background: #001c30; color: white; border-color: #001c30; }

        /* CHAT AREA */
        .chat-area {
          flex: 1;
          overflow-y: auto;
          padding-top: 96px;
          padding-bottom: 120px;
          padding-left: 16px;
          padding-right: 16px;
          position: relative;
          z-index: 10;
        }
        .chat-inner {
          max-width: 720px;
          margin: 0 auto;
          display: flex;
          flex-direction: column;
          gap: 32px;
        }

        /* AI BUBBLE */
        .msg-ai { display: flex; flex-direction: column; align-items: flex-start; gap: 10px; }
        .msg-ai-header { display: flex; align-items: center; gap: 10px; padding: 0 8px; }
        .ai-avatar {
          width: 32px; height: 32px;
          border-radius: 9999px;
          background: #c3eac3;
          display: flex; align-items: center; justify-content: center;
          font-size: 0.9rem;
          flex-shrink: 0;
        }
        .ai-label {
          font-size: 0.7rem;
          font-weight: 700;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: #42474d;
        }
        .bubble-ai {
          background: rgba(255,255,255,0.62);
          backdrop-filter: blur(12px);
          border-radius: 2rem;
          border-top-left-radius: 0.5rem;
          padding: 20px 24px;
          max-width: 85%;
          font-size: 1.05rem;
          line-height: 1.7;
          color: #161d19;
          box-shadow: 0 2px 12px rgba(0,0,0,0.05);
        }

        /* USER BUBBLE */
        .msg-user { display: flex; flex-direction: column; align-items: flex-end; gap: 10px; }
        .msg-user-header { display: flex; align-items: center; gap: 10px; padding: 0 8px; }
        .user-avatar {
          width: 32px; height: 32px;
          border-radius: 9999px;
          overflow: hidden;
          background: #a9caed;
          flex-shrink: 0;
        }
        .user-avatar img { width: 100%; height: 100%; object-fit: cover; }
        .user-label {
          font-size: 0.7rem;
          font-weight: 700;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: #42474d;
        }
        .bubble-user {
          background: linear-gradient(135deg, #001c30 0%, #0a314d 100%);
          border-radius: 2rem;
          border-top-right-radius: 0.5rem;
          padding: 20px 24px;
          max-width: 85%;
          font-size: 1.05rem;
          line-height: 1.7;
          color: white;
          box-shadow: 0 8px 24px rgba(0,28,48,0.18);
        }

        /* TYPING INDICATOR */
        .typing-dots {
          display: flex;
          align-items: center;
          gap: 5px;
          padding: 20px 24px;
        }
        .dot {
          width: 8px; height: 8px;
          border-radius: 9999px;
          background: #486b4c;
          animation: bounce 1.2s infinite ease-in-out;
        }
        .dot:nth-child(2) { animation-delay: 0.2s; }
        .dot:nth-child(3) { animation-delay: 0.4s; }
        @keyframes bounce {
          0%, 80%, 100% { transform: translateY(0); opacity: 0.5; }
          40% { transform: translateY(-8px); opacity: 1; }
        }

        /* INPUT BAR */
        .input-bar {
          position: fixed;
          bottom: 0; left: 0; right: 0;
          z-index: 50;
          padding: 16px 24px 32px;
        }
        .input-pill {
          max-width: 680px;
          margin: 0 auto;
          background: rgba(255,255,255,0.45);
          backdrop-filter: blur(24px);
          border-radius: 9999px;
          padding: 8px 8px 8px 24px;
          display: flex;
          align-items: center;
          gap: 12px;
          box-shadow: 0 20px 50px rgba(10, 49, 77, 0.15);
          border: 1px solid rgba(195,199,206,0.3);
          transition: box-shadow 0.2s;
        }
        .input-pill:focus-within {
          box-shadow: 0 20px 50px rgba(10, 49, 77, 0.22);
        }
        .input-pill input {
          flex: 1;
          background: transparent;
          border: none;
          outline: none;
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-size: 1rem;
          color: #161d19;
        }
        .input-pill input::placeholder { color: rgba(66,71,77,0.55); }
        .send-btn {
          width: 46px; height: 46px;
          border-radius: 9999px;
          background: #001c30;
          color: white;
          border: none;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.1rem;
          transition: all 0.2s;
          flex-shrink: 0;
        }
        .send-btn:hover { transform: scale(1.08); box-shadow: 0 4px 16px rgba(0,28,48,0.3); }
        .send-btn:active { transform: scale(0.95); }
        .send-btn:disabled { opacity: 0.45; cursor: not-allowed; transform: none; }

        .material-symbols-outlined {
          font-family: 'Material Symbols Outlined';
          font-weight: normal;
          font-style: normal;
          font-size: 22px;
          line-height: 1;
          letter-spacing: normal;
          text-transform: none;
          display: inline-block;
          white-space: nowrap;
          direction: ltr;
          -webkit-font-smoothing: antialiased;
          font-variation-settings: 'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 24;
        }
      `}</style>

      <div className="bot-page">
        {/* GLOW BLOBS */}
        <div className="glow-blob-1" />
        <div className="glow-blob-2" />

        {/* STICKERS */}
        <div className="stickers">
          <div className="sticker" style={{ left: "5%", top: "25%" }}>🧘</div>
          <div className="sticker" style={{ left: "8%", bottom: "30%" }}>🌳</div>
          <div className="sticker" style={{ left: "3%", top: "52%" }}>🪑</div>
          <div className="sticker" style={{ right: "5%", top: "30%" }}>🌊</div>
          <div className="sticker" style={{ right: "10%", bottom: "35%" }}>🌿</div>
          <div className="sticker" style={{ right: "4%", top: "56%" }}>🪴</div>
        </div>

        {/* NAVBAR */}
        <nav className="bot-nav">
          <div className="bot-nav-logo">
            🪷 <span>श्वास</span>
          </div>
          <button className="back-btn" onClick={() => navigate("/get-started")}>
            ← Back
          </button> 
          <ProfileIcon />
        </nav>

        {/* CHAT AREA */}
        <main className="chat-area">
          <div className="chat-inner">
            {messages.map((msg, i) =>
              msg.role === "assistant" ? (
                <div className="msg-ai" key={i}>
                  <div className="msg-ai-header">
                    <div className="ai-avatar">✨</div>
                    <span className="ai-label">Shvaas Guide</span>
                  </div>
                  <div className="bubble-ai">{msg.content}</div>
                </div>
              ) : (
                <div className="msg-user" key={i}>
                  <div className="msg-user-header">
                    <span className="user-label">You</span>
                    <div className="user-avatar">
                      <img src={userAvatar} alt="you" />
                    </div>
                  </div>
                  <div className="bubble-user">{msg.content}</div>
                </div>
              )
            )}

            {/* TYPING INDICATOR */}
            {loading && (
              <div className="msg-ai">
                <div className="msg-ai-header">
                  <div className="ai-avatar">✨</div>
                  <span className="ai-label">Shvaas Guide</span>
                </div>
                <div className="bubble-ai">
                  <div className="typing-dots">
                    <div className="dot" />
                    <div className="dot" />
                    <div className="dot" />
                  </div>
                </div>
              </div>
            )}

            <div ref={bottomRef} />
          </div>
        </main>

        {/* INPUT BAR */}
        <div className="input-bar">
          <div className="input-pill">
            <input
              ref={inputRef}
              type="text"
              placeholder="Share your thoughts..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={loading}
            />
            <button className="send-btn" onClick={sendMessage} disabled={loading || !input.trim()}>
              <span className="material-symbols-outlined">send</span>
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default ShvaasBot;
