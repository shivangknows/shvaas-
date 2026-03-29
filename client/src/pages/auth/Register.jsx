 import React, { useState } from "react";
 import { auth, db } from "../../firebase/config";
 import { createUserWithEmailAndPassword, sendEmailVerification, updateProfile, GoogleAuthProvider, signInWithPopup } from "firebase/auth";
 import { doc, setDoc } from "firebase/firestore";
 import { useNavigate, Link } from "react-router-dom";
 
 const Register = () => {
   const navigate = useNavigate();
   const [step, setStep] = useState(1);
   const [formData, setFormData] = useState({ username: "", email: "", password: "", confirm: "" });
   const [agreed, setAgreed] = useState(false);
   const [error, setError] = useState("");
   const [loading, setLoading] = useState(false);
 
   const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });
 
   const handleRegister = async (e) => {
     e.preventDefault();
     setError("");
     if (formData.password !== formData.confirm) { setError("Passwords do not match."); return; }
     if (!agreed) { setError("Please agree to the Terms and Privacy Policy."); return; }
     setLoading(true);
     try {
       const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
       const user = userCredential.user;
       await updateProfile(user, { displayName: formData.username });
       await sendEmailVerification(user);
       await setDoc(doc(db, "users", user.uid), { uid: user.uid, username: formData.username,displayName: formData.username, displayNameLower: formData.username.toLowerCase(), email: formData.email, bio: "", followers: [], following: [], profilePic: "", createdAt: new Date() });
       setStep(2);
     } catch (err) {
       if (err.code === "auth/email-already-in-use") setError("This email is already registered.");
       else if (err.code === "auth/weak-password") setError("Password must be at least 6 characters.");
       else setError(err.message);
     }
     setLoading(false);
   };
 
   const handleGoogle = async () => {
     try {
       const provider = new GoogleAuthProvider();
       await signInWithPopup(auth, provider);
       navigate("/home");
     } catch (err) { setError(err.message); }
   };
 
   const handleVerified = async () => {
     await auth.currentUser.reload();
     if (auth.currentUser.emailVerified) navigate("/home");
     else setError("Email not verified yet. Please check your inbox and click the link.");
   };
 
   const resendEmail = async () => {
     await sendEmailVerification(auth.currentUser);
     setError("Verification email resent! Check your inbox.");
   };

   const fixExistingUsers = async () => {
  const { collection, getDocs, updateDoc, doc } = await import("firebase/firestore");
  const snapshot = await getDocs(collection(db, "users"));
  snapshot.forEach(async (userDoc) => {
    const data = userDoc.data();
    const name = data.username || data.displayName || "";
    await updateDoc(doc(db, "users", userDoc.id), {
      displayName: name,
      displayNameLower: name.toLowerCase(),
    });
  });
  alert("Done! All users updated.");
};
 
   return (
     <div style={styles.page}>
       {/* Top Nav */}
       <header style={styles.header}>
         <div style={styles.headerLogo}>
           <span style={{ fontSize: 24 }}>🪷</span>
           <span style={styles.headerLogoText}>श्वास</span>
         </div>
         <div style={styles.headerBtns}>
           <Link to="/login" style={styles.headerLogin}>Login</Link>
           <Link to="/register" style={styles.headerRegister}>Register</Link>
         </div>
       </header>
 
       <main style={styles.main}>
         {/* Ambient blobs */}
         <div style={styles.blob1} />
         <div style={styles.blob2} />
 
         <div style={styles.grid}>
           {/* Left Side */}
           <div style={styles.leftSide}>
             <div style={styles.mascotContainer}>
               <img
                 src="https://lh3.googleusercontent.com/aida-public/AB6AXuCpa-8DrU9NiamfrlLwUvzNbwXnL5fwDCLdrqxPCQC-qcG8_p4w9crnkrNjUX079XEanxcgqG8mSfiMJeM2l2-cQIwLdimzJlnmsWU9PPPlJz_uiTyu3koF5y2dSA1pzDaykHWkGErxn3izNP6IVp1JW_flWvc-K-Ua8DDg_QQe7HiyzG0z7g8soVhnwItpGJtBf6xGQRc7ty2fUPNoGfE9c_vQ0jPI2GdBHqgy5ODfzfSFaqJ1jjqvORrWxaCBj54rg8UFAx3qKcvA"
                 alt="Meditating monk"
                 style={styles.mascotImg}
               />
             </div>
             <div style={styles.leftText}>
               <h1 style={styles.leftTitle}>
                 Breathe easy, <br />
                 <span style={{ color: "#446648" }}>we've got you.</span>
               </h1>
               <p style={styles.leftSubtitle}>Join our community and start your journey towards digital mindfulness and mental clarity today.</p>
             </div>
           </div>
 
           {/* Right Side - Form */}
           <div style={styles.formCard}>
             {step === 1 ? (
               <>
                 <h2 style={styles.title}>Create Account</h2>
                 <p style={styles.subtitle}>Step into a calmer digital space.</p>
 
                 {error && <div style={styles.errorBox}>{error}</div>}
 
                 <form onSubmit={handleRegister} style={styles.form}>
                   <div style={styles.fieldGroup}>
                     <label style={styles.label}>EMAIL ADDRESS</label>
                     <div style={styles.inputWrapper}>
                       <span style={styles.inputIcon}>✉️</span>
                       <input style={styles.input} type="email" name="email" placeholder="hello@example.com" value={formData.email} onChange={handleChange} required />
                     </div>
                   </div>
 
                   <div style={styles.fieldGroup}>
                     <label style={styles.label}>USERNAME</label>
                     <div style={styles.inputWrapper}>
                       <span style={styles.inputIcon}>👤</span>
                       <input style={styles.input} type="text" name="username" placeholder="yourname" value={formData.username} onChange={handleChange} required />
                     </div>
                   </div>
 
                   <div style={styles.twoCol}>
                     <div style={styles.fieldGroup}>
                       <label style={styles.label}>PASSWORD</label>
                       <div style={styles.inputWrapper}>
                         <span style={styles.inputIcon}>🔒</span>
                         <input style={styles.input} type="password" name="password" placeholder="••••••••" value={formData.password} onChange={handleChange} required />
                       </div>
                     </div>
                     <div style={styles.fieldGroup}>
                       <label style={styles.label}>CONFIRM</label>
                       <div style={styles.inputWrapper}>
                         <span style={styles.inputIcon}>🛡️</span>
                         <input style={styles.input} type="password" name="confirm" placeholder="••••••••" value={formData.confirm} onChange={handleChange} required />
                       </div>
                     </div>
                   </div>
 
                   <div style={styles.checkRow}>
                     <input type="checkbox" id="terms" checked={agreed} onChange={e => setAgreed(e.target.checked)} style={styles.checkbox} />
                     <label htmlFor="terms" style={styles.checkLabel}>
                       I agree to the <a href="#" style={styles.checkLink}>Terms</a> and <a href="#" style={styles.checkLink}>Privacy Policy</a>.
                     </label>
                   </div>
 
                   <button type="submit" style={styles.primaryBtn} disabled={loading}>
                     {loading ? "Creating Account..." : "Register Now →"}
                   </button>
 
                   <div style={styles.divider}>
                     <div style={styles.dividerLine} />
                     <span style={styles.dividerText}>OR</span>
                     <div style={styles.dividerLine} />
                   </div>
 
                   <button type="button" style={styles.googleBtn} onClick={handleGoogle}>
                     <svg width="20" height="20" viewBox="0 0 24 24">
                       <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                       <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                       <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                       <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                     </svg>
                     Sign up with Google
                   </button>
 
                   <p style={styles.switchText}>Already have an account? <Link to="/login" style={styles.switchLink}>Login</Link></p>
                 </form>
               </>
             ) : (
               <>
                 <span style={{ fontSize: 56, display: "block", textAlign: "center", marginBottom: 16 }}>📧</span>
                 <h2 style={styles.title}>Verify Your Email</h2>
                 <p style={styles.subtitle}>We've sent a verification link to <strong>{formData.email}</strong>. Click the link in your email to verify.</p>
                 {error && <div style={styles.errorBox}>{error}</div>}
                 <button style={{ ...styles.primaryBtn, marginTop: 24 }} onClick={handleVerified}>I've Verified My Email ✅</button>
                 <button style={{ ...styles.googleBtn, marginTop: 12 }} onClick={resendEmail}>Resend Verification Email</button>
                 <p style={styles.switchText}><Link to="/login" style={styles.switchLink}>Back to Login</Link></p>
               </>
             )}
           </div>
         </div>
       </main>
 
       {/* Footer */}
       <footer style={styles.footer}>
         <div style={styles.footerLinks}>
           {["Privacy Policy", "Terms of Service", "Help Center", "Contact Us"].map(l => (
             <a key={l} href="#" style={styles.footerLink}>{l}</a>
           ))}
         </div>
         <p style={styles.footerCopy}>© 2024 SHWAAS • BREATHE FREELY.</p>
       </footer>
     </div>
   );
 };
 
 const styles = {
   page: { minHeight: "100vh", display: "flex", flexDirection: "column", background: "#d8e6d8", fontFamily: "'Plus Jakarta Sans', 'Segoe UI', sans-serif", color: "#161d19" },
   header: { position: "fixed", top: 0, left: 0, right: 0, zIndex: 50, display: "flex", justifyContent: "space-between", alignItems: "center", height: 80, padding: "0 48px", maxWidth: 1280, margin: "0 auto", width: "100%" },
   headerLogo: { display: "flex", alignItems: "center", gap: 8 },
   headerLogoText: { fontSize: 22, fontWeight: 700, color: "#0a314d", letterSpacing: "-0.02em" },
   headerBtns: { display: "flex", alignItems: "center", gap: 24 },
   headerLogin: { fontSize: 14, fontWeight: 600, color: "rgba(10,49,77,0.8)", textDecoration: "none" },
   headerRegister: { background: "#c3eac3", color: "#0a314d", padding: "8px 24px", borderRadius: 12, fontWeight: 700, fontSize: 14, textDecoration: "none" },
   main: { flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "100px 16px 48px", position: "relative", overflow: "hidden" },
   blob1: { position: "absolute", top: "-10%", right: "-5%", width: 400, height: 400, background: "rgba(195,234,195,0.2)", borderRadius: "50%", filter: "blur(100px)", pointerEvents: "none" },
   blob2: { position: "absolute", bottom: "-10%", left: "-5%", width: 350, height: 350, background: "rgba(206,229,255,0.1)", borderRadius: "50%", filter: "blur(100px)", pointerEvents: "none" },
   grid: { width: "100%", maxWidth: 1100, display: "grid", gridTemplateColumns: "1fr 1.1fr", gap: 48, alignItems: "center", position: "relative", zIndex: 10 },
   leftSide: { display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 40, paddingRight: 48 },
   mascotContainer: { width: 280, height: 280, borderRadius: "50%", overflow: "hidden", border: "8px solid #fff", boxShadow: "0 16px 48px rgba(0,0,0,0.15)" },
   mascotImg: { width: "100%", height: "100%", objectFit: "cover" },
   leftText: { display: "flex", flexDirection: "column", gap: 16 },
   leftTitle: { fontSize: 56, fontWeight: 800, color: "#001c30", letterSpacing: "-0.02em", lineHeight: 1.1, margin: 0 },
   leftSubtitle: { fontSize: 18, color: "#42474d", lineHeight: 1.6, maxWidth: 360 },
   formCard: { background: "rgba(255,255,255,0.9)", backdropFilter: "blur(24px)", padding: "48px", borderRadius: 48, boxShadow: "0 24px 64px rgba(0,0,0,0.1)", border: "1px solid rgba(255,255,255,0.5)" },
   title: { fontSize: 36, fontWeight: 900, color: "#001c30", margin: "0 0 8px 0" },
   subtitle: { fontSize: 15, color: "#42474d", marginBottom: 28 },
   errorBox: { background: "#ffe0e0", color: "#c0392b", padding: "10px 14px", borderRadius: 12, fontSize: 14, marginBottom: 16, textAlign: "center" },
   form: { display: "flex", flexDirection: "column", gap: 20 },
   fieldGroup: { display: "flex", flexDirection: "column", gap: 6 },
   label: { fontSize: 10, fontWeight: 700, color: "#001c30", letterSpacing: "0.2em", marginLeft: 4 },
   inputWrapper: { position: "relative", display: "flex", alignItems: "center" },
   inputIcon: { position: "absolute", left: 16, fontSize: 15, pointerEvents: "none" },
   input: { width: "100%", padding: "14px 16px 14px 44px", background: "#e2ece2", border: "none", borderRadius: 16, fontSize: 15, fontFamily: "inherit", color: "#161d19", outline: "none", boxSizing: "border-box" },
   twoCol: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 },
   checkRow: { display: "flex", alignItems: "center", gap: 12 },
   checkbox: { width: 20, height: 20, accentColor: "#446648", cursor: "pointer" },
   checkLabel: { fontSize: 12, color: "#42474d", fontWeight: 500, lineHeight: 1.4 },
   checkLink: { color: "#001c30", fontWeight: 700, textDecoration: "none" },
   primaryBtn: { width: "100%", padding: "18px 24px", background: "#001c30", color: "#fff", border: "none", borderRadius: 9999, fontSize: 17, fontWeight: 900, fontFamily: "inherit", cursor: "pointer", boxShadow: "0 20px 40px -10px rgba(0,28,48,0.4)", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginTop: 8 },
   divider: { display: "flex", alignItems: "center", gap: 12 },
   dividerLine: { flex: 1, height: 1, background: "rgba(195,199,206,0.3)" },
   dividerText: { fontSize: 10, fontWeight: 700, color: "#73777e", letterSpacing: "0.15em" },
   googleBtn: { width: "100%", padding: "14px 24px", background: "#fff", border: "1px solid rgba(195,199,206,0.3)", borderRadius: 9999, fontSize: 15, fontWeight: 700, fontFamily: "inherit", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 10, color: "#161d19" },
   switchText: { textAlign: "center", paddingTop: 20, fontSize: 14, color: "#42474d", fontWeight: 500 },
   switchLink: { color: "#001c30", fontWeight: 900, textDecoration: "none" },
   footer: { padding: "48px 32px", background: "#d8e6d8", textAlign: "center" },
   footerLinks: { display: "flex", justifyContent: "center", gap: 32, flexWrap: "wrap", marginBottom: 16 },
   footerLink: { fontSize: 14, fontWeight: 700, color: "#42474d", textDecoration: "none" },
   footerCopy: { fontSize: 11, fontWeight: 500, color: "rgba(66,71,77,0.7)", letterSpacing: "0.15em", textTransform: "uppercase" },
 };
 
 export default Register;
 