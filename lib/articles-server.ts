import { prisma } from "@/lib/prisma";
import type { Article, Category } from "@/types";

const LIST_PAGE_SIZE = 50;

/** Server-only: fetch article list for feeds. No full content. */
export async function getArticlesList(admin = false): Promise<Article[]> {
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

  return articles.map((a) => ({
    id: a.id,
    title: a.title,
    slug: a.slug,
    excerpt: a.excerpt,
    content: "",
    authorId: a.authorId,
    authorName: a.author.name,
    authorAvatar: a.author.avatar ?? undefined,
    publishDate: a.publishDate.toISOString().slice(0, 10),
    status: a.status,
    featuredImage: a.featuredImage,
    readingTime: a.readingTime,
    category: a.category as Category,
    claps: a.claps,
    tags: a.tags,
    responses: [],
    highlights: [],
  }));
}

/** Server-only: fetch full article by id. Optionally pass userId for hasClapped. */
export async function getArticleById(
  id: string,
  userId?: string | null
): Promise<Article | null> {
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

  if (!article) return null;

  let hasClapped = false;
  if (userId && userId !== "guest") {
    try {
      const clap = await prisma.clap.findUnique({
        where: {
          userId_articleId: { userId, articleId: id },
        },
      });
      hasClapped = !!clap;
    } catch {
      hasClapped = false;
    }
  }

  return {
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
    category: article.category as Category,
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
  };
}

export type WriterItem = {
  id: string;
  name: string;
  role?: string;
  bio?: string;
  image?: string;
  articlesCount: number;
  socials: { twitter: string; linkedin: string };
};

/** Server-only: fetch writers for right panel / sidebar. Article count is derived from Article table by matching writer name to User name. */
export async function getWriters(): Promise<WriterItem[]> {
  const [writers, articleCountsByAuthor, users] = await Promise.all([
    prisma.writer.findMany({ orderBy: { createdAt: "desc" } }),
    prisma.article.groupBy({
      by: ["authorId"],
      _count: { id: true },
    }),
    prisma.user.findMany({ select: { id: true, name: true } }),
  ]);

  const countByUserId = new Map(
    articleCountsByAuthor.map((row) => [row.authorId, row._count.id])
  );
  const userIdByName = new Map(
    users.map((u) => [u.name.trim().toLowerCase(), u.id])
  );

  return writers.map((w) => {
    const userId = userIdByName.get(w.name.trim().toLowerCase());
    const articlesCount =
      userId != null ? countByUserId.get(userId) ?? 0 : w.articlesCount;
    return {
      id: w.id,
      name: w.name,
      role: w.role ?? undefined,
      bio: w.bio ?? undefined,
      image: w.image ?? undefined,
      articlesCount,
      socials: {
        twitter: w.twitter ?? "#",
        linkedin: w.linkedin ?? "#",
      },
    };
  });
}
