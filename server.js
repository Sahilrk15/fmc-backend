const admin = require("firebase-admin");
const express = require("express");

const app = express();
app.use(express.json());

// Load Firebase admin service account
const serviceAccount = require("./freemycost-dev-firebase-adminsdk-fbsvc-ae9d067ab1.json");

// Initialize admin SDK
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

// Endpoint to send notification to topic: all-users
app.post("/notify-all", async (req, res) => {
  try {
    const { title, body } = req.body;

    const message = {
      notification: { title, body },
      topic: "all-users",
    };

    await admin.messaging().send(message);
    return res.json({ success: true });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ success: false, error });
  }
});

app.post('/subscribe', async (req, res) => {
  try {
    const { token } = req.body;
    if (!token) return res.status(400).json({ error: 'Token required' });

    await admin.messaging().subscribeToTopic(token, 'all-users');

    return res.json({ success: true });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
});

//---------------------------------------------
// ⭐ STEP: SUBSCRIBE A TOKEN TO ANY TOPIC
//---------------------------------------------
app.post("/subscribe-topic", async (req, res) => {
  try {
    const { token, topic } = req.body;

    if (!token || !topic) {
      return res.status(400).json({ error: "token and topic required" });
    }

    await admin.messaging().subscribeToTopic(token, topic);

    return res.json({ success: true, subscribed: true });
  } catch (err) {
    console.error("Topic subscribe error:", err);
    return res.status(500).json({ error: err.message });
  }
});

//---------------------------------------------
// ⭐ STEP: SEND BROADCAST TO TOPIC
//---------------------------------------------
app.post("/send-topic", async (req, res) => {
  try {
    const { topic, title, body, url } = req.body;

    if (!topic) return res.status(400).json({ error: "topic required" });

    const message = {
      topic,
      notification: { title, body },
      data: { url: url || "/" },
    };

    await admin.messaging().send(message);
    return res.json({ success: true, sent: true });
  } catch (err) {
    console.error("Send topic broadcast failed:", err);
    return res.status(500).json({ error: err.message });
  }
});

// Start backend server
app.listen(4000, () => {
  console.log("Backend running on http://localhost:4000");
});
