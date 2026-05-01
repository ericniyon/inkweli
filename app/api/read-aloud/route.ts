import { NextResponse } from "next/server";
import { GoogleGenAI, Modality } from "@google/genai";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import { userHasFullReadAccessToArticle } from "@/lib/article-access";

function htmlToPlainText(html: string): string {
  return (html || "").replace(/<[^>]*>?/gm, " ").replace(/\s+/g, " ").trim();
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
    const session = await getServerSession(authOptions);
    const userId = session?.userId;
    if (!userId || userId === "guest") {
      return NextResponse.json({ error: "Sign in is required for audio." }, { status: 401 });
    }

    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
    const articleId = typeof body.articleId === "string" ? body.articleId.trim() : "";
    if (!articleId) {
      return NextResponse.json({ error: "articleId is required" }, { status: 400 });
    }

    const article = await prisma.article.findUnique({
      where: { id: articleId },
      select: { title: true, content: true, authorId: true },
    });
    if (!article) {
      return NextResponse.json({ error: "Article not found" }, { status: 404 });
    }

    const canListen = await userHasFullReadAccessToArticle(userId, articleId, {
      articleAuthorId: article.authorId,
    });
    if (!canListen) {
      return NextResponse.json(
        {
          error:
            "Audio is available only with full access — annual subscribers or purchasers of this article.",
        },
        { status: 403 }
      );
    }

    const textToRead = htmlToPlainText(article.content);
    if (!textToRead) {
      return NextResponse.json({ error: "No readable content." }, { status: 400 });
    }

    const prompt = `Read this article in a calm, professional tone: ${article.title}. ${textToRead}`;

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
