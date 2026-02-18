"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import App from "@/App";
import { useAuth } from "@/lib/auth-context";
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
  const router = useRouter();
  const { user, isGuest } = useAuth();

  useEffect(() => {
    if (!isGuest) {
      router.replace(user.role === "ADMIN" ? "/admin" : "/dashboard");
    }
  }, [isGuest, user.role, router]);

  if (!isGuest) {
    return null;
  }

  return (
    <App
      initialArticles={initialArticles}
      initialWriters={initialWriters}
    />
  );
}
