import React from "react";
import { useNavigate } from "react-router-dom";
import { auth } from "../firebase/config";

/**
 * Drop this component into any post-login page navbar.
 * It shows the user's avatar and navigates to /profile on click.
 */
const ProfileIcon = () => {
  const navigate = useNavigate();
  const user = auth.currentUser;
  const avatarUrl = `https://api.dicebear.com/7.x/personas/svg?seed=${user?.uid || "default"}`;

  return (
    <button
      onClick={() => navigate("/profile")}
      title="My Profile"
      style={{
        background: "transparent",
        border: "2px solid rgba(195,199,206,0.4)",
        borderRadius: "9999px",
        width: "36px",
        height: "36px",
        padding: "0",
        cursor: "pointer",
        overflow: "hidden",
        transition: "border-color 0.2s, transform 0.2s",
        flexShrink: 0,
      }}
      onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#446648"; e.currentTarget.style.transform = "scale(1.08)"; }}
      onMouseLeave={(e) => { e.currentTarget.style.borderColor = "rgba(195,199,206,0.4)"; e.currentTarget.style.transform = "scale(1)"; }}
    >
      <img
        src={avatarUrl}
        alt="profile"
        style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
      />
    </button>
  );
};

export default ProfileIcon;
