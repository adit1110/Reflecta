import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { extractFactorScores } from "../../../../lib/nlp/factor-extractor";
import { computeMhfFromFactors } from "../../../../lib/nlp/mhf-score";
import { detectCoreMemory } from "../../../../lib/nlp/core-memory";

type SubmitPayload = {
  content?: string;
  entry_date?: string;
};

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

  return NextResponse.json({
    ok: true,
    journal_id: journal.id,
    mhf: mhfResult.mhf,
    is_core_memory: core.is_core_memory,
    core_label: core.core_label,
  });
}
