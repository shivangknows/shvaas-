 import React, { useEffect, useState } from "react";
import { auth } from "../../firebase/config";
import { sendEmailVerification } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import "../../styles/auth.css";

const VerifyOTP = () => {
  const [verified, setVerified] = useState(false);
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
      alert("Email verified successfully!");
      navigate("/home");
    } else {
      alert("Still not verified.");
    }
  };

  const resendEmail = async () => {
    await sendEmailVerification(auth.currentUser);
    alert("Verification email sent again!");
  };

  return (
    <div className="auth-page">
      <div className="register-main">
        
        {/* RIGHT CARD ONLY */}
        <div className="register-card">
          <h2 className="rcard-title">Verify Your Email</h2>

          <p className="rcard-sub">
            We’ve sent a verification link to{" "}
            <strong>{auth.currentUser?.email}</strong>
          </p>

          {!verified && (
            <div className="auth-error">
              Email not verified yet. Please check your inbox.
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