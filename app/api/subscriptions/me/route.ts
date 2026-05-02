import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isPaidUrubutuTransactionStatus } from "@/lib/urubutopay-claim";

/**
 * Signed-in user's subscription rows (with matching SubscriptionPlan rows when present),
 * plus `per_article_unlocks`: stories with a confirmed unlock only (ACTIVE `plan_per_article`
 * subscription and/or ONE_ARTICLE UrubutuPay txn whose status counts as paid).
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    const userId = session && (session as { userId?: string }).userId;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const [subs, txRows] = await Promise.all([
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
      prisma.urubutoPayTransaction.findMany({
        where: { userId, articleId: { not: null } },
        select: { articleId: true, status: true, tier: true },
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

    // Story access: only successes — active per-article subscription and/or gateway-paid txn rows.
    for (const s of subs) {
      if (
        s.planId === "plan_per_article" &&
        s.status === "ACTIVE" &&
        s.articleId
      ) {
        pushArticle(s.articleId);
      }
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
