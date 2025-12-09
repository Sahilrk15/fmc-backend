// Load env vars (needed for local dev; Render ignores .env file)
require("dotenv").config();

const express = require("express");
const admin = require("firebase-admin");

const app = express();
app.use(express.json());

// ------------------------
// 1) Read ADMIN_JSON_BASE64
// ------------------------
const base64 = process.env.ADMIN_JSON_BASE64;

if (!base64) {
  console.error("❌ ADMIN_JSON_BASE64 missing in environment!");
  // Important: crash fast so we see it in logs
  process.exit(1);
}

let serviceAccount;

try {
  const jsonString = Buffer.from(base64, "base64").toString("utf8");
  serviceAccount = JSON.parse(jsonString);
} catch (e) {
  console.error("❌ Failed to decode ADMIN_JSON_BASE64:", e.message);
  process.exit(1);
}

// ------------------------
// 2) Initialize Firebase Admin
// ------------------------
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

// ------------------------
// 3) Endpoints
// ------------------------

// Subscribe one device token to a topic
app.post("/subscribe-topic", async (req, res) => {
  const { token, topic } = req.body || {};

  if (!token || !topic) {
    return res.status(400).json({ error: "token and topic required" });
  }

  try {
    await admin.messaging().subscribeToTopic(token, topic);
    return res.json({ success: true });
  } catch (err) {
    console.error("subscribe-topic error:", err);
    return res.status(500).json({ error: err.message });
  }
});

// Send broadcast to a topic
app.post("/send-topic", async (req, res) => {
  const { topic, title, body, url } = req.body || {};

  if (!topic) {
    return res.status(400).json({ error: "topic required" });
  }

  try {
    await admin.messaging().send({
      topic,
      notification: {
        title: title || "",
        body: body || "",
      },
      data: {
        url: url || "/",
      },
    });

    return res.json({ success: true });
  } catch (err) {
    console.error("send-topic error:", err);
    return res.status(500).json({ error: err.message });
  }
});

// ------------------------
// 4) Start server
// ------------------------
const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
  console.log("🔥 Backend running on port", PORT);
});
