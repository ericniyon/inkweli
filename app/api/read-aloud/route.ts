import { NextResponse } from "next/server";
import { GoogleGenAI, Modality } from "@google/genai";

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
    const { title = "", content = "" } = body;
    const plainText = (content || "").replace(/<[^>]*>?/gm, "").trim();
    const prompt = `Read this article in a calm, professional tone: ${title}. ${plainText}`;

    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text: prompt }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: "Kore" },
          },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!base64Audio) {
      return NextResponse.json(
        { error: "No audio generated." },
        { status: 502 }
      );
    }

    return NextResponse.json({ data: base64Audio });
  } catch (e) {
    console.error("Read-aloud API error:", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to generate audio." },
      { status: 500 }
    );
  }
}
