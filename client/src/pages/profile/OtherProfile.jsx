import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { auth, db } from "../../firebase/config";
import {
  doc, getDoc, setDoc, updateDoc, collection, query,
  where, onSnapshot, orderBy, addDoc, serverTimestamp, getDocs,
} from "firebase/firestore";
import { arrayUnion, arrayRemove } from "firebase/firestore";

const OtherProfile = () => {
  const { uid: otherUid } = useParams();
  const navigate = useNavigate();
  const myUid = auth.currentUser?.uid;
  const myDisplayName = auth.currentUser?.displayName || auth.currentUser?.email?.split("@")[0] || "Me";
  const myAvatar = `https://api.dicebear.com/7.x/personas/svg?seed=${myUid}`;

  const [profile, setProfile] = useState(null);
  const [myProfile, setMyProfile] = useState(null);
  const [activeTab, setActiveTab] = useState("thoughts");
  const [thoughts, setThoughts] = useState([]);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  // DM state
  const [showChat, setShowChat] = useState(false);
  const [messages, setMessages] = useState([]);
  const [dmInput, setDmInput] = useState("");
  const [convoId, setConvoId] = useState(null);
  const messagesEndRef = useRef(null);

  const isFollowing = myProfile?.following?.includes(otherUid);
  const avatarUrl = profile?.avatarUrl || `https://api.dicebear.com/7.x/personas/svg?seed=${otherUid}`;

  // ── Load other user's profile ──
  useEffect(() => {
    if (!otherUid) return;
    if (otherUid === myUid) { navigate("/profile"); return; }

    const unsub = onSnapshot(doc(db, "users", otherUid), (snap) => {
      if (snap.exists()) setProfile(snap.data());
      setLoading(false);
    });
    return () => unsub();
  }, [otherUid]);

  // ── Load my profile ──
  useEffect(() => {
    if (!myUid) return;
    const unsub = onSnapshot(doc(db, "users", myUid), (snap) => {
      if (snap.exists()) setMyProfile(snap.data());
    });
    return () => unsub();
  }, [myUid]);

  // ── Load their thoughts ──
  useEffect(() => {
    if (!otherUid) return;
    const q = query(collection(db, "thoughts"), where("authorId", "==", otherUid), orderBy("createdAt", "desc"));
    return onSnapshot(q, (snap) => setThoughts(snap.docs.map((d) => ({ id: d.id, ...d.data() }))));
  }, [otherUid]);

  // ── Load their studio posts ──
  useEffect(() => {
    if (!otherUid) return;
    const q = query(collection(db, "studio_posts"), where("authorId", "==", otherUid), orderBy("createdAt", "desc"));
    return onSnapshot(q, (snap) => setPosts(snap.docs.map((d) => ({ id: d.id, ...d.data() }))));
  }, [otherUid]);

  // ── Load messages when chat opens ──
  useEffect(() => {
    if (!showChat || !convoId) return;
    const q = query(collection(db, "conversations", convoId, "messages"), orderBy("createdAt", "asc"));
    return onSnapshot(q, (snap) => {
      setMessages(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
    });
  }, [showChat, convoId]);

  // ── Follow / Unfollow ──
  const handleFollow = async () => {
    if (!myUid || !otherUid) return;
    const myRef = doc(db, "users", myUid);
    const otherRef = doc(db, "users", otherUid);

    if (isFollowing) {
      // Unfollow
      await updateDoc(myRef, { following: arrayRemove(otherUid) });
      await updateDoc(otherRef, { followers: arrayRemove(myUid) });
    } else {
      // Follow
      await updateDoc(myRef, { following: arrayUnion(otherUid) });
      await updateDoc(otherRef, { followers: arrayUnion(myUid) });
    }
  };

  // ── Open DM ──
  const handleMessage = async () => {
    const id = [myUid, otherUid].sort().join("_");
    const convoRef = doc(db, "conversations", id);
    const snap = await getDoc(convoRef);

    if (!snap.exists()) {
      await setDoc(convoRef, {
        participants: [myUid, otherUid],
        participantNames: { [myUid]: myDisplayName, [otherUid]: profile?.username || "User" },
        participantAvatars: { [myUid]: myAvatar, [otherUid]: avatarUrl },
        lastMessage: "",
        lastMessageAt: serverTimestamp(),
      });
    }

    setConvoId(id);
    setShowChat(true);
  };

  // ── Send DM ──
  const sendMessage = async () => {
    if (!dmInput.trim() || !convoId) return;
    const text = dmInput.trim();
    setDmInput("");
    await addDoc(collection(db, "conversations", convoId, "messages"), {
      text, senderId: myUid, senderName: myDisplayName, createdAt: serverTimestamp(),
    });
    await updateDoc(doc(db, "conversations", convoId), {
      lastMessage: text, lastMessageAt: serverTimestamp(),
    });
  };

  const formatTime = (ts) => {
    if (!ts) return "";
    const d = ts.toDate ? ts.toDate() : new Date(ts);
    const diff = Math.floor((Date.now() - d) / 1000);
    if (diff < 60) return "now";
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return d.toLocaleDateString();
  };

  if (loading) return (
    <div style={{ background: "#0a1628", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", color: "#a8b8a8", fontFamily: "Plus Jakarta Sans, sans-serif" }}>
      Loading profile...
    </div>
  );

  if (!profile) return (
    <div style={{ background: "#0a1628", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", color: "#a8b8a8", fontFamily: "Plus Jakarta Sans, sans-serif" }}>
      User not found.
    </div>
  );

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }

        .op-page { font-family: 'Plus Jakarta Sans', sans-serif; background: #0a1628; min-height: 100vh; color: #e8f0e8; }

        .op-nav { display: flex; justify-content: space-between; align-items: center; padding: 16px 28px; position: sticky; top: 0; z-index: 50; background: rgba(10,22,40,0.92); backdrop-filter: blur(16px); border-bottom: 1px solid rgba(255,255,255,0.05); }
        .op-logo { font-size: 1.3rem; font-weight: 800; color: #e8f0e8; }
        .op-back-btn { background: transparent; border: 1px solid rgba(255,255,255,0.18); color: #a8b8a8; padding: 7px 16px; border-radius: 9999px; font-family: 'Plus Jakarta Sans', sans-serif; font-weight: 600; font-size: 0.8rem; cursor: pointer; transition: all 0.2s; }
        .op-back-btn:hover { background: rgba(255,255,255,0.08); color: white; }

        .op-hero { padding: 36px 28px 0; display: flex; gap: 32px; align-items: flex-start; flex-wrap: wrap; }
        .op-left { flex: 1; min-width: 260px; }
        .op-username { font-size: 2rem; font-weight: 800; color: #fff; margin-bottom: 14px; letter-spacing: -0.02em; }
        .op-bio { background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.08); border-radius: 1rem; padding: 16px 20px; font-size: 0.95rem; color: #a8b8a8; line-height: 1.65; font-style: italic; margin-bottom: 12px; min-height: 60px; }
        .op-book { display: flex; align-items: center; gap: 10px; background: rgba(169,202,237,0.08); border: 1px solid rgba(169,202,237,0.18); border-radius: 0.875rem; padding: 10px 16px; margin-bottom: 20px; }
        .op-book-label { font-size: 0.72rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.1em; color: #7a8a7a; white-space: nowrap; }
        .op-book-title { font-size: 0.9rem; font-weight: 700; color: #a9caed; font-style: italic; }

        .op-actions { display: flex; gap: 10px; flex-wrap: wrap; }
        .follow-btn { padding: 10px 28px; border-radius: 9999px; font-family: 'Plus Jakarta Sans', sans-serif; font-weight: 700; font-size: 0.9rem; cursor: pointer; transition: all 0.2s; border: none; }
        .follow-btn.following { background: rgba(255,255,255,0.08); color: #a8b8a8; border: 1px solid rgba(255,255,255,0.15); }
        .follow-btn.following:hover { background: rgba(186,26,26,0.15); color: #e57373; border-color: rgba(186,26,26,0.3); }
        .follow-btn.not-following { background: linear-gradient(135deg, #446648, #2d4e32); color: white; }
        .follow-btn.not-following:hover { opacity: 0.9; }
        .msg-btn { padding: 10px 22px; border-radius: 9999px; background: rgba(255,255,255,0.07); color: #d8e8d8; border: 1px solid rgba(255,255,255,0.15); font-family: 'Plus Jakarta Sans', sans-serif; font-weight: 700; font-size: 0.875rem; cursor: pointer; transition: all 0.2s; }
        .msg-btn:hover { background: rgba(255,255,255,0.14); color: white; }

        .op-right { display: flex; flex-direction: column; align-items: center; gap: 20px; }
        .op-avatar { width: 110px; height: 110px; border-radius: 9999px; border: 3px solid rgba(169,202,237,0.35); overflow: hidden; background: #1a2a40; }
        .op-avatar img { width: 100%; height: 100%; object-fit: cover; }
        .op-stats { display: flex; gap: 28px; }
        .op-stat { text-align: center; }
        .op-stat-num { font-size: 1.4rem; font-weight: 800; color: #fff; }
        .op-stat-label { font-size: 0.7rem; color: #7a8a7a; text-transform: uppercase; letter-spacing: 0.08em; margin-top: 2px; }

        .op-tabs { display: flex; justify-content: center; gap: 8px; padding: 32px 28px 0; }
        .op-tab { padding: 10px 28px; border-radius: 9999px; font-family: 'Plus Jakarta Sans', sans-serif; font-weight: 600; font-size: 0.9rem; cursor: pointer; border: none; transition: all 0.2s; }
        .op-tab.active { background: rgba(255,255,255,0.1); color: white; border: 1px solid rgba(255,255,255,0.12); }
        .op-tab.inactive { background: transparent; color: #7a8a7a; border: 1px solid transparent; }
        .op-tab.inactive:hover { background: rgba(255,255,255,0.05); color: #a8b8a8; }

        .op-content { padding: 20px 28px 80px; }
        .op-empty { text-align: center; padding: 60px 20px; color: #7a8a7a; font-size: 0.95rem; }

        .thought-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 16px; }
        .thought-card { background: rgba(255,255,255,0.04); border-radius: 1.25rem; padding: 20px; border: 1px solid rgba(255,255,255,0.07); transition: all 0.3s; }
        .thought-card:hover { background: rgba(255,255,255,0.07); }
        .thought-tag { font-size: 0.65rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.12em; color: #7a8a7a; margin-bottom: 10px; display: flex; justify-content: space-between; }
        .thought-text { font-size: 1rem; color: #d8e8d8; line-height: 1.65; margin-bottom: 16px; }
        .thought-stats { display: flex; gap: 16px; font-size: 0.82rem; color: #7a8a7a; }

        .studio-grid { columns: 2; gap: 10px; }
        @media (min-width: 600px) { .studio-grid { columns: 3; } }
        .studio-item { break-inside: avoid; margin-bottom: 10px; border-radius: 0.875rem; overflow: hidden; background: #1a2a40; }
        .studio-item img, .studio-item video { width: 100%; display: block; border-radius: 0.875rem; }

        /* CHAT PANEL */
        .chat-panel { position: fixed; bottom: 0; right: 24px; width: 340px; background: #0d1a2e; border: 1px solid rgba(255,255,255,0.08); border-bottom: none; border-radius: 1rem 1rem 0 0; z-index: 100; display: flex; flex-direction: column; box-shadow: 0 -8px 32px rgba(0,0,0,0.4); }
        .chat-panel-header { padding: 14px 16px; border-bottom: 1px solid rgba(255,255,255,0.07); display: flex; align-items: center; gap: 10px; }
        .chat-panel-avatar { width: 32px; height: 32px; border-radius: 9999px; overflow: hidden; background: #1a2a40; flex-shrink: 0; }
        .chat-panel-avatar img { width: 100%; height: 100%; object-fit: cover; }
        .chat-panel-name { font-weight: 700; color: #fff; font-size: 0.9rem; flex: 1; }
        .chat-panel-close { background: none; border: none; color: #7a8a7a; cursor: pointer; font-size: 1rem; }
        .chat-messages { height: 280px; overflow-y: auto; padding: 12px; display: flex; flex-direction: column; gap: 8px; }
        .msg-wrap { display: flex; }
        .msg-wrap.mine { justify-content: flex-end; }
        .msg-bubble { max-width: 78%; padding: 9px 13px; border-radius: 1.25rem; font-size: 0.875rem; line-height: 1.5; font-family: 'Plus Jakarta Sans', sans-serif; }
        .msg-bubble.mine { background: linear-gradient(135deg, #2a4a6a, #1a3450); color: #a9caed; border-bottom-right-radius: 4px; }
        .msg-bubble.theirs { background: rgba(255,255,255,0.07); color: #d8e8d8; border-bottom-left-radius: 4px; }
        .chat-input-row { padding: 10px 12px; border-top: 1px solid rgba(255,255,255,0.07); display: flex; gap: 8px; align-items: center; }
        .chat-input { flex: 1; background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.1); border-radius: 9999px; padding: 9px 14px; font-family: 'Plus Jakarta Sans', sans-serif; font-size: 0.875rem; color: #e8f0e8; outline: none; }
        .chat-input::placeholder { color: #7a8a7a; }
        .chat-send { background: #2a4a6a; border: none; border-radius: 9999px; width: 34px; height: 34px; display: flex; align-items: center; justify-content: center; cursor: pointer; color: #a9caed; font-size: 0.9rem; flex-shrink: 0; }
        .chat-send:hover { background: #3a5a7a; }
      `}</style>

      <div className="op-page">

        {/* NAV */}
        <nav className="op-nav">
          <div className="op-logo">🪷 श्वास</div>
          <button className="op-back-btn" onClick={() => navigate(-1)}>← Back</button>
        </nav>

        {/* HERO */}
        <div className="op-hero">
          <div className="op-left">
            <div className="op-username">@{profile.username || "user"}</div>

            <div className="op-bio">
              {profile.bio || "No bio yet."}
            </div>

            {profile.book && (
              <div className="op-book">
                <span style={{ fontSize: "1.2rem" }}>📚</span>
                <span className="op-book-label">Go Read This:</span>
                <span className="op-book-title">"{profile.book}"</span>
              </div>
            )}

            <div className="op-actions">
              {/* FOLLOW BUTTON */}
              <button
                className={`follow-btn ${isFollowing ? "following" : "not-following"}`}
                onClick={handleFollow}
              >
                {isFollowing ? "✓ Following" : "+ Follow"}
              </button>

              {/* MESSAGE BUTTON — opens DM directly */}
              <button className="msg-btn" onClick={handleMessage}>
                💬 Message
              </button>
            </div>
          </div>

          <div className="op-right">
            <div className="op-avatar">
              <img src={avatarUrl} alt={profile.username} />
            </div>
            <div className="op-stats">
              <div className="op-stat">
                <div className="op-stat-num">{profile.followers?.length || 0}</div>
                <div className="op-stat-label">Followers</div>
              </div>
              <div className="op-stat">
                <div className="op-stat-num">{profile.following?.length || 0}</div>
                <div className="op-stat-label">Following</div>
              </div>
            </div>
          </div>
        </div>

        {/* TABS */}
        <div className="op-tabs">
          <button className={`op-tab ${activeTab === "thoughts" ? "active" : "inactive"}`} onClick={() => setActiveTab("thoughts")}>
            🌊 Pond of Thoughts
          </button>
          <button className={`op-tab ${activeTab === "studio" ? "active" : "inactive"}`} onClick={() => setActiveTab("studio")}>
            ✨ Shvaas Studio
          </button>
        </div>

        {/* CONTENT */}
        <div className="op-content">
          {activeTab === "thoughts" && (
            thoughts.length === 0
              ? <div className="op-empty">No thoughts posted yet.</div>
              : <div className="thought-grid">
                  {thoughts.map((t) => (
                    <div className="thought-card" key={t.id}>
                      <div className="thought-tag"><span>Thought</span><span>{formatTime(t.createdAt)}</span></div>
                      <div className="thought-text">{t.text}</div>
                      <div className="thought-stats">
                        <span>❤️ {t.likes?.length || 0}</span>
                        <span>💬 {t.comments?.length || 0}</span>
                      </div>
                    </div>
                  ))}
                </div>
          )}

          {activeTab === "studio" && (
            posts.length === 0
              ? <div className="op-empty">No studio posts yet.</div>
              : <div className="studio-grid">
                  {posts.map((p) => (
                    <div className="studio-item" key={p.id}>
                      {p.isVideo
                        ? <video src={p.mediaUrl} muted playsInline style={{ width: "100%" }} />
                        : <img src={p.mediaUrl} alt={p.caption || "post"} loading="lazy" />}
                    </div>
                  ))}
                </div>
          )}
        </div>

        {/* CHAT PANEL — pops up from bottom when Message clicked */}
        {showChat && (
          <div className="chat-panel">
            <div className="chat-panel-header">
              <div className="chat-panel-avatar">
                <img src={avatarUrl} alt={profile.username} />
              </div>
              <span className="chat-panel-name">@{profile.username || "user"}</span>
              <button className="chat-panel-close" onClick={() => setShowChat(false)}>✕</button>
            </div>
            <div className="chat-messages">
              {messages.length === 0 && (
                <div style={{ textAlign: "center", color: "#7a8a7a", fontSize: "0.82rem", padding: "20px" }}>
                  Say hello 👋
                </div>
              )}
              {messages.map((m) => (
                <div className={`msg-wrap ${m.senderId === myUid ? "mine" : ""}`} key={m.id}>
                  <div className={`msg-bubble ${m.senderId === myUid ? "mine" : "theirs"}`}>{m.text}</div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
            <div className="chat-input-row">
              <input
                className="chat-input"
                placeholder="Type a message..."
                value={dmInput}
                onChange={(e) => setDmInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && sendMessage()}
              />
              <button className="chat-send" onClick={sendMessage}>➤</button>
            </div>
          </div>
        )}

      </div>
    </>
  );
};

export default OtherProfile;
