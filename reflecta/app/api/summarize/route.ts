// app/api/summarize/route.ts
import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export async function POST(request: Request) {
  try {
    const { journalEntry } = await request.json();

    if (!journalEntry || typeof journalEntry !== "string") {
      return NextResponse.json(
        { error: "Journal entry is required" },
        { status: 400 }
      );
    }

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json(
        { error: "Gemini API key not configured" },
        { status: 500 }
      );
    }

    const model = genAI.getGenerativeModel({ model: "gemini-pro" });

    const prompt = `You are a compassionate mental health journal analyzer. Read the following journal entry and provide a warm, empathetic summary in 4-7 sentences. Focus on:
1. The overall emotional tone and mood
2. Key events or situations mentioned
3. Any patterns or themes that emerge
4. A gentle, supportive tone that validates their experience

Important: Be neutral and non-judgmental. Don't diagnose or provide medical advice. Simply reflect back what you observe.

Journal Entry:
"""
${journalEntry}
"""

Summary:`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const summary = response.text();

    return NextResponse.json({ summary });
  } catch (error) {
    console.error("Gemini API error:", error);
    return NextResponse.json(
      { error: "Failed to generate summary" },
      { status: 500 }
    );
  }
}