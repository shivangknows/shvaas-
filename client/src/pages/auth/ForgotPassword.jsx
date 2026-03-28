 import React, { useState, useRef } from "react";
 import { auth } from "../../firebase/config";
 import { sendPasswordResetEmail } from "firebase/auth";
 import { Link } from "react-router-dom";
 
 const ForgotPassword = () => {
   const [email, setEmail] = useState("");
   const [otp, setOtp] = useState(["", "", "", "", "", ""]);
   const [message, setMessage] = useState("");
   const [error, setError] = useState("");
   const [loading, setLoading] = useState(false);
   const otpRefs = useRef([]);
 
   const handleSendOtp = async (e) => {
     e.preventDefault();
     setError(""); setMessage("");
     setLoading(true);
     try {
       await sendPasswordResetEmail(auth, email);
       setMessage("Reset link sent! Check your inbox.");
     } catch (err) {
       if (err.code === "auth/user-not-found") setError("No account found with this email.");
       else setError(err.message);
     }
     setLoading(false);
   };
 
   const handleOtpChange = (index, value) => {
     if (!/^\d*$/.test(value)) return;
     const newOtp = [...otp];
     newOtp[index] = value.slice(-1);
     setOtp(newOtp);
     if (value && index < 5) otpRefs.current[index + 1]?.focus();
   };
 
   const handleOtpKeyDown = (index, e) => {
     if (e.key === "Backspace" && !otp[index] && index > 0) {
       otpRefs.current[index - 1]?.focus();
     }
   };
 
   const handleResend = async () => {
     setError(""); setMessage("");
     try {
       await sendPasswordResetEmail(auth, email);
       setMessage("Code resent! Check your inbox.");
     } catch (err) { setError(err.message); }
   };
 
   return (
     <div style={{
       minHeight: "100vh",
       display: "flex",
       flexDirection: "row",
       fontFamily: "'Plus Jakarta Sans', 'Segoe UI', sans-serif",
       overflow: "hidden",
     }}>
       {/* ── LEFT PANEL ── */}
       <div style={{
         width: "50%",
         minHeight: "100vh",
         background: "#eef5ee",
         display: "flex",
         alignItems: "center",
         justifyContent: "center",
         padding: "64px",
         position: "relative",
         overflow: "hidden",
         boxSizing: "border-box",
       }}>
         {/* blobs */}
         <div style={{ position:"absolute", top:-96, left:-96, width:380, height:380, borderRadius:"50%", background:"rgba(195,234,195,0.35)", filter:"blur(80px)", pointerEvents:"none" }} />
         <div style={{ position:"absolute", bottom:0, right:0, width:320, height:320, borderRadius:"50%", background:"rgba(206,229,255,0.2)", filter:"blur(100px)", pointerEvents:"none" }} />
 
         {/* bg texture */}
         <div style={{ position:"absolute", inset:0, zIndex:0, opacity:0.1, filter:"grayscale(1)", mixBlendMode:"multiply", pointerEvents:"none" }}>
           <img
             src="https://lh3.googleusercontent.com/aida-public/AB6AXuCKKcUoR0f_yj2nLvdtFdDjFmE6h6tke9swG-ynwdcgoWkU2t1Ar50mxQabgTcCGaW-APa_igq95Np-o5blH009O1YbuNNSWKjbMnmS0d0lVqCZvyIIFBi0B3noYai88ibLn66v758-cK7cTnXVBZcfQVPxAdiKUloSSFdOJqwAe4JbMSsOB6U0k4cq8DzLb2ig8QQ1AT-x4es5yxsSdsTlNPaiWfmPLdaPQftXx0fxFichOi5h0z_xuxDDKyzPrukWjGFIIIEdqIgT"
             alt=""
             style={{ width:"100%", height:"100%", objectFit:"cover" }}
           />
         </div>
 
         {/* content */}
         <div style={{ position:"relative", zIndex:1, maxWidth:400 }}>
           {/* brand */}
           <div style={{ display:"flex", alignItems:"center", gap:16, marginBottom:20 }}>
             <span style={{ fontSize:56 }}>🪷</span>
             <h1 style={{ fontSize:52, fontWeight:800, color:"#001c30", margin:0, letterSpacing:-2 }}>श्वास</h1>
           </div>
 
           <p style={{ fontSize:18, color:"rgba(0,28,48,0.6)", fontWeight:500, lineHeight:1.6, margin:"0 0 48px" }}>
             Pause. Take a deep breath.<br />
             We'll help you find your way back to tranquility.
           </p>
 
           {/* quote card */}
           <div style={{
             background:"rgba(255,255,255,0.4)",
             backdropFilter:"blur(12px)",
             border:"1px solid rgba(255,255,255,0.25)",
             borderRadius:16,
             padding:24,
           }}>
             <p style={{ fontSize:14, fontStyle:"italic", color:"#42474d", lineHeight:1.7, margin:0 }}>
               "The soul always knows what to do to heal itself. The challenge is to silence the mind."
             </p>
           </div>
         </div>
       </div>
 
       {/* ── RIGHT PANEL ── */}
       <div style={{
         width:"50%",
         minHeight:"100vh",
         background:"#f4fbf4",
         display:"flex",
         alignItems:"center",
         justifyContent:"center",
         padding:"48px",
         boxSizing:"border-box",
       }}>
         <div style={{ width:"100%", maxWidth:440 }}>
 
           {/* heading */}
           <div style={{ marginBottom:40 }}>
             <h2 style={{ fontSize:32, fontWeight:700, color:"#161d19", margin:"0 0 8px" }}>Recover Peace</h2>
             <p style={{ fontSize:15, color:"#42474d", fontWeight:500, margin:0 }}>Forgot your password? No worries, let's reset it.</p>
           </div>
 
           {error && (
             <div style={{ background:"#ffe0e0", color:"#c0392b", padding:"10px 16px", borderRadius:12, fontSize:14, marginBottom:16, textAlign:"center" }}>
               {error}
             </div>
           )}
           {message && (
             <div style={{ background:"#e0ffe0", color:"#27ae60", padding:"10px 16px", borderRadius:12, fontSize:14, marginBottom:16, textAlign:"center" }}>
               {message}
             </div>
           )}
 
           <form onSubmit={handleSendOtp} style={{ display:"flex", flexDirection:"column", gap:24 }}>
 
             {/* Email */}
             <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
               <label style={{ fontSize:10, fontWeight:700, color:"#001c30", letterSpacing:"0.2em", textTransform:"uppercase" }}>
                 EMAIL ADDRESS
               </label>
               <div style={{ display:"flex", alignItems:"center", background:"white", borderRadius:12, padding:"0 16px", gap:10, boxShadow:"0 0 0 1px rgba(195,199,206,0.4)" }}>
                 <span style={{ fontSize:16, opacity:0.6 }}>✉️</span>
                 <input
                   type="email"
                   placeholder="hello@calm.com"
                   value={email}
                   onChange={(e) => setEmail(e.target.value)}
                   required
                   style={{ flex:1, border:"none", background:"transparent", padding:"16px 0", fontSize:15, fontFamily:"inherit", color:"#161d19", outline:"none" }}
                 />
               </div>
             </div>
 
             {/* OTP */}
             <div style={{ display:"flex", flexDirection:"column", gap:14, paddingTop:24, borderTop:"1px solid #dde4de" }}>
               <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-end" }}>
                 <label style={{ fontSize:11, fontWeight:700, color:"#161d19", letterSpacing:"0.15em", textTransform:"uppercase" }}>
                   ENTER 6-DIGIT OTP
                 </label>
                 <button
                   type="button"
                   onClick={handleResend}
                   style={{ background:"none", border:"none", fontSize:11, fontWeight:700, color:"#001c30", cursor:"pointer", letterSpacing:"0.15em", textTransform:"uppercase", fontFamily:"inherit", padding:0 }}
                 >
                   RESEND CODE
                 </button>
               </div>
 
               {/* OTP boxes */}
               <div style={{ display:"grid", gridTemplateColumns:"repeat(6, 1fr)", gap:10 }}>
                 {otp.map((digit, i) => (
                   <input
                     key={i}
                     ref={(el) => (otpRefs.current[i] = el)}
                     type="text"
                     maxLength={1}
                     value={digit}
                     onChange={(e) => handleOtpChange(i, e.target.value)}
                     onKeyDown={(e) => handleOtpKeyDown(i, e)}
                     inputMode="numeric"
                     style={{
                       width:"100%",
                       aspectRatio:"1",
                       textAlign:"center",
                       fontSize:20,
                       fontWeight:700,
                       fontFamily:"inherit",
                       background:"white",
                       border:"none",
                       borderRadius:12,
                       outline:"none",
                       boxShadow: digit ? "0 0 0 2px #416180" : "0 0 0 1px rgba(195,199,206,0.5)",
                       color:"#161d19",
                       boxSizing:"border-box",
                       transition:"box-shadow 0.2s",
                     }}
                   />
                 ))}
               </div>
 
               <p style={{ fontSize:12, color:"#42474d", fontWeight:500, margin:0 }}>
                 We've sent a code to your registered email.
               </p>
             </div>
 
             {/* Submit */}
             <button
               type="submit"
               disabled={loading}
               style={{
                 width:"100%",
                 padding:"18px",
                 background: loading ? "#aaa" : "#001c30",
                 color:"white",
                 border:"none",
                 borderRadius:9999,
                 fontSize:17,
                 fontFamily:"inherit",
                 fontWeight:800,
                 cursor: loading ? "not-allowed" : "pointer",
                 boxShadow:"0 20px 40px rgba(0,28,48,0.25)",
                 transition:"all 0.3s",
                 marginTop:4,
               }}
             >
               {loading ? "Sending..." : "Reset Password →"}
             </button>
           </form>
 
           {/* Back to login */}
           <div style={{ textAlign:"center", marginTop:48 }}>
             <Link
               to="/login"
               style={{ fontSize:15, fontWeight:600, color:"#42474d", textDecoration:"none", display:"inline-flex", alignItems:"center", gap:6 }}
             >
               ← Back to Login
             </Link>
           </div>
 
           {/* ambient bar */}
           <div style={{ width:48, height:4, background:"rgba(66,71,77,0.15)", borderRadius:9999, margin:"32px auto 0" }} />
         </div>
       </div>
 
       {/* SYSTEM SECURED badge */}
       <div style={{
         position:"fixed",
         bottom:32,
         left:32,
         display:"flex",
         alignItems:"center",
         gap:10,
         background:"rgba(255,255,255,0.8)",
         backdropFilter:"blur(16px)",
         padding:"8px 18px",
         borderRadius:9999,
         boxShadow:"0 2px 8px rgba(0,0,0,0.06)",
         border:"1px solid rgba(195,199,206,0.2)",
         zIndex:100,
       }}>
         <span style={{ width:8, height:8, background:"#446648", borderRadius:"50%", display:"inline-block" }} />
         <span style={{ fontSize:10, fontWeight:700, letterSpacing:"0.2em", textTransform:"uppercase", color:"#42474d" }}>
           SYSTEM SECURED
         </span>
       </div>
     </div>
   );
 };
 
 export default ForgotPassword;
 