import React from "react";
import ProfileIcon from "../components/ProfileIcon";
import { useNavigate } from "react-router-dom";
import { auth } from "../firebase/config";
import { signOut } from "firebase/auth";

const GetStarted = () => {
  const navigate = useNavigate();

  const handleLogout = async () => {
    await signOut(auth);
    navigate("/");
  };

  return (
    <>
      {/* Google Fonts */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap');
        @import url('https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=swap');

        * { box-sizing: border-box; margin: 0; padding: 0; }

        .gs-body {
          font-family: 'Plus Jakarta Sans', sans-serif;
          min-height: 100vh;
          background-color: #f4fbf4;
          background-image:
            radial-gradient(at 0% 0%, #eef5ee 0px, transparent 50%),
            radial-gradient(at 100% 0%, #c3eac3 0px, transparent 50%),
            radial-gradient(at 100% 100%, #cee5ff 0px, transparent 50%),
            radial-gradient(at 0% 100%, #f4fbf4 0px, transparent 50%);
          color: #161d19;
        }

        /* NAVBAR */
        .gs-nav {
          position: fixed;
          top: 0;
          width: 100%;
          z-index: 50;
          background: rgba(244, 251, 244, 0.85);
          backdrop-filter: blur(20px);
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px 32px;
        }
        .gs-logo {
          font-size: 1.5rem;
          font-weight: 800;
          color: #001c30;
        }
        .gs-logout-btn {
          background: transparent;
          border: 1.5px solid #c3c7ce;
          color: #42474d;
          padding: 8px 20px;
          border-radius: 9999px;
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-weight: 600;
          font-size: 0.875rem;
          cursor: pointer;
          transition: all 0.2s;
        }
        .gs-logout-btn:hover {
          background: #001c30;
          color: white;
          border-color: #001c30;
        }

        /* MAIN */
        .gs-main {
          padding-top: 128px;
          padding-bottom: 80px;
          padding-left: 24px;
          padding-right: 24px;
          max-width: 1200px;
          margin: 0 auto;
        }

        /* HERO */
        .gs-hero {
          margin-bottom: 64px;
        }
        .gs-hero h1 {
          font-size: clamp(2.5rem, 6vw, 4.5rem);
          font-weight: 800;
          line-height: 1.1;
          color: #001c30;
          margin-bottom: 16px;
          letter-spacing: -0.02em;
        }
        .gs-hero h1 span {
          color: #486b4c;
        }
        .gs-hero p {
          font-size: 1.1rem;
          color: #42474d;
          max-width: 520px;
          line-height: 1.7;
        }

        /* BENTO GRID */
        .gs-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 24px;
        }
        @media (min-width: 768px) {
          .gs-grid {
            grid-template-columns: 7fr 5fr;
          }
        }

        /* EXPLORE CARD */
        .explore-card {
          position: relative;
          overflow: hidden;
          background: #ffffff;
          border-radius: 2rem;
          padding: 40px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          min-height: 480px;
          border: 1px solid rgba(195, 199, 206, 0.2);
          cursor: pointer;
          transition: box-shadow 0.4s ease;
        }
        .explore-card:hover {
          box-shadow: 0 40px 60px -15px rgba(0, 28, 48, 0.08);
        }
        .explore-card:hover .explore-bg-img {
          opacity: 0.22;
        }
        .explore-bg-img {
          position: absolute;
          top: 0; right: 0;
          width: 100%; height: 100%;
          object-fit: cover;
          opacity: 0.1;
          transition: opacity 0.6s ease;
          pointer-events: none;
        }
        .explore-content { position: relative; z-index: 2; }
        .discovery-badge {
          display: inline-block;
          padding: 4px 16px;
          border-radius: 9999px;
          background: #c6ecc6;
          color: #01210a;
          font-size: 0.7rem;
          font-weight: 700;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          margin-bottom: 24px;
        }
        .explore-card h2 {
          font-size: 2.5rem;
          font-weight: 800;
          color: #001c30;
          margin-bottom: 12px;
        }
        .explore-card p {
          color: #42474d;
          max-width: 280px;
          line-height: 1.6;
          font-size: 0.95rem;
        }
        .explore-card-footer {
          position: relative;
          z-index: 2;
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          margin-top: 40px;
        }
        .avatar-stack {
          display: flex;
        }
        .avatar-stack > * {
          width: 44px;
          height: 44px;
          border-radius: 9999px;
          border: 3px solid white;
          margin-left: -10px;
          background: #dde4de;
          overflow: hidden;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.7rem;
          font-weight: 700;
          color: #42474d;
        }
        .avatar-stack > *:first-child { margin-left: 0; }
        .avatar-stack img { width: 100%; height: 100%; object-fit: cover; }

        .start-exploring-btn {
          background: #001c30;
          color: white;
          padding: 14px 28px;
          border-radius: 9999px;
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-weight: 700;
          font-size: 0.95rem;
          border: none;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 8px;
          transition: all 0.3s;
        }
        .start-exploring-btn:hover {
          padding-right: 36px;
          box-shadow: 0 8px 24px rgba(0,28,48,0.25);
        }
        .start-exploring-btn:active { transform: scale(0.97); }

        /* RIGHT COLUMN */
        .right-col {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        /* BOT CARD */
        .bot-card {
          flex: 1;
          background: #0a314d;
          border-radius: 2rem;
          padding: 36px;
          position: relative;
          overflow: hidden;
          cursor: pointer;
          transition: box-shadow 0.4s ease;
        }
        .bot-card:hover {
          box-shadow: 0 40px 60px -15px rgba(10, 49, 77, 0.3);
        }
        .bot-card-glow {
          position: absolute;
          bottom: -40px; right: -40px;
          width: 160px; height: 160px;
          background: rgba(122, 153, 186, 0.12);
          border-radius: 9999px;
          filter: blur(40px);
          pointer-events: none;
        }
        .bot-icon-wrap {
          width: 56px; height: 56px;
          background: white;
          border-radius: 1rem;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 24px;
          transform: rotate(3deg);
          transition: transform 0.3s;
          font-size: 1.6rem;
        }
        .bot-card:hover .bot-icon-wrap { transform: rotate(0deg); }
        .bot-card h2 {
          font-size: 1.9rem;
          font-weight: 800;
          color: #f4fbf4;
          margin-bottom: 8px;
        }
        .bot-card > p {
          color: rgba(169, 202, 237, 0.8);
          font-size: 0.875rem;
          line-height: 1.6;
        }
        .bot-quote-box {
          background: rgba(0, 28, 48, 0.35);
          backdrop-filter: blur(10px);
          border-radius: 1rem;
          padding: 16px;
          margin-top: 28px;
          margin-bottom: 16px;
          border: 1px solid rgba(255,255,255,0.05);
        }
        .bot-quote-box p {
          color: white;
          font-size: 0.8rem;
          font-style: italic;
          line-height: 1.5;
        }
        .chat-btn {
          width: 100%;
          background: #f4fbf4;
          color: #0a314d;
          padding: 14px;
          border-radius: 9999px;
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-weight: 700;
          font-size: 0.95rem;
          border: none;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          transition: all 0.2s;
        }
        .chat-btn:hover { background: white; }
        .chat-btn:active { transform: scale(0.97); }

        /* AMBIENT ICONS */
        .ambient-icons {
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 32px;
          padding: 24px 0;
          opacity: 0.5;
          transition: opacity 0.5s, filter 0.5s;
          filter: grayscale(1);
        }
        .ambient-icons:hover {
          opacity: 1;
          filter: grayscale(0);
        }
        .ambient-icon {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 6px;
          font-size: 2.2rem;
        }
        .ambient-icon:nth-child(2) { margin-top: 16px; font-size: 2.8rem; }
        .ambient-icon-line {
          height: 4px;
          border-radius: 9999px;
          background: rgba(68, 102, 72, 0.2);
          filter: blur(1px);
        }

        .material-symbols-outlined {
          font-family: 'Material Symbols Outlined';
          font-weight: normal;
          font-style: normal;
          font-size: 24px;
          line-height: 1;
          letter-spacing: normal;
          text-transform: none;
          display: inline-block;
          white-space: nowrap;
          word-wrap: normal;
          direction: ltr;
          -webkit-font-feature-settings: 'liga';
          font-feature-settings: 'liga';
          -webkit-font-smoothing: antialiased;
          font-variation-settings: 'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 24;
        }
      `}</style>

      <div className="gs-body">
        {/* NAVBAR */}
        <nav className="gs-nav">
          <div className="gs-logo">🌸 श्वास</div>
          <button className="gs-logout-btn" onClick={handleLogout}>Logout</button>
          <ProfileIcon />
        </nav>

        {/* MAIN */}
        <main className="gs-main">

          {/* HERO */}
          <header className="gs-hero">
            <h1>
              Find your center. <br />
              <span>Explore Shvaas.</span>
            </h1>
            <p>
              Step into a curated sanctuary designed to help you breathe, reflect,
              and grow. Wellness is not a destination, but a rhythmic journey.
            </p>
          </header>

          {/* BENTO GRID */}
          <div className="gs-grid">

            {/* LEFT — EXPLORE CARD */}
            <div className="explore-card" onClick={() => navigate("/explore")}>
              <img
                className="explore-bg-img"
                src="https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&auto=format&fit=crop"
                alt="zen garden"
              />
              <div className="explore-content">
                <span className="discovery-badge">Discovery</span>
                <h2>EXPLORE</h2>
                <p>
                  Uncover mindfulness practices, guided meditations, and
                  restorative soundscapes tailored for your current mood.
                </p>
              </div>
              <div className="explore-card-footer">
                <div className="avatar-stack">
                  <div>
                    <img src="https://api.dicebear.com/7.x/personas/svg?seed=alice" alt="user" />
                  </div>
                  <div>
                    <img src="https://api.dicebear.com/7.x/personas/svg?seed=bob" alt="user" />
                  </div>
                  <div>+12k</div>
                </div>
                <button className="start-exploring-btn">
                  Start Exploring
                  <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>arrow_forward</span>
                </button>
              </div>
            </div>

            {/* RIGHT COLUMN */}
            <div className="right-col">

              {/* SHVAAS BOT CARD */}
              <div className="bot-card" onClick={() => navigate("/bot")}>
                <div className="bot-card-glow" />
                <div className="bot-icon-wrap">🧠</div>
                <h2>Shvaas Bot</h2>
                <p>
                  Your friendly breathing companion. Ready to guide you through
                  anxiety or just share a moment of peace.
                </p>
                <div className="bot-quote-box">
                  <p>"Feeling a bit overwhelmed? Let's take three deep breaths together."</p>
                </div>
                <button className="chat-btn">
                  Chat with Shvaas
                  <span className="material-symbols-outlined" style={{ fontSize: "20px", color: "#0a314d" }}>chat_bubble</span>
                </button>
              </div>

              {/* AMBIENT ICONS */}
              <div className="ambient-icons">
                <div className="ambient-icon">
                  <span style={{ fontSize: "2rem" }}>🧘</span>
                  <div className="ambient-icon-line" style={{ width: "32px" }} />
                </div>
                <div className="ambient-icon">
                  <span style={{ fontSize: "2.6rem" }}>🌿</span>
                  <div className="ambient-icon-line" style={{ width: "40px" }} />
                </div>
                <div className="ambient-icon">
                  <span style={{ fontSize: "2rem" }}>🧘</span>
                  <div className="ambient-icon-line" style={{ width: "32px" }} />
                </div>
              </div>

            </div>
          </div>
        </main>
      </div>
    </>
  );
};

export default GetStarted;
