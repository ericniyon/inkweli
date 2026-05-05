import Link from "next/link";
import { getServerSession } from "next-auth";
import ArticleDetailClient from "@/components/ArticleDetailClient";
import { authOptions } from "@/lib/auth";
import { getArticleById, getArticlesList, getWriters } from "@/lib/articles-server";
import { buildArticlePreviewHtml } from "@/lib/article-paywall-preview";
import { userHasFullReadAccessToArticle } from "@/lib/article-access";

type PageProps = { params: Promise<{ id: string }> };

// Always fetch fresh article so edits from the editor are shown
export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function ArticleDetailPage({ params }: PageProps) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  const userId = session?.userId ?? null;

  const [article, allArticles, writers] = await Promise.all([
    getArticleById(id, userId),
    getArticlesList(false),
    getWriters(),
  ]);

  if (!article) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center px-6">
        <h1 className="font-charter text-medium-h1 font-black text-slate-900 mb-2">Article not found</h1>
        <p className="font-charter text-medium-body text-slate-500 mb-6">
          The story you’re looking for doesn’t exist or was removed.
        </p>
        <Link
          href="/"
          className="font-charter px-6 py-2.5 bg-slate-900 text-white rounded-full text-medium-meta font-bold hover:bg-slate-800 transition"
        >
          Back to home
        </Link>
      </div>
    );
  }

  const readerHasFullAccess = await userHasFullReadAccessToArticle(userId, id, {
    articleAuthorId: article.authorId,
  });

  const articleForReader = readerHasFullAccess
    ? article
    : { ...article, content: buildArticlePreviewHtml(article.content, id) };

  return (
    <ArticleDetailClient
      article={articleForReader}
      allArticles={allArticles}
      writers={writers}
      initialReaderHasFullAccess={readerHasFullAccess}
    />
  );
}

export async function generateMetadata({ params }: PageProps) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  const article = await getArticleById(id, session?.userId ?? null);
  if (!article) return { title: "Article not found | usethinkup" };
  return { title: `${article.title} | usethinkup` };
}
