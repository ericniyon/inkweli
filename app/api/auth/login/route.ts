import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyPassword } from "@/lib/password";

const SEEDED_ADMIN_EMAIL = "admin@thinkup.com";
const isDev = process.env.NODE_ENV === "development";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const emailRaw = body.email;
    const password = typeof body.password === "string" ? body.password.trim() : "";

    if (!emailRaw || typeof emailRaw !== "string" || !emailRaw.trim()) {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }
    const email = emailRaw.trim().toLowerCase();
    if (!password) {
      return NextResponse.json(
        { error: "Password is required" },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user || !user.passwordHash) {
      const hint = isDev && email === SEEDED_ADMIN_EMAIL
        ? " No user found. Run: npx prisma db seed (seed uses password: admin123)"
        : "";
      return NextResponse.json(
        { error: `Invalid email or password.${hint}` },
        { status: 401 }
      );
    }

    const valid = verifyPassword(password, user.passwordHash);
    if (!valid) {
      const hint = isDev && email === SEEDED_ADMIN_EMAIL
        ? " Seeded admin password is: admin123"
        : "";
      return NextResponse.json(
        { error: `Invalid email or password.${hint}` },
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
