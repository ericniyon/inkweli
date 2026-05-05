import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import { buildArticlePreviewHtml } from "@/lib/article-paywall-preview";
import { userHasFullReadAccessToArticle } from "@/lib/article-access";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = session.userId;

    const { id } = await params;

    const article = await prisma.article.findUnique({
      where: { id },
      include: {
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
      },
    });
    if (!article) {
      return NextResponse.json({ error: "Article not found" }, { status: 404 });
    }

    let hasClapped = false;
    if (userId && userId !== "guest") {
      try {
        const clap = await prisma.clap.findUnique({
          where: {
            userId_articleId: {
              userId,
              articleId: id,
            },
          },
        });
        hasClapped = !!clap;
      } catch {
        hasClapped = false;
      }
    }

    const readerHasFullAccess = await userHasFullReadAccessToArticle(userId, id, {
      articleAuthorId: article.authorId,
    });

    const contentPayload = readerHasFullAccess
      ? article.content
      : buildArticlePreviewHtml(article.content, id);

    const response = NextResponse.json({
      id: article.id,
      title: article.title,
      slug: article.slug,
      excerpt: article.excerpt,
      content: contentPayload,
      authorId: article.authorId,
      authorName: article.author.name,
      authorAvatar: article.author.avatar ?? undefined,
      publishDate: article.publishDate.toISOString().slice(0, 10),
      status: article.status,
      featuredImage: article.featuredImage,
      readingTime: article.readingTime,
      category: article.category,
      claps: article.claps,
      hasClapped,
      tags: article.tags,
      scheduledPublishAt: article.scheduledPublishAt?.toISOString() ?? null,
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
      readerHasFullAccess,
    });

    // No cache so detail view always shows latest edited content
    response.headers.set("Cache-Control", "private, no-store, max-age=0");
    return response;
  } catch (e) {
    console.error("GET /api/articles/[id]", e);
    return NextResponse.json(
      { error: "Failed to fetch article" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const {
      title,
      slug,
      excerpt,
      content,
      featuredImage,
      readingTime,
      category,
      tags,
      status,
      scheduledPublishAt,
    } = body;

    const article = await prisma.article.update({
      where: { id },
      data: {
        ...(title != null && { title }),
        ...(slug != null && { slug }),
        ...(excerpt != null && { excerpt }),
        ...(content != null && { content }),
        ...(featuredImage != null && { featuredImage }),
        ...(readingTime != null && { readingTime }),
        ...(category != null && { category }),
        ...(Array.isArray(tags) && { tags }),
        ...(status != null && { status }),
        ...(scheduledPublishAt != null && { scheduledPublishAt: scheduledPublishAt ? new Date(scheduledPublishAt) : null }),
      },
      include: {
        author: { select: { id: true, name: true, avatar: true } },
      },
    });

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
      scheduledPublishAt: article.scheduledPublishAt?.toISOString() ?? null,
    });
  } catch (e) {
    console.error("PATCH /api/articles/[id]", e);
    return NextResponse.json(
      { error: "Failed to update article" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await prisma.article.delete({
      where: { id },
    });
    return new NextResponse(null, { status: 204 });
  } catch (e) {
    console.error("DELETE /api/articles/[id]", e);
    return NextResponse.json(
      { error: "Failed to delete article" },
      { status: 500 }
    );
  }
}
