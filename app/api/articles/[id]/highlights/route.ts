import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: articleId } = await params;
    const body = await request.json();
    const { text, comment, userId } = body;

    if (!text || typeof text !== "string" || !comment || typeof comment !== "string") {
      return NextResponse.json(
        { error: "Missing or invalid text or comment" },
        { status: 400 }
      );
    }
    if (!userId || typeof userId !== "string") {
      return NextResponse.json(
        { error: "Missing or invalid userId" },
        { status: 400 }
      );
    }

    const article = await prisma.article.findUnique({
      where: { id: articleId },
    });
    if (!article) {
      return NextResponse.json({ error: "Article not found" }, { status: 404 });
    }

    const highlight = await prisma.highlight.create({
      data: {
        articleId,
        userId,
        text: text.trim(),
        comment: comment.trim(),
      },
      include: {
        user: {
          select: { id: true, name: true, avatar: true },
        },
      },
    });

    return NextResponse.json({
      id: highlight.id,
      articleId: highlight.articleId,
      userId: highlight.userId,
      userName: highlight.user.name,
      userAvatar: highlight.user.avatar ?? undefined,
      text: highlight.text,
      comment: highlight.comment,
      createdAt: highlight.createdAt.toISOString(),
    });
  } catch (e) {
    console.error("POST /api/articles/[id]/highlights", e);
    return NextResponse.json(
      { error: "Failed to save highlight" },
      { status: 500 }
    );
  }
}
