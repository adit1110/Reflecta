import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { generateJournalVideo } from "../../../../lib/video/did-video";

export const runtime = "nodejs";

type GeneratePayload = {
  journal_id?: string;
  user_id?: string;
  narrativeText?: string;
};

async function isVideoUrlAvailable(url: string) {
  try {
    const headResponse = await fetch(url, { method: "HEAD" });
    if (headResponse.ok) return true;
    if (headResponse.status === 405) {
      const getResponse = await fetch(url, { method: "GET" });
      return getResponse.ok;
    }
    return false;
  } catch {
    return false;
  }
}

function getSupabaseAdmin() {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) return null;
  return createClient(url, serviceKey);
}

export async function POST(req: Request) {
  const body = (await req.json()) as GeneratePayload;
  const journalId = (body.journal_id ?? "").trim();
  const narrativeText = (body.narrativeText ?? "").trim();
  const force = new URL(req.url).searchParams.get("force") === "true";

  if (!journalId && !narrativeText) {
    return NextResponse.json(
      { error: "Missing journal_id or narrativeText." },
      { status: 400 },
    );
  }

  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return NextResponse.json(
      { error: "Server misconfigured." },
      { status: 500 },
    );
  }

  if (!journalId) {
    try {
      const result = await generateJournalVideo({
        summary: narrativeText,
        journalId: `preview-${Date.now()}`,
        userId: "preview",
        force: true,
      });
      return NextResponse.json({
        ok: true,
        video_url: result.videoUrl,
        talk_id: result.talkId,
      });
    } catch {
      return NextResponse.json(
        { error: "Video generation failed." },
        { status: 500 },
      );
    }
  }

  const { data: summaryRow, error } = await supabase
    .from("journal_ai_summary")
    .select("summary, user_id, video_url")
    .eq("journal_id", journalId)
    .maybeSingle();

  if (error || !summaryRow) {
    return NextResponse.json(
      { error: "Summary not found." },
      { status: 404 },
    );
  }

  if (summaryRow.video_url && !force) {
    const available = await isVideoUrlAvailable(summaryRow.video_url);
    if (!available) {
      console.warn("Video URL missing, regenerating:", summaryRow.video_url);
    } else {
    return NextResponse.json({
      ok: true,
      video_url: summaryRow.video_url,
      talk_id: null,
    });
    }
  }

  if (!summaryRow.summary) {
    return NextResponse.json(
      { error: "Summary is empty." },
      { status: 400 },
    );
  }

  try {
    const result = await generateJournalVideo({
      summary: summaryRow.summary,
      journalId,
      userId: summaryRow.user_id,
      force,
    });

    return NextResponse.json({
      ok: true,
      video_url: result.videoUrl,
      talk_id: result.talkId,
    });
  } catch (err) {
    console.error("Video generation failed:", err);
    return NextResponse.json(
      { error: "Video generation failed. Check D-ID config." },
      { status: 500 },
    );
  }
}