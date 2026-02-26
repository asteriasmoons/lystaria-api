import { verifyAccessToken } from "../utils/jwt.js";
import { User } from "../Models/User.js";

export async function requireAuth(req, res, next) {
  try {
    const header = req.headers.authorization || "";
    const [type, token] = header.split(" ");

    if (type !== "Bearer" || !token) {
      return res.status(401).json({ message: "Missing bearer token" });
    }

    const decoded = verifyAccessToken(token);
    const user = await User.findById(decoded.uid);

    if (!user) return res.status(401).json({ message: "User not found" });

    // Optional tokenVersion check (revocation support)
    if (decoded.tv !== user.tokenVersion) {
      return res.status(401).json({ message: "Token revoked" });
    }

    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid token" });
  }
}
