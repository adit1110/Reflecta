// lib/video/did-video.ts
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

type TalkResult = {
  id: string;
  result_url?: string;
  status?: string;
  error?: {
    kind?: string;
    description?: string;
  };
  message?: string;
};

type GenerateVideoOptions = {
  summary: string;
  journalId: string;
  userId: string;
  force?: boolean;
};

function getSupabaseAdmin() {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) return null;
  return createClient(url, serviceKey);
}

function getDidAuthHeader() {
  const apiKey = process.env.DID_API_KEY;
  if (!apiKey) return null;
  const encoded = Buffer.from(apiKey, "utf8").toString("base64");
  return `Basic ${encoded}`;
}

function getDidConfig() {
  const sourceUrl = process.env.DID_SOURCE_URL;
  if (!sourceUrl) {
    throw new Error("D-ID source image not configured.");
  }

  return {
    sourceUrl,
    voiceId: process.env.DID_VOICE_ID || "en-US-JennyNeural",
  };
}

async function createTalk(summary: string) {
  const auth = getDidAuthHeader();
  if (!auth) throw new Error("D-ID API key not configured.");

  const { sourceUrl, voiceId } = getDidConfig();

  const response = await fetch("https://api.d-id.com/talks", {
    method: "POST",
    headers: {
      Authorization: auth,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      source_url: sourceUrl,
      script: {
        type: "text",
        input: summary.slice(0, 1200),
        provider: {
          type: "microsoft",
          voice_id: voiceId,
        },
      },
    }),
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`Failed to create D-ID talk: ${detail}`);
  }

  const data = (await response.json()) as TalkResult;
  if (!data.id) {
    throw new Error("D-ID returned no talk id.");
  }

  return data.id;
}

async function getTalk(talkId: string) {
  const auth = getDidAuthHeader();
  if (!auth) throw new Error("D-ID API key not configured.");

  const response = await fetch(`https://api.d-id.com/talks/${talkId}`, {
    headers: {
      Authorization: auth,
    },
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`Failed to fetch D-ID talk: ${detail}`);
  }

  return (await response.json()) as TalkResult;
}

async function pollForResult(talkId: string) {
  const started = Date.now();
  let attempt = 0;
  let delay = 1500;

  while (Date.now() - started < 90000) {
    const talk = await getTalk(talkId);
    if (talk.result_url) return talk.result_url;
    if (talk.status && talk.status.toLowerCase() === "error") {
      const detail =
        talk.error?.description ||
        talk.error?.kind ||
        talk.message ||
        "D-ID talk failed.";
      throw new Error(`D-ID talk failed: ${detail}`);
    }

    attempt += 1;
    await new Promise((resolve) => setTimeout(resolve, delay));
    delay = Math.min(8000, delay * 1.4);
  }

  throw new Error("D-ID talk timed out.");
}

async function downloadVideo(url: string) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error("Failed to download video.");
  }
  const arrayBuffer = await response.arrayBuffer();
  return new Uint8Array(arrayBuffer);
}

async function uploadVideo(
  supabase: SupabaseClient,
  userId: string,
  journalId: string,
  bytes: Uint8Array,
  force: boolean,
) {
  const path = `${userId}/${journalId}.mp4`;
  const { error } = await supabase.storage
    .from("journal-videos")
    .upload(path, bytes, {
      contentType: "video/mp4",
      upsert: Boolean(force),
    });

  if (error) {
    if (error.message?.includes("already exists")) {
      const { data } = supabase.storage.from("journal-videos").getPublicUrl(path);
      return data.publicUrl;
    }
    throw new Error(`Failed to upload video: ${error.message}`);
  }

  const { data } = supabase.storage.from("journal-videos").getPublicUrl(path);
  return data.publicUrl;
}

export async function generateJournalVideo({
  summary,
  journalId,
  userId,
  force = false,
}: GenerateVideoOptions) {
  const supabase = getSupabaseAdmin();
  if (!supabase) {
    throw new Error("Server misconfigured.");
  }

  const talkId = await createTalk(summary);
  const resultUrl = await pollForResult(talkId);
  const bytes = await downloadVideo(resultUrl);
  const publicUrl = await uploadVideo(supabase, userId, journalId, bytes, force);

  if (!journalId.startsWith("preview-")) {
    const { data, error } = await supabase
      .from("journal_ai_summary")
      .update({
        video_url: publicUrl,
        video_updated_at: new Date().toISOString(),
      })
      .eq("journal_id", journalId)
      .eq("user_id", userId)
      .select("journal_id");

    if (error) {
      throw new Error(`Failed to update video_url: ${error.message}`);
    }

    if (!data || data.length === 0) {
      const fallback = await supabase
        .from("journal_ai_summary")
        .update({
          video_url: publicUrl,
          video_updated_at: new Date().toISOString(),
        })
        .eq("journal_id", journalId)
        .select("journal_id");

      if (fallback.error) {
        throw new Error(
          `Failed to update video_url: ${fallback.error.message}`,
        );
      }

      if (!fallback.data || fallback.data.length === 0) {
        throw new Error("Failed to update video_url: row not found.");
      }
    }
  }

  return { videoUrl: publicUrl, talkId };
}
