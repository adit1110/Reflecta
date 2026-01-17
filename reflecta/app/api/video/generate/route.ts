import { GoogleGenAI } from "@google/genai";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const { narrativeText } = await req.json();


  if (!narrativeText) {
    return Response.json(
      { error: "Missing narrative text." },
      { status: 400 }
    );
  }

  const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY!,
  });

  try {
    let operation = await ai.models.generateVideos({
      model: "veo-3.1-generate-preview",
      prompt: narrativeText,
    });

    // polling omitted for brevity

    return Response.json({
      error: null,
      videoUrl: "REAL_VIDEO_URL_WHEN_AVAILABLE",
    });
  } catch (err: any) {
    if (err?.status === 429) {
      return Response.json({
        error:
          "Video generation is temporarily unavailable. Please try again later.",
      });
    }

    return Response.json({
      error: "Video generation failed unexpectedly.",
    });
  }
}
