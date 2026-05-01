import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isPaidUrubutuTransactionStatus } from "@/lib/urubutopay-claim";

/**
 * Signed-in user's subscription rows (with matching SubscriptionPlan rows when present),
 * plus resolved `per_article_unlocks` for per-story checkout when recorded.
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    const userId = session && (session as { userId?: string }).userId;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const [subs, userRow, txRows, paymentRows] = await Promise.all([
      prisma.subscription.findMany({
        where: { userId },
        orderBy: { updatedAt: "desc" },
        select: {
          id: true,
          planId: true,
          articleId: true,
          status: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
      prisma.user.findUnique({
        where: { id: userId },
        select: { tier: true },
      }),
      prisma.urubutoPayTransaction.findMany({
        where: { userId, articleId: { not: null } },
        select: { articleId: true, status: true, tier: true },
      }),
      prisma.payment.findMany({
        where: {
          userId,
          articleId: { not: null },
          planId: "plan_per_article",
        },
        orderBy: { createdAt: "desc" },
        take: 24,
        select: { articleId: true },
      }),
    ]);

    const planIds = [...new Set(subs.map((s) => s.planId).filter(Boolean))];
    const plans =
      planIds.length > 0
        ? await prisma.subscriptionPlan.findMany({
            where: { id: { in: planIds } },
            select: {
              id: true,
              name: true,
              tier: true,
              interval: true,
              price: true,
              features: true,
              color: true,
            },
          })
        : [];
    const planById = new Map(plans.map((p) => [p.id, p]));

    const orderedArticleIds: string[] = [];
    const seenArticles = new Set<string>();
    const pushArticle = (id: string | null | undefined) => {
      if (!id || seenArticles.has(id)) return;
      seenArticles.add(id);
      orderedArticleIds.push(id);
    };

    for (const s of subs) {
      if (s.status === "ACTIVE" && s.articleId) pushArticle(s.articleId);
    }
    for (const t of txRows) {
      if (
        t.articleId &&
        t.tier === "ONE_ARTICLE" &&
        isPaidUrubutuTransactionStatus(t.status)
      ) {
        pushArticle(t.articleId);
      }
    }
    for (const s of subs) {
      if (s.status === "PENDING" && s.articleId) pushArticle(s.articleId);
    }
    if (userRow?.tier === "ONE_ARTICLE") {
      for (const p of paymentRows) {
        pushArticle(p.articleId);
      }
    }

    const perArticleArticles =
      orderedArticleIds.length > 0
        ? await prisma.article.findMany({
            where: { id: { in: orderedArticleIds } },
            select: { id: true, title: true, slug: true },
          })
        : [];

    const rank = new Map(orderedArticleIds.map((id, i) => [id, i]));
    perArticleArticles.sort(
      (a, b) => (rank.get(a.id) ?? 9999) - (rank.get(b.id) ?? 9999)
    );

    return NextResponse.json({
      subscriptions: subs.map((s) => ({
        ...s,
        plan: planById.get(s.planId) ?? null,
      })),
      per_article_unlocks: perArticleArticles,
    });
  } catch (e) {
    console.error("[subscriptions/me]", e);
    return NextResponse.json({ error: "Failed to load subscriptions" }, { status: 500 });
  }
}
