const express = require("express");
const cors = require("cors");
const axios = require("axios");
require("dotenv").config();

const GROQ_KEY = "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";


const app = express();
app.use(cors());
app.use(express.json());

// Health check
app.get("/", (req, res) => {
  res.send("Shvaas backend is running 🌿");
});

// Groq proxy route
app.post("/api/chat", async (req, res) => {
  try {
    const { messages } = req.body;

    const response = await axios.post(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        model: "llama-3.3-70b-versatile",
        max_tokens: 1000,
        messages,
      },
      {
        headers: {
          "Authorization": `Bearer ${GROQ_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    res.json(response.data);
  } catch (err) {
    console.error("Groq error:", err.response?.data || err.message);
    res.status(500).json({ error: err.response?.data || err.message });
  }
});

const PORT = process.env.PORT || 5000;
// Keep server awake — ping every 14 minutes
const https = require("https");
setInterval(() => {
  https.get("https://shvaas-backend.onrender.com", (res) => {
    console.log("Keep alive ping:", res.statusCode);
  }).on("error", (e) => console.log("Ping error:", e.message));
}, 14 * 60 * 1000);
app.listen(PORT, () => console.log(`✅ Shvaas backend running on port ${PORT}`));