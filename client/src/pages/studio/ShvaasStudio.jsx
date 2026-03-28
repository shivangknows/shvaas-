import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { auth, db } from "../../firebase/config";
import ProfileIcon from "../../components/ProfileIcon";
import { signOut } from "firebase/auth";
import {
  collection, addDoc, onSnapshot, updateDoc, deleteDoc,
  doc, arrayUnion, arrayRemove, orderBy, query, serverTimestamp,
} from "firebase/firestore";

// 🔧 REPLACE THESE WITH YOUR CLOUDINARY DETAILS
const CLOUDINARY_CLOUD_NAME = "demfthap2";
const CLOUDINARY_UPLOAD_PRESET = "izkf5cf2"; // unsigned preset

const CATEGORIES = ["All", "Mindful Art", "Photography", "Nature", "Meditation"];

const ShvaasStudio = () => {
  const navigate = useNavigate();
  const user = auth.currentUser;
  const displayName = user?.displayName || user?.email?.split("@")[0] || "Anonymous";
  const userAvatar = `https://api.dicebear.com/7.x/personas/svg?seed=${user?.uid}`;

  const [posts, setPosts] = useState([]);
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  const [selectedPost, setSelectedPost] = useState(null);
  const [commentInput, setCommentInput] = useState("");

  const [showUpload, setShowUpload] = useState(false);
  const [uploadFile, setUploadFile] = useState(null);
  const [uploadPreview, setUploadPreview] = useState(null);
  const [uploadCaption, setUploadCaption] = useState("");
  const [uploadCategory, setUploadCategory] = useState("Photography");
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef(null);

  // 🔥 Real-time listener from Firestore
  useEffect(() => {
    const q = query(collection(db, "studio_posts"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, (snap) => {
      setPosts(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
    return () => unsub();
  }, []);

  const filtered = posts.filter((p) => {
    const matchCat = activeCategory === "All" || p.category === activeCategory;
    const matchSearch = !search ||
      p.authorName?.toLowerCase().includes(search.toLowerCase()) ||
      p.caption?.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploadFile(file);
    setUploadPreview(URL.createObjectURL(file));
  };

  // ☁️ Upload to Cloudinary → save URL to Firestore
  const handleUpload = async () => {
    if (!uploadFile || uploading) return;
    setUploading(true);
    setUploadProgress(0);
    try {
      const isVideo = uploadFile.type.startsWith("video/");
      const formData = new FormData();
      formData.append("file", uploadFile);
      formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);
      formData.append("folder", "shvaas_studio");

      const mediaUrl = await new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        const resourceType = isVideo ? "video" : "image";
        xhr.open("POST", `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/${resourceType}/upload`);
        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) setUploadProgress(Math.round((e.loaded / e.total) * 100));
        };
        xhr.onload = () => {
          const res = JSON.parse(xhr.responseText);
          if (res.secure_url) resolve(res.secure_url);
          else reject(new Error("Upload failed: " + JSON.stringify(res)));
        };
        xhr.onerror = () => reject(new Error("Network error"));
        xhr.send(formData);
      });

      // Save only metadata + Cloudinary URL to Firestore
      await addDoc(collection(db, "studio_posts"), {
        mediaUrl,
        isVideo,
        caption: uploadCaption.trim(),
        category: uploadCategory,
        authorId: user.uid,
        authorName: displayName,
        authorAvatar: userAvatar,
        likes: [],
        comments: [],
        createdAt: serverTimestamp(),
      });

      setShowUpload(false);
      setUploadFile(null);
      setUploadPreview(null);
      setUploadCaption("");
      setUploadProgress(0);
    } catch (e) {
      alert("Upload failed. Check your Cloudinary cloud name and upload preset.");
      console.error(e);
    }
    setUploading(false);
  };

  const handleLike = async (post, e) => {
    e?.stopPropagation();
    const liked = post.likes?.includes(user.uid);
    await updateDoc(doc(db, "studio_posts", post.id), {
      likes: liked ? arrayRemove(user.uid) : arrayUnion(user.uid),
    });
    if (selectedPost?.id === post.id) {
      setSelectedPost((p) => ({
        ...p,
        likes: liked ? p.likes.filter((id) => id !== user.uid) : [...(p.likes || []), user.uid],
      }));
    }
  };

  const handleComment = async () => {
    if (!commentInput.trim() || !selectedPost) return;
    const comment = { uid: user.uid, name: displayName, avatar: userAvatar, text: commentInput.trim(), createdAt: new Date().toISOString() };
    await updateDoc(doc(db, "studio_posts", selectedPost.id), { comments: arrayUnion(comment) });
    setSelectedPost((p) => ({ ...p, comments: [...(p.comments || []), comment] }));
    setCommentInput("");
  };

  // 🗑️ Delete removes Firestore doc (Cloudinary URL becomes orphaned — fine for free tier)
  const handleDelete = async (post, e) => {
    e?.stopPropagation();
    if (!window.confirm("Delete this post permanently?")) return;
    try {
      await deleteDoc(doc(db, "studio_posts", post.id));
      if (selectedPost?.id === post.id) setSelectedPost(null);
    } catch (e) { console.error(e); }
  };

  const formatTime = (ts) => {
    if (!ts) return "Just now";
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
        .st-page { font-family: 'Plus Jakarta Sans', sans-serif; background: #f4fbf4; min-height: 100vh; color: #161d19; padding-bottom: 100px; }
        .st-nav { position: sticky; top: 0; z-index: 50; background: rgba(236,250,236,0.85); backdrop-filter: blur(20px); box-shadow: 0 2px 16px rgba(10,49,77,0.06); padding: 14px 24px; display: flex; align-items: center; justify-content: space-between; gap: 16px; }
        .st-logo { font-size: 1.4rem; font-weight: 800; color: #0a314d; display: flex; align-items: center; gap: 8px; white-space: nowrap; }
        .st-search-wrap { flex: 1; max-width: 440px; position: relative; }
        .st-search-wrap input { width: 100%; background: #fff; border: none; border-radius: 9999px; padding: 10px 16px 10px 40px; font-family: 'Plus Jakarta Sans', sans-serif; font-size: 0.9rem; color: #161d19; outline: none; box-shadow: 0 2px 8px rgba(0,0,0,0.05); }
        .st-search-icon { position: absolute; left: 12px; top: 50%; transform: translateY(-50%); color: #73777e; font-size: 18px; }
        .st-nav-btns { display: flex; gap: 8px; }
        .st-nav-btn { background: transparent; border: 1.5px solid #c3c7ce; color: #42474d; padding: 7px 16px; border-radius: 9999px; font-family: 'Plus Jakarta Sans', sans-serif; font-weight: 600; font-size: 0.8rem; cursor: pointer; transition: all 0.2s; white-space: nowrap; }
        .st-nav-btn:hover { background: #001c30; color: white; border-color: #001c30; }
        .chips-wrap { display: flex; gap: 10px; overflow-x: auto; padding: 16px 24px 8px; scrollbar-width: none; }
        .chips-wrap::-webkit-scrollbar { display: none; }
        .chip { padding: 8px 20px; border-radius: 9999px; font-size: 0.85rem; font-weight: 600; cursor: pointer; border: none; white-space: nowrap; transition: all 0.2s; font-family: 'Plus Jakarta Sans', sans-serif; }
        .chip.active { background: #001c30; color: white; }
        .chip.inactive { background: #c3eac3; color: #486b4c; }
        .chip.inactive:hover { background: #aad0ab; }
        .st-grid { columns: 2; gap: 12px; padding: 12px 24px; }
        @media (min-width: 600px) { .st-grid { columns: 3; } }
        @media (min-width: 900px) { .st-grid { columns: 4; } }
        .st-grid-item { break-inside: avoid; margin-bottom: 12px; position: relative; border-radius: 1rem; overflow: hidden; cursor: pointer; background: #e3eae3; }
        .st-grid-item img, .st-grid-item video { width: 100%; display: block; border-radius: 1rem; transition: transform 0.5s ease; }
        .st-grid-item:hover img, .st-grid-item:hover video { transform: scale(1.04); }
        .st-grid-overlay { position: absolute; inset: 0; background: linear-gradient(to top, rgba(0,0,0,0.5) 0%, transparent 60%); opacity: 0; transition: opacity 0.3s; border-radius: 1rem; display: flex; flex-direction: column; justify-content: flex-end; padding: 12px; }
        .st-grid-item:hover .st-grid-overlay { opacity: 1; }
        .st-overlay-author { color: white; font-size: 0.75rem; font-weight: 600; }
        .st-overlay-likes { color: white; font-size: 0.75rem; display: flex; align-items: center; gap: 4px; }
        .video-badge { position: absolute; top: 10px; left: 10px; background: rgba(0,0,0,0.45); border-radius: 9999px; padding: 3px 8px; color: white; font-size: 0.7rem; display: flex; align-items: center; gap: 3px; }
        .delete-btn { position: absolute; bottom: 8px; right: 8px; background: rgba(186,26,26,0.88); color: white; border: none; border-radius: 9999px; padding: 4px 12px; font-size: 0.7rem; font-weight: 700; cursor: pointer; font-family: 'Plus Jakarta Sans', sans-serif; transition: all 0.2s; z-index: 5; display: none; }
        .st-grid-item:hover .delete-btn { display: block; }
        .delete-btn:hover { background: #ba1a1a; }
        .empty-state { text-align: center; padding: 80px 20px; color: #42474d; }
        .empty-state .emoji { font-size: 3rem; margin-bottom: 16px; }
        .empty-state h3 { font-size: 1.2rem; font-weight: 700; color: #001c30; margin-bottom: 8px; }
        .fab { position: fixed; bottom: 32px; left: 50%; transform: translateX(-50%); z-index: 60; width: 56px; height: 56px; border-radius: 9999px; background: #001c30; color: white; border: none; cursor: pointer; display: flex; align-items: center; justify-content: center; box-shadow: 0 8px 32px rgba(0,28,48,0.35); transition: all 0.2s; }
        .fab:hover { transform: translateX(-50%) scale(1.08); }
        .fab:active { transform: translateX(-50%) scale(0.95); }
        .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.55); z-index: 100; display: flex; align-items: center; justify-content: center; padding: 24px; backdrop-filter: blur(6px); }
        .upload-modal { background: white; border-radius: 2rem; padding: 32px; width: 100%; max-width: 480px; max-height: 90vh; overflow-y: auto; }
        .upload-modal h2 { font-size: 1.4rem; font-weight: 800; color: #001c30; margin-bottom: 20px; }
        .upload-drop { border: 2px dashed #c3eac3; border-radius: 1.5rem; padding: 40px 20px; text-align: center; cursor: pointer; background: #f4fbf4; transition: all 0.2s; margin-bottom: 20px; }
        .upload-drop:hover { border-color: #446648; background: #eef5ee; }
        .upload-preview { width: 100%; border-radius: 1rem; overflow: hidden; margin-bottom: 16px; background: #e3eae3; cursor: pointer; }
        .upload-preview img, .upload-preview video { width: 100%; max-height: 280px; object-fit: cover; display: block; }
        .upload-input { width: 100%; border: 1.5px solid #e3eae3; border-radius: 1rem; padding: 12px 16px; font-family: 'Plus Jakarta Sans', sans-serif; font-size: 0.9rem; color: #161d19; outline: none; margin-bottom: 12px; transition: border 0.2s; }
        .upload-input:focus { border-color: #446648; }
        .upload-select { width: 100%; border: 1.5px solid #e3eae3; border-radius: 1rem; padding: 12px 16px; font-family: 'Plus Jakarta Sans', sans-serif; font-size: 0.9rem; color: #161d19; outline: none; margin-bottom: 20px; background: white; cursor: pointer; }
        .progress-bar-wrap { background: #e3eae3; border-radius: 9999px; height: 8px; margin-bottom: 16px; overflow: hidden; }
        .progress-bar { height: 100%; background: linear-gradient(90deg, #446648, #001c30); border-radius: 9999px; transition: width 0.3s; }
        .upload-actions { display: flex; gap: 12px; }
        .upload-cancel { flex: 1; padding: 14px; border-radius: 9999px; border: 1.5px solid #c3c7ce; background: transparent; color: #42474d; font-family: 'Plus Jakarta Sans', sans-serif; font-weight: 700; cursor: pointer; }
        .upload-cancel:hover { background: #eef5ee; }
        .upload-submit { flex: 1; padding: 14px; border-radius: 9999px; background: linear-gradient(135deg, #001c30, #0a314d); color: white; border: none; font-family: 'Plus Jakarta Sans', sans-serif; font-weight: 700; cursor: pointer; }
        .upload-submit:disabled { opacity: 0.5; cursor: not-allowed; }
        .post-modal { background: white; border-radius: 2rem; width: 100%; max-width: 700px; max-height: 90vh; display: flex; flex-direction: column; overflow: hidden; position: relative; }
        .post-modal-media { background: #000; display: flex; align-items: center; justify-content: center; max-height: 420px; overflow: hidden; flex-shrink: 0; }
        .post-modal-media img { width: 100%; max-height: 420px; object-fit: contain; }
        .post-modal-body { padding: 24px; overflow-y: auto; flex: 1; }
        .post-modal-author { display: flex; align-items: center; gap: 10px; margin-bottom: 12px; }
        .modal-avatar { width: 40px; height: 40px; border-radius: 9999px; overflow: hidden; background: #c6ecc6; }
        .modal-avatar img { width: 100%; height: 100%; object-fit: cover; }
        .modal-author-name { font-weight: 700; color: #001c30; font-size: 0.95rem; }
        .modal-time { font-size: 0.75rem; color: #73777e; }
        .modal-caption { font-size: 1rem; color: #161d19; line-height: 1.6; margin-bottom: 16px; }
        .modal-actions { display: flex; gap: 16px; margin-bottom: 20px; border-bottom: 1px solid #e9f0e9; padding-bottom: 16px; flex-wrap: wrap; }
        .modal-action-btn { background: none; border: none; cursor: pointer; display: flex; align-items: center; gap: 6px; color: #42474d; font-family: 'Plus Jakarta Sans', sans-serif; font-weight: 600; font-size: 0.875rem; padding: 6px 12px; border-radius: 9999px; transition: all 0.2s; }
        .modal-action-btn:hover { background: #eef5ee; color: #001c30; }
        .modal-action-btn.liked { color: #e53935; }
        .modal-comment { display: flex; gap: 10px; margin-bottom: 12px; }
        .comment-avatar-sm { width: 28px; height: 28px; border-radius: 9999px; overflow: hidden; background: #c6ecc6; flex-shrink: 0; }
        .comment-avatar-sm img { width: 100%; height: 100%; object-fit: cover; }
        .comment-bubble { background: #eef5ee; border-radius: 1rem; padding: 8px 14px; flex: 1; }
        .comment-name { font-size: 0.75rem; font-weight: 700; color: #001c30; margin-bottom: 2px; }
        .comment-text { font-size: 0.875rem; color: #161d19; line-height: 1.5; }
        .modal-comment-input { display: flex; gap: 8px; align-items: center; margin-top: 12px; }
        .modal-comment-input input { flex: 1; background: #eef5ee; border: none; outline: none; border-radius: 9999px; padding: 10px 16px; font-family: 'Plus Jakarta Sans', sans-serif; font-size: 0.875rem; color: #161d19; }
        .modal-comment-input input::placeholder { color: #73777e; }
        .send-btn { background: #001c30; border: none; border-radius: 9999px; width: 36px; height: 36px; display: flex; align-items: center; justify-content: center; cursor: pointer; color: white; flex-shrink: 0; }
        .close-btn { position: absolute; top: 12px; right: 12px; background: rgba(0,0,0,0.4); border: none; border-radius: 9999px; width: 36px; height: 36px; color: white; cursor: pointer; display: flex; align-items: center; justify-content: center; z-index: 10; font-size: 1rem; font-weight: 700; }
        .material-symbols-outlined { font-family: 'Material Symbols Outlined'; font-weight: normal; font-style: normal; font-size: 20px; line-height: 1; letter-spacing: normal; text-transform: none; display: inline-block; white-space: nowrap; direction: ltr; -webkit-font-smoothing: antialiased; font-variation-settings: 'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 24; }
      `}</style>

      <div className="st-page">
        <header className="st-nav">
          <div className="st-logo">🪷 श्वास</div>
          <div className="st-search-wrap">
            <span className="material-symbols-outlined st-search-icon">search</span>
            <input placeholder="Find creators or posts..." value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <div className="st-nav-btns">
            <button className="st-nav-btn" onClick={() => navigate("/explore")}>← Back</button>
            <button className="st-nav-btn" onClick={() => { signOut(auth); navigate("/"); }}>Logout</button>
            <ProfileIcon />
          </div>
        </header>

        <div className="chips-wrap">
          {CATEGORIES.map((c) => (
            <button key={c} className={`chip ${activeCategory === c ? "active" : "inactive"}`} onClick={() => setActiveCategory(c)}>{c}</button>
          ))}
        </div>

        {filtered.length === 0 ? (
          <div className="empty-state">
            <div className="emoji">🎨</div>
            <h3>{search ? "No results found" : "The studio is empty..."}</h3>
            <p style={{ marginTop: "8px", fontSize: "0.95rem" }}>{search ? "Try a different search" : "Tap + to post something beautiful ✨"}</p>
          </div>
        ) : (
          <div className="st-grid">
            {filtered.map((post) => (
              <div className="st-grid-item" key={post.id} onClick={() => setSelectedPost(post)}>
                {post.isVideo ? (
                  <>
                    <video src={post.mediaUrl} muted playsInline />
                    <div className="video-badge">
                      <span className="material-symbols-outlined" style={{ fontSize: "12px" }}>play_circle</span> Video
                    </div>
                  </>
                ) : (
                  <img src={post.mediaUrl} alt={post.caption || "post"} loading="lazy" />
                )}
                <div className="st-grid-overlay">
                  <div className="st-overlay-author">@{post.authorName}</div>
                  <div className="st-overlay-likes">
                    <span className="material-symbols-outlined" style={{ fontSize: "13px" }}>favorite</span>
                    {post.likes?.length || 0}
                  </div>
                </div>
                {post.authorId === user?.uid && (
                  <button className="delete-btn" onClick={(e) => handleDelete(post, e)}>🗑 Delete</button>
                )}
              </div>
            ))}
          </div>
        )}

        <button className="fab" onClick={() => setShowUpload(true)}>
          <span className="material-symbols-outlined" style={{ fontSize: "28px" }}>add</span>
        </button>

        {/* UPLOAD MODAL */}
        {showUpload && (
          <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setShowUpload(false)}>
            <div className="upload-modal">
              <h2>📸 New Post</h2>
              {!uploadPreview ? (
                <div className="upload-drop" onClick={() => fileInputRef.current?.click()}>
                  <div style={{ fontSize: "2.5rem", marginBottom: "12px" }}>🖼️</div>
                  <p style={{ fontWeight: 700, color: "#001c30", marginBottom: "4px" }}>Tap to choose a photo or video</p>
                  <p style={{ fontSize: "0.82rem", color: "#73777e" }}>JPG, PNG, MP4, MOV supported</p>
                  <input ref={fileInputRef} type="file" accept="image/*,video/*" style={{ display: "none" }} onChange={handleFileSelect} />
                </div>
              ) : (
                <div className="upload-preview" onClick={() => fileInputRef.current?.click()}>
                  {uploadFile?.type.startsWith("video/") ? <video src={uploadPreview} controls /> : <img src={uploadPreview} alt="preview" />}
                  <input ref={fileInputRef} type="file" accept="image/*,video/*" style={{ display: "none" }} onChange={handleFileSelect} />
                </div>
              )}
              <input className="upload-input" placeholder="Add a caption..." value={uploadCaption} onChange={(e) => setUploadCaption(e.target.value)} />
              <select className="upload-select" value={uploadCategory} onChange={(e) => setUploadCategory(e.target.value)}>
                {CATEGORIES.filter((c) => c !== "All").map((c) => <option key={c}>{c}</option>)}
              </select>
              {uploading && (
                <div className="progress-bar-wrap">
                  <div className="progress-bar" style={{ width: `${uploadProgress}%` }} />
                </div>
              )}
              <div className="upload-actions">
                <button className="upload-cancel" onClick={() => { setShowUpload(false); setUploadFile(null); setUploadPreview(null); setUploadCaption(""); }}>Cancel</button>
                <button className="upload-submit" onClick={handleUpload} disabled={!uploadFile || uploading}>
                  {uploading ? `Uploading ${uploadProgress}%...` : "Post"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* POST VIEWER MODAL */}
        {selectedPost && (
          <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setSelectedPost(null)}>
            <div className="post-modal">
              <button className="close-btn" onClick={() => setSelectedPost(null)}>✕</button>
              <div className="post-modal-media">
                {selectedPost.isVideo
                  ? <video src={selectedPost.mediaUrl} controls autoPlay style={{ width: "100%", maxHeight: "420px" }} />
                  : <img src={selectedPost.mediaUrl} alt="post" />}
              </div>
              <div className="post-modal-body">
                <div className="post-modal-author">
                  <div className="modal-avatar"><img src={selectedPost.authorAvatar} alt={selectedPost.authorName} /></div>
                  <div>
                    <div className="modal-author-name">{selectedPost.authorName}</div>
                    <div className="modal-time">{formatTime(selectedPost.createdAt)}</div>
                  </div>
                </div>
                {selectedPost.caption && <p className="modal-caption">{selectedPost.caption}</p>}
                <div className="modal-actions">
                  <button className={`modal-action-btn ${selectedPost.likes?.includes(user?.uid) ? "liked" : ""}`} onClick={() => handleLike(selectedPost)}>
                    <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>favorite</span>
                    {selectedPost.likes?.length || 0}
                  </button>
                  <button className="modal-action-btn">
                    <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>chat_bubble</span>
                    {selectedPost.comments?.length || 0}
                  </button>
                  <button className="modal-action-btn" onClick={() => { navigator.clipboard?.writeText(selectedPost.mediaUrl); alert("Link copied!"); }}>
                    <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>share</span> Share
                  </button>
                  {selectedPost.authorId === user?.uid && (
                    <button className="modal-action-btn" style={{ color: "#ba1a1a", marginLeft: "auto" }} onClick={() => handleDelete(selectedPost)}>
                      <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>delete</span> Delete
                    </button>
                  )}
                </div>
                <div>
                  {(selectedPost.comments || []).length === 0 && (
                    <p style={{ fontSize: "0.85rem", color: "#73777e", marginBottom: "12px" }}>No comments yet 🌿</p>
                  )}
                  {(selectedPost.comments || []).map((c, i) => (
                    <div className="modal-comment" key={i}>
                      <div className="comment-avatar-sm"><img src={c.avatar} alt={c.name} /></div>
                      <div className="comment-bubble">
                        <div className="comment-name">{c.name}</div>
                        <div className="comment-text">{c.text}</div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="modal-comment-input">
                  <input placeholder="Add a comment..." value={commentInput} onChange={(e) => setCommentInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleComment()} />
                  <button className="send-btn" onClick={handleComment}>
                    <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>send</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default ShvaasStudio;
