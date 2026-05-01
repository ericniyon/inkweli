import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { initiateSubscriptionPaymentViaGateway } from "@/lib/payments-initiate";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const plan_id =
      typeof body.plan_id === "string" ? body.plan_id.trim() : "plan_per_article";
    let article_id =
      typeof body.article_id === "string"
        ? body.article_id.trim()
        : typeof body.articleId === "string"
          ? body.articleId.trim()
          : "";
    if (!article_id && plan_id === "plan_per_article") {
      const row = await prisma.article.findFirst({
        select: { id: true },
        orderBy: { createdAt: "asc" },
      });
      article_id = row?.id ?? "";
    }

    const result = await initiateSubscriptionPaymentViaGateway({
      plan_id: plan_id || "plan_per_article",
      amount: body.amount || 20,
      user_id: body.user_id || "test_user_123",
      email: body.email || "ericniyonkuru0007@gmail.com",
      name: body.name || "EWS",
      phone: body.phone || "250788616703",
      channelName: body.channelName || "MOMO",
      ...(article_id ? { article_id } : {}),
    });

    if (!result.ok) {
      return NextResponse.json(
        { error: result.error, details: result.details },
        { status: result.status }
      );
    }

    return NextResponse.json({
      payment_url: result.payment_url,
      payment_reference: result.payment_reference,
    });
  } catch (e) {
    console.error("[test-payment]", e);
    return NextResponse.json(
      { error: "Payment initiation failed" },
      { status: 500 }
    );
  }
}
