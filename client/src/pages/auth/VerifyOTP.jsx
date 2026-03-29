 import React, { useEffect, useState } from "react";
 import { auth } from "../../firebase/config";
 import { sendEmailVerification } from "firebase/auth";
 import { useNavigate } from "react-router-dom";
 import "../../styles/auth.css";
 
 const VerifyOTP = () => {
   const [verified, setVerified] = useState(false);
   const [resent, setResent] = useState(false);
   const navigate = useNavigate();
 
   useEffect(() => {
     if (!auth.currentUser) {
       navigate("/login");
     }
   }, [navigate]);
 
   const checkVerification = async () => {
     await auth.currentUser.reload();
     if (auth.currentUser.emailVerified) {
       setVerified(true);
       navigate("/home");
     } else {
       alert("Email not verified yet. Please click the link in your email first.");
     }
   };
 
   const resendEmail = async () => {
     await sendEmailVerification(auth.currentUser);
     setResent(true);
   };
 
   return (
     <div className="auth-page">
       <div className="register-main">
         <div className="register-card">
 
           {/* ICON */}
           <div style={{ fontSize: 48, textAlign: "center", marginBottom: 8 }}>📧</div>
 
           <h2 className="rcard-title">Verify Your Email</h2>
 
           {/* MAIN MESSAGE */}
           <p className="rcard-sub">
             We've sent a verification link to{" "}
             <strong>{auth.currentUser?.email}</strong>.{" "}
             Click the link in your email to verify.
           </p>
 
           {/* SPAM WARNING */}
           <div style={{
             background: "#fff8e1",
             border: "1px solid #ffe082",
             borderRadius: 12,
             padding: "12px 16px",
             fontSize: 13,
             color: "#5d4037",
             lineHeight: 1.6,
             marginBottom: 16,
             textAlign: "center",
           }}>
             📂 <strong>Can't find the email?</strong><br />
             Check your <strong>Spam / Junk folder</strong> — verification emails sometimes land there.
             If you find it, mark it as <strong>"Not spam"</strong> so future emails arrive in your inbox.
           </div>
 
           {!verified && (
             <div className="auth-error">
               Email not verified yet. Please check your inbox and spam folder.
             </div>
           )}
 
           {resent && (
             <div style={{
               background: "#e8f5e9",
               border: "1px solid #a5d6a7",
               borderRadius: 12,
               padding: "10px 16px",
               fontSize: 13,
               color: "#2e7d32",
               textAlign: "center",
               marginBottom: 12,
             }}>
               ✅ Verification email resent! Check your inbox and spam folder.
             </div>
           )}
 
           <div className="verify-box">
             <button className="auth-submit-btn" onClick={checkVerification}>
               I've Verified My Email ✅
             </button>
 
             <button className="google-btn" onClick={resendEmail}>
               Resend Verification Email
             </button>

              
           </div>
 
           <p
             className="auth-bottom-link"
             onClick={() => navigate("/login")}
             style={{ cursor: "pointer" }}
           >
             Back to Login
           </p>
 
         </div>
       </div>
     </div>
   );
 };
 
 export default VerifyOTP;
 