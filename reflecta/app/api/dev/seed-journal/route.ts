import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { extractFactorScores } from "../../../../lib/nlp/factor-extractor";
import { computeMhfFromFactors } from "../../../../lib/nlp/mhf-score";
import { detectCoreMemory } from "../../../../lib/nlp/core-memory";
import { GEMINI_PROMPT } from "../../../../scripts/gemini-journal-export";

type SeedPayload = {
  user_id?: string;
  entry_date?: string;
  content?: string;
};

function isValidIsoDate(value: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function isValidUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  );
}

export async function POST(request: Request) {
  const seedSecret = process.env.SEED_SECRET;
  const headerSecret = request.headers.get("x-seed-secret") ?? "";
  if (!seedSecret || headerSecret !== seedSecret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceRoleKey) {
    return NextResponse.json(
      { error: "Server misconfigured." },
      { status: 500 },
    );
  }

  const body = (await request.json()) as SeedPayload;
  const userId = body.user_id?.trim() ?? "";
  const entryDate = body.entry_date?.trim() ?? "";
  const content = body.content?.trim() ?? "";

  if (!userId || !isValidUuid(userId)) {
    return NextResponse.json(
      { error: "Invalid user_id." },
      { status: 400 },
    );
  }

  if (!entryDate || !isValidIsoDate(entryDate)) {
    return NextResponse.json(
      { error: "Invalid entry_date." },
      { status: 400 },
    );
  }

  if (!content) {
    return NextResponse.json(
      { error: "Content is required." },
      { status: 400 },
    );
  }

  const supabase = createClient(url, serviceRoleKey);

  const { data: journal, error: insertError } = await supabase
    .from("journals")
    .insert({
      user_id: userId,
      entry_date: entryDate,
      content,
    })
    .select("id")
    .single();

  if (insertError) {
    if (insertError.code === "23505") {
      return NextResponse.json(
        { error: "You've already written today's entry." },
        { status: 409 },
      );
    }
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 },
    );
  }

  const factors = extractFactorScores(content);
  const mhfResult = computeMhfFromFactors(factors);

  const { data: previous } = await supabase
    .from("journal_analysis")
    .select("mhf, entry_date")
    .eq("user_id", userId)
    .lt("entry_date", entryDate)
    .order("entry_date", { ascending: false })
    .limit(1)
    .maybeSingle();

  const core = detectCoreMemory(mhfResult.mhf, previous?.mhf);

  const { error: analysisError } = await supabase
    .from("journal_analysis")
    .insert({
      journal_id: journal.id,
      user_id: userId,
      entry_date: entryDate,
      mhf: mhfResult.mhf,
      delta: core.delta,
      is_core_memory: core.is_core_memory,
      core_label: core.core_label,
      stress: factors.stress,
      instability: factors.instability,
      intensity: factors.intensity,
      fatigue: factors.fatigue,
      neg_sentiment: factors.neg_sentiment,
      algo_version: "v1",
    });

  if (analysisError) {
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 },
    );
  }

  let aiSummary: string | null = null;
  let aiSummaryError: string | null = null;

  try {
    aiSummary = await generateAndPersistJournalSummary(
      supabase,
      userId,
      journal.id,
      entryDate,
    );
  } catch {
    aiSummaryError = "Summary generation failed.";
  }

  return NextResponse.json({
    ok: true,
    journal_id: journal.id,
    entry_date: entryDate,
    mhf: mhfResult.mhf,
    delta: core.delta,
    is_core_memory: core.is_core_memory,
    core_label: core.core_label,
    summary: aiSummary,
    summary_error: aiSummaryError,
  });
}

type DateRange = { from: string; to: string };

function computeMonthToDateRange(baseDate: string): DateRange {
  const parsed = new Date(`${baseDate}T00:00:00`);
  const from = new Date(parsed.getFullYear(), parsed.getMonth(), 1);
  const to = new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate());
  return {
    from: from.toISOString().slice(0, 10),
    to: to.toISOString().slice(0, 10),
  };
}

async function fetchMonthToDateJournals(
  supabase: ReturnType<typeof createClient>,
  userId: string,
  range: DateRange,
) {
  const { data, error } = await supabase
    .from("journals")
    .select("id,user_id,entry_date,content,created_at")
    .eq("user_id", userId)
    .gte("entry_date", range.from)
    .lte("entry_date", range.to)
    .order("entry_date", { ascending: true });

  if (error) {
    throw new Error("Failed to fetch journals.");
  }

  return data || [];
}

async function fetchMonthToDateAnalysis(
  supabase: ReturnType<typeof createClient>,
  userId: string,
  range: DateRange,
) {
  const { data, error } = await supabase
    .from("journal_analysis")
    .select(
      "id,journal_id,user_id,entry_date,mhf,delta,is_core_memory,core_label,stress,instability,intensity,fatigue,neg_sentiment,algo_version,created_at",
    )
    .eq("user_id", userId)
    .gte("entry_date", range.from)
    .lte("entry_date", range.to)
    .order("entry_date", { ascending: true });

  if (error) {
    throw new Error("Failed to fetch journal_analysis.");
  }

  return data || [];
}

function mergeJournals(
  journals: Array<Record<string, unknown>>,
  analyses: Array<Record<string, unknown>>,
) {
  const analysisByJournalId = new Map<string, Record<string, unknown>>();
  for (const analysis of analyses) {
    const journalId = analysis.journal_id as string | undefined;
    if (journalId && !analysisByJournalId.has(journalId)) {
      analysisByJournalId.set(journalId, analysis);
    }
  }

  return journals.map((journal) => ({
    journal,
    analysis: analysisByJournalId.get(journal.id as string) || null,
  }));
}

async function generateGeminiSummary(payload: unknown) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("Gemini API key not configured.");
  }

  const modelName = process.env.GEMINI_MODEL || "gemini-2.5-flash";
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: modelName });

  const result = await model.generateContent({
    contents: [
      {
        role: "user",
        parts: [{ text: GEMINI_PROMPT }, { text: JSON.stringify(payload) }],
      },
    ],
  });

  const response = await result.response;
  return response.text().trim();
}

async function generateAndPersistJournalSummary(
  supabase: ReturnType<typeof createClient>,
  userId: string,
  journalId: string,
  entryDate: string,
) {
  const range = computeMonthToDateRange(entryDate);
  const [journals, analyses] = await Promise.all([
    fetchMonthToDateJournals(supabase, userId, range),
    fetchMonthToDateAnalysis(supabase, userId, range),
  ]);
  const merged = mergeJournals(journals, analyses);

  const payload = {
    date_range: range,
    journals,
    journal_analysis: analyses,
    merged_journals: merged,
  };

  const summary = await generateGeminiSummary(payload);
  if (!summary) {
    throw new Error("Gemini returned an empty summary.");
  }

  const { data, error } = await supabase
    .from("journal_ai_summary")
    .upsert(
      {
        journal_id: journalId,
        user_id: userId,
        summary,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "journal_id" },
    )
    .select("summary")
    .single();

  if (error) {
    throw new Error("Failed to save AI summary.");
  }

  return data?.summary ?? summary;
}
