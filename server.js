require("dotenv").config();

const admin = require("firebase-admin");
const express = require("express");
const app = express();
app.use(express.json());

// decode Firebase admin JSON from BASE64 env variable
const base64 = process.env.ADMIN_JSON_BASE64;

if (!base64) {
  console.error("❌ ADMIN_JSON_BASE64 missing in environment!");
  process.exit(1);
}

const jsonString = Buffer.from(base64, "base64").toString("utf8");
const serviceAccount = JSON.parse(jsonString);

// init firebase admin
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

// =====================================
// SUBSCRIBE AND SEND ENDPOINTS
// =====================================
app.post("/subscribe-topic", async (req, res) => {
  try {
    const { token, topic } = req.body;
    if (!token || !topic) throw new Error("token and topic required");
    await admin.messaging().subscribeToTopic(token, topic);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/send-topic", async (req, res) => {
  try {
    const { topic, title, body, url } = req.body;
    if (!topic) throw new Error("topic required");
    await admin.messaging().send({
      topic,
      notification: { title, body },
      data: { url: url || "/" }
    });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log("🔥 Backend ready on port " + PORT));
