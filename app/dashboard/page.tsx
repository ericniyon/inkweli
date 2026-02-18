import Dashboard from "@/components/dashboard/Dashboard";
import { getArticlesList, getWriters } from "@/lib/articles-server";

export default async function DashboardPage() {
  const [initialArticles, initialWriters] = await Promise.all([
    getArticlesList(false),
    getWriters(),
  ]);
  return (
    <Dashboard
      initialArticles={initialArticles}
      initialWriters={initialWriters}
    />
  );
}
