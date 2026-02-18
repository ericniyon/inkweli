import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyPassword } from "@/lib/password";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || typeof email !== "string" || !email.trim()) {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }
    if (!password || typeof password !== "string") {
      return NextResponse.json(
        { error: "Password is required" },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: email.trim().toLowerCase() },
    });

    if (!user || !user.passwordHash) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    const valid = verifyPassword(password, user.passwordHash);
    if (!valid) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    const [bookmarks, following] = await Promise.all([
      prisma.bookmark.findMany({
        where: { userId: user.id },
        select: { articleId: true },
      }),
      prisma.follow.findMany({
        where: { followerId: user.id },
        select: { followingId: true },
      }),
    ]);

    return NextResponse.json({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      tier: user.tier,
      avatar: user.avatar ?? undefined,
      bio: user.bio ?? undefined,
      followersCount: user.followersCount,
      following: following.map((f) => f.followingId),
      bookmarks: bookmarks.map((b) => b.articleId),
      articlesViewedThisMonth: [],
    });
  } catch (e) {
    console.error("POST /api/auth/login", e);
    return NextResponse.json(
      { error: "Sign in failed. Please try again." },
      { status: 500 }
    );
  }
}
