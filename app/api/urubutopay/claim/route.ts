import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions, userToPayload } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { claimPaidTransactionForUser } from "@/lib/urubutopay-claim";

/** Link a validated payment reference to the signed-in account and apply tier. */
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    const userId = session?.userId;
    if (!userId) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const reference =
      typeof body.paymentReference === "string"
        ? body.paymentReference.trim()
        : typeof body.payment_reference === "string"
          ? body.payment_reference.trim()
          : "";

    if (!reference) {
      return NextResponse.json({ error: "paymentReference required" }, { status: 400 });
    }

    const userRow = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true },
    });

    const userEmail =
      typeof session?.user?.email === "string" && session.user.email.trim().length > 0
        ? session.user.email.trim().toLowerCase()
        : userRow?.email?.trim().toLowerCase() ?? "";

    if (!userEmail) {
      return NextResponse.json({ error: "Account email unavailable" }, { status: 400 });
    }

    const result = await claimPaidTransactionForUser({
      reference,
      userId,
      userEmail,
    });

    if (!result.ok) {
      const status =
        result.code === "NOT_FOUND"
          ? 404
          : result.code === "NOT_PAID"
            ? 400
            : result.code === "ALREADY_CLAIMED"
              ? 409
              : result.code === "EMAIL_MISMATCH"
                ? 400
                : 400;
      return NextResponse.json({ error: result.message, code: result.code }, { status });
    }

    const payload = await userToPayload(userId);
    if (!payload) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json(payload);
  } catch (e) {
    console.error("[urubutopay/claim]", e);
    return NextResponse.json({ error: "Claim failed" }, { status: 500 });
  }
}
