// middleware/auth.js
import { auth } from "../firebase.js";

export async function verifyFirebaseToken(req, res, next) {
  const header = req.headers.authorization || "";
  const match = header.match(/^Bearer (.*)$/);
  if (!match) return res.status(401).json({ message: "No token provided" });

  const idToken = match[1];
  try {
    const decoded = await auth.verifyIdToken(idToken);
    req.user = decoded; // contains uid, email, etc.
    next();
  } catch (err) {
    console.error("Token verification error:", err);
    res.status(401).json({ message: "Invalid or expired token" });
  }
}
