 import React, { useState, useRef, useEffect } from "react";
 import ProfileIcon from "../../components/ProfileIcon";
 import { useNavigate } from "react-router-dom";
 import { auth, db } from "../../firebase/config";
 import {
   collection, addDoc, onSnapshot, updateDoc, deleteDoc,
   doc, orderBy, query, where, serverTimestamp,
 } from "firebase/firestore";
 
 const SYSTEM_PROMPT = `You are Shvaas Guide — a warm, calm, and empathetic mental wellness companion built into the Shvaas app. Your role is to help users find peace, manage stress, anxiety, and everyday mental struggles.
 
 Guidelines:
 - Always respond with warmth, patience, and a calming tone
 - Keep responses concise but meaningful (2-4 sentences usually)
 - Offer breathing exercises, grounding techniques, or gentle reflections when appropriate
 - Never diagnose or replace professional therapy — gently suggest professional help for serious issues
 - Use nature metaphors occasionally (breath, water, trees, sky) to ground the user
 - Start the first message with "Namaste 🙏" if it's a greeting
 - You speak in English but can use occasional Hindi/Sanskrit words like "Namaste", "Shvaas (breath)", "Shanti (peace)"`;
 
 const WELCOME_MSG = {
   role: "assistant",
   content: "Namaste 🙏 Take a deep breath. I'm here to listen, reflect, and help you find your center. How is your inner weather today?",
 };
 
 const ShvaasBot = () => {
   const navigate = useNavigate();
   const user = auth.currentUser;
   const uid = user?.uid;
 
   // Chat sessions
   const [sessions, setSessions] = useState([]);
   const [activeSessionId, setActiveSessionId] = useState(null);
   const [messages, setMessages] = useState([WELCOME_MSG]);
   const [input, setInput] = useState("");
   const [loading, setLoading] = useState(false);
   const [showSidebar, setShowSidebar] = useState(false);
 
   const bottomRef = useRef(null);
   const inputRef = useRef(null);
 
   const userAvatar = `https://api.dicebear.com/7.x/personas/svg?seed=${uid || "user"}`;
 
   // ── Load all chat sessions for this user ──
   useEffect(() => {
     if (!uid) return;
     const q = query(
       collection(db, "chat_sessions"),
       where("uid", "==", uid),
       orderBy("updatedAt", "desc")
     );
     const unsub = onSnapshot(q, (snap) => {
       setSessions(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
     });
     return () => unsub();
   }, [uid]);
 
   // ── Scroll to bottom on new messages ──
   useEffect(() => {
     bottomRef.current?.scrollIntoView({ behavior: "smooth" });
   }, [messages, loading]);
 
   // ── Start a new chat ──
   const handleNewChat = async () => {
     setActiveSessionId(null);
     setMessages([WELCOME_MSG]);
     setInput("");
     setShowSidebar(false);
   };
 
   // ── Load an existing chat session ──
   const handleLoadSession = (session) => {
     setActiveSessionId(session.id);
     setMessages(session.messages || [WELCOME_MSG]);
     setShowSidebar(false);
   };
 
   // ── Delete a chat session ──
   const handleDeleteSession = async (sessionId, e) => {
     e.stopPropagation();
     if (!window.confirm("Delete this chat?")) return;
     await deleteDoc(doc(db, "chat_sessions", sessionId));
     if (activeSessionId === sessionId) {
       setActiveSessionId(null);
       setMessages([WELCOME_MSG]);
     }
   };
 
   // ── Send message ──
   const sendMessage = async () => {
     const text = input.trim();
     if (!text || loading) return;
 
     const userMsg = { role: "user", content: text };
     const updatedMessages = [...messages, userMsg];
     setMessages(updatedMessages);
     setInput("");
     setLoading(true);
 
     try {
       const res = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/chat`, {
         method: "POST",
         headers: { "Content-Type": "application/json" },
         body: JSON.stringify({
           messages: [
             { role: "system", content: SYSTEM_PROMPT },
             ...updatedMessages,
           ],
         }),
       });
 
       const data = await res.json();
       console.log("📥 Response:", data);
 
       if (data.error) {
         console.error("❌ Error:", data.error);
         setMessages([...updatedMessages, {
           role: "assistant",
           content: "Something went wrong — please try again 🌿",
         }]);
         return;
       }
 
       const reply = data.choices?.[0]?.message?.content || "Try again 🌿";
       const finalMessages = [...updatedMessages, { role: "assistant", content: reply }];
       setMessages(finalMessages);
 
       // ── Save to Firestore ──
       const title = text.length > 40 ? text.substring(0, 40) + "..." : text;
       if (activeSessionId) {
         // Update existing session
         await updateDoc(doc(db, "chat_sessions", activeSessionId), {
           messages: finalMessages,
           updatedAt: serverTimestamp(),
           title,
         });
       } else {
         // Create new session
         const docRef = await addDoc(collection(db, "chat_sessions"), {
           uid,
           title,
           messages: finalMessages,
           createdAt: serverTimestamp(),
           updatedAt: serverTimestamp(),
         });
         setActiveSessionId(docRef.id);
       }
 
     } catch (err) {
       console.error("❌ Fetch error:", err.message);
       setMessages([...updatedMessages, {
         role: "assistant",
         content: "Connection issue — make sure backend is running 🌿",
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
 
   const formatTime = (ts) => {
     if (!ts) return "";
     const d = ts.toDate ? ts.toDate() : new Date(ts);
     const diff = Math.floor((Date.now() - d) / 1000);
     if (diff < 60) return "Just now";
     if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
     if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
     if (diff < 172800) return "Yesterday";
     return d.toLocaleDateString();
   };
 
   return (
     <>
       <style>{`
         @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap');
         @import url('https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=swap');
         * { box-sizing: border-box; margin: 0; padding: 0; }
 
         .bot-page { font-family: 'Plus Jakarta Sans', sans-serif; min-height: 100vh; background: radial-gradient(circle at top left, #f4fbf4 0%, #eef5ee 50%, #e3eae3 100%); color: #161d19; display: flex; flex-direction: column; overflow: hidden; position: relative; }
 
         /* BLOBS */
         .glow-blob-1 { position: fixed; top: 80px; left: -80px; width: 256px; height: 256px; background: rgba(198,236,198,0.3); border-radius: 9999px; filter: blur(100px); pointer-events: none; z-index: 0; }
         .glow-blob-2 { position: fixed; bottom: 160px; right: -80px; width: 320px; height: 320px; background: rgba(206,229,255,0.2); border-radius: 9999px; filter: blur(120px); pointer-events: none; z-index: 0; }
 
         /* STICKERS */
         .stickers { position: fixed; inset: 0; pointer-events: none; overflow: hidden; z-index: 0; }
         .sticker { position: absolute; font-size: 2rem; opacity: 0.4; }
 
         /* NAVBAR */
         .bot-nav { position: fixed; top: 0; width: 100%; z-index: 50; background: rgba(240,251,240,0.88); backdrop-filter: blur(20px); display: flex; justify-content: space-between; align-items: center; padding: 14px 28px; box-shadow: 0 8px 32px rgba(10,49,77,0.06); }
         .bot-nav-logo { font-size: 1.4rem; font-weight: 800; color: #0a314d; display: flex; align-items: center; gap: 8px; letter-spacing: -0.02em; }
         .bot-nav-logo span { font-weight: 400; opacity: 0.55; font-size: 1rem; }
         .bot-nav-right { display: flex; align-items: center; gap: 8px; }
         .nav-btn { background: transparent; border: 1.5px solid #c3c7ce; color: #42474d; padding: 7px 16px; border-radius: 9999px; font-family: 'Plus Jakarta Sans', sans-serif; font-weight: 600; font-size: 0.82rem; cursor: pointer; transition: all 0.2s; white-space: nowrap; }
         .nav-btn:hover { background: #001c30; color: white; border-color: #001c30; }
         .nav-btn.primary { background: #001c30; color: white; border-color: #001c30; }
         .nav-btn.primary:hover { background: #0a314d; }
 
         /* SIDEBAR */
         .sidebar-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.3); z-index: 80; backdrop-filter: blur(2px); }
         .sidebar { position: fixed; left: 0; top: 0; bottom: 0; width: 300px; background: #fff; z-index: 90; display: flex; flex-direction: column; box-shadow: 8px 0 40px rgba(0,0,0,0.1); }
         .sidebar-header { padding: 20px; border-bottom: 1px solid #e9f0e9; display: flex; justify-content: space-between; align-items: center; flex-shrink: 0; }
         .sidebar-title { font-size: 1rem; font-weight: 800; color: #001c30; }
         .sidebar-close { background: none; border: none; font-size: 1.2rem; cursor: pointer; color: #73777e; padding: 4px; }
         .new-chat-btn { margin: 16px; padding: 12px; border-radius: 9999px; background: linear-gradient(135deg, #001c30, #0a314d); color: white; border: none; font-family: 'Plus Jakarta Sans', sans-serif; font-weight: 700; font-size: 0.9rem; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px; transition: all 0.2s; flex-shrink: 0; }
         .new-chat-btn:hover { opacity: 0.9; }
         .sessions-list { flex: 1; overflow-y: auto; padding: 0 12px 16px; }
         .sessions-empty { text-align: center; padding: 40px 20px; color: #73777e; font-size: 0.875rem; }
         .session-item { display: flex; align-items: center; gap: 8px; padding: 12px 14px; border-radius: 1rem; cursor: pointer; transition: background 0.2s; margin-bottom: 4px; border: 1px solid transparent; }
         .session-item:hover { background: #eef5ee; }
         .session-item.active { background: #eef5ee; border-color: #c3eac3; }
         .session-icon { font-size: 1.1rem; flex-shrink: 0; }
         .session-info { flex: 1; overflow: hidden; }
         .session-title { font-size: 0.875rem; font-weight: 600; color: #001c30; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
         .session-time { font-size: 0.72rem; color: #73777e; margin-top: 2px; }
         .session-delete { background: none; border: none; cursor: pointer; color: #73777e; font-size: 0.85rem; padding: 4px 6px; border-radius: 9999px; transition: all 0.2s; flex-shrink: 0; opacity: 0; }
         .session-item:hover .session-delete { opacity: 1; }
         .session-delete:hover { background: #ffdad6; color: #ba1a1a; }
 
         /* CHAT AREA */
         .chat-area { flex: 1; overflow-y: auto; padding-top: 96px; padding-bottom: 120px; padding-left: 16px; padding-right: 16px; position: relative; z-index: 10; }
         .chat-inner { max-width: 720px; margin: 0 auto; display: flex; flex-direction: column; gap: 32px; }
 
         /* MESSAGES */
         .msg-ai { display: flex; flex-direction: column; align-items: flex-start; gap: 10px; }
         .msg-ai-header { display: flex; align-items: center; gap: 10px; padding: 0 8px; }
         .ai-avatar { width: 32px; height: 32px; border-radius: 9999px; background: #c3eac3; display: flex; align-items: center; justify-content: center; font-size: 0.9rem; flex-shrink: 0; }
         .ai-label { font-size: 0.7rem; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase; color: #42474d; }
         .bubble-ai { background: rgba(255,255,255,0.62); backdrop-filter: blur(12px); border-radius: 2rem; border-top-left-radius: 0.5rem; padding: 20px 24px; max-width: 85%; font-size: 1.05rem; line-height: 1.7; color: #161d19; box-shadow: 0 2px 12px rgba(0,0,0,0.05); }
 
         .msg-user { display: flex; flex-direction: column; align-items: flex-end; gap: 10px; }
         .msg-user-header { display: flex; align-items: center; gap: 10px; padding: 0 8px; }
         .user-avatar { width: 32px; height: 32px; border-radius: 9999px; overflow: hidden; background: #a9caed; flex-shrink: 0; }
         .user-avatar img { width: 100%; height: 100%; object-fit: cover; }
         .user-label { font-size: 0.7rem; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase; color: #42474d; }
         .bubble-user { background: linear-gradient(135deg, #001c30 0%, #0a314d 100%); border-radius: 2rem; border-top-right-radius: 0.5rem; padding: 20px 24px; max-width: 85%; font-size: 1.05rem; line-height: 1.7; color: white; box-shadow: 0 8px 24px rgba(0,28,48,0.18); }
 
         /* TYPING */
         .typing-dots { display: flex; align-items: center; gap: 5px; padding: 20px 24px; }
         .dot { width: 8px; height: 8px; border-radius: 9999px; background: #486b4c; animation: bounce 1.2s infinite ease-in-out; }
         .dot:nth-child(2) { animation-delay: 0.2s; }
         .dot:nth-child(3) { animation-delay: 0.4s; }
         @keyframes bounce { 0%, 80%, 100% { transform: translateY(0); opacity: 0.5; } 40% { transform: translateY(-8px); opacity: 1; } }
 
         /* INPUT */
         .input-bar { position: fixed; bottom: 0; left: 0; right: 0; z-index: 50; padding: 16px 24px 32px; }
         .input-pill { max-width: 680px; margin: 0 auto; background: rgba(255,255,255,0.45); backdrop-filter: blur(24px); border-radius: 9999px; padding: 8px 8px 8px 24px; display: flex; align-items: center; gap: 12px; box-shadow: 0 20px 50px rgba(10,49,77,0.15); border: 1px solid rgba(195,199,206,0.3); }
         .input-pill input { flex: 1; background: transparent; border: none; outline: none; font-family: 'Plus Jakarta Sans', sans-serif; font-size: 1rem; color: #161d19; }
         .input-pill input::placeholder { color: rgba(66,71,77,0.55); }
         .send-btn { width: 46px; height: 46px; border-radius: 9999px; background: #001c30; color: white; border: none; cursor: pointer; display: flex; align-items: center; justify-content: center; font-size: 1.1rem; transition: all 0.2s; flex-shrink: 0; }
         .send-btn:hover { transform: scale(1.08); }
         .send-btn:active { transform: scale(0.95); }
         .send-btn:disabled { opacity: 0.45; cursor: not-allowed; transform: none; }
 
         .material-symbols-outlined { font-family: 'Material Symbols Outlined'; font-weight: normal; font-style: normal; font-size: 22px; line-height: 1; letter-spacing: normal; text-transform: none; display: inline-block; white-space: nowrap; direction: ltr; -webkit-font-smoothing: antialiased; font-variation-settings: 'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 24; }
       `}</style>
 
       <div className="bot-page">
         <div className="glow-blob-1" />
         <div className="glow-blob-2" />
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
           <div className="bot-nav-logo">🪷 <span>श्वास</span></div>
           <div className="bot-nav-right">
             <button className="nav-btn" onClick={() => setShowSidebar(true)}>
               🕐 History
             </button>
             <button className="nav-btn primary" onClick={handleNewChat}>
               + New Chat
             </button>
             <button className="nav-btn" onClick={() => navigate("/get-started")}>← Back</button>
             <ProfileIcon />
           </div>
         </nav>
 
         {/* SIDEBAR */}
         {showSidebar && (
           <>
             <div className="sidebar-overlay" onClick={() => setShowSidebar(false)} />
             <div className="sidebar">
               <div className="sidebar-header">
                 <span className="sidebar-title">🕐 Chat History</span>
                 <button className="sidebar-close" onClick={() => setShowSidebar(false)}>✕</button>
               </div>
               <button className="new-chat-btn" onClick={handleNewChat}>
                 ✨ New Chat
               </button>
               <div className="sessions-list">
                 {sessions.length === 0 ? (
                   <div className="sessions-empty">No saved chats yet.<br />Start a conversation! 🌿</div>
                 ) : (
                   sessions.map((s) => (
                     <div
                       key={s.id}
                       className={`session-item ${activeSessionId === s.id ? "active" : ""}`}
                       onClick={() => handleLoadSession(s)}
                     >
                       <span className="session-icon">💬</span>
                       <div className="session-info">
                         <div className="session-title">{s.title || "Chat"}</div>
                         <div className="session-time">{formatTime(s.updatedAt)}</div>
                       </div>
                       <button
                         className="session-delete"
                         onClick={(e) => handleDeleteSession(s.id, e)}
                         title="Delete chat"
                       >
                         🗑
                       </button>
                     </div>
                   ))
                 )}
               </div>
             </div>
           </>
         )}
 
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
                     <div className="user-avatar"><img src={userAvatar} alt="you" /></div>
                   </div>
                   <div className="bubble-user">{msg.content}</div>
                 </div>
               )
             )}
             {loading && (
               <div className="msg-ai">
                 <div className="msg-ai-header">
                   <div className="ai-avatar">✨</div>
                   <span className="ai-label">Shvaas Guide</span>
                 </div>
                 <div className="bubble-ai">
                   <div className="typing-dots">
                     <div className="dot" /><div className="dot" /><div className="dot" />
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
 