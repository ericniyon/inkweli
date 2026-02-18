import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

export async function POST(request: Request) {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "API_KEY is not configured on the server." },
      { status: 500 }
    );
  }

  try {
    const body = await request.json();
    const { prompt, title = "", content = "" } = body;
    if (!prompt || typeof prompt !== "string") {
      return NextResponse.json(
        { error: "Missing or invalid prompt." },
        { status: 400 }
      );
    }

    const plainContent = (content || "").replace(/<[^>]*>?/gm, "").trim();
    const fullPrompt = `
Context: You are an expert analyst for a premium publishing platform called usethinkup.
Article Title: ${title}
Article Content: ${plainContent}

Task: ${prompt}

Keep the tone professional, insightful, and concise.
`.trim();

    const model = process.env.GEMINI_MODEL || "gemini-1.5-flash";
    const ai = new GoogleGenAI({ apiKey });
    const result = await ai.models.generateContent({
      model,
      contents: [{ parts: [{ text: fullPrompt }] }],
    });

    const text = result.text ?? result.candidates?.[0]?.content?.parts?.[0]?.text ?? null;
    if (!text) {
      return NextResponse.json(
        { error: "No response from model." },
        { status: 502 }
      );
    }

    return NextResponse.json({ text });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    const isQuota = message.includes("429") || message.includes("quota") || message.includes("RESOURCE_EXHAUSTED") || message.includes("rate");
    console.error("Gemini API error:", e);
    return NextResponse.json(
      { error: isQuota ? "Rate limit reached. Please try again in a minute." : message || "Failed to get AI response." },
      { status: isQuota ? 429 : 500 }
    );
  }
}
