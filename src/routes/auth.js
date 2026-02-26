import express from "express";
import bcrypt from "bcryptjs";
import { User } from "../Models/User.js";
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} from "../utils/jwt.js";
import { verifyAppleIdentityToken } from "../utils/apple.js";

export const authRouter = express.Router();

function authResponse(user) {
  return {
    accessToken: signAccessToken(user),
    refreshToken: signRefreshToken(user),
    user: {
      id: user._id.toString(),
      email: user.email || null,
      name: user.name || null,
    },
  };
}

// Email signup
authRouter.post("/email/signup", async (req, res) => {
  const { email, password, name } = req.body || {};
  if (!email || !password)
    return res.status(400).json({ message: "Email and password required" });

  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing)
    return res.status(409).json({ message: "Email already in use" });

  const passwordHash = await bcrypt.hash(password, 12);

  const user = await User.create({
    email: email.toLowerCase(),
    name: name || null,
    passwordHash,
  });

  return res.json(authResponse(user));
});

// Email login
authRouter.post("/email/login", async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password)
    return res.status(400).json({ message: "Email and password required" });

  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user || !user.passwordHash)
    return res.status(401).json({ message: "Invalid credentials" });

  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) return res.status(401).json({ message: "Invalid credentials" });

  return res.json(authResponse(user));
});

// Sign in with Apple
authRouter.post("/apple", async (req, res) => {
  const { identityToken, authorizationCode, fullName, email } = req.body || {};
  if (!identityToken)
    return res.status(400).json({ message: "Missing identityToken" });

  // Verify Apple identity token (JWT)
  let payload;
  try {
    payload = await verifyAppleIdentityToken(identityToken);
  } catch (err) {
    return res.status(401).json({ message: "Invalid Apple identity token" });
  }

  const appleSub = payload.sub;
  const appleEmail = payload.email || email || null;

  // Find by appleSub first
  let user = await User.findOne({ appleSub });

  // If not found, try linking by email if present
  if (!user && appleEmail) {
    user = await User.findOne({ email: appleEmail.toLowerCase() });
    if (user && !user.appleSub) {
      user.appleSub = appleSub;
      if (!user.name && fullName) user.name = fullName;
      await user.save();
    }
  }

  // Create new user if still not found
  if (!user) {
    user = await User.create({
      appleSub,
      email: appleEmail ? appleEmail.toLowerCase() : null,
      name: fullName || null,
    });
  }

  // Note: authorizationCode is included for future expansion (server-to-Apple token exchange)
  // For most app flows, verifying identityToken is the key step.

  return res.json(authResponse(user));
});

// Refresh
authRouter.post("/refresh", async (req, res) => {
  const { refreshToken } = req.body || {};
  if (!refreshToken)
    return res.status(400).json({ message: "Missing refreshToken" });

  try {
    const decoded = verifyRefreshToken(refreshToken);
    const user = await User.findById(decoded.uid);
    if (!user) return res.status(401).json({ message: "User not found" });

    if (decoded.tv !== user.tokenVersion) {
      return res.status(401).json({ message: "Token revoked" });
    }

    return res.json(authResponse(user));
  } catch {
    return res.status(401).json({ message: "Invalid refresh token" });
  }
});
