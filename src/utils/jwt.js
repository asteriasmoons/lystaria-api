import jwt from "jsonwebtoken";
import { config } from "../config.js";

export function signAccessToken(user) {
  return jwt.sign(
    { uid: user._id.toString(), tv: user.tokenVersion },
    config.jwtAccessSecret,
    { expiresIn: config.accessTtl },
  );
}

export function signRefreshToken(user) {
  return jwt.sign(
    { uid: user._id.toString(), tv: user.tokenVersion },
    config.jwtRefreshSecret,
    { expiresIn: config.refreshTtl },
  );
}

export function verifyAccessToken(token) {
  return jwt.verify(token, config.jwtAccessSecret);
}

export function verifyRefreshToken(token) {
  return jwt.verify(token, config.jwtRefreshSecret);
}
