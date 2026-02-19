"use client";

import App from "@/App";
import type { Article } from "@/types";
import type { WriterItem } from "@/lib/articles-server";

type HomeClientProps = {
  initialArticles: Article[];
  initialWriters: WriterItem[];
};

export default function HomeClient({
  initialArticles,
  initialWriters,
}: HomeClientProps) {
  return (
    <App
      initialArticles={initialArticles}
      initialWriters={initialWriters}
    />
  );
}
