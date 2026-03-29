import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { auth, db } from "../../firebase/config";
import ProfileIcon from "../../components/ProfileIcon";
import { signOut } from "firebase/auth";
import {
  collection,
  addDoc,
  onSnapshot,
  updateDoc,
  doc,
  arrayUnion,
  arrayRemove,
  orderBy,
  query,
  serverTimestamp,
} from "firebase/firestore";

const PondOfThoughts = () => {
  const navigate = useNavigate();
  const [thoughts, setThoughts] = useState([]);
  const [input, setInput] = useState("");
  const [posting, setPosting] = useState(false);
  const [openComments, setOpenComments] = useState(null); // postId
  const [commentInputs, setCommentInputs] = useState({});
  const inputRef = useRef(null);

  const user = auth.currentUser;
  const userAvatar = `https://api.dicebear.com/7.x/personas/svg?seed=${user?.uid}`;
  const displayName = user?.displayName || user?.email?.split("@")[0] || "Anonymous";

  // 🔥 Real-time listener from Firestore
  useEffect(() => {
    const q = query(collection(db, "thoughts"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, (snapshot) => {
      setThoughts(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
    return () => unsub();
  }, []);

  // 📝 Post a thought
  const handlePost = async () => {
    if (!input.trim() || posting) return;
    setPosting(true);
    try {
      await addDoc(collection(db, "thoughts"), {
        text: input.trim(),
        authorId: user.uid,
        authorName: displayName,
        authorAvatar: userAvatar,
        likes: [],
        comments: [],
        createdAt: serverTimestamp(),
      });
      setInput("");
    } catch (e) {
      console.error(e);
    }
    setPosting(false);
  };

  // ❤️ Toggle like
  const handleLike = async (thought) => {
    const ref = doc(db, "thoughts", thought.id);
    const liked = thought.likes?.includes(user.uid);
    await updateDoc(ref, {
      likes: liked ? arrayRemove(user.uid) : arrayUnion(user.uid),
    });
  };

  // 💬 Post a comment
  const handleComment = async (thoughtId) => {
    const text = commentInputs[thoughtId]?.trim();
    if (!text) return;
    const ref = doc(db, "thoughts", thoughtId);
    await updateDoc(ref, {
      comments: arrayUnion({
        uid: user.uid,
        name: displayName,
        avatar: userAvatar,
        text,
        createdAt: new Date().toISOString(),
      }),
    });
    setCommentInputs((prev) => ({ ...prev, [thoughtId]: "" }));
  };

  // 🕒 Format timestamp
  const formatTime = (ts) => {
    if (!ts) return "Just now";
    const date = ts.toDate ? ts.toDate() : new Date(ts);
    const diff = Math.floor((Date.now() - date) / 1000);
    if (diff < 60) return "Just now";
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    if (diff < 172800) return "Yesterday";
    return date.toLocaleDateString();
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap');
        @import url('https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=swap');

        * { box-sizing: border-box; margin: 0; padding: 0; }

        .pot-page {
          font-family: 'Plus Jakarta Sans', sans-serif;
          background-color: #f4fbf4;
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          color: #161d19;
        }

        /* BG DECORATIONS */
        .bg-dec-1 {
          position: fixed;
          top: -10%; right: -5%;
          width: 600px; height: 600px;
          background: rgba(195,234,195,0.2);
          border-radius: 9999px;
          filter: blur(120px);
          pointer-events: none;
          z-index: 0;
          animation: pulse 4s ease-in-out infinite;
        }
        .bg-dec-2 {
          position: fixed;
          bottom: -10%; left: -5%;
          width: 480px; height: 480px;
          background: rgba(227,234,227,0.3);
          border-radius: 9999px;
          filter: blur(100px);
          pointer-events: none;
          z-index: 0;
        }
        @keyframes pulse {
          0%, 100% { opacity: 0.2; } 50% { opacity: 0.35; }
        }

        /* NAVBAR */
        .pot-nav {
          position: fixed;
          top: 0; width: 100%;
          z-index: 50;
          background: rgba(244,251,244,0.82);
          backdrop-filter: blur(20px);
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px 24px;
        }
        .pot-logo {
          font-size: 1.4rem;
          font-weight: 800;
          color: #0a314d;
          display: flex;
          align-items: center;
          gap: 8px;
          letter-spacing: -0.02em;
        }
        .pot-nav-btns { display: flex; gap: 10px; }
        .nav-btn {
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
        .nav-btn:hover { background: #001c30; color: white; border-color: #001c30; }

        /* MAIN */
        .pot-main {
          position: relative;
          z-index: 1;
          flex: 1;
          padding-top: 96px;
          padding-bottom: 120px;
          padding-left: 24px;
          padding-right: 24px;
          max-width: 680px;
          margin: 0 auto;
          width: 100%;
        }

        /* HERO */
        .pot-hero { margin-bottom: 40px; margin-top: 16px; }
        .pot-hero h1 {
          font-size: 2.4rem;
          font-weight: 800;
          color: #001c30;
          letter-spacing: -0.03em;
          margin-bottom: 6px;
        }
        .pot-hero p { color: #42474d; font-size: 1.05rem; }

        /* EMPTY STATE */
        .empty-state {
          text-align: center;
          padding: 60px 20px;
          color: #42474d;
        }
        .empty-state .emoji { font-size: 3rem; margin-bottom: 16px; }
        .empty-state h3 { font-size: 1.2rem; font-weight: 700; color: #001c30; margin-bottom: 8px; }
        .empty-state p { font-size: 0.95rem; line-height: 1.6; }

        /* THOUGHT CARD */
        .thought-card {
          background: #ffffff;
          border-radius: 1.25rem;
          padding: 28px;
          margin-bottom: 24px;
          box-shadow: 0 4px 40px rgba(10,49,77,0.04);
          border: 1px solid transparent;
          transition: all 0.4s ease;
        }
        .thought-card:hover {
          box-shadow: 0 4px 60px rgba(10,49,77,0.07);
          border-color: rgba(195,199,206,0.2);
        }

        /* POST HEADER */
        .post-header {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 16px;
        }
        .post-avatar {
          width: 44px; height: 44px;
          border-radius: 9999px;
          overflow: hidden;
          background: #c6ecc6;
          flex-shrink: 0;
        }
        .post-avatar img { width: 100%; height: 100%; object-fit: cover; }
        .post-author-name {
          font-weight: 700;
          color: #001c30;
          font-size: 0.95rem;
        }
        .post-time {
          font-size: 0.75rem;
          color: #42474d;
          margin-top: 2px;
        }

        /* POST TEXT */
        .post-text {
          font-size: 1.1rem;
          line-height: 1.75;
          color: #161d19;
          margin-bottom: 20px;
        }

        /* ACTIONS */
        .post-actions {
          display: flex;
          align-items: center;
          gap: 24px;
        }
        .action-btn {
          background: none;
          border: none;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 6px;
          color: #42474d;
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-size: 0.875rem;
          font-weight: 600;
          padding: 6px 10px;
          border-radius: 9999px;
          transition: all 0.2s;
        }
        .action-btn:hover { background: #eef5ee; color: #001c30; }
        .action-btn.liked { color: #e53935; }
        .action-btn.liked:hover { background: #ffdad6; }
        .share-btn {
          margin-left: auto;
          background: none;
          border: none;
          cursor: pointer;
          color: #42474d;
          padding: 6px 10px;
          border-radius: 9999px;
          transition: all 0.2s;
          display: flex;
          align-items: center;
        }
        .share-btn:hover { background: #eef5ee; color: #001c30; }

        /* COMMENTS SECTION */
        .comments-section {
          margin-top: 16px;
          border-top: 1px solid #e9f0e9;
          padding-top: 16px;
        }
        .comment-item {
          display: flex;
          gap: 10px;
          margin-bottom: 12px;
          align-items: flex-start;
        }
        .comment-avatar {
          width: 30px; height: 30px;
          border-radius: 9999px;
          overflow: hidden;
          background: #c6ecc6;
          flex-shrink: 0;
        }
        .comment-avatar img { width: 100%; height: 100%; object-fit: cover; }
        .comment-bubble {
          background: #eef5ee;
          border-radius: 1rem;
          padding: 8px 14px;
          flex: 1;
        }
        .comment-name {
          font-size: 0.78rem;
          font-weight: 700;
          color: #001c30;
          margin-bottom: 2px;
        }
        .comment-text {
          font-size: 0.875rem;
          color: #161d19;
          line-height: 1.5;
        }
        .comment-input-row {
          display: flex;
          gap: 8px;
          align-items: center;
          margin-top: 10px;
        }
        .comment-input {
          flex: 1;
          background: #eef5ee;
          border: none;
          outline: none;
          border-radius: 9999px;
          padding: 8px 16px;
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-size: 0.875rem;
          color: #161d19;
        }
        .comment-input::placeholder { color: #73777e; }
        .comment-send-btn {
          background: #001c30;
          border: none;
          border-radius: 9999px;
          width: 34px; height: 34px;
          display: flex; align-items: center; justify-content: center;
          cursor: pointer;
          color: white;
          transition: all 0.2s;
          flex-shrink: 0;
        }
        .comment-send-btn:hover { background: #0a314d; }

        /* INPUT BAR */
        .input-bar {
          position: fixed;
          bottom: 0; left: 0; right: 0;
          z-index: 50;
          padding: 12px 24px 24px;
          background: rgba(244,251,244,0.96);
          backdrop-filter: blur(20px);
          border-top: 1px solid rgba(195,199,206,0.08);
        }
        .input-pill {
          max-width: 680px;
          margin: 0 auto;
          display: flex;
          align-items: center;
          gap: 12px;
          background: #ffffff;
          border-radius: 9999px;
          padding: 8px 8px 8px 16px;
          box-shadow: 0 -4px 40px rgba(10,49,77,0.06);
          border: 1px solid rgba(195,199,206,0.12);
        }
        .input-smiley {
          width: 38px; height: 38px;
          border-radius: 9999px;
          background: #e3eae3;
          display: flex; align-items: center; justify-content: center;
          font-size: 1.1rem;
          flex-shrink: 0;
        }
        .input-pill input {
          flex: 1;
          background: transparent;
          border: none;
          outline: none;
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-size: 0.95rem;
          color: #161d19;
          font-weight: 500;
        }
        .input-pill input::placeholder { color: #73777e; }
        .post-btn {
          background: linear-gradient(135deg, #001c30 0%, #0a314d 100%);
          color: white;
          border: none;
          border-radius: 9999px;
          padding: 10px 24px;
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-weight: 700;
          font-size: 0.875rem;
          cursor: pointer;
          transition: all 0.2s;
          white-space: nowrap;
          letter-spacing: 0.02em;
        }
        .post-btn:hover { opacity: 0.9; box-shadow: 0 4px 16px rgba(0,28,48,0.25); }
        .post-btn:active { transform: scale(0.96); }
        .post-btn:disabled { opacity: 0.5; cursor: not-allowed; }

        .material-symbols-outlined {
          font-family: 'Material Symbols Outlined';
          font-weight: normal;
          font-style: normal;
          font-size: 20px;
          line-height: 1;
          letter-spacing: normal;
          text-transform: none;
          display: inline-block;
          white-space: nowrap;
          direction: ltr;
          -webkit-font-smoothing: antialiased;
          font-variation-settings: 'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 24;
        }

        /* SCROLLBAR */
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #dde4de; border-radius: 10px; }
      `}</style>

      <div className="pot-page">
        <div className="bg-dec-1" />
        <div className="bg-dec-2" />

        {/* NAVBAR */}
        <nav className="pot-nav">
          <div className="pot-logo">🪷 श्वास</div>
          <div className="pot-nav-btns">
            <button className="nav-btn" onClick={() => navigate("/explore")}>← Back</button>
            <button className="nav-btn" onClick={() => { signOut(auth); navigate("/"); }}>Logout</button>
            <ProfileIcon />
          </div>
        </nav>

        {/* MAIN FEED */}
        <main className="pot-main">
          <div className="pot-hero">
            <h1>Pond of Thoughts</h1>
            <p>Let your reflections ripple through the water.</p>
          </div>

          {/* EMPTY STATE */}
          {thoughts.length === 0 && (
            <div className="empty-state">
              <div className="emoji">🌊</div>
              <h3>The pond is still...</h3>
              <p>Be the first to drop a thought.<br />Your words create the first ripple.</p>
            </div>
          )}

          {/* THOUGHTS FEED */}
          {thoughts.map((thought) => {
            const liked = thought.likes?.includes(user?.uid);
            const isCommentsOpen = openComments === thought.id;

            return (
              <div className="thought-card" key={thought.id}>
                {/* HEADER */}
                <div className="post-header">
                  <div className="post-avatar">
                    <img src={thought.authorAvatar} alt={thought.authorName} />
                  </div>
                  <div>
                    <div className="post-author-name" style={{ cursor: "pointer" }}
                         onClick={() => navigate(`/user/${thought.authorId}`)}
                        >
                        {thought.authorName}
                        </div>
                    <div className="post-time">{formatTime(thought.createdAt)}</div>
                  </div>
                </div>

                {/* TEXT */}
                <p className="post-text">{thought.text}</p>

                {/* ACTIONS */}
                <div className="post-actions">
                  <button
                    className={`action-btn ${liked ? "liked" : ""}`}
                    onClick={() => handleLike(thought)}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>
                      favorite
                    </span>
                    {thought.likes?.length || 0}
                  </button>

                  <button
                    className="action-btn"
                    onClick={() => setOpenComments(isCommentsOpen ? null : thought.id)}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>
                      chat_bubble
                    </span>
                    {thought.comments?.length || 0}
                  </button>

                  <button
                    className="share-btn"
                    onClick={() => {
                      navigator.clipboard?.writeText(thought.text);
                      alert("Thought copied to clipboard!");
                    }}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>share</span>
                  </button>
                </div>

                {/* COMMENTS */}
                {isCommentsOpen && (
                  <div className="comments-section">
                    {thought.comments?.length === 0 && (
                      <p style={{ fontSize: "0.85rem", color: "#73777e", marginBottom: "10px" }}>
                        No comments yet. Be the first 🌿
                      </p>
                    )}
                    {thought.comments?.map((c, i) => (
                      <div className="comment-item" key={i}>
                        <div className="comment-avatar">
                          <img src={c.avatar} alt={c.name} />
                        </div>
                        <div className="comment-bubble">
                          <div className="comment-name">{c.name}</div>
                          <div className="comment-text">{c.text}</div>
                        </div>
                      </div>
                    ))}
                    <div className="comment-input-row">
                      <input
                        className="comment-input"
                        placeholder="Add a comment..."
                        value={commentInputs[thought.id] || ""}
                        onChange={(e) =>
                          setCommentInputs((prev) => ({ ...prev, [thought.id]: e.target.value }))
                        }
                        onKeyDown={(e) => e.key === "Enter" && handleComment(thought.id)}
                      />
                      <button
                        className="comment-send-btn"
                        onClick={() => handleComment(thought.id)}
                      >
                        <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>send</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </main>

        {/* INPUT BAR */}
        <div className="input-bar">
          <div className="input-pill">
            <div className="input-smiley">😊</div>
            <input
              ref={inputRef}
              type="text"
              placeholder="Share your thoughts"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handlePost()}
            />
            <button className="post-btn" onClick={handlePost} disabled={posting || !input.trim()}>
              {posting ? "Posting..." : "Post"}
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default PondOfThoughts;
