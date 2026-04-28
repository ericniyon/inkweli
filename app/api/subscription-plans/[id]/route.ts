import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function normalizeFeatures(features: unknown): string[] | undefined {
  if (!Array.isArray(features)) return undefined;
  return features
    .map((item) => (typeof item === "string" ? item.trim() : ""))
    .filter(Boolean);
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const data: {
      tier?: string;
      name?: string;
      price?: number;
      interval?: string;
      features?: string[];
      color?: string | null;
    } = {};

    if (typeof body?.tier === "string") data.tier = body.tier.trim();
    if (typeof body?.name === "string") data.name = body.name.trim();
    if (typeof body?.interval === "string") data.interval = body.interval.trim();
    if (body?.price !== undefined) {
      const price =
        typeof body.price === "number"
          ? Math.round(body.price)
          : Number.parseInt(String(body.price), 10);
      if (!Number.isFinite(price) || price < 0) {
        return NextResponse.json({ error: "Invalid price" }, { status: 400 });
      }
      data.price = price;
    }
    const features = normalizeFeatures(body?.features);
    if (features) data.features = features;
    if (body?.color !== undefined) {
      data.color =
        typeof body.color === "string" && body.color.trim()
          ? body.color.trim()
          : null;
    }

    const updated = await prisma.subscriptionPlan.update({
      where: { id },
      data,
    });

    return NextResponse.json({
      id: updated.id,
      tier: updated.tier,
      name: updated.name,
      price: updated.price,
      interval: updated.interval,
      features: updated.features,
      color: updated.color ?? undefined,
    });
  } catch (e) {
    console.error("PATCH /api/subscription-plans/[id]", e);
    return NextResponse.json(
      { error: "Failed to update subscription plan" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await prisma.subscriptionPlan.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("DELETE /api/subscription-plans/[id]", e);
    return NextResponse.json(
      { error: "Failed to delete subscription plan" },
      { status: 500 }
    );
  }
}
