import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: articleId } = await params;
    const body = await request.json();
    const { userId } = body;

    if (!userId || typeof userId !== "string") {
      return NextResponse.json(
        { error: "Missing or invalid userId." },
        { status: 400 }
      );
    }

    const article = await prisma.article.findUnique({
      where: { id: articleId },
      select: { id: true, claps: true },
    });
    if (!article) {
      return NextResponse.json({ error: "Article not found." }, { status: 404 });
    }

    const existingClap = await prisma.clap.findUnique({
      where: {
        userId_articleId: {
          userId,
          articleId,
        },
      },
    });

    if (existingClap) {
      // User already clapped: return current state without changing
      return NextResponse.json({ clapped: true, claps: article.claps });
    }
    // User hasn't clapped: add clap (like)
    await prisma.clap.create({
      data: { userId, articleId },
    });
    const updated = await prisma.article.update({
      where: { id: articleId },
      data: { claps: { increment: 1 } },
      select: { claps: true },
    });
    return NextResponse.json({ clapped: true, claps: updated.claps });
  } catch (e) {
    console.error("POST /api/articles/[id]/clap", e);
    return NextResponse.json(
      { error: "Failed to toggle clap." },
      { status: 500 }
    );
  }
}
