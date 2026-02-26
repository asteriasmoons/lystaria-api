import express from "express";
import { requireAuth } from "../middleware/requireAuth.js";

export const meRouter = express.Router();

meRouter.get("/", requireAuth, async (req, res) => {
  const user = req.user;
  return res.json({
    id: user._id.toString(),
    email: user.email || null,
    name: user.name || null,
  });
});
