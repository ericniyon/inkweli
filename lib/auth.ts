/**
 * NextAuth options for credentials only.
 * Required .env: NEXTAUTH_SECRET, NEXTAUTH_URL (e.g. http://localhost:3000).
 */
import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";
import { verifyPassword } from "@/lib/password";

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
      },
      async authorize(credentials) {
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
      }
      return token;
    },
    async session({ session, token }) {
      if (token.userId && session.user) {
        (session as { userId?: string }).userId = token.userId;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
  session: { strategy: "jwt", maxAge: 30 * 24 * 60 * 60 },
  secret: process.env.NEXTAUTH_SECRET,
};

declare module "next-auth" {
  interface Session {
    userId?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    userId?: string;
  }
}
