import { NextResponse } from "next/server";
import { initiateSubscriptionPaymentViaGateway } from "@/lib/payments-initiate";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    const result = await initiateSubscriptionPaymentViaGateway({
      plan_id: body.plan_id || "plan_per_article",
      amount: body.amount || 20,
      user_id: body.user_id || "test_user_123",
      email: body.email || "ericniyonkuru0007@gmail.com",
      name: body.name || "EWS",
      phone: body.phone || "250788616703",
      channelName: body.channelName || "MOMO",
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
