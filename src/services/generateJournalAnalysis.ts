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
    messages: [
      {
        role: "system",
        content: `You are a thoughtful journaling companion. Analyze the user's journal entries and return ONLY a valid JSON object — no markdown, no code fences, no preamble.

The JSON must have exactly these keys:
- "themes": array of 2–4 short theme strings (e.g. "self-doubt", "gratitude", "transition")
- "mood": single word or short phrase for the dominant emotional tone (e.g. "reflective", "anxious", "hopeful")
- "reflection": two full paragraphs of warm, perceptive analysis synthesizing what emerged across today's entries. Be specific to what the user actually wrote. Write as if speaking directly to them. Each paragraph should be 3–5 sentences. Separate paragraphs with a single newline character \\n.

Return nothing except the JSON object.`,
      },
      {
        role: "user",
        content: `Here are my journal entries from today:\n\n${entryText}`,
      },
    ],
  };

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

  // Strip any accidental markdown fences
  const cleaned = raw.replace(/^```json\s*/i, "").replace(/```\s*$/, "").trim();
  console.log("[analyze] Cleaned response:", cleaned);

  let parsed: any;
  try {
    parsed = JSON.parse(cleaned);
  } catch (e) {
    console.error("[analyze] JSON parse error:", e);
    throw new Error(`Failed to parse Groq JSON response: ${cleaned}`);
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
