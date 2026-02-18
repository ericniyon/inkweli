import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const articleInclude = {
  author: {
    select: { id: true, name: true, avatar: true },
  },
  responses: {
    include: {
      user: {
        select: { id: true, name: true, avatar: true },
      },
    },
  },
  highlights: {
    include: {
      user: {
        select: { id: true, name: true, avatar: true },
      },
    },
  },
};

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug: slugOrId } = await params;
    let article = await prisma.article.findFirst({
      where: { slug: slugOrId },
      include: articleInclude,
    });
    if (!article) {
      article = await prisma.article.findUnique({
        where: { id: slugOrId },
        include: articleInclude,
      });
    }
    if (!article) {
      return NextResponse.json({ error: "Article not found" }, { status: 404 });
    }
    return NextResponse.json({
      id: article.id,
      title: article.title,
      slug: article.slug,
      excerpt: article.excerpt,
      content: article.content,
      authorId: article.authorId,
      authorName: article.author.name,
      authorAvatar: article.author.avatar ?? undefined,
      publishDate: article.publishDate.toISOString().slice(0, 10),
      status: article.status,
      featuredImage: article.featuredImage,
      readingTime: article.readingTime,
      category: article.category,
      claps: article.claps,
      tags: article.tags,
      responses: article.responses.map((r) => ({
        id: r.id,
        userId: r.userId,
        userName: r.user.name,
        userAvatar: r.user.avatar ?? undefined,
        text: r.text,
        createdAt: r.createdAt.toISOString(),
        claps: r.claps,
      })),
      highlights: article.highlights.map((h) => ({
        id: h.id,
        articleId: h.articleId,
        userId: h.userId,
        userName: h.user.name,
        userAvatar: h.user.avatar ?? undefined,
        text: h.text,
        comment: h.comment,
        createdAt: h.createdAt.toISOString(),
      })),
    });
  } catch (e) {
    console.error("GET /api/articles/by-slug/[slug]", e);
    return NextResponse.json(
      { error: "Failed to fetch article" },
      { status: 500 }
    );
  }
}
