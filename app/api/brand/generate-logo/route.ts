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
    const theme = typeof body?.theme === "string" ? body.theme.trim() : "";
    if (!theme) {
      return NextResponse.json({ error: "Missing theme." }, { status: 400 });
    }

    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-image",
      contents: {
        parts: [
          {
            text: `High-fidelity, professional logo design for a premium news platform called usethinkup. Theme: ${theme}. Minimalist, vector style, white background, slate and indigo colors.`,
          },
        ],
      },
      config: {
        imageConfig: { aspectRatio: "1:1" },
      },
    });

    const candidate = response.candidates?.[0];
    const parts = candidate?.content?.parts;
    if (parts) {
      for (const part of parts) {
        if (part.inlineData?.data) {
          return NextResponse.json({
            imageDataUrl: `data:image/png;base64,${part.inlineData.data}`,
          });
        }
      }
    }

    return NextResponse.json(
      { error: "No image returned from the model." },
      { status: 502 }
    );
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    console.error("Brand logo generation error:", e);
    return NextResponse.json(
      { error: message || "Failed to generate logo." },
      { status: 500 }
    );
  }
}
