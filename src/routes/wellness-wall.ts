import express from "express";

const router = express.Router();

type WellnessWallRequest = {
  journal: {
    entryCount: number;
    topTags: string[];
  };
  water: {
    currentOz: number;
    goalOz: number;
    progress: number;
  };
  steps: {
    currentSteps: number;
    goalSteps: number;
    progress: number;
  };
  habits: {
    completedActions: number;
    targetActions: number;
    progress: number;
  };
};

type WellnessWallResponse = {
  journal: string | null;
  water: string | null;
  steps: string | null;
  habits: string | null;
};

type GroqChatCompletionResponse = {
  choices?: Array<{
    message?: {
      content?: string;
    };
  }>;
};

router.post("/wellness-wall", async (req, res) => {
  try {
    const body = req.body as WellnessWallRequest;

    const apiKey = process.env.GROQ_WALL_KEY;

    if (!apiKey) {
      return res.status(500).json({ error: "Missing GROQ_WALL_KEY" });
    }

    const prompt = `
Write four Wellness Wall insights for a self-care dashboard.

Rules:
- Return valid JSON only.
- Return exactly these keys: journal, water, steps, habits.
- Each value must be one sentence.
- Each sentence must include one specific data point.
- Each sentence must include one interpretation.
- Journal focuses on today's journal tags and themes.
- Water focuses on hydration progress.
- Steps focuses on movement level.
- Habits focuses on routine completion.
- Do not repeat the same phrasing between categories.
- Do not give generic motivation.
- Do not diagnose, moralize, or overstate.

Data:
${JSON.stringify(body, null, 2)}
`;

    const aiResponse = await fetch(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "llama-3.1-8b-instant",
          messages: [
            {
              role: "user",
              content: prompt,
            },
          ],
          temperature: 0.4,
        }),
      },
    );

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      return res.status(500).json({
        error: "AI request failed",
        details: errorText,
      });
    }

    const aiData = (await aiResponse.json()) as GroqChatCompletionResponse;

    const outputText =
      aiData.choices?.[0]?.message?.content ?? "";

    let parsed: WellnessWallResponse;

    try {
      const jsonMatch = outputText.match(/\{[\s\S]*\}/);

      if (!jsonMatch) {
        return res.status(500).json({
          error: "AI response did not contain JSON",
          raw: outputText,
        });
      }

      parsed = JSON.parse(jsonMatch[0]) as WellnessWallResponse;
    } catch {
      return res.status(500).json({
        error: "AI returned invalid JSON",
        raw: outputText,
      });
    }

    return res.json({
      journal: parsed.journal ?? null,
      water: parsed.water ?? null,
      steps: parsed.steps ?? null,
      habits: parsed.habits ?? null,
    });
  } catch {
    return res.status(500).json({
      error: "Wellness Wall request failed",
    });
  }
});

export default router;
