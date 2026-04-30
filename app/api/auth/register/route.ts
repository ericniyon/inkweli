import { NextResponse } from "next/server";
import { UserRole, type SubscriptionTier } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/password";
import {
  findTransactionByPaymentReference,
  isPaidUrubutuTransactionStatus,
  planIdToSubscriptionTier,
} from "@/lib/urubutopay-claim";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, email, password, planId } = body;
    const paymentReference =
      typeof body.paymentReference === "string" ? body.paymentReference.trim() : "";

    if (!name || typeof name !== "string" || !name.trim()) {
      return NextResponse.json(
        { error: "Name is required" },
        { status: 400 }
      );
    }
    if (!email || typeof email !== "string" || !email.trim()) {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }
    if (!password || typeof password !== "string" || password.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters" },
        { status: 400 }
      );
    }

    const emailLower = email.trim().toLowerCase();

    const existing = await prisma.user.findUnique({
      where: { email: emailLower },
    });
    if (existing) {
      return NextResponse.json(
        { error: "An account with this email already exists" },
        { status: 409 }
      );
    }

    let tier: SubscriptionTier;
    let txnToLinkId: string | null = null;

    if (paymentReference) {
      const tx = await findTransactionByPaymentReference(paymentReference);
      if (!tx) {
        return NextResponse.json(
          { error: "Payment reference not found" },
          { status: 404 }
        );
      }
      if (!isPaidUrubutuTransactionStatus(tx.status)) {
        return NextResponse.json(
          {
            error: "Payment has not confirmed yet — wait a minute and try again",
          },
          { status: 400 }
        );
      }
      if (tx.userId) {
        return NextResponse.json(
          { error: "This payment is already linked — sign in instead." },
          { status: 409 }
        );
      }
      const onFile = tx.email?.trim().toLowerCase();
      if (onFile && onFile !== emailLower) {
        return NextResponse.json(
          { error: "Use the same email address you entered when completing payment." },
          { status: 400 }
        );
      }

      txnToLinkId = tx.id;
      tier = planIdToSubscriptionTier(tx.planId);
    } else {
      tier = planIdToSubscriptionTier(
        typeof planId === "string" ? planId.trim() : null
      );
    }

    const passwordHash = hashPassword(password);

    const user = await prisma.user.create({
      data: {
        name: name.trim(),
        email: emailLower,
        passwordHash,
        role: UserRole.USER,
        tier,
      },
    });

    if (txnToLinkId) {
      await prisma.urubutoPayTransaction.update({
        where: { id: txnToLinkId },
        data: {
          userId: user.id,
          email: emailLower,
          updatedAt: new Date(),
        },
      });
    }

    return NextResponse.json({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      tier: user.tier,
      avatar: user.avatar ?? undefined,
      bio: user.bio ?? undefined,
      followersCount: user.followersCount,
      following: [],
      bookmarks: [],
      articlesViewedThisMonth: [],
    });
  } catch (e) {
    console.error("POST /api/auth/register", e);
    return NextResponse.json(
      { error: "Registration failed. Please try again." },
      { status: 500 }
    );
  }
}
