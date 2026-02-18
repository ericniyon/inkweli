import Link from "next/link";
import ArticleDetailClient from "@/components/ArticleDetailClient";
import { getArticleById, getArticlesList, getWriters } from "@/lib/articles-server";

type PageProps = { params: Promise<{ id: string }> };

export default async function ArticleDetailPage({ params }: PageProps) {
  const { id } = await params;
  const [article, allArticles, writers] = await Promise.all([
    getArticleById(id, null),
    getArticlesList(false),
    getWriters(),
  ]);

  if (!article) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center px-6">
        <h1 className="text-2xl font-black text-slate-900 mb-2">Article not found</h1>
        <p className="text-slate-500 mb-6">
          The story you’re looking for doesn’t exist or was removed.
        </p>
        <Link
          href="/"
          className="px-6 py-2.5 bg-slate-900 text-white rounded-full text-sm font-bold hover:bg-slate-800 transition"
        >
          Back to home
        </Link>
      </div>
    );
  }

  return (
    <ArticleDetailClient
      article={article}
      allArticles={allArticles}
      writers={writers}
    />
  );
}

export async function generateMetadata({ params }: PageProps) {
  const { id } = await params;
  const article = await getArticleById(id, null);
  if (!article) return { title: "Article not found | usethinkup" };
  return { title: `${article.title} | usethinkup` };
}
