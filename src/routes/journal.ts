import { Router } from "express";
import { claimDailyPrompt } from "../services/claimDailyPrompt";
import { generateJournalPrompt } from "../services/generateJournalPrompt";

const router = Router();

router.post("/prompt", async (req, res) => {
  try {
    const userId = String(req.body?.userId || "").trim();

    if (!userId) {
      return res.status(400).json({
        error: "Missing userId",
      });
    }

    const quota = await claimDailyPrompt(userId);

    if (!quota.allowed) {
      return res.status(429).json({
        error: "DAILY_PROMPT_LIMIT_REACHED",
        message: "You’ve used your 3 prompts for today.",
        remaining: quota.remaining,
        dateKey: quota.dateKey,
      });
    }

    const prompt = await generateJournalPrompt();

    return res.json({
      prompt,
      remaining: quota.remaining,
      dateKey: quota.dateKey,
    });
  } catch (error) {
    console.error("Prompt generation error:", error);

    return res.status(500).json({
      error: "Failed to generate prompt",
    });
  }
});

export default router;
