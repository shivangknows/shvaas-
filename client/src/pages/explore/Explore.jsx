import React from "react";
import { useNavigate } from "react-router-dom";
import ProfileIcon from "../../components/ProfileIcon";
import { auth } from "../../firebase/config";
import { signOut } from "firebase/auth";

const Explore = () => {
  const navigate = useNavigate();

  const handleLogout = async () => {
    await signOut(auth);
    navigate("/");
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap');
        @import url('https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=swap');

        * { box-sizing: border-box; margin: 0; padding: 0; }

        .exp-body {
          font-family: 'Plus Jakarta Sans', sans-serif;
          min-height: 100vh;
          background-color: #f4fbf4;
          color: #161d19;
          overflow-x: hidden;
          position: relative;
        }

        /* BG BLOBS */
        .bg-blob-1 {
          position: fixed;
          top: -10%; right: -10%;
          width: 50vw; height: 50vw;
          background: #aad0ab;
          border-radius: 9999px;
          filter: blur(120px);
          opacity: 0.28;
          pointer-events: none;
          z-index: 0;
        }
        .bg-blob-2 {
          position: fixed;
          bottom: -10%; left: -10%;
          width: 50vw; height: 50vw;
          background: #cee5ff;
          border-radius: 9999px;
          filter: blur(120px);
          opacity: 0.28;
          pointer-events: none;
          z-index: 0;
        }

        /* FLOATING STICKERS */
        @keyframes float {
          0%, 100% { transform: translateY(0) rotate(var(--rot, -12deg)); }
          50% { transform: translateY(-15px) rotate(var(--rot, -12deg)); }
        }
        .sticker-float {
          animation: float 6s ease-in-out infinite;
        }
        .sticker-bubble {
          padding: 16px;
          border-radius: 9999px;
          box-shadow: 0 4px 16px rgba(0,0,0,0.08);
          display: inline-flex;
          align-items: center;
          justify-content: center;
          font-size: 1.8rem;
        }

        /* NAVBAR */
        .exp-nav {
          position: fixed;
          top: 0; width: 100%;
          z-index: 50;
          background: rgba(244,251,244,0.82);
          backdrop-filter: blur(20px);
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0 24px;
          height: 80px;
        }
        .exp-nav-inner {
          max-width: 1200px;
          width: 100%;
          margin: 0 auto;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .exp-logo {
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 1.5rem;
          font-weight: 800;
          color: #001c30;
          letter-spacing: -0.02em;
        }
        .exp-nav-actions {
          display: flex;
          gap: 12px;
          align-items: center;
        }
        .back-btn {
          background: transparent;
          border: 1.5px solid #c3c7ce;
          color: #42474d;
          padding: 8px 20px;
          border-radius: 9999px;
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-weight: 600;
          font-size: 0.85rem;
          cursor: pointer;
          transition: all 0.2s;
        }
        .back-btn:hover { background: #001c30; color: white; border-color: #001c30; }
        .logout-btn {
          background: transparent;
          border: 1.5px solid #c3c7ce;
          color: #42474d;
          padding: 8px 20px;
          border-radius: 9999px;
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-weight: 600;
          font-size: 0.85rem;
          cursor: pointer;
          transition: all 0.2s;
        }
        .logout-btn:hover { background: #ba1a1a; color: white; border-color: #ba1a1a; }

        /* MAIN */
        .exp-main {
          position: relative;
          z-index: 1;
          padding-top: 112px;
          padding-bottom: 48px;
          padding-left: 24px;
          padding-right: 24px;
          max-width: 1200px;
          margin: 0 auto;
        }

        /* HERO */
        .exp-hero { margin-bottom: 64px; }
        .exp-hero h1 {
          font-size: clamp(3rem, 7vw, 5rem);
          font-weight: 800;
          color: #001c30;
          letter-spacing: -0.04em;
          margin-bottom: 16px;
          line-height: 1.05;
        }
        .exp-hero p {
          color: #42474d;
          font-size: 1.1rem;
          max-width: 520px;
          line-height: 1.7;
        }

        /* GRID */
        .exp-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 32px;
          align-items: stretch;
        }
        @media (min-width: 900px) {
          .exp-grid { grid-template-columns: 1fr 1fr; }
        }

        /* STUDIO CARD */
        .studio-card {
          background: #ffffff;
          border-radius: 2rem;
          overflow: hidden;
          box-shadow: 0 40px 60px -15px rgba(0,28,48,0.06);
          display: flex;
          flex-direction: column;
          transition: transform 0.4s ease, box-shadow 0.4s ease;
          cursor: pointer;
        }
        .studio-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 50px 70px -15px rgba(0,28,48,0.1);
        }
        .studio-img-area {
          height: 360px;
          position: relative;
          background: #f9fdfa;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
        }
        .studio-monk {
          width: 260px; height: 260px;
          object-fit: contain;
          filter: drop-shadow(0 8px 24px rgba(0,0,0,0.12));
          position: relative;
          z-index: 1;
        }
        .studio-camera-badge {
          position: absolute;
          bottom: 12px; right: 80px;
          background: white;
          border-radius: 9999px;
          padding: 10px 12px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.1);
          font-size: 1.4rem;
          border: 1px solid #e9f0e9;
          z-index: 2;
        }
        .studio-gradient {
          position: absolute;
          bottom: 0; left: 0; right: 0;
          height: 60%;
          background: linear-gradient(to top, #ffffff, transparent);
        }
        .studio-badge {
          position: absolute;
          top: 20px; right: 20px;
          background: rgba(255,255,255,0.7);
          backdrop-filter: blur(12px);
          padding: 6px 16px;
          border-radius: 9999px;
          font-size: 0.72rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          color: #001c30;
          border: 1px solid rgba(195,199,206,0.3);
        }
        .studio-body {
          padding: 36px 40px 40px;
          display: flex;
          flex-direction: column;
          flex: 1;
        }
        .studio-body h2 {
          font-size: 2.2rem;
          font-weight: 800;
          color: #001c30;
          margin-bottom: 12px;
          letter-spacing: -0.02em;
        }
        .studio-body p {
          color: #42474d;
          font-size: 1rem;
          line-height: 1.7;
          margin-bottom: 28px;
        }
        .mini-feed {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 8px;
          margin-bottom: 32px;
        }
        .mini-feed-img {
          aspect-ratio: 1;
          border-radius: 0.75rem;
          overflow: hidden;
          background: #e3eae3;
        }
        .mini-feed-img img {
          width: 100%; height: 100%;
          object-fit: cover;
          transition: transform 0.3s;
        }
        .mini-feed-img:hover img { transform: scale(1.05); }

        /* POND CARD */
        .pond-card {
          background: #eef5ee;
          border-radius: 2rem;
          overflow: hidden;
          box-shadow: 0 40px 60px -15px rgba(0,28,48,0.06);
          display: flex;
          flex-direction: column;
          transition: transform 0.4s ease, box-shadow 0.4s ease;
          cursor: pointer;
        }
        .pond-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 50px 70px -15px rgba(0,28,48,0.1);
        }
        .pond-body {
          padding: 40px 40px 40px;
          display: flex;
          flex-direction: column;
          flex: 1;
          height: 100%;
        }
        .pond-top {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 28px;
        }
        .pond-icon {
          width: 60px; height: 60px;
          border-radius: 9999px;
          background: #c3eac3;
          display: flex; align-items: center; justify-content: center;
          font-size: 1.5rem;
        }
        .pond-badge {
          background: #c6ecc6;
          color: #01210a;
          padding: 6px 16px;
          border-radius: 9999px;
          font-size: 0.72rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.1em;
        }
        .pond-body h2 {
          font-size: 2.2rem;
          font-weight: 800;
          color: #001c30;
          margin-bottom: 12px;
          letter-spacing: -0.02em;
        }
        .pond-body > p {
          color: #42474d;
          font-size: 1rem;
          line-height: 1.7;
          margin-bottom: 28px;
        }
        .pond-img-wrap {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 32px;
          min-height: 260px;
        }
        .pond-peacock {
          width: 280px; height: 280px;
          object-fit: contain;
          filter: drop-shadow(0 8px 20px rgba(0,0,0,0.1));
        }

        /* BUTTONS */
        .studio-btn {
          width: 100%;
          padding: 18px 32px;
          border-radius: 9999px;
          background: linear-gradient(135deg, #001c30 0%, #0a314d 100%);
          color: white;
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-weight: 700;
          font-size: 1rem;
          border: none;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          transition: all 0.3s;
          margin-top: auto;
        }
        .studio-btn:hover { box-shadow: 0 12px 32px rgba(0,28,48,0.3); }
        .studio-btn:active { transform: scale(0.97); }

        .pond-btn {
          width: 100%;
          padding: 18px 32px;
          border-radius: 9999px;
          background: #446648;
          color: white;
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-weight: 700;
          font-size: 1rem;
          border: none;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          transition: all 0.3s;
          margin-top: auto;
        }
        .pond-btn:hover { box-shadow: 0 12px 32px rgba(68,102,72,0.3); background: #3a5a3e; }
        .pond-btn:active { transform: scale(0.97); }

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

      <div className="exp-body">
        {/* BG BLOBS */}
        <div className="bg-blob-1" />
        <div className="bg-blob-2" />

        {/* FLOATING STICKERS */}
        <div style={{ position: "fixed", top: "160px", left: "24px", opacity: 0.3, pointerEvents: "none", zIndex: 0 }}>
          <div className="sticker-float sticker-bubble" style={{ "--rot": "-12deg", background: "#ffd9e2" }}>🧘</div>
        </div>
        <div style={{ position: "fixed", bottom: "160px", right: "24px", opacity: 0.3, pointerEvents: "none", zIndex: 0 }}>
          <div className="sticker-float sticker-bubble" style={{ "--rot": "12deg", background: "#c6ecc6" }}>👥</div>
        </div>

        {/* NAVBAR */}
        <nav className="exp-nav">
          <div className="exp-nav-inner">
            <div className="exp-logo">
              🪷 <span>श्वास</span>
            </div>
            <div className="exp-nav-actions">
              <button className="back-btn" onClick={() => navigate("/get-started")}>← Back</button>
              <button className="logout-btn" onClick={handleLogout}>Logout</button>
              <ProfileIcon />
            </div>
          </div>
        </nav>

        {/* MAIN */}
        <main className="exp-main">

          {/* HERO */}
          <header className="exp-hero">
            <h1>Explore.</h1>
            <p>Discover the duality of stillness and expression. Your sanctuary for mindful connection.</p>
          </header>

          {/* BENTO GRID */}
          <div className="exp-grid">

            {/* SHVAAS STUDIO CARD */}
            <div className="studio-card" onClick={() => navigate("/studio")}>
              <div className="studio-img-area">
                <div className="sticker-float" style={{ "--rot": "0deg" }}>
                  <img
                    className="studio-monk"
                    src="https://cdn-icons-png.flaticon.com/512/3048/3048122.png"
                    alt="monk photographer"
                  />
                </div>
                <div className="studio-camera-badge">📸</div>
                <div className="studio-gradient" />
                <div className="studio-badge">Visual Studio</div>
              </div>
              <div className="studio-body">
                <h2>Shvaas Studio</h2>
                <p>A creative sanctuary to capture and share your journey. Create, post, and watch soulful stories that breathe life into your practice.</p>
                <div className="mini-feed">
                  <div className="mini-feed-img">
                    <img src="https://images.unsplash.com/photo-1518241353330-0f7941c2d9b5?w=200&auto=format&fit=crop" alt="nature" />
                  </div>
                  <div className="mini-feed-img">
                    <img src="https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=200&auto=format&fit=crop" alt="yoga" />
                  </div>
                  <div className="mini-feed-img">
                    <img src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop" alt="light" />
                  </div>
                </div>
                <button className="studio-btn">
                  <span className="material-symbols-outlined" style={{ fontSize: "20px" }}>movie</span>
                  Enter Studio
                </button>
              </div>
            </div>

            {/* POND OF THOUGHTS CARD */}
            <div className="pond-card" onClick={() => navigate("/thoughts")}>
              <div className="pond-body">
                <div className="pond-top">
                  <div className="pond-icon">📖</div>
                  <span className="pond-badge">Community Hub</span>
                </div>
                <h2>Pond of Thoughts</h2>
                <p>A ripple of connection. Join the community to share reflections, insights, and find your tribe in a space built for depth over noise.</p>
                <div className="pond-img-wrap">
                  <div className="sticker-float" style={{ "--rot": "0deg" }}>
                    <img
                      className="pond-peacock"
                      src="https://cdn-icons-png.flaticon.com/512/3069/3069172.png"
                      alt="peacock"
                    />
                  </div>
                </div>
                <button className="pond-btn">
                  <span className="material-symbols-outlined" style={{ fontSize: "20px" }}>waves</span>
                  Join the Ripple
                </button>
              </div>
            </div>

          </div>
        </main>
      </div>
    </>
  );
};

export default Explore;
