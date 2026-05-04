const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
const MODEL = "llama-3.1-8b-instant";

export interface JournalAnalysisResult {
  themes: string[];
  mood: string;
  reflection: string;
}

interface EntryInput {
  title: string;
  body: string;
}

export async function generateJournalAnalysis(
  entries: EntryInput[],
): Promise<JournalAnalysisResult> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error("Missing GROQ_API_KEY");

  const entryText = entries
    .map((e, i) => `Entry ${i + 1}: "${e.title}"\n${e.body.trim()}`)
    .join("\n\n---\n\n");

  const body = {
    model: MODEL,
    temperature: 0.7,
    max_tokens: 2222,
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content: `You are a warm, emotionally intelligent journaling companion.

Your job is not to summarize the entries. Your job is to synthesize them into a deeper emotional reflection that helps the user feel seen.

Focus on:
- the emotional undercurrent beneath the writing
- repeated themes or patterns across entries
- tensions, contrasts, or shifts in tone
- what seems meaningful, tender, unresolved, comforting, heavy, hopeful, or important
- the inner story the writing seems to reveal

Do not repeat details back unless they are necessary for insight.
Do not list what happened.
Do not give advice, instructions, action steps, or coaching.
Do not ask questions.
Do not diagnose, judge, or over-pathologize.
Do not frame the user as broken or needing to be fixed.

Write with warmth, depth, and emotional nuance.
Sound like a thoughtful journal companion, not a therapist, coach, or report generator.

Return a JSON object with exactly these keys:
- "themes": array of 2–4 theme tags. 
Each theme must be 1–3 words max. 
No full sentences. No punctuation like "vs." or commas. 
Keep them simple, clear, and scannable (e.g. "low energy", "seeking support", "creative comfort").
- "mood": single word or short phrase for the emotional tone
- "reflection": a single string containing two paragraphs separated by \\n. Each paragraph 3–5 sentences. The reflection should feel insightful, emotionally specific, and gently interpretive without becoming advice.`,
      },
      {
        role: "user",
        content: `Here are my journal entries from today:\n\n${entryText}`,
      },
    ],
  };

  console.log("[analyze] Sending request to Groq...");

  const resp = await fetch(GROQ_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  console.log("[analyze] Groq status:", resp.status);

  if (!resp.ok) {
    const text = await resp.text().catch(() => "");
    console.error("[analyze] Groq error body:", text);
    throw new Error(`Groq error ${resp.status}: ${text}`);
  }

  const json: any = await resp.json();
  const raw = String(json?.choices?.[0]?.message?.content || "").trim();
  console.log("[analyze] Groq raw response:", raw);

  let parsed: any;
  try {
    parsed = JSON.parse(raw);
  } catch (e) {
    console.error("[analyze] JSON parse error:", e);
    throw new Error(`Failed to parse Groq JSON response: ${raw}`);
  }

  console.log("[analyze] Parsed:", JSON.stringify(parsed));

  const themes = Array.isArray(parsed.themes)
    ? parsed.themes.map((t: any) => String(t).trim()).filter(Boolean)
    : [];
  const mood = String(parsed.mood || "").trim();
  const reflection = String(parsed.reflection || "").trim();

  console.log("[analyze] themes:", themes, "mood:", mood, "reflection length:", reflection.length);

  if (!mood || !reflection || themes.length === 0) {
    throw new Error("Groq returned incomplete analysis fields");
  }

  return { themes, mood, reflection };
}
