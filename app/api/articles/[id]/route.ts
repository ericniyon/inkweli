import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const url = new URL(request.url);
    const userId = url.searchParams.get("userId");

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

    const response = NextResponse.json({
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
      hasClapped,
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

    // Allow short-term cache so reloads and back/forward are faster
    response.headers.set("Cache-Control", "private, max-age=60, stale-while-revalidate=120");
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
