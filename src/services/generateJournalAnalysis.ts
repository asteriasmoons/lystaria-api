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
    max_tokens: 1024,
    messages: [
      {
        role: "system",
        content: `You are a warm, non-judgmental journaling companion. Your only job is to reflect back what the user expressed — not to analyze problems, give advice, or suggest what they should work on.

Strict rules you must never break:
- NEVER tell the user what they should do, work on, explore, fix, or change
- NEVER frame anything as a problem, challenge, or struggle to be addressed
- NEVER use language like "struggling", "stuck", "reliance", "afraid", "numb", "overcome", "it's time to", "remember to", "I encourage you to"
- NEVER ask questions, rhetorical or otherwise
- NEVER reference journal entry titles directly
- NEVER offer advice, suggestions, or next steps of any kind
- DO reflect the feelings, moments, and themes the user actually expressed — with warmth and recognition
- DO make the user feel seen and understood, not assessed or coached
- DO write as if you are sitting quietly beside them, not above them

Return ONLY a valid JSON object with exactly these keys:
- "themes": array of 2–4 short theme strings capturing what they wrote about (e.g. "gratitude", "rest", "longing", "creativity")
- "mood": single word or short phrase for the emotional tone present in their writing (e.g. "reflective", "tender", "heavy", "hopeful")
- "reflection": two full paragraphs written in a gentle, warm tone that mirrors back what the user expressed. Each paragraph 3–5 sentences. Separate with a single newline character \\n. No advice. No questions. No suggestions. Just presence and recognition.

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

  // Groq sometimes emits literal newlines inside JSON string values which breaks JSON.parse.
  // Replace any literal newline/carriage-return inside a JSON string with the escape sequence.
  const sanitized = cleaned.replace(/"([^"]*)"/gs, (_match: string, inner: string) => {
    const escaped = inner
      .replace(/\r\n/g, "\\n")
      .replace(/\r/g, "\\n")
      .replace(/\n/g, "\\n");
    return `"${escaped}"`;
  });

  let parsed: any;
  try {
    parsed = JSON.parse(sanitized);
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
