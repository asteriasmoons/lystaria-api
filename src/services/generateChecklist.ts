const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";

function pickModel() {
  return process.env.GROQ_MODEL || "llama-3.1-8b-instant";
}

export async function generateChecklist(
  taskNames: string[],
  prompt?: string
): Promise<string[]> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error("Missing GROQ_API_KEY");

  const taskList = taskNames.map((n, i) => `${i + 1}. ${n}`).join("\n");
  const userInstruction = prompt?.trim()
    ? `Additional instructions from the user: ${prompt.trim()}`
    : "No additional instructions.";

  const body = {
    model: pickModel(),
    temperature: 0.7,
    max_tokens: 600,
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content: `You generate practical, action-oriented checklist steps for household tasks.

Rules:
- Return a JSON object with exactly one key: "items" — an array of strings.
- Each item must be a short, clear action step (3–8 words ideally).
- Aim for 4–7 items total across all tasks provided.
- If multiple tasks are provided, write shared steps that apply to all of them, not per-task breakdowns.
- If a single task is provided, write steps specific to that task.
- Steps should follow a natural order: gather → do → finish → reset.
- Never include numbering, bullet characters, or markdown in the item strings.
- Respect any tone instructions from the user (simple, low-energy, deep clean, quick, detailed, etc.).
- Do not include preamble, explanation, or keys other than "items".
- Output must be valid JSON only.`,
      },
      {
        role: "user",
        content: `Tasks:\n${taskList}\n\n${userInstruction}`,
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

  if (!resp.ok) {
    const text = await resp.text().catch(() => "");
    throw new Error(`Groq error ${resp.status}: ${text}`);
  }

  const json: any = await resp.json();
  const raw = String(json?.choices?.[0]?.message?.content || "").trim();

  let parsed: any;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error(`Failed to parse Groq checklist JSON: ${raw}`);
  }

  const items: string[] = Array.isArray(parsed.items)
    ? parsed.items.map((i: any) => String(i).trim()).filter(Boolean)
    : [];

  if (items.length === 0) {
    throw new Error("Groq returned no checklist items");
  }

  return items;
}
