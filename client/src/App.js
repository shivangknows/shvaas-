 import React, { useState, useEffect } from "react";
import { Routes, Route } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "./firebase/config";
import Landing from "./pages/Landing.jsx";
import Home from "./pages/home/Home.jsx";
import Register from "./pages/auth/Register";
import Login from "./pages/auth/Login.jsx";
import VerifyOTP from "./pages/auth/VerifyOTP";
import ForgotPassword from "./pages/auth/ForgotPassword";
import Explore from "./pages/explore/Explore";
import PondOfThoughts from "./pages/thoughts/PondOfThoughts";
import ShvaasStudio from "./pages/studio/ShvaasStudio";
import GetStarted from "./pages/GetStarted";
import ShvaasBot from "./pages/chatbot/ShvaasBot";
import Profile from "./pages/profile/Profile";
import ProtectedRoute from "./components/ProtectedRoute";
import OtherProfile from "./pages/profile/OtherProfile";

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  if (loading) return <div>Loading...</div>;

  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<Landing />} />
      <Route path="/register" element={<Register />} />
      <Route path="/verify-otp" element={<VerifyOTP />} />
      <Route path="/login" element={<Login />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />

      {/* Protected Routes */}
      <Route path="/home" element={<ProtectedRoute user={user}><Home /></ProtectedRoute>} />
      <Route path="/explore" element={<ProtectedRoute user={user}><Explore /></ProtectedRoute>} />
      <Route path="/thoughts" element={<ProtectedRoute user={user}><PondOfThoughts /></ProtectedRoute>} />
      <Route path="/studio" element={<ProtectedRoute user={user}><ShvaasStudio /></ProtectedRoute>} />
      <Route path="/bot" element={<ProtectedRoute user={user}><ShvaasBot /></ProtectedRoute>} />
      <Route path="/profile" element={<ProtectedRoute user={user}><Profile /></ProtectedRoute>} />
      <Route path="/get-started" element={<ProtectedRoute user={user}><GetStarted /></ProtectedRoute>} />
      <Route path="/user/:uid" element={<ProtectedRoute user={user}><OtherProfile /></ProtectedRoute>} />
    </Routes>
  );
}

export default App;