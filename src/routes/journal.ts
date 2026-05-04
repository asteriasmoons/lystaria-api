import { Router } from "express";
import { claimDailyPrompt } from "../services/claimDailyPrompt";
import { generateJournalPrompt } from "../services/generateJournalPrompt";
import { generateJournalAnalysis } from "../services/generateJournalAnalysis";
import { DailyJournalAnalysis } from "../models/DailyJournalAnalysis";
import { chicagoDateKey } from "../utils/chicagoDateKey";

const router = Router();

// POST /api/journal/prompt
router.post("/prompt", async (req, res) => {
  try {
    const userId = String(req.body?.userId || "").trim();

    if (!userId) {
      return res.status(400).json({ error: "Missing userId" });
    }

    const quota = await claimDailyPrompt(userId);

    if (!quota.allowed) {
      return res.status(429).json({
        error: "DAILY_PROMPT_LIMIT_REACHED",
        message: "You've used your 3 prompts for today.",
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
    return res.status(500).json({ error: "Failed to generate prompt" });
  }
});

// GET /api/journal/analyze
router.get("/analyze", async (req, res) => {
  try {
    const userId = String(req.query?.userId || "").trim();

    if (!userId) {
      return res.status(400).json({ error: "Missing userId" });
    }

    const dateKey = chicagoDateKey(new Date());

    const existing = await DailyJournalAnalysis.findOne({ userId, dateKey }).lean();

    if (!existing) {
      return res.json({
        exists: false,
        dateKey,
      });
    }

    return res.json({
      exists: true,
      themes: existing.themes,
      mood: existing.mood,
      reflection: existing.reflection,
      dateKey,
      cached: true,
    });
  } catch (error) {
    console.error("Journal fetch error:", error);
    return res.status(500).json({ error: "Failed to fetch analysis" });
  }
});
// POST /api/journal/analyze
router.post("/analyze", async (req, res) => {
  try {
    const userId = String(req.body?.userId || "").trim();
    const entries: { title: string; body: string }[] = req.body?.entries ?? [];

    console.log("[analyze] userId:", userId, "entries count:", entries.length);
    if (entries.length > 0 && entries[0]) {
      const first = entries[0] as { title: string; body: string };
      console.log("[analyze] first entry body length:", first.body?.length);
    }

    if (!userId) {
      return res.status(400).json({ error: "Missing userId" });
    }

    if (!Array.isArray(entries) || entries.length === 0) {
      return res.status(400).json({ error: "No entries provided" });
    }

    const dateKey = chicagoDateKey(new Date());

    // Return cached result if already analyzed today
    const existing = await DailyJournalAnalysis.findOne({ userId, dateKey }).lean();
    if (existing) {
      return res.json({
        themes: existing.themes,
        mood: existing.mood,
        reflection: existing.reflection,
        dateKey,
        cached: true,
      });
    }

    const result = await generateJournalAnalysis(entries);

    await DailyJournalAnalysis.create({
      userId,
      dateKey,
      themes: result.themes,
      mood: result.mood,
      reflection: result.reflection,
    });

    return res.json({
      themes: result.themes,
      mood: result.mood,
      reflection: result.reflection,
      dateKey,
      cached: false,
    });
  } catch (error) {
    console.error("Journal analysis error:", error);
    return res.status(500).json({ error: "Failed to generate analysis" });
  }
});

export default router;
