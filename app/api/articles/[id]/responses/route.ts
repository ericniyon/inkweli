import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: articleId } = await params;
    const body = await request.json();
    const { userId, text } = body;

    if (!userId || typeof userId !== "string" || !text || typeof text !== "string") {
      return NextResponse.json(
        { error: "Missing or invalid userId or text." },
        { status: 400 }
      );
    }

    const article = await prisma.article.findUnique({
      where: { id: articleId },
      select: { id: true },
    });
    if (!article) {
      return NextResponse.json({ error: "Article not found." }, { status: 404 });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, avatar: true },
    });
    if (!user) {
      return NextResponse.json({ error: "User not found." }, { status: 400 });
    }

    const response = await prisma.response.create({
      data: {
        articleId,
        userId,
        text: text.trim(),
      },
    });

    return NextResponse.json({
      id: response.id,
      userId: response.userId,
      userName: user.name,
      userAvatar: user.avatar ?? undefined,
      text: response.text,
      createdAt: response.createdAt.toISOString(),
      claps: response.claps,
    });
  } catch (e) {
    console.error("POST /api/articles/[id]/responses", e);
    return NextResponse.json(
      { error: "Failed to post response." },
      { status: 500 }
    );
  }
}
