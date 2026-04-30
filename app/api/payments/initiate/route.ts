import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { initiateSubscriptionPaymentViaGateway } from "@/lib/payments-initiate";

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    const sessionUserId = session?.userId;
    if (!sessionUserId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await request.json().catch(() => ({}))) as Record<
      string,
      unknown
    >;

    const plan_id =
      typeof body.plan_id === "string" ? body.plan_id.trim() : "";
    const amount = body.amount;
    const user_id = typeof body.user_id === "string" ? body.user_id.trim() : "";
    const email = typeof body.email === "string" ? body.email.trim() : "";
    const name = typeof body.name === "string" ? body.name.trim() : "";
    const phone = typeof body.phone === "string" ? body.phone.trim() : "";
    const channelNameRaw =
      typeof body.channelName === "string" && body.channelName.trim()
        ? body.channelName.trim()
        : typeof body.channel_name === "string" && body.channel_name.trim()
          ? body.channel_name.trim()
          : undefined;

    if (user_id !== sessionUserId) {
      return NextResponse.json(
        { error: "user_id does not match the signed-in user" },
        { status: 403 }
      );
    }

    const result = await initiateSubscriptionPaymentViaGateway({
      plan_id,
      amount: typeof amount === "number" ? amount : NaN,
      user_id,
      email,
      name,
      phone,
      ...(channelNameRaw !== undefined ? { channelName: channelNameRaw } : {}),
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
    console.error("[api/payments/initiate]", e);
    return NextResponse.json(
      { error: "Payment initiation failed" },
      { status: 500 }
    );
  }
}
