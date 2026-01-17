import { NextResponse } from "next/server";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { extractFactorScores } from "../../../../lib/nlp/factor-extractor";
import { computeMhfFromFactors } from "../../../../lib/nlp/mhf-score";
import { detectCoreMemory } from "../../../../lib/nlp/core-memory";
import { GEMINI_PROMPT } from "../../../../scripts/gemini-journal-export";

type SubmitPayload = {
  content?: string;
  entry_date?: string;
};

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

type DateRange = { from: string; to: string };

function isValidIsoDate(value: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function getSupabaseClient(accessToken: string) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    return null;
  }
  return createClient(url, anonKey, {
    global: {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  });
}

function computeMonthToDateRange(): DateRange {
  const now = new Date();
  const from = new Date(now.getFullYear(), now.getMonth(), 1);
  const to = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return {
    from: from.toISOString().slice(0, 10),
    to: to.toISOString().slice(0, 10),
  };
}

async function fetchMonthToDateJournals(
  supabase: SupabaseClient,
  userId: string,
  range: DateRange,
): Promise<JournalRow[]> {
  const { data, error } = await supabase
    .from("journals")
    .select("id,user_id,entry_date,content,created_at")
    .eq("user_id", userId)
    .gte("entry_date", range.from)
    .lte("entry_date", range.to)
    .order("entry_date", { ascending: true });

  if (error) {
    throw new Error(`Failed to fetch journals: ${error.message}`);
  }

  return data || [];
}

async function fetchMonthToDateAnalysis(
  supabase: SupabaseClient,
  userId: string,
  range: DateRange,
): Promise<JournalAnalysisRow[]> {
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
    throw new Error(`Failed to fetch journal_analysis: ${error.message}`);
  }

  return data || [];
}

function mergeJournals(
  journals: JournalRow[],
  analyses: JournalAnalysisRow[],
) {
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
  supabase: SupabaseClient,
  userId: string,
  journalId: string,
) {
  const range = computeMonthToDateRange();
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
    throw new Error(`Failed to save AI summary: ${error.message}`);
  }

  return data?.summary ?? summary;
}

export async function POST(request: Request) {
  const authHeader = request.headers.get("authorization") ?? "";
  const token = authHeader.replace("Bearer ", "").trim();
  if (!token) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 },
    );
  }

  const supabase = getSupabaseClient(token);
  if (!supabase) {
    return NextResponse.json(
      { error: "App misconfigured." },
      { status: 500 },
    );
  }

  const { data: userData, error: userError } = await supabase.auth.getUser(token);
  const user = userData?.user;
  if (userError || !user) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 },
    );
  }

  const body = (await request.json()) as SubmitPayload;
  const content = (body.content ?? "").trim();
  const entryDate = body.entry_date ?? "";

  if (!content) {
    return NextResponse.json(
      { error: "Write something before saving." },
      { status: 400 },
    );
  }

  if (!isValidIsoDate(entryDate)) {
    return NextResponse.json(
      { error: "Invalid entry date." },
      { status: 400 },
    );
  }

  const { data: journal, error: insertError } = await supabase
    .from("journals")
    .insert({
      user_id: user.id,
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
    .eq("user_id", user.id)
    .lt("entry_date", entryDate)
    .order("entry_date", { ascending: false })
    .limit(1)
    .maybeSingle();

  const core = detectCoreMemory(mhfResult.mhf, previous?.mhf);

  const { error: analysisError } = await supabase
    .from("journal_analysis")
    .insert({
      journal_id: journal.id,
      user_id: user.id,
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
      user.id,
      journal.id,
    );
  } catch (error) {
    console.error("AI summary generation failed:", error);
    aiSummaryError = "Summary generation failed.";
  }

  return NextResponse.json({
    ok: true,
    journal_id: journal.id,
    mhf: mhfResult.mhf,
    is_core_memory: core.is_core_memory,
    core_label: core.core_label,
    summary: aiSummary,
    summary_error: aiSummaryError,
  });
}
