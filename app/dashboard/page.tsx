import { Suspense } from "react";
import Dashboard from "@/components/dashboard/Dashboard";
import { getArticlesList, getWriters } from "@/lib/articles-server";

function DashboardSuspenseFallback() {
  return (
    <div className="min-h-screen bg-[#FDFCFB] flex items-center justify-center">
      <div className="w-10 h-10 border-2 border-stone-200 border-t-indigo-600 rounded-full animate-spin" />
    </div>
  );
}

export default async function DashboardPage() {
  const [initialArticles, initialWriters] = await Promise.all([
    getArticlesList(false),
    getWriters(),
  ]);
  return (
    <Suspense fallback={<DashboardSuspenseFallback />}>
      <Dashboard
        initialArticles={initialArticles}
        initialWriters={initialWriters}
      />
    </Suspense>
  );
}
