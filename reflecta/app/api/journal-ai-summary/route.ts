import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

type SummaryPayload = {
  journal_id?: string;
  user_id?: string;
  summary?: string;
};

function getSupabaseAdmin() {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    return null;
  }
  // Service role key allows server-side inserts regardless of RLS.
  return createClient(url, serviceKey);
}

function normalizePayload(body: unknown): SummaryPayload[] {
  if (
    body &&
    typeof body === "object" &&
    "items" in body &&
    Array.isArray((body as { items?: unknown }).items)
  ) {
    return (body as { items: SummaryPayload[] }).items;
  }
  return [body as SummaryPayload];
}

function validateItem(item: SummaryPayload) {
  const journalId = (item.journal_id ?? "").trim();
  const userId = (item.user_id ?? "").trim();
  const summary = (item.summary ?? "").trim();
  if (!journalId || !userId || !summary) {
    return null;
  }
  return { journal_id: journalId, user_id: userId, summary };
}

export async function POST(request: Request) {
  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return NextResponse.json(
      { error: "Server misconfigured." },
      { status: 500 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body." },
      { status: 400 },
    );
  }

  const items = normalizePayload(body);
  const rows = items.map(validateItem).filter(Boolean) as Array<{
    journal_id: string;
    user_id: string;
    summary: string;
  }>;

  if (rows.length === 0) {
    return NextResponse.json(
      { error: "Missing journal_id, user_id, or summary." },
      { status: 400 },
    );
  }

  const { error } = await supabase
    .from("journal_ai_summary")
    .upsert(rows, { onConflict: "journal_id" });

  if (error) {
    return NextResponse.json(
      { error: "Failed to save AI summary." },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true, count: rows.length });
}
