import { createClient } from "@supabase/supabase-js";

type JournalRow = {
  id: string;
  user_id: string;
  entry_date: string;
  content: string;
  created_at: string;
};

type JournalAnalysisRow = {
  id: string;
  journal_id: string;
  user_id: string;
  entry_date: string;
  mhf: number;
  delta: number | null;
  is_core_memory: boolean;
  core_label: string | null;
  stress: number;
  instability: number;
  intensity: number;
  fatigue: number;
  neg_sentiment: number;
  algo_version: string;
  created_at: string;
};

type MergedJournal = {
  journal: JournalRow;
  analysis: JournalAnalysisRow | null;
};

type DateRange = { from: string; to: string };

const GEMINI_PROMPT = `You are not here to fix the user.
You are here to help them see themselves clearly.
Identity is not static.
 It moves.
 And noticing that movement is enough.

You are an identity reflection engine, not a therapist, doctor, or medical authority.

Your role is to help the user reflect on how their identity is shifting over time by gently mirroring patterns found in their own writing.

You do NOT diagnose, treat, or give psychological advice.
You do NOT use clinical or medical language.
You do NOT tell the user what they should do.
You do NOT give commands or instructions.

You speak like a thoughtful friend — calm, observant, grounded, and respectful.

You will be given structured data for a single day, including:
- The user’s journal entry text
- A Mental Health / Identity Score (MLH) from 0–100
- Emotional signals extracted from the journal:
  - sentiment
  - stress level
  - emotional intensity
  - emotional instability
  - energy level
- Keywords or phrases that strongly influenced the score
- Whether this day represents a significant Identity Shift

This data represents patterns, not facts.

TASK:
Generate a short self-introspective reflection written as if the user is calmly speaking to themselves.

The reflection should help the user:
- Notice how they may be changing
- Understand what moments or themes mattered
- Feel seen, not judged
- Feel grounded, not analyzed

This is a mirror, not advice.

STYLE RULES:
- Warm, human, and non-judgmental
- Never clinical
- No diagnosis words
- No “you should”
- No commands
- No emergency language
- No therapist framing

CONTENT GUIDELINES:
1. Acknowledge the current identity state based on the MLH score
   - Lower score → recognize heaviness or strain
   - Higher score → recognize steadiness or growth
   - Never label it as good or bad

2. Highlight 1–2 meaningful emotional patterns
   - Based on stress, sentiment, instability, or repeated themes
   - Refer to themes, not exact quotes

3. Connect this moment to identity over time
   - Emphasize that identity shifts and adapts
   - Frame this as one moment in a longer timeline

4. End with gentle grounding
   - A calm, supportive closing thought
   - No instructions or advice

LENGTH:
- 90–120 words
- Suitable for ~25–30 seconds of spoken audio
- Calm pacing

OUTPUT FORMAT:
- Return ONLY the reflection text
- No headings
- No emojis
- No bullet points
- No explanations or metadata

Remember:
You are not here to fix the user.
You are here to help them see themselves clearly.
Identity moves, and noticing that movement is enough.`;

const SUPABASE_URL =
  process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "";
const GEMINI_MODEL =
  process.env.GEMINI_MODEL || "gemini-2.5-flash";

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !GEMINI_API_KEY) {
  throw new Error(
    "Missing required environment variables. Expect SUPABASE_URL (or NEXT_PUBLIC_SUPABASE_URL), SUPABASE_SERVICE_ROLE_KEY, and GEMINI_API_KEY."
  );
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

function computeDateRange(): DateRange {
  const now = new Date();
  const fromDate = new Date(now.getFullYear(), now.getMonth(), 1);
  const toDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return {
    from: fromDate.toISOString().slice(0, 10),
    to: toDate.toISOString().slice(0, 10),
  };
}

async function fetchJournals(range: DateRange): Promise<JournalRow[]> {
  const { data, error } = await supabase
    .from("journals")
    .select("id,user_id,entry_date,content,created_at")
    .gte("entry_date", range.from)
    .lte("entry_date", range.to);

  if (error) {
    throw new Error(`Failed to fetch journals: ${error.message}`);
  }

  return data || [];
}

async function fetchJournalAnalysis(
  range: DateRange
): Promise<JournalAnalysisRow[]> {
  const { data, error } = await supabase
    .from("journal_analysis")
    .select(
      "id,journal_id,user_id,entry_date,mhf,delta,is_core_memory,core_label,stress,instability,intensity,fatigue,neg_sentiment,algo_version,created_at"
    )
    .gte("entry_date", range.from)
    .lte("entry_date", range.to);

  if (error) {
    throw new Error(`Failed to fetch journal_analysis: ${error.message}`);
  }

  return data || [];
}

function mergeJournals(
  journals: JournalRow[],
  analyses: JournalAnalysisRow[]
): MergedJournal[] {
  const analysisByJournalId = new Map<string, JournalAnalysisRow>();
  for (const analysis of analyses) {
    if (!analysisByJournalId.has(analysis.journal_id)) {
      analysisByJournalId.set(analysis.journal_id, analysis);
    }
  }

  return journals.map((journal) => ({
    journal,
    analysis: analysisByJournalId.get(journal.id) || null,
  }));
}

function buildPayload(range: DateRange, merged: MergedJournal[]) {
  return {
    date_range: range,
    journals: merged,
  };
}

function serializePayload(payload: unknown): string {
  return JSON.stringify(payload);
}

async function sendToGemini(serializedPayload: string): Promise<string> {
  const url =
    `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
      GEMINI_MODEL
    )}:generateContent` +
    `?key=${encodeURIComponent(GEMINI_API_KEY)}`;

  const body = {
    contents: [
      {
        role: "user",
        parts: [{ text: GEMINI_PROMPT }, { text: serializedPayload }],
      },
    ],
  };

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Gemini API error ${response.status}: ${errText}`);
  }

  const json = await response.json();
  const text =
    json?.candidates?.[0]?.content?.parts
      ?.map((p: { text?: string }) => p.text)
      .join("") || "";
  return text;
}

async function main() {
  try {
    const range = computeDateRange();
    const [journals, analyses] = await Promise.all([
      fetchJournals(range),
      fetchJournalAnalysis(range),
    ]);
    const merged = mergeJournals(journals, analyses);
    const payload = buildPayload(range, merged);
    const serialized = serializePayload(payload);
    const geminiResponse = await sendToGemini(serialized);
    console.log(geminiResponse);
  } catch (error) {
    console.error("Execution failed:", error);
  }
}

main();
