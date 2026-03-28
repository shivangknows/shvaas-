 import React, { useState, useEffect, useRef } from "react";
 import { useNavigate } from "react-router-dom";
 import { auth, db } from "../../firebase/config";
 import { signOut, updateProfile } from "firebase/auth";
 import {
   doc, getDoc, setDoc, updateDoc, collection, query, where,
   onSnapshot, orderBy, addDoc, serverTimestamp, getDocs
 } from "firebase/firestore";
 
 // Cloudinary config — only needed if user changes profile photo
 const CLOUDINARY_CLOUD_NAME = "your_cloud_name";
 const CLOUDINARY_UPLOAD_PRESET = "your_upload_preset";
 
 const Profile = () => {
   const navigate = useNavigate();
   const user = auth.currentUser;
   const uid = user?.uid;
 
   // Profile state
   const [profile, setProfile] = useState(null);
   const [editMode, setEditMode] = useState(false);
   const [editBio, setEditBio] = useState("");
   const [editUsername, setEditUsername] = useState("");
   const [editBook, setEditBook] = useState("");
   const [editAvatar, setEditAvatar] = useState(null);
   const [editAvatarPreview, setEditAvatarPreview] = useState(null);
   const [savingProfile, setSavingProfile] = useState(false);
   const [saveError, setSaveError] = useState("");
   const avatarInputRef = useRef(null);
 
   // Tabs
   const [activeTab, setActiveTab] = useState("thoughts");
 
   // Content
   const [myThoughts, setMyThoughts] = useState([]);
   const [myPosts, setMyPosts] = useState([]);
 
   // Followers/Following modals
   const [showFollowers, setShowFollowers] = useState(false);
   const [showFollowing, setShowFollowing] = useState(false);
   const [followerProfiles, setFollowerProfiles] = useState([]);
   const [followingProfiles, setFollowingProfiles] = useState([]);
 
   // DM state
   const [showDMs, setShowDMs] = useState(false);
   const [conversations, setConversations] = useState([]);
   const [activeConvo, setActiveConvo] = useState(null);
   const [messages, setMessages] = useState([]);
   const [dmInput, setDmInput] = useState("");
   const [newDmUser, setNewDmUser] = useState("");
   const [searchResults, setSearchResults] = useState([]);
   const messagesEndRef = useRef(null);
 
   const displayName = profile?.username || user?.displayName || user?.email?.split("@")[0] || "Anonymous";
   const avatarUrl = profile?.avatarUrl || `https://api.dicebear.com/7.x/personas/svg?seed=${uid}`;
 
   // ── Load profile ──
   useEffect(() => {
     if (!uid) return;
     const ref = doc(db, "users", uid);
     const unsub = onSnapshot(ref, async (snap) => {
       if (snap.exists()) {
         setProfile(snap.data());
       } else {
         const defaultProfile = {
           uid,
           username: user?.displayName || user?.email?.split("@")[0] || "user",
           bio: "",
           book: "",
           avatarUrl: `https://api.dicebear.com/7.x/personas/svg?seed=${uid}`,
           followers: [],
           following: [],
           createdAt: new Date().toISOString(),
         };
         await setDoc(ref, defaultProfile);
         setProfile(defaultProfile);
       }
     });
     return () => unsub();
   }, [uid]);
 
   // ── Load thoughts ──
   useEffect(() => {
     if (!uid) return;
     const q = query(collection(db, "thoughts"), where("authorId", "==", uid), orderBy("createdAt", "desc"));
     return onSnapshot(q, (snap) => setMyThoughts(snap.docs.map((d) => ({ id: d.id, ...d.data() }))));
   }, [uid]);
 
   // ── Load studio posts ──
   useEffect(() => {
     if (!uid) return;
     const q = query(collection(db, "studio_posts"), where("authorId", "==", uid), orderBy("createdAt", "desc"));
     return onSnapshot(q, (snap) => setMyPosts(snap.docs.map((d) => ({ id: d.id, ...d.data() }))));
   }, [uid]);
 
   // ── Load conversations ──
   useEffect(() => {
     if (!uid || !showDMs) return;
     const q = query(collection(db, "conversations"), where("participants", "array-contains", uid), orderBy("lastMessageAt", "desc"));
     return onSnapshot(q, (snap) => setConversations(snap.docs.map((d) => ({ id: d.id, ...d.data() }))));
   }, [uid, showDMs]);
 
   // ── Load messages ──
   useEffect(() => {
     if (!activeConvo) return;
     const q = query(collection(db, "conversations", activeConvo.id, "messages"), orderBy("createdAt", "asc"));
     return onSnapshot(q, (snap) => {
       setMessages(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
       setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
     });
   }, [activeConvo]);
 
   // ── Open edit panel ──
   const openEdit = () => {
     setEditBio(profile?.bio || "");
     setEditUsername(profile?.username || displayName);
     setEditBook(profile?.book || "");
     setEditAvatar(null);
     setEditAvatarPreview(null);
     setSaveError("");
     setEditMode(true);
   };
 
   // ── FIXED: Save profile — photo upload is optional ──
   const handleSaveProfile = async () => {
     if (!uid) return;
     setSavingProfile(true);
     setSaveError("");
 
     try {
       // Start with existing avatar URL — only update if user chose a new photo
       let newAvatarUrl = profile?.avatarUrl || `https://api.dicebear.com/7.x/personas/svg?seed=${uid}`;
 
       if (editAvatar) {
         // Only try Cloudinary if user actually picked a new photo
         if (CLOUDINARY_CLOUD_NAME === "your_cloud_name") {
           setSaveError("Cloudinary not configured — bio and username saved, but photo was skipped.");
           // Don't return — still save the rest of the profile below
         } else {
           try {
             const formData = new FormData();
             formData.append("file", editAvatar);
             formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);
             formData.append("folder", "shvaas_avatars");
             const res = await fetch(
               `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
               { method: "POST", body: formData }
             );
             const data = await res.json();
             if (data.secure_url) {
               newAvatarUrl = data.secure_url;
             } else {
               setSaveError("Photo upload failed — bio saved. Check Cloudinary config.");
             }
           } catch {
             setSaveError("Photo upload failed — bio saved. Check internet/Cloudinary config.");
           }
         }
       }
 
       // ✅ Always save text fields to Firestore regardless of photo outcome
       const updated = {
         ...profile,
         uid,
         username: editUsername.trim() || profile?.username || displayName,
         bio: editBio.trim(),
         book: editBook.trim(),
         avatarUrl: newAvatarUrl,
         updatedAt: new Date().toISOString(),
       };
 
       await setDoc(doc(db, "users", uid), updated, { merge: true });
 
       // Update Firebase Auth display name
       if (editUsername.trim() && editUsername.trim() !== user?.displayName) {
         await updateProfile(user, { displayName: editUsername.trim() });
       }
 
       setEditMode(false);
       setEditAvatar(null);
       setEditAvatarPreview(null);
     } catch (e) {
       console.error("Save error:", e);
       setSaveError("Something went wrong. Please try again.");
     }
 
     setSavingProfile(false);
   };
 
   // ── Search users for DM ──
   const handleSearchUsers = async (val) => {
     setNewDmUser(val);
     if (!val.trim()) return setSearchResults([]);
     const snap = await getDocs(collection(db, "users"));
     const results = snap.docs
       .map((d) => d.data())
       .filter((u) => u.uid !== uid && u.username?.toLowerCase().includes(val.toLowerCase()));
     setSearchResults(results);
   };
 
   // ── Start conversation ──
   const startConversation = async (otherUser) => {
     const convoId = [uid, otherUser.uid].sort().join("_");
     const convoRef = doc(db, "conversations", convoId);
     const snap = await getDoc(convoRef);
     if (!snap.exists()) {
       await setDoc(convoRef, {
         participants: [uid, otherUser.uid],
         participantNames: { [uid]: displayName, [otherUser.uid]: otherUser.username },
         participantAvatars: { [uid]: avatarUrl, [otherUser.uid]: otherUser.avatarUrl || `https://api.dicebear.com/7.x/personas/svg?seed=${otherUser.uid}` },
         lastMessage: "",
         lastMessageAt: serverTimestamp(),
       });
     }
     const freshSnap = await getDoc(convoRef);
     setActiveConvo({ id: convoId, ...freshSnap.data() });
     setNewDmUser("");
     setSearchResults([]);
   };
 
   // ── Send DM ──
   const sendMessage = async () => {
     if (!dmInput.trim() || !activeConvo) return;
     const text = dmInput.trim();
     setDmInput("");
     await addDoc(collection(db, "conversations", activeConvo.id, "messages"), {
       text, senderId: uid, senderName: displayName, createdAt: serverTimestamp(),
     });
     await updateDoc(doc(db, "conversations", activeConvo.id), {
       lastMessage: text, lastMessageAt: serverTimestamp(),
     });
   };
 
   const otherParticipantId = (convo) => convo.participants?.find((p) => p !== uid);
   const otherName = (convo) => convo.participantNames?.[otherParticipantId(convo)] || "User";
   const otherAvatar = (convo) => convo.participantAvatars?.[otherParticipantId(convo)] || `https://api.dicebear.com/7.x/personas/svg?seed=${otherParticipantId(convo)}`;
 
   const formatTime = (ts) => {
     if (!ts) return "";
     const d = ts.toDate ? ts.toDate() : new Date(ts);
     const diff = Math.floor((Date.now() - d) / 1000);
     if (diff < 60) return "now";
     if (diff < 3600) return `${Math.floor(diff / 60)}m`;
     if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
     return d.toLocaleDateString();
   };
 
   return (
     <>
       <style>{`
         @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap');
         * { box-sizing: border-box; margin: 0; padding: 0; }
 
         .pf-page { font-family: 'Plus Jakarta Sans', sans-serif; background: #0a1628; min-height: 100vh; color: #e8f0e8; }
 
         .pf-nav { display: flex; justify-content: space-between; align-items: center; padding: 16px 28px; position: sticky; top: 0; z-index: 50; background: rgba(10,22,40,0.92); backdrop-filter: blur(16px); border-bottom: 1px solid rgba(255,255,255,0.05); }
         .pf-logo { font-size: 1.3rem; font-weight: 800; color: #e8f0e8; }
         .pf-nav-right { display: flex; gap: 10px; align-items: center; }
         .pf-icon-btn { background: rgba(255,255,255,0.08); border: none; border-radius: 9999px; width: 38px; height: 38px; color: #e8f0e8; cursor: pointer; display: flex; align-items: center; justify-content: center; font-size: 1.1rem; transition: all 0.2s; }
         .pf-icon-btn:hover { background: rgba(255,255,255,0.15); }
         .pf-logout-btn { background: transparent; border: 1px solid rgba(255,255,255,0.18); color: #a8b8a8; padding: 7px 16px; border-radius: 9999px; font-family: 'Plus Jakarta Sans', sans-serif; font-weight: 600; font-size: 0.8rem; cursor: pointer; transition: all 0.2s; }
         .pf-logout-btn:hover { background: rgba(255,255,255,0.08); color: white; }
 
         .pf-hero { padding: 36px 28px 0; display: flex; gap: 32px; align-items: flex-start; flex-wrap: wrap; }
         .pf-left { flex: 1; min-width: 260px; }
         .pf-username { font-size: 2rem; font-weight: 800; color: #fff; margin-bottom: 14px; letter-spacing: -0.02em; }
         .pf-bio { background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.08); border-radius: 1rem; padding: 16px 20px; font-size: 0.95rem; color: #a8b8a8; line-height: 1.65; font-style: italic; margin-bottom: 12px; min-height: 60px; }
         .pf-book-badge { display: flex; align-items: center; gap: 10px; background: rgba(169,202,237,0.08); border: 1px solid rgba(169,202,237,0.18); border-radius: 0.875rem; padding: 10px 16px; margin-bottom: 20px; }
         .pf-book-label { font-size: 0.72rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.1em; color: #7a8a7a; white-space: nowrap; }
         .pf-book-title { font-size: 0.9rem; font-weight: 700; color: #a9caed; font-style: italic; }
 
         .pf-actions { display: flex; gap: 10px; flex-wrap: wrap; }
         .pf-btn { padding: 10px 22px; border-radius: 9999px; font-family: 'Plus Jakarta Sans', sans-serif; font-weight: 700; font-size: 0.875rem; cursor: pointer; transition: all 0.2s; border: 1px solid rgba(255,255,255,0.15); background: rgba(255,255,255,0.07); color: #d8e8d8; }
         .pf-btn:hover { background: rgba(255,255,255,0.14); color: white; }
         .pf-edit-btn { padding: 10px 22px; border-radius: 9999px; background: linear-gradient(135deg, #1e3a56, #122840); color: #a9caed; border: 1px solid rgba(169,202,237,0.25); font-family: 'Plus Jakarta Sans', sans-serif; font-weight: 700; font-size: 0.875rem; cursor: pointer; transition: all 0.2s; }
         .pf-edit-btn:hover { background: linear-gradient(135deg, #2a4a6a, #1a3450); }
 
         .pf-right { display: flex; flex-direction: column; align-items: center; gap: 20px; }
         .pf-avatar-wrap { position: relative; cursor: pointer; }
         .pf-avatar { width: 110px; height: 110px; border-radius: 9999px; border: 3px solid rgba(169,202,237,0.35); overflow: hidden; background: #1a2a40; }
         .pf-avatar img { width: 100%; height: 100%; object-fit: cover; }
         .pf-avatar-badge { position: absolute; bottom: 4px; right: 4px; background: #2a4a6a; border: 2px solid #0a1628; border-radius: 9999px; width: 28px; height: 28px; display: flex; align-items: center; justify-content: center; font-size: 0.8rem; }
         .pf-stats { display: flex; gap: 28px; }
         .pf-stat { text-align: center; cursor: pointer; transition: transform 0.2s; }
         .pf-stat:hover { transform: scale(1.06); }
         .pf-stat-num { font-size: 1.4rem; font-weight: 800; color: #fff; }
         .pf-stat-label { font-size: 0.7rem; color: #7a8a7a; text-transform: uppercase; letter-spacing: 0.08em; margin-top: 2px; }
 
         /* EDIT PANEL */
         .edit-panel { margin: 20px 28px 0; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.09); border-radius: 1.5rem; padding: 24px; }
         .edit-panel h3 { font-size: 1rem; font-weight: 700; color: #a9caed; margin-bottom: 18px; }
         .edit-avatar-row { display: flex; align-items: center; gap: 14px; margin-bottom: 16px; }
         .edit-avatar-preview { width: 52px; height: 52px; border-radius: 9999px; overflow: hidden; background: #1a2a40; flex-shrink: 0; border: 2px solid rgba(169,202,237,0.25); }
         .edit-avatar-preview img { width: 100%; height: 100%; object-fit: cover; }
         .edit-avatar-btn { padding: 8px 18px; border-radius: 9999px; background: rgba(255,255,255,0.07); color: #a9caed; border: 1px solid rgba(169,202,237,0.2); font-family: 'Plus Jakarta Sans', sans-serif; font-size: 0.82rem; font-weight: 600; cursor: pointer; transition: all 0.2s; }
         .edit-avatar-btn:hover { background: rgba(255,255,255,0.12); }
         .edit-input { width: 100%; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 0.875rem; padding: 12px 16px; font-family: 'Plus Jakarta Sans', sans-serif; font-size: 0.9rem; color: #e8f0e8; outline: none; margin-bottom: 10px; transition: border 0.2s; }
         .edit-input:focus { border-color: rgba(169,202,237,0.45); }
         .edit-input::placeholder { color: #5a6a5a; }
         .edit-textarea { resize: vertical; min-height: 80px; }
         .edit-book-wrap { position: relative; margin-bottom: 10px; }
         .edit-book-label { font-size: 0.72rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; color: #7a8a7a; margin-bottom: 6px; display: flex; align-items: center; gap: 6px; }
         .edit-actions { display: flex; gap: 10px; margin-top: 6px; }
         .edit-save-btn { padding: 11px 28px; border-radius: 9999px; background: linear-gradient(135deg, #2a4a6a, #1a3450); color: #a9caed; border: 1px solid rgba(169,202,237,0.3); font-family: 'Plus Jakarta Sans', sans-serif; font-weight: 700; font-size: 0.9rem; cursor: pointer; transition: all 0.2s; }
         .edit-save-btn:disabled { opacity: 0.55; cursor: not-allowed; }
         .edit-save-btn:not(:disabled):hover { background: linear-gradient(135deg, #3a5a7a, #2a4460); }
         .edit-cancel-btn { padding: 11px 22px; border-radius: 9999px; background: transparent; color: #7a8a7a; border: 1px solid rgba(255,255,255,0.1); font-family: 'Plus Jakarta Sans', sans-serif; font-weight: 600; font-size: 0.9rem; cursor: pointer; transition: all 0.2s; }
         .edit-cancel-btn:hover { background: rgba(255,255,255,0.05); color: #a8b8a8; }
         .save-error { font-size: 0.8rem; color: #e57373; margin-top: 10px; background: rgba(229,115,115,0.08); border-radius: 0.5rem; padding: 8px 12px; }
         .save-success { font-size: 0.8rem; color: #81c784; margin-top: 10px; background: rgba(129,199,132,0.08); border-radius: 0.5rem; padding: 8px 12px; }
 
         /* TABS */
         .pf-tabs { display: flex; justify-content: center; gap: 8px; padding: 32px 28px 0; }
         .pf-tab { padding: 10px 28px; border-radius: 9999px; font-family: 'Plus Jakarta Sans', sans-serif; font-weight: 600; font-size: 0.9rem; cursor: pointer; border: none; transition: all 0.2s; display: flex; align-items: center; gap: 8px; }
         .pf-tab.active { background: rgba(255,255,255,0.1); color: white; border: 1px solid rgba(255,255,255,0.12); }
         .pf-tab.inactive { background: transparent; color: #7a8a7a; border: 1px solid transparent; }
         .pf-tab.inactive:hover { background: rgba(255,255,255,0.05); color: #a8b8a8; }
 
         .pf-content { padding: 20px 28px 80px; }
         .pf-empty { text-align: center; padding: 60px 20px; color: #7a8a7a; }
         .pf-empty .emoji { font-size: 2.5rem; margin-bottom: 12px; }
         .pf-empty p { font-size: 0.95rem; }
 
         .thought-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 16px; }
         .thought-card { background: rgba(255,255,255,0.04); border-radius: 1.25rem; padding: 20px; border: 1px solid rgba(255,255,255,0.07); transition: all 0.3s; }
         .thought-card:hover { background: rgba(255,255,255,0.07); border-color: rgba(255,255,255,0.12); }
         .thought-tag { font-size: 0.65rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.12em; color: #7a8a7a; margin-bottom: 10px; display: flex; justify-content: space-between; }
         .thought-text { font-size: 1rem; color: #d8e8d8; line-height: 1.65; margin-bottom: 16px; }
         .thought-stats { display: flex; gap: 16px; font-size: 0.82rem; color: #7a8a7a; }
 
         .studio-grid { columns: 2; gap: 10px; }
         @media (min-width: 600px) { .studio-grid { columns: 3; } }
         .studio-item { break-inside: avoid; margin-bottom: 10px; border-radius: 0.875rem; overflow: hidden; background: #1a2a40; }
         .studio-item img, .studio-item video { width: 100%; display: block; border-radius: 0.875rem; }
 
         /* MODALS */
         .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.72); z-index: 200; display: flex; align-items: center; justify-content: center; padding: 20px; backdrop-filter: blur(8px); }
         .modal-box { background: #0f1e32; border: 1px solid rgba(255,255,255,0.1); border-radius: 1.5rem; width: 100%; max-width: 380px; max-height: 75vh; overflow-y: auto; padding: 24px; }
         .modal-box h3 { font-size: 1.05rem; font-weight: 800; color: #fff; margin-bottom: 16px; display: flex; justify-content: space-between; align-items: center; }
         .modal-close { background: none; border: none; color: #7a8a7a; font-size: 1.1rem; cursor: pointer; }
         .user-item { display: flex; align-items: center; gap: 12px; padding: 10px 0; border-bottom: 1px solid rgba(255,255,255,0.06); }
         .user-item:last-child { border-bottom: none; }
         .user-avatar-sm { width: 36px; height: 36px; border-radius: 9999px; overflow: hidden; background: #1a2a40; flex-shrink: 0; }
         .user-avatar-sm img { width: 100%; height: 100%; object-fit: cover; }
         .user-item-name { font-weight: 600; color: #d8e8d8; font-size: 0.875rem; }
 
         /* DM PANEL */
         .dm-panel { position: fixed; top: 0; right: 0; width: 360px; height: 100vh; background: #0d1a2e; border-left: 1px solid rgba(255,255,255,0.07); z-index: 150; display: flex; flex-direction: column; box-shadow: -8px 0 48px rgba(0,0,0,0.5); }
         .dm-header { padding: 16px 20px; border-bottom: 1px solid rgba(255,255,255,0.07); display: flex; justify-content: space-between; align-items: center; flex-shrink: 0; }
         .dm-title { font-weight: 800; color: #fff; font-size: 1rem; }
         .dm-close { background: none; border: none; color: #7a8a7a; cursor: pointer; font-size: 1.1rem; }
         .dm-search { padding: 12px 16px; border-bottom: 1px solid rgba(255,255,255,0.05); flex-shrink: 0; }
         .dm-search input { width: 100%; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 9999px; padding: 9px 16px; font-family: 'Plus Jakarta Sans', sans-serif; font-size: 0.85rem; color: #e8f0e8; outline: none; }
         .dm-search input::placeholder { color: #7a8a7a; }
         .search-results { background: #0a1628; border: 1px solid rgba(255,255,255,0.1); border-radius: 1rem; margin-top: 8px; overflow: hidden; }
         .search-result-item { padding: 10px 14px; display: flex; align-items: center; gap: 10px; cursor: pointer; transition: background 0.2s; }
         .search-result-item:hover { background: rgba(255,255,255,0.06); }
         .dm-list { flex: 1; overflow-y: auto; }
         .convo-item { padding: 13px 20px; display: flex; align-items: center; gap: 12px; cursor: pointer; border-bottom: 1px solid rgba(255,255,255,0.04); transition: background 0.2s; }
         .convo-item:hover { background: rgba(255,255,255,0.05); }
         .convo-avatar { width: 40px; height: 40px; border-radius: 9999px; overflow: hidden; background: #1a2a40; flex-shrink: 0; }
         .convo-avatar img { width: 100%; height: 100%; object-fit: cover; }
         .convo-name { font-weight: 700; color: #d8e8d8; font-size: 0.875rem; }
         .convo-preview { font-size: 0.78rem; color: #7a8a7a; margin-top: 2px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 210px; }
         .convo-time { font-size: 0.72rem; color: #7a8a7a; margin-left: auto; flex-shrink: 0; }
         .dm-empty { padding: 40px 20px; text-align: center; color: #7a8a7a; font-size: 0.875rem; line-height: 1.6; }
 
         /* CHAT VIEW */
         .chat-view { display: flex; flex-direction: column; height: 100%; }
         .chat-header { padding: 13px 16px; border-bottom: 1px solid rgba(255,255,255,0.07); display: flex; align-items: center; gap: 10px; flex-shrink: 0; }
         .chat-back { background: none; border: none; color: #a9caed; cursor: pointer; font-size: 0.9rem; padding: 5px 10px; border-radius: 9999px; font-family: 'Plus Jakarta Sans', sans-serif; font-weight: 600; }
         .chat-back:hover { background: rgba(255,255,255,0.07); }
         .chat-partner-name { font-weight: 700; color: #fff; font-size: 0.95rem; }
         .chat-messages { flex: 1; overflow-y: auto; padding: 16px; display: flex; flex-direction: column; gap: 10px; }
         .msg-wrap { display: flex; }
         .msg-wrap.mine { justify-content: flex-end; }
         .msg-bubble { max-width: 76%; padding: 10px 14px; border-radius: 1.25rem; font-size: 0.875rem; line-height: 1.5; }
         .msg-bubble.mine { background: linear-gradient(135deg, #2a4a6a, #1a3450); color: #a9caed; border-bottom-right-radius: 4px; }
         .msg-bubble.theirs { background: rgba(255,255,255,0.07); color: #d8e8d8; border-bottom-left-radius: 4px; }
         .chat-input-row { padding: 12px 14px; border-top: 1px solid rgba(255,255,255,0.07); display: flex; gap: 8px; align-items: center; flex-shrink: 0; }
         .chat-input { flex: 1; background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.1); border-radius: 9999px; padding: 10px 16px; font-family: 'Plus Jakarta Sans', sans-serif; font-size: 0.875rem; color: #e8f0e8; outline: none; }
         .chat-input::placeholder { color: #7a8a7a; }
         .chat-send { background: #2a4a6a; border: none; border-radius: 9999px; width: 36px; height: 36px; display: flex; align-items: center; justify-content: center; cursor: pointer; color: #a9caed; font-size: 1rem; flex-shrink: 0; transition: all 0.2s; }
         .chat-send:hover { background: #3a5a7a; }
       `}</style>
 
       <div className="pf-page">
 
         {/* NAVBAR */}
         <nav className="pf-nav">
           <div className="pf-logo">🪷 श्वास</div>
           <div className="pf-nav-right">
             <button className="pf-icon-btn" title="Messages" onClick={() => setShowDMs(true)}>💬</button>
             <button className="pf-logout-btn" onClick={() => { signOut(auth); navigate("/"); }}>Logout</button>
           </div>
         </nav>
 
         {/* HERO */}
         <div className="pf-hero">
           <div className="pf-left">
             <div className="pf-username">@{displayName}</div>
 
             {/* BIO */}
             <div className="pf-bio">
               {profile?.bio || "No bio yet. Click Edit Profile to add one ✨"}
             </div>
 
             {/* BOOK RECOMMENDATION */}
             {profile?.book && (
               <div className="pf-book-badge">
                 <span style={{ fontSize: "1.2rem" }}>📚</span>
                 <span className="pf-book-label">Go Read This:</span>
                 <span className="pf-book-title">"{profile.book}"</span>
               </div>
             )}
 
             <div className="pf-actions">
               <button className="pf-btn" onClick={() => setShowDMs(true)}>💬 Message</button>
               <button className="pf-edit-btn" onClick={openEdit}>✏️ Edit Profile</button>
             </div>
           </div>
 
           <div className="pf-right">
             <div className="pf-avatar-wrap">
               <div className="pf-avatar">
                 <img src={editAvatarPreview || avatarUrl} alt="avatar" />
               </div>
               {editMode && <div className="pf-avatar-badge">📷</div>}
             </div>
             <div className="pf-stats">
               <div className="pf-stat" onClick={() => setShowFollowers(true)}>
                 <div className="pf-stat-num">{profile?.followers?.length || 0}</div>
                 <div className="pf-stat-label">Followers</div>
               </div>
               <div className="pf-stat" onClick={() => setShowFollowing(true)}>
                 <div className="pf-stat-num">{profile?.following?.length || 0}</div>
                 <div className="pf-stat-label">Following</div>
               </div>
             </div>
           </div>
         </div>
 
         {/* EDIT PANEL */}
         {editMode && (
           <div className="edit-panel">
             <h3>✏️ Edit Profile</h3>
 
             <div className="edit-avatar-row">
               <div className="edit-avatar-preview">
                 <img src={editAvatarPreview || avatarUrl} alt="preview" />
               </div>
               <button className="edit-avatar-btn" onClick={() => avatarInputRef.current?.click()}>
                 📷 Change Photo
               </button>
               <input
                 ref={avatarInputRef}
                 type="file"
                 accept="image/*"
                 style={{ display: "none" }}
                 onChange={(e) => {
                   const f = e.target.files[0];
                   if (f) { setEditAvatar(f); setEditAvatarPreview(URL.createObjectURL(f)); }
                 }}
               />
             </div>
 
             <input
               className="edit-input"
               placeholder="Username"
               value={editUsername}
               onChange={(e) => setEditUsername(e.target.value)}
             />
 
             <textarea
               className="edit-input edit-textarea"
               placeholder="Write your bio..."
               value={editBio}
               onChange={(e) => setEditBio(e.target.value)}
             />
 
             {/* BOOK RECOMMENDATION */}
             <div className="edit-book-wrap">
               <div className="edit-book-label">📚 Recommend a book (optional)</div>
               <input
                 className="edit-input"
                 placeholder='e.g. "The Alchemist" by Paulo Coelho'
                 value={editBook}
                 onChange={(e) => setEditBook(e.target.value)}
                 style={{ marginBottom: 0 }}
               />
             </div>
 
             {saveError && <div className="save-error">⚠️ {saveError}</div>}
 
             <div className="edit-actions">
               <button className="edit-save-btn" onClick={handleSaveProfile} disabled={savingProfile}>
                 {savingProfile ? "Saving..." : "✓ Save Changes"}
               </button>
               <button className="edit-cancel-btn" onClick={() => { setEditMode(false); setEditAvatarPreview(null); setSaveError(""); }}>
                 Cancel
               </button>
             </div>
           </div>
         )}
 
         {/* TABS */}
         <div className="pf-tabs">
           <button className={`pf-tab ${activeTab === "thoughts" ? "active" : "inactive"}`} onClick={() => setActiveTab("thoughts")}>
             🌊 Pond of Thoughts
           </button>
           <button className={`pf-tab ${activeTab === "studio" ? "active" : "inactive"}`} onClick={() => setActiveTab("studio")}>
             ✨ Shvaas Studio
           </button>
         </div>
 
         {/* CONTENT */}
         <div className="pf-content">
           {activeTab === "thoughts" && (
             myThoughts.length === 0
               ? <div className="pf-empty"><div className="emoji">🌊</div><p>No thoughts posted yet.</p></div>
               : <div className="thought-grid">
                   {myThoughts.map((t) => (
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
             myPosts.length === 0
               ? <div className="pf-empty"><div className="emoji">🎨</div><p>No studio posts yet.</p></div>
               : <div className="studio-grid">
                   {myPosts.map((p) => (
                     <div className="studio-item" key={p.id}>
                       {p.isVideo
                         ? <video src={p.mediaUrl} muted playsInline style={{ width: "100%" }} />
                         : <img src={p.mediaUrl} alt={p.caption || "post"} loading="lazy" />}
                     </div>
                   ))}
                 </div>
           )}
         </div>
 
         {/* FOLLOWERS MODAL */}
         {showFollowers && (
           <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setShowFollowers(false)}>
             <div className="modal-box">
               <h3>Followers <button className="modal-close" onClick={() => setShowFollowers(false)}>✕</button></h3>
               {(profile?.followers || []).length === 0
                 ? <p style={{ color: "#7a8a7a", fontSize: "0.875rem" }}>No followers yet.</p>
                 : (profile.followers).map((fuid) => (
                   <div className="user-item" key={fuid}>
                     <div className="user-avatar-sm"><img src={`https://api.dicebear.com/7.x/personas/svg?seed=${fuid}`} alt="user" /></div>
                     <div className="user-item-name">@{fuid}</div>
                   </div>
                 ))}
             </div>
           </div>
         )}
 
         {/* FOLLOWING MODAL */}
         {showFollowing && (
           <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setShowFollowing(false)}>
             <div className="modal-box">
               <h3>Following <button className="modal-close" onClick={() => setShowFollowing(false)}>✕</button></h3>
               {(profile?.following || []).length === 0
                 ? <p style={{ color: "#7a8a7a", fontSize: "0.875rem" }}>Not following anyone yet.</p>
                 : (profile.following).map((fuid) => (
                   <div className="user-item" key={fuid}>
                     <div className="user-avatar-sm"><img src={`https://api.dicebear.com/7.x/personas/svg?seed=${fuid}`} alt="user" /></div>
                     <div className="user-item-name">@{fuid}</div>
                   </div>
                 ))}
             </div>
           </div>
         )}
 
         {/* DM PANEL */}
         {showDMs && (
           <div className="dm-panel">
             {!activeConvo ? (
               <>
                 <div className="dm-header">
                   <span className="dm-title">💬 Messages</span>
                   <button className="dm-close" onClick={() => setShowDMs(false)}>✕</button>
                 </div>
                 <div className="dm-search">
                   <input placeholder="Search user to message..." value={newDmUser} onChange={(e) => handleSearchUsers(e.target.value)} />
                   {searchResults.length > 0 && (
                     <div className="search-results">
                       {searchResults.map((u) => (
                         <div className="search-result-item" key={u.uid} onClick={() => startConversation(u)}>
                           <div className="user-avatar-sm"><img src={u.avatarUrl || `https://api.dicebear.com/7.x/personas/svg?seed=${u.uid}`} alt={u.username} /></div>
                           <span style={{ color: "#d8e8d8", fontSize: "0.875rem", fontWeight: 600 }}>@{u.username}</span>
                         </div>
                       ))}
                     </div>
                   )}
                 </div>
                 <div className="dm-list">
                   {conversations.length === 0
                     ? <div className="dm-empty">No conversations yet.<br />Search a username above to start chatting 💬</div>
                     : conversations.map((c) => (
                       <div className="convo-item" key={c.id} onClick={() => setActiveConvo(c)}>
                         <div className="convo-avatar"><img src={otherAvatar(c)} alt={otherName(c)} /></div>
                         <div style={{ flex: 1, overflow: "hidden" }}>
                           <div className="convo-name">@{otherName(c)}</div>
                           <div className="convo-preview">{c.lastMessage || "Say hello 👋"}</div>
                         </div>
                         <div className="convo-time">{formatTime(c.lastMessageAt)}</div>
                       </div>
                     ))}
                 </div>
               </>
             ) : (
               <div className="chat-view">
                 <div className="chat-header">
                   <button className="chat-back" onClick={() => setActiveConvo(null)}>← Back</button>
                   <div className="convo-avatar"><img src={otherAvatar(activeConvo)} alt={otherName(activeConvo)} /></div>
                   <span className="chat-partner-name">@{otherName(activeConvo)}</span>
                 </div>
                 <div className="chat-messages">
                   {messages.length === 0 && (
                     <div style={{ textAlign: "center", color: "#7a8a7a", fontSize: "0.82rem", padding: "24px" }}>Send the first message 👋</div>
                   )}
                   {messages.map((m) => (
                     <div className={`msg-wrap ${m.senderId === uid ? "mine" : ""}`} key={m.id}>
                       <div className={`msg-bubble ${m.senderId === uid ? "mine" : "theirs"}`}>{m.text}</div>
                     </div>
                   ))}
                   <div ref={messagesEndRef} />
                 </div>
                 <div className="chat-input-row">
                   <input className="chat-input" placeholder="Type a message..." value={dmInput} onChange={(e) => setDmInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && sendMessage()} />
                   <button className="chat-send" onClick={sendMessage}>➤</button>
                 </div>
               </div>
             )}
           </div>
         )}
       </div>
     </>
   );
 };
 
 export default Profile;
 