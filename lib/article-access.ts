import type { SubscriptionTier } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { checkoutPlanRequiresLinkedArticle } from "@/lib/urubutopay-initiate-shared";
import { isPaidUrubutuTransactionStatus } from "@/lib/urubutopay-claim";

async function planIsStoryUnlock(planId: string): Promise<boolean> {
  if (planId === "plan_per_article") return true;
  return checkoutPlanRequiresLinkedArticle(planId);
}

/**
 * Whether the viewer may load this article body in full:
 * unlimited (annual/full access), author viewing own story, purchased unlock for this story,
 * or **staff** (ADMIN / EDITOR) — staff always get full text on the public reader without payment.
 */
export async function userHasFullReadAccessToArticle(
  userId: string | null | undefined,
  articleId: string,
  options?: {
    articleAuthorId?: string;
    userTier?: SubscriptionTier;
    userRole?: string;
  }
): Promise<boolean> {
  if (!userId || userId === "guest") return false;

  let tier = options?.userTier ?? null;
  let role = options?.userRole ?? null;
  if (tier === null || role === null) {
    const row = await prisma.user.findUnique({
      where: { id: userId },
      select: { tier: true, role: true },
    });
    tier = row?.tier ?? "NONE";
    role = row?.role ?? "";
  }

  if (role === "ADMIN" || role === "EDITOR") return true;
  if (tier === "UNLIMITED") return true;
  if (options?.articleAuthorId && options.articleAuthorId === userId) return true;

  const unlocked = await prisma.subscription.findFirst({
    where: {
      userId,
      articleId,
      status: "ACTIVE",
      planId: "plan_per_article",
    },
    select: { id: true },
  });
  if (unlocked) return true;

  const txRows = await prisma.urubutoPayTransaction.findMany({
    where: {
      userId,
      articleId,
      tier: "ONE_ARTICLE",
    },
    select: { status: true, planId: true },
    orderBy: { updatedAt: "desc" },
    take: 8,
  });
  for (const tx of txRows) {
    if (!isPaidUrubutuTransactionStatus(tx.status)) continue;
    if (await planIsStoryUnlock(tx.planId)) return true;
  }

  return false;
}
