import HomeClient from "@/components/HomeClient";
import { getArticlesList, getWriters } from "@/lib/articles-server";

export default async function Home() {
  const [articles, writers] = await Promise.all([
    getArticlesList(false),
    getWriters(),
  ]);
  return (
    <HomeClient
      initialArticles={articles}
      initialWriters={writers}
    />
  );
}
