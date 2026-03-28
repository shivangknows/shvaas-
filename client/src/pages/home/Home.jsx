 import React, { useState } from "react";
import { auth } from "../../firebase/config";
import ProfileIcon from "../../components/ProfileIcon";
import { signOut } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import "../../styles/main.css";

const Home = () => {
  const [posts, setPosts] = useState([
    {
      id: 1,
      name: "Shvaas Speaks",
      avatar: "https://api.dicebear.com/7.x/personas/svg?seed=jane",
      title: "Believe in yourself",
      body: "You are capable of amazing things.",
    },
  ]);
  const [input, setInput] = useState("");
  const navigate = useNavigate();

  // 🔐 Logout
  const handleLogout = async () => {
    await signOut(auth);
    navigate("/");
  };

  // 📝 Add post
  const handlePost = () => {
    if (!input.trim()) return;
    setPosts([
      {
        id: Date.now(),
        name: auth.currentUser?.displayName || auth.currentUser?.email || "You",
        avatar: `https://api.dicebear.com/7.x/personas/svg?seed=${auth.currentUser?.uid}`,
        title: input,
        body: "",
      },
      ...posts,
    ]);
    setInput("");
  };

  return (
    <div className="container">

      {/* 🔝 NAVBAR — same as landing but with Logout */}
      <div className="navbar">
        <div className="logo">🌸 Shvaas</div>
        <div className="nav-buttons">
          <button className="login-btn" onClick={handleLogout}>
            Logout
          </button>
          <ProfileIcon />
        </div>
      </div>

      {/* 🎯 HERO — exactly like landing page */}
      <div className="main">
        <div className="left">
          <div className="title">Find peace of mind</div>
          <div className="subtitle">Therapy and counseling for mental wellness</div>
          <button className="btn" onClick={() => navigate("/get-started")}>
            Get Started
          </button>
        </div>
        <div className="right">
          <img
            src="https://cdn-icons-png.flaticon.com/512/4712/4712109.png"
            alt="meditation illustration"
          />
        </div>
      </div>

      {/* 💭 SHARE YOUR THOUGHTS SECTION */}
      <div className="thoughts-section">
        <h2 className="thoughts-title">Share your thoughts</h2>
        <div className="post-box">
          <input
            type="text"
            placeholder="What's on your mind?"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handlePost()}
          />
          <button onClick={handlePost}>Post</button>
        </div>

        {/* 📜 POSTS FEED */}
        <div className="posts-feed">
          {posts.map((post) => (
            <div className="post-card" key={post.id}>
              <img className="post-avatar" src={post.avatar} alt={post.name} />
              <div className="post-content">
                <div className="post-name">{post.name}</div>
                <div className="post-title">{post.title}</div>
                {post.body && <div className="post-body">{post.body}</div>}
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};

export default Home;
