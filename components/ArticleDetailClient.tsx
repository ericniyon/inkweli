"use client";

import React, { useState, useEffect, Suspense, useCallback, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Article, SubscriptionTier } from "@/types";
import { useAuth } from "@/lib/auth-context";
import type { WriterItem } from "@/lib/articles-server";
import SiteHeader from "@/components/SiteHeader";
import DetailSidebar from "@/components/DetailSidebar";
import ArticleReader from "@/components/ArticleReader";
import Footer from "@/components/Footer";
import PaymentDialog, { type PlanForPayment } from "@/components/PaymentDialog";
import PaymentStatusTracker from "@/components/PaymentStatusTracker";
import { SUBSCRIPTION_PLANS, type SubscriptionPlanConfig } from "@/constants";

type ArticleDetailClientProps = {
  article: Article;
  allArticles: Article[];
  writers: WriterItem[];
  /** Server: annual/unlimited author staff or active per-article entitlement for this story */
  initialReaderHasFullAccess?: boolean;
};

function ArticleDetailClientInner({
  article: initialArticle,
  allArticles,
  writers,
  initialReaderHasFullAccess = false,
}: ArticleDetailClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, setUser, isGuest, hydrated } = useAuth();
  const [article, setArticle] = useState<Article>(initialArticle);
  const [readerHasFullAccess, setReaderHasFullAccess] = useState(initialReaderHasFullAccess);
  const [plans, setPlans] = useState<SubscriptionPlanConfig[]>(SUBSCRIPTION_PLANS);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [checkoutPlan, setCheckoutPlan] = useState<PlanForPayment | null>(null);
  const autoOpenedPlanRef = useRef<string | null>(null);

  const planCfgToPayment = useCallback((planCfg: SubscriptionPlanConfig): PlanForPayment => {
    return {
      id: planCfg.id,
      name: planCfg.name,
      price: planCfg.price,
      currency: planCfg.currency,
      interval: planCfg.interval,
      features: planCfg.features,
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/subscription-plans")
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => {
        if (!Array.isArray(data) || cancelled) return;
        const fallbackById = new Map(SUBSCRIPTION_PLANS.map((plan) => [plan.id, plan]));
        const normalizedFromDb = data
          .filter((item: unknown) => item && typeof item === "object" && item !== null && "id" in item)
          .map((item: Record<string, unknown>) => {
            const id = typeof item.id === "string" ? item.id.trim() : "";
            const fallback = id ? fallbackById.get(id) : undefined;
            const features = Array.isArray(item.features)
              ? item.features
                  .map((f: unknown) => (typeof f === "string" ? f.trim() : ""))
                  .filter(Boolean)
              : [];
            return {
              id: id || "unknown",
              tier:
                typeof item.tier === "string" && item.tier.trim()
                  ? (item.tier.trim() as SubscriptionTier)
                  : fallback?.tier ?? SubscriptionTier.NONE,
              name:
                typeof item.name === "string" && item.name.trim()
                  ? item.name.trim()
                  : fallback?.name ?? "Package",
              price:
                typeof item.price === "number" && Number.isFinite(item.price)
                  ? item.price
                  : fallback?.price ?? 0,
              interval:
                typeof item.interval === "string" && item.interval.trim()
                  ? item.interval.trim()
                  : fallback?.interval ?? "article",
              features: features.length > 0 ? features : fallback?.features ?? [],
              color: fallback?.color ?? "slate",
              currency: "RWF" as const,
              paymentUrl: fallback?.paymentUrl ?? "#",
            } satisfies SubscriptionPlanConfig;
          })
          .filter((row) => row.id !== "unknown");

        if (normalizedFromDb.length > 0) {
          setPlans(normalizedFromDb);
        }
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    setReaderHasFullAccess(initialReaderHasFullAccess);
  }, [initialReaderHasFullAccess, initialArticle.id]);

  useEffect(() => {
    if (isGuest || user.id === "guest") return;
    fetch(`/api/articles/${initialArticle.id}`, { credentials: "include" })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!data) return;
        const full =
          typeof (data as { readerHasFullAccess?: unknown }).readerHasFullAccess === "boolean"
            ? (data as { readerHasFullAccess: boolean }).readerHasFullAccess
            : undefined;
        const { readerHasFullAccess: _omit, ...rest } = data as Article & {
          readerHasFullAccess?: boolean;
        };
        void _omit;
        setArticle(rest);
        if (typeof full === "boolean") setReaderHasFullAccess(full);
      })
      .catch(() => {});
  }, [initialArticle.id, user.id, isGuest, user.tier]);

  useEffect(() => {
    const prev = document.title;
    document.title = `${article.title} | usethinkup`;
    return () => {
      document.title = prev;
    };
  }, [article.title]);

  const refreshUserFromSession = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/me", { credentials: "include" });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data?.id && data?.email && data?.name) {
        setUser(data);
      }
    } catch {
      // ignore
    }
  }, [setUser]);

  /** Guests must sign in before checkout; login returns here with ?plan= so we open PaymentDialog */
  const redirectToLoginForArticleCheckout = useCallback(
    (planId: "plan_annual" | "plan_per_article") => {
      const path = `/detail/${article.id}?plan=${encodeURIComponent(planId)}`;
      router.push(`/login?callbackUrl=${encodeURIComponent(path)}`);
    },
    [article.id, router],
  );

  const openPerArticlePaymentDialog = useCallback(() => {
    if (isGuest) {
      redirectToLoginForArticleCheckout("plan_per_article");
      return;
    }
    const planCfg = plans.find((p) => p.id === "plan_per_article");
    if (!planCfg) return;
    setCheckoutPlan(planCfgToPayment(planCfg));
    setPaymentDialogOpen(true);
  }, [isGuest, redirectToLoginForArticleCheckout, plans, planCfgToPayment]);

  const openAnnualFullAccessDialog = useCallback(() => {
    if (isGuest) {
      redirectToLoginForArticleCheckout("plan_annual");
      return;
    }
    const planCfg = plans.find((p) => p.id === "plan_annual");
    if (!planCfg) return;
    setCheckoutPlan(planCfgToPayment(planCfg));
    setPaymentDialogOpen(true);
  }, [isGuest, redirectToLoginForArticleCheckout, plans, planCfgToPayment]);

  useEffect(() => {
    if (!hydrated || isGuest || plans.length === 0) return;
    const pid = searchParams.get("plan")?.trim();
    if (!pid || (pid !== "plan_per_article" && pid !== "plan_annual")) return;
    if (autoOpenedPlanRef.current === pid) return;

    const planCfg = plans.find((p) => p.id === pid);
    if (!planCfg) {
      router.replace(`/detail/${article.id}`, { scroll: false });
      autoOpenedPlanRef.current = null;
      return;
    }

    autoOpenedPlanRef.current = pid;
    setCheckoutPlan(planCfgToPayment(planCfg));
    setPaymentDialogOpen(true);
    router.replace(`/detail/${article.id}`, { scroll: false });
  }, [
    hydrated,
    isGuest,
    plans,
    router,
    searchParams,
    article.id,
    planCfgToPayment,
  ]);

  const onCheckoutSuccess = useCallback(async () => {
    await refreshUserFromSession();
    setPaymentDialogOpen(false);
    setCheckoutPlan(null);
    router.refresh();
  }, [refreshUserFromSession, router]);

  const handlePaymentComplete = useCallback(
    async (status: { isSuccess?: boolean }) => {
      await refreshUserFromSession();
      if (status.isSuccess) {
        router.refresh();
      }
    },
    [refreshUserFromSession, router],
  );

  const handleArticleClick = (a: Article) => {
    router.push(`/detail/${a.id}`);
  };

  const toggleBookmark = (articleId: string) => {
    if (isGuest) {
      router.push("/login");
      return;
    }
    setUser({
      ...user,
      bookmarks: user.bookmarks.includes(articleId)
        ? user.bookmarks.filter((id) => id !== articleId)
        : [...user.bookmarks, articleId],
    });
  };

  const toggleFollow = (authorId: string) => {
    if (isGuest) {
      router.push("/login");
      return;
    }
    setUser({
      ...user,
      following: user.following.includes(authorId)
        ? user.following.filter((id) => id !== authorId)
        : [...user.following, authorId],
    });
  };

  return (
    <div className="min-h-screen bg-white animate-fade-in">
      <SiteHeader variant="white" />

      <div className="flex pt-0">
        <Suspense
          fallback={
            <aside
              className="w-56 border-r border-slate-200/80 h-screen fixed left-0 top-0 hidden md:block z-40 bg-[#FDFCFB]"
              aria-hidden
            />
          }
        >
          <DetailSidebar writers={writers} />
        </Suspense>
        <main className="flex-1 md:ml-56 flex flex-col min-h-screen">
          <ArticleReader
            article={article}
            allArticles={allArticles}
            currentUser={user}
            onArticleClick={handleArticleClick}
            onAuthorClick={() => {}}
            isBookmarked={user.bookmarks.includes(article.id)}
            onToggleBookmark={() => toggleBookmark(article.id)}
            isFollowing={user.following.includes(article.authorId)}
            onToggleFollow={() => toggleFollow(article.authorId)}
            isLimitedAccess={isGuest || !readerHasFullAccess}
            onReadMoreClick={() => router.push("/membership")}
            onPerArticleCheckout={openPerArticlePaymentDialog}
            onFullAccessCheckout={openAnnualFullAccessDialog}
            writers={writers}
          />
          <Footer />
        </main>
      </div>

      <PaymentDialog
        isOpen={paymentDialogOpen}
        onClose={() => {
          setPaymentDialogOpen(false);
          setCheckoutPlan(null);
        }}
        plan={checkoutPlan}
        onPaymentSuccess={onCheckoutSuccess}
        payerNameOverride={!isGuest && user.id !== "guest" ? user.name : undefined}
        payerEmailOverride={!isGuest && user.id !== "guest" ? user.email : undefined}
        authenticatedCheckout={!isGuest && user.id !== "guest"}
        checkoutUserId={!isGuest && user.id !== "guest" ? user.id : null}
        checkoutArticleId={article.id}
      />
      <PaymentStatusTracker onPaymentComplete={handlePaymentComplete} />
    </div>
  );
}

export default function ArticleDetailClient(props: ArticleDetailClientProps) {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-white flex items-center justify-center">
          <div className="w-10 h-10 border-2 border-slate-200 border-t-slate-900 rounded-full animate-spin" />
        </div>
      }
    >
      <ArticleDetailClientInner {...props} />
    </Suspense>
  );
}
