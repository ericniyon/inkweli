import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import ArticleDetailClient from "@/components/ArticleDetailClient";
import { authOptions } from "@/lib/auth";
import { getArticleById, getArticlesList, getWriters } from "@/lib/articles-server";

type PageProps = { params: Promise<{ id: string }> };

// Always fetch fresh article so edits from the editor are shown
export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function ArticleDetailPage({ params }: PageProps) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.userId) {
    redirect(`/login?callbackUrl=${encodeURIComponent(`/detail/${id}`)}`);
  }

  const [article, allArticles, writers] = await Promise.all([
    getArticleById(id, session.userId),
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
  const session = await getServerSession(authOptions);
  if (!session?.userId) {
    return { title: "Sign in to read | usethinkup" };
  }
  const article = await getArticleById(id, session.userId);
  if (!article) return { title: "Article not found | usethinkup" };
  return { title: `${article.title} | usethinkup` };
}
