// server.js
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
dotenv.config();

import { db } from "./firebase.js";
import { verifyFirebaseToken } from "./middleware/auth.js";
import { submitCode } from "./utils/judge0.js";

const app = express();
app.use(cors());
app.use(express.json());

// language mapping (common)
const LANGUAGE_MAP = {
  javascript: 63, // Node.js (JS)
  python: 71,     // Python 3
  cpp: 54,        // C++ (g++ / 14 maybe)
  c: 50,
  java: 62
};

// ------------------ ADMIN: add question ------------------
// Protected endpoint — requires Firebase ID token of admin user
app.post("/api/admin/addContest", verifyFirebaseToken, async (req, res) => {
  try {
    const docRef = await db.collection("contests").add({
      ...req.body,
      createdAt: new Date()
    });
    res.json({ message: "Contest added", id: docRef.id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

app.put("/api/admin/updateContest/:id", verifyFirebaseToken, async (req, res) => {
    try {
      const { id } = req.params;
      await db.collection("contests").doc(id).update({
        ...req.body,
      });
      res.json({ message: "Contest updated", id });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Server error", error: err.message });
    }
});

app.delete("/api/admin/deleteContest/:id", verifyFirebaseToken, async (req, res) => {
    try {
        const { id } = req.params;
        await db.collection("contests").doc(id).delete();
        res.json({ message: "Contest deleted", id });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error", error: err.message });
    }
});


// ------------------ GET questions ------------------
app.get("/api/contests", async (req, res) => {
  try {
    const snap = await db.collection("contests").orderBy("startTime", "desc").get();
    const contests = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.json(contests);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

app.get("/api/contests/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const doc = await db.collection("contests").doc(id).get();
        if (!doc.exists) {
            return res.status(404).json({ message: "Contest not found" });
        }
        res.json({ id: doc.id, ...doc.data() });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error" });
    }
});


// ------------------ USER SUBMIT ------------------
app.post("/api/user/submit", verifyFirebaseToken, async (req, res) => {
  try {
    const uid = req.user.uid;
    const { questionId, code, language, contestId, testInput } = req.body;
    if (!code || !language) return res.status(400).json({ message: "code, language required" });


    const language_id = LANGUAGE_MAP[language.toLowerCase()];
    if (!language_id) return res.status(400).json({ message: "Unsupported language" });

    // Submit to Judge0
    const judgeResp = await submitCode({
      source_code: code,
      stdin: testInput,
      language_id
    });
    
    // judgeResp typically contains: stdout, stderr, status
    const stdout = (judgeResp.stdout || null);
    const stderr = judgeResp.stderr || null;
    const compile_output = judgeResp.compile_output || null;
    
    const matched = stdout === String(q.expectedOutput).trim();

    // Update attempts history (optional)
    const attemptDoc = {
      userId: uid,
      questionId,
      code,
      language,
      stdout,
      stderr,
      compile_output,
      correct: matched,
      createdAt: new Date()
    };
    if (questionId) {
      await db.collection("submissions").add(attemptDoc);
    }
    
    if (questionId && matched) {
      // update user score atomically
      const userRef = db.collection("users").doc(uid);
      const qDoc = await db.collection("questions").doc(questionId).get();
      if (!qDoc.exists) return res.status(404).json({ message: "Question not found" });
      const q = qDoc.data();

      await db.runTransaction(async (t) => {
        const userDoc = await t.get(userRef);
        if (userDoc.exists) {
          const cur = Number(userDoc.data().score || 0);
          t.update(userRef, { score: cur + (Number(q.score) || 0), name: userDoc.data().name || "" });
        } else {
          t.set(userRef, { score: Number(q.score) || 0, name: req.user.name || "" });
        }
      });

      return res.json({ success: true, message: "Correct answer!", stdout, stderr, compile_output });
    } else {
      return res.json({ success: false, message: "Wrong answer", stdout, stderr, compile_output });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// ------------------ LEADERBOARD ------------------
app.get("/api/admin/leaderboard", verifyFirebaseToken, async (req, res) => {
  try {
    // Optionally check admin claim here
    const snap = await db.collection("users").orderBy("score", "desc").limit(100).get();
    const board = snap.docs.map(doc => ({ userId: doc.id, ...doc.data() }));
    res.json(board);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on ${PORT}`));
