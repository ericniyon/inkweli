import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function normalizeFeatures(features: unknown): string[] {
  if (!Array.isArray(features)) return [];
  return features
    .map((item) => (typeof item === "string" ? item.trim() : ""))
    .filter(Boolean);
}

export async function GET() {
  try {
    const plans = await prisma.subscriptionPlan.findMany({
      orderBy: [{ createdAt: "asc" }, { price: "asc" }],
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

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const id = typeof body?.id === "string" ? body.id.trim() : "";
    const tier = typeof body?.tier === "string" ? body.tier.trim() : "";
    const name = typeof body?.name === "string" ? body.name.trim() : "";
    const interval =
      typeof body?.interval === "string" ? body.interval.trim() : "";
    const color =
      typeof body?.color === "string" && body.color.trim()
        ? body.color.trim()
        : null;
    const price =
      typeof body?.price === "number"
        ? Math.round(body.price)
        : Number.parseInt(String(body?.price ?? ""), 10);
    const features = normalizeFeatures(body?.features);

    if (!id || !tier || !name || !interval || !Number.isFinite(price) || price < 0) {
      return NextResponse.json(
        { error: "id, tier, name, interval and valid price are required" },
        { status: 400 }
      );
    }

    const plan = await prisma.subscriptionPlan.create({
      data: { id, tier, name, interval, price, features, color },
    });

    return NextResponse.json(
      {
        id: plan.id,
        tier: plan.tier,
        name: plan.name,
        price: plan.price,
        interval: plan.interval,
        features: plan.features,
        color: plan.color ?? undefined,
      },
      { status: 201 }
    );
  } catch (e) {
    console.error("POST /api/subscription-plans", e);
    return NextResponse.json(
      { error: "Failed to create subscription plan" },
      { status: 500 }
    );
  }
}
