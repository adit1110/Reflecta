import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { extractFactorScores } from "../../../../lib/nlp/factor-extractor";
import { computeMhfFromFactors } from "../../../../lib/nlp/mhf-score";
import { detectCoreMemory } from "../../../../lib/nlp/core-memory";
import { GEMINI_PROMPT } from "../../../../scripts/gemini-journal-export";
import { generateJournalVideo } from "../../../../lib/video/did-video";

type SeedPayload = {
  user_id?: string;
  entry_date?: string;
  content?: string;
};

type SeedRequest = SeedPayload | { items: SeedPayload[] };

function isValidIsoDate(value: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function isValidUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  );
}

function normalizePayload(body: SeedRequest): SeedPayload[] {
  if (
    body &&
    typeof body === "object" &&
    "items" in body &&
    Array.isArray((body as { items?: unknown }).items)
  ) {
    return (body as { items: SeedPayload[] }).items;
  }
  return [body as SeedPayload];
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

  const body = (await request.json()) as SeedRequest;
  const items = normalizePayload(body);
  if (!items.length) {
    return NextResponse.json(
      { error: "Missing seed items." },
      { status: 400 },
    );
  }

  const supabase = createClient(url, serviceRoleKey);

  const results = [];

  for (const item of items) {
    const userId = item.user_id?.trim() ?? "";
    const entryDate = item.entry_date?.trim() ?? "";
    const content = item.content?.trim() ?? "";

    if (!userId || !isValidUuid(userId)) {
      results.push({
        ok: false,
        entry_date: entryDate,
        error: "Invalid user_id.",
      });
      continue;
    }

    if (!entryDate || !isValidIsoDate(entryDate)) {
      results.push({
        ok: false,
        entry_date: entryDate,
        error: "Invalid entry_date.",
      });
      continue;
    }

    if (!content) {
      results.push({
        ok: false,
        entry_date: entryDate,
        error: "Content is required.",
      });
      continue;
    }

    const { data: journal, error: insertError } = await supabase
      .from("journals")
      .insert({
        user_id: userId,
        entry_date: entryDate,
        content,
      })
      .select("id")
      .single();

    if (insertError || !journal) {
      results.push({
        ok: false,
        entry_date: entryDate,
        error:
          insertError?.code === "23505"
            ? "You've already written today's entry."
            : "Something went wrong. Please try again.",
      });
      continue;
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
      results.push({
        ok: false,
        entry_date: entryDate,
        error: "Something went wrong. Please try again.",
      });
      continue;
    }

    let aiSummary: string | null = null;
    let aiSummaryError: string | null = null;
    let videoUrl: string | null = null;
    let videoError: string | null = null;

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

    if (aiSummary) {
      try {
        const result = await generateJournalVideo({
          summary: aiSummary,
          journalId: journal.id,
          userId,
          force: true,
        });
        videoUrl = result.videoUrl;
      } catch {
        videoError = "Video generation failed.";
      }
    }

    results.push({
      ok: true,
      journal_id: journal.id,
      entry_date: entryDate,
      mhf: mhfResult.mhf,
      delta: core.delta,
      is_core_memory: core.is_core_memory,
      core_label: core.core_label,
      summary: aiSummary,
      summary_error: aiSummaryError,
      video_url: videoUrl,
      video_error: videoError,
    });
  }

  return NextResponse.json({
    ok: true,
    count: results.length,
    results,
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
