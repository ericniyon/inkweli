import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const plans = await prisma.subscriptionPlan.findMany({
      orderBy: { price: "asc" },
    });
    return NextResponse.json(
      plans.map((p) => ({
        id: p.id,
        tier: p.tier,
        name: p.name,
        price: p.price,
        interval: p.interval,
        features: p.features,
        color: p.color ?? undefined,
      }))
    );
  } catch (e) {
    console.error("GET /api/subscription-plans", e);
    return NextResponse.json(
      { error: "Failed to fetch subscription plans" },
      { status: 500 }
    );
  }
}
