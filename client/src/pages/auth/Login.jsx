 import React, { useState } from "react";
 import { auth, db } from "../../firebase/config";
 import {
   signInWithEmailAndPassword,
   GoogleAuthProvider,
   signInWithPopup,
 } from "firebase/auth";
 import { collection, query, where, getDocs } from "firebase/firestore";
 import { useNavigate, Link } from "react-router-dom";
 
 const Login = () => {
   const navigate = useNavigate();
   const [formData, setFormData] = useState({ email: "", password: "" });
   const [showPassword, setShowPassword] = useState(false);
   const [error, setError] = useState("");
   const [loading, setLoading] = useState(false);
 
   const handleChange = (e) => {
     setFormData({ ...formData, [e.target.name]: e.target.value });
   };
 
   // ── Resolve email from username if needed ──
   const resolveEmail = async (input) => {
     // If it looks like an email, use it directly
     if (input.includes("@")) return input;
 
     // Otherwise look up username in Firestore users collection
     try {
       const q = query(collection(db, "users"), where("username", "==", input));
       const snap = await getDocs(q);
       if (!snap.empty) {
         const userData = snap.docs[0].data();
         // Return email from user doc or from Firebase Auth via uid
         if (userData.email) return userData.email;
       }
     } catch (e) {
       console.error("Username lookup error:", e);
     }
     return null;
   };
 
   const handleLogin = async (e) => {
     e.preventDefault();
     setError("");
     setLoading(true);
 
     try {
       let emailToUse = formData.email.trim();
 
       // If username entered, resolve to email
       if (!emailToUse.includes("@")) {
         const resolved = await resolveEmail(emailToUse);
         if (!resolved) {
           setError("Username not found. Try using your email instead.");
           setLoading(false);
           return;
         }
         emailToUse = resolved;
       }
 
       const userCredential = await signInWithEmailAndPassword(auth, emailToUse, formData.password);
 
       if (!userCredential.user.emailVerified) {
         setError("Please verify your email before logging in.");
         setLoading(false);
         return;
       }
 
       navigate("/home");
     } catch (err) {
       if (
         err.code === "auth/user-not-found" ||
         err.code === "auth/invalid-credential" ||
         err.code === "auth/wrong-password" ||
         err.code === "auth/invalid-email"
       ) {
         setError("Invalid email/username or password.");
       } else {
         setError(err.message);
       }
     }
     setLoading(false);
   };
 
   const handleGoogle = async () => {
     setError("");
     try {
       const provider = new GoogleAuthProvider();
       await signInWithPopup(auth, provider);
       navigate("/home");
     } catch (err) {
       if (err.code === "auth/popup-closed-by-user") return;
       setError(err.message);
     }
   };
 
   return (
     <div style={styles.page}>
       <main style={styles.card}>
         {/* Left Side */}
         <section style={styles.leftSide}>
           <div style={styles.decorCircle1} />
           <div style={styles.decorCircle2} />
           <div style={styles.leftContent}>
             <span style={{ fontSize: 64 }}>🪷</span>
             <h1 style={styles.leftTitle}>श्वास</h1>
             <p style={styles.leftSubtitle}>Take a deep breath. Your journey to mental clarity begins here.</p>
           </div>
         </section>
 
         {/* Right Side */}
         <section style={styles.rightSide}>
           <div style={styles.formWrapper}>
             <h2 style={styles.title}>Welcome Back</h2>
             <p style={styles.subtitle}>Good vibes only. Sign in to your space.</p>
 
             {error && <div style={styles.errorBox}>{error}</div>}
 
             <form onSubmit={handleLogin} style={styles.form}>
               <div style={styles.fieldGroup}>
                 <label style={styles.label}>Email or Username</label>
                 <div style={styles.inputWrapper}>
                   <span style={styles.inputIcon}>@</span>
                   <input
                     style={styles.input}
                     type="text"
                     name="email"
                     placeholder="hello@shvaas.com or username"
                     value={formData.email}
                     onChange={handleChange}
                     required
                   />
                 </div>
               </div>
 
               <div style={styles.fieldGroup}>
                 <div style={styles.labelRow}>
                   <label style={styles.label}>Password</label>
                   <Link to="/forgot-password" style={styles.forgotLink}>Forgot?</Link>
                 </div>
                 <div style={styles.inputWrapper}>
                   <span style={styles.inputIcon}>🔒</span>
                   <input
                     style={{ ...styles.input, paddingRight: 48 }}
                     type={showPassword ? "text" : "password"}
                     name="password"
                     placeholder="••••••••"
                     value={formData.password}
                     onChange={handleChange}
                     required
                   />
                   <button type="button" style={styles.eyeBtn} onClick={() => setShowPassword(!showPassword)}>
                     {showPassword ? "🙈" : "👁️"}
                   </button>
                 </div>
               </div>
 
               <div style={styles.checkRow}>
                 <input type="checkbox" id="remember" style={styles.checkbox} />
                 <label htmlFor="remember" style={styles.checkLabel}>Stay signed in</label>
               </div>
 
               <button type="submit" style={styles.primaryBtn} disabled={loading}>
                 {loading ? "Signing in..." : "Sign In →"}
               </button>
 
               <div style={styles.divider}>
                 <div style={styles.dividerLine} />
                 <span style={styles.dividerText}>OR EXPLORE WITH</span>
                 <div style={styles.dividerLine} />
               </div>
 
               <button type="button" style={styles.googleBtn} onClick={handleGoogle}>
                 <svg width="20" height="20" viewBox="0 0 24 24">
                   <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                   <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                   <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                   <path d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                 </svg>
                 Google
               </button>
             </form>
 
             <p style={styles.switchText}>New here? <Link to="/register" style={styles.switchLink}>Register</Link></p>
           </div>
         </section>
       </main>
 
       <div style={styles.floatingFooter}>
         <a href="#" style={styles.footerLink}>Privacy</a>
         <span style={styles.footerDot} />
         <a href="#" style={styles.footerLink}>Terms</a>
         <span style={styles.footerDot} />
         <a href="#" style={styles.footerLink}>Support</a>
       </div>
     </div>
   );
 };
 
 const styles = {
   page: { minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 24, backgroundColor: "#c9e2c9", backgroundImage: "radial-gradient(at 0% 0%, #d7ead7 0px, transparent 50%), radial-gradient(at 100% 0%, #b8d8b8 0px, transparent 50%), radial-gradient(at 100% 100%, #d7ead7 0px, transparent 50%), radial-gradient(at 0% 100%, #c3eac3 0px, transparent 50%)", fontFamily: "'Plus Jakarta Sans', 'Segoe UI', sans-serif" },
   card: { width: "100%", maxWidth: 1100, display: "grid", gridTemplateColumns: "1fr 1.2fr", background: "rgba(255,255,255,0.85)", backdropFilter: "blur(24px)", borderRadius: 40, overflow: "hidden", boxShadow: "0 32px 80px -16px rgba(45,78,50,0.15)", border: "1px solid rgba(255,255,255,0.4)" },
   leftSide: { background: "rgba(237,245,237,0.4)", display: "flex", alignItems: "center", justifyContent: "center", padding: 48, position: "relative", overflow: "hidden" },
   decorCircle1: { position: "absolute", top: "-10%", left: "-10%", width: 256, height: 256, background: "rgba(195,234,195,0.4)", borderRadius: "50%", filter: "blur(48px)" },
   decorCircle2: { position: "absolute", bottom: "-10%", right: "-10%", width: 256, height: 256, background: "rgba(68,102,72,0.1)", borderRadius: "50%", filter: "blur(48px)" },
   leftContent: { position: "relative", zIndex: 10, textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: 16 },
   leftTitle: { fontSize: 56, fontWeight: 800, color: "#001c30", letterSpacing: "-0.02em", margin: 0 },
   leftSubtitle: { fontSize: 18, color: "#42474d", lineHeight: 1.6, maxWidth: 280, fontWeight: 500 },
   rightSide: { background: "#fff", padding: "48px 64px", display: "flex", alignItems: "center" },
   formWrapper: { width: "100%", maxWidth: 420, margin: "0 auto" },
   title: { fontSize: 30, fontWeight: 700, color: "#161d19", margin: "0 0 8px 0" },
   subtitle: { fontSize: 14, color: "#42474d", marginBottom: 28 },
   errorBox: { background: "#ffe0e0", color: "#c0392b", padding: "10px 14px", borderRadius: 12, fontSize: 14, marginBottom: 16, textAlign: "center" },
   form: { display: "flex", flexDirection: "column", gap: 20 },
   fieldGroup: { display: "flex", flexDirection: "column", gap: 6 },
   label: { fontSize: 14, fontWeight: 600, color: "#161d19", paddingLeft: 4 },
   labelRow: { display: "flex", justifyContent: "space-between", alignItems: "center" },
   forgotLink: { fontSize: 12, fontWeight: 700, color: "#446648", textDecoration: "none" },
   inputWrapper: { position: "relative", display: "flex", alignItems: "center" },
   inputIcon: { position: "absolute", left: 16, fontSize: 16, color: "#73777e", pointerEvents: "none" },
   input: { width: "100%", padding: "14px 16px 14px 44px", background: "#edf5ed", border: "none", borderRadius: 16, fontSize: 15, fontFamily: "inherit", color: "#161d19", outline: "none", boxSizing: "border-box" },
   eyeBtn: { position: "absolute", right: 14, background: "none", border: "none", cursor: "pointer", fontSize: 16, padding: 4 },
   checkRow: { display: "flex", alignItems: "center", gap: 10, marginTop: -4 },
   checkbox: { width: 18, height: 18, cursor: "pointer", accentColor: "#446648" },
   checkLabel: { fontSize: 14, fontWeight: 500, color: "#42474d", cursor: "pointer" },
   primaryBtn: { width: "100%", padding: "16px 24px", background: "#001c30", color: "#fff", border: "none", borderRadius: 9999, fontSize: 17, fontWeight: 700, fontFamily: "inherit", cursor: "pointer", boxShadow: "0 8px 24px rgba(0,28,48,0.2)", marginTop: 4 },
   divider: { display: "flex", alignItems: "center", gap: 12 },
   dividerLine: { flex: 1, height: 1, background: "rgba(195,199,206,0.3)" },
   dividerText: { fontSize: 10, fontWeight: 700, color: "rgba(66,71,77,0.4)", letterSpacing: "0.2em", whiteSpace: "nowrap" },
   googleBtn: { width: "100%", padding: "14px 24px", background: "#fff", border: "1px solid rgba(195,199,206,0.4)", borderRadius: 9999, fontSize: 15, fontWeight: 700, fontFamily: "inherit", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 10, color: "#161d19", boxShadow: "0 2px 8px rgba(0,0,0,0.05)" },
   switchText: { textAlign: "center", marginTop: 28, fontSize: 14, color: "#42474d", fontWeight: 500 },
   switchLink: { color: "#446648", fontWeight: 800, textDecoration: "underline", textDecorationColor: "rgba(68,102,72,0.3)", textUnderlineOffset: 4 },
   floatingFooter: { marginTop: 32, display: "flex", alignItems: "center", gap: 24, padding: "14px 40px", background: "rgba(255,255,255,0.6)", backdropFilter: "blur(16px)", borderRadius: 9999, border: "1px solid rgba(255,255,255,0.4)", boxShadow: "0 8px 32px rgba(0,0,0,0.05)" },
   footerLink: { fontSize: 12, fontWeight: 700, color: "#42474d", textDecoration: "none" },
   footerDot: { width: 6, height: 6, background: "rgba(68,102,72,0.3)", borderRadius: "50%", display: "inline-block" },
 };
 
 export default Login;
 