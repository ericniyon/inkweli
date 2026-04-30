/**
 * NextAuth options: credentials (password or magic-link token).
 * Required .env: NEXTAUTH_SECRET, NEXTAUTH_URL (e.g. http://localhost:3000).
 */
import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import crypto from "crypto";
import { UserRole } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { verifyPassword } from "@/lib/password";
import { resolveNextAuthSecret } from "@/lib/nextauth-secret";

/** Build full User payload for client (same shape as /api/auth/login). Exported for GET /api/auth/me */
export async function userToPayload(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      tier: true,
      avatar: true,
      bio: true,
      followersCount: true,
    },
  });
  if (!user) return null;

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

  return {
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
    articlesViewedThisMonth: [] as string[],
  };
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
        magicLinkToken: { label: "Magic link token", type: "text" },
      },
      async authorize(credentials) {
        const magicRaw =
          typeof credentials?.magicLinkToken === "string" ? credentials.magicLinkToken.trim() : "";

        if (magicRaw) {
          const tokenHash = crypto.createHash("sha256").update(magicRaw).digest("hex");
          const row = await prisma.magicLinkToken.findUnique({
            where: { tokenHash },
          });
          if (!row || row.usedAt || row.expiresAt < new Date()) return null;

          const consumed = await prisma.magicLinkToken.updateMany({
            where: { id: row.id, usedAt: null },
            data: { usedAt: new Date() },
          });
          if (consumed.count !== 1) return null;

          const emailNorm = row.email.trim().toLowerCase();
          let user = await prisma.user.findUnique({ where: { email: emailNorm } });
          if (!user) {
            user = await prisma.user.create({
              data: {
                email: emailNorm,
                name: emailNorm.split("@")[0]?.trim() || "Member",
                passwordHash: null,
                role: UserRole.USER,
              },
            });
          }

          return { id: user.id, email: user.email, name: user.name };
        }

        if (!credentials?.email || !credentials?.password) return null;
        const email = credentials.email.trim().toLowerCase();
        const user = await prisma.user.findUnique({
          where: { email },
        });
        if (!user?.passwordHash) return null;
        const valid = verifyPassword(credentials.password, user.passwordHash);
        if (!valid) return null;
        return { id: user.id, email: user.email, name: user.name };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, account }) {
      if (account?.provider === "credentials" && user?.id) {
        token.userId = user.id;
        token.sub = user.id;
        if (typeof user.email === "string") token.email = user.email;
      }
      return token;
    },
    async session({ session, token }) {
      if (token.userId && session.user) {
        (session as { userId?: string }).userId = token.userId;
      }
      if (typeof token.email === "string" && session.user) {
        session.user.email = token.email;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
  session: { strategy: "jwt", maxAge: 30 * 24 * 60 * 60 },
  secret: resolveNextAuthSecret(),
};

declare module "next-auth" {
  interface Session {
    userId?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    userId?: string;
    email?: string;
  }
}
