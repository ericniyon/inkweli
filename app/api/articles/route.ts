import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const LIST_PAGE_SIZE = 50;

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const admin = url.searchParams.get("admin") === "1";

    // List/feed: only fields needed for cards; no content, responses, or highlights (big payload + slow query)
    const articles = await prisma.article.findMany({
      where: admin ? undefined : { status: "PUBLISHED" },
      select: {
        id: true,
        title: true,
        slug: true,
        excerpt: true,
        authorId: true,
        publishDate: true,
        status: true,
        featuredImage: true,
        readingTime: true,
        category: true,
        claps: true,
        tags: true,
        author: {
          select: { id: true, name: true, avatar: true },
        },
      },
      orderBy: { publishDate: "desc" },
      take: LIST_PAGE_SIZE,
    });

    const mapped = articles.map((a) => ({
      id: a.id,
      title: a.title,
      slug: a.slug,
      excerpt: a.excerpt,
      content: "", // Omit full content for list; use GET /api/articles/[id] for detail
      authorId: a.authorId,
      authorName: a.author.name,
      authorAvatar: a.author.avatar ?? undefined,
      publishDate: a.publishDate.toISOString().slice(0, 10),
      status: a.status,
      featuredImage: a.featuredImage,
      readingTime: a.readingTime,
      category: a.category,
      claps: a.claps,
      tags: a.tags,
      responses: [],
      highlights: [],
    }));

    return NextResponse.json(mapped);
  } catch (e) {
    console.error("GET /api/articles", e);
    return NextResponse.json(
      { error: "Failed to fetch articles" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      title,
      slug,
      excerpt,
      content,
      authorId,
      featuredImage,
      readingTime,
      category,
      tags,
      status = "DRAFT",
    } = body;

    if (!title || !slug || !authorId) {
      return NextResponse.json(
        { error: "Missing required fields: title, slug, authorId" },
        { status: 400 }
      );
    }

    // Ensure author exists; default article writer is Katurebe
    let authorIdToUse = authorId;
    const authorExists = await prisma.user.findUnique({
      where: { id: authorId },
      select: { id: true },
    });
    if (!authorExists) {
      const defaultAuthor = await prisma.user.upsert({
        where: { id: "auth_katurebe" },
        create: {
          id: "auth_katurebe",
          email: "katurebe@inkwell.local",
          name: "Katurebe",
          role: "ADMIN",
          tier: "UNLIMITED",
        },
        update: {},
        select: { id: true },
      });
      authorIdToUse = defaultAuthor.id;
    }

    // Ensure unique slug for new articles
    let slugToUse = slug;
    let slugSuffix = 0;
    while (true) {
      const existing = await prisma.article.findUnique({
        where: { slug: slugToUse },
        select: { id: true },
      });
      if (!existing) break;
      slugSuffix += 1;
      slugToUse = `${slug}-${slugSuffix}`;
    }

    const article = await prisma.article.create({
      data: {
        title,
        slug: slugToUse,
        excerpt: excerpt ?? "",
        content: content ?? "",
        authorId: authorIdToUse,
        featuredImage: featuredImage ?? "",
        readingTime: readingTime ?? 0,
        category: category ?? "General",
        tags: Array.isArray(tags) ? tags : [],
        status: status === "PUBLISHED" ? "PUBLISHED" : status === "SCHEDULED" ? "SCHEDULED" : "DRAFT",
        publishDate: new Date(),
      },
      include: {
        author: {
          select: { id: true, name: true, avatar: true },
        },
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
      responses: [],
      highlights: [],
    });
  } catch (e) {
    console.error("POST /api/articles", e);
    return NextResponse.json(
      { error: "Failed to create article" },
      { status: 500 }
    );
  }
}
