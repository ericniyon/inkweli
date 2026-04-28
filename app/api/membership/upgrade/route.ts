import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions, userToPayload } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { SubscriptionTier } from "@prisma/client";

function planIdToTier(planId: string): SubscriptionTier {
  if (planId === "plan_annual") return "UNLIMITED";
  if (planId === "plan_per_article") return "ONE_ARTICLE";
  return "ONE_ARTICLE";
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    const userId = session?.userId;
    if (!userId) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const planId = typeof body.planId === "string" ? body.planId.trim() : "";

    if (!planId) {
      return NextResponse.json({ error: "planId is required" }, { status: 400 });
    }

    const tier = planIdToTier(planId);

    await prisma.user.update({
      where: { id: userId },
      data: { tier },
    });

    const payload = await userToPayload(userId);
    if (!payload) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json(payload);
  } catch (e) {
    console.error("POST /api/membership/upgrade", e);
    return NextResponse.json(
      { error: "Upgrade failed. Please try again." },
      { status: 500 }
    );
  }
}

