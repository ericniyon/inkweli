import { NextResponse } from "next/server";
import { GoogleGenAI, Modality } from "@google/genai";
import { prisma } from "@/lib/prisma";

/** Get plain text for the first N paragraphs (for free listen preview). */
function getFirstParagraphPlainText(html: string): string {
  const regex = /<p[^>]*>([\s\S]*?)<\/p>/i;
  const match = (html || "").match(regex);
  if (match) {
    return match[1].replace(/<[^>]*>?/gm, " ").replace(/\s+/g, " ").trim();
  }
  const plain = (html || "").replace(/<[^>]*>?/gm, " ").replace(/\s+/g, " ").trim();
  return plain.slice(0, 500) || plain;
}

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
    const { title = "", content = "", userId } = body;

    let textToRead: string;
    const fullPlainText = (content || "").replace(/<[^>]*>?/gm, " ").replace(/\s+/g, " ").trim();

    if (userId && typeof userId === "string") {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { tier: true },
      });
      if (user?.tier === "UNLIMITED") {
        textToRead = fullPlainText;
      } else {
        const firstParagraph = getFirstParagraphPlainText(content || "");
        textToRead = firstParagraph
          ? `${firstParagraph} To listen to the full article, become an annual subscriber.`
          : fullPlainText.slice(0, 500);
      }
    } else {
      const firstParagraph = getFirstParagraphPlainText(content || "");
      textToRead = firstParagraph
        ? `${firstParagraph} To listen to the full article, become an annual subscriber.`
        : fullPlainText.slice(0, 500);
    }

    const prompt = `Read this article in a calm, professional tone: ${title}. ${textToRead}`;

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
