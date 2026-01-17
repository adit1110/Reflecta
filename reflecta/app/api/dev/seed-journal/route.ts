import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { extractFactorScores } from "../../../../lib/nlp/factor-extractor";
import { computeMhfFromFactors } from "../../../../lib/nlp/mhf-score";
import { detectCoreMemory } from "../../../../lib/nlp/core-memory";

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

  return NextResponse.json({
    ok: true,
    journal_id: journal.id,
    entry_date: entryDate,
    mhf: mhfResult.mhf,
    delta: core.delta,
    is_core_memory: core.is_core_memory,
    core_label: core.core_label,
  });
}
