/**
 * NextAuth: credentials (password or magic-link) + optional Google / Apple OAuth.
 * Required: NEXTAUTH_SECRET, NEXTAUTH_URL (e.g. http://localhost:3000).
 * OAuth: set GOOGLE_* and/or APPLE_* (see .env.example).
 */
import type { NextAuthOptions } from "next-auth";
import type { User as NextAuthUser } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import AppleProvider from "next-auth/providers/apple";
import GoogleProvider from "next-auth/providers/google";
import crypto from "crypto";
import { UserRole } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { verifyPassword } from "@/lib/password";
import { resolveNextAuthSecret } from "@/lib/nextauth-secret";
import { getAppleClientSecret } from "@/lib/apple-client-secret";

function buildOAuthProviders(): NextAuthOptions["providers"] {
  const list: NonNullable<NextAuthOptions["providers"]> = [];

  const googleId = process.env.GOOGLE_CLIENT_ID?.trim();
  const googleSecret = process.env.GOOGLE_CLIENT_SECRET?.trim();
  if (googleId && googleSecret) {
    list.push(
      GoogleProvider({
        clientId: googleId,
        clientSecret: googleSecret,
        // Some hosts / Google setups expect client_secret at the token endpoint (POST) instead of basic auth.
        client: { token_endpoint_auth_method: "client_secret_post" },
        authorization: {
          params: {
            // Avoid silent re-auth edge cases; helps multi-account and clearer consent flows.
            prompt: "select_account",
          },
        },
      })
    );
  }

  const appleId = process.env.APPLE_ID?.trim();
  const teamId = process.env.APPLE_TEAM_ID?.trim();
  const keyId = process.env.APPLE_KEY_ID?.trim();
  const p8 = process.env.APPLE_PRIVATE_KEY?.trim();
  if (appleId && teamId && keyId && p8) {
    try {
      list.push(
        AppleProvider({
          clientId: appleId,
          clientSecret: getAppleClientSecret(),
        })
      );
    } catch (e) {
      console.error("[auth] Apple provider could not be initialized:", e);
    }
  }

  return list;
}

async function upsertUserFromOAuth(profile: {
  email: string;
  name: string;
  image?: string | null;
}) {
  const email = profile.email.trim().toLowerCase();
  const nameCandidate = profile.name.trim() || email.split("@")[0] || "Member";

  // Match existing rows regardless of stored email casing (Postgres default unique is case-sensitive).
  let dbUser = await prisma.user.findFirst({
    where: { email: { equals: email, mode: "insensitive" } },
  });
  if (!dbUser) {
    return prisma.user.create({
      data: {
        email,
        name: nameCandidate,
        passwordHash: null,
        role: UserRole.USER,
        ...(profile.image ? { avatar: profile.image } : {}),
      },
    });
  }
  if (profile.image && !dbUser.avatar) {
    await prisma.user.update({
      where: { id: dbUser.id },
      data: { avatar: profile.image },
    });
  }
  return dbUser;
}

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
  debug: process.env.NODE_ENV === "development",
  providers: [
    ...buildOAuthProviders(),
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
    async signIn({ user, account, profile }) {
      if (account?.provider === "credentials") return true;
      if (account?.provider !== "google" && account?.provider !== "apple") return true;

      let emailRaw =
        typeof user.email === "string" && user.email.trim() ? user.email.trim().toLowerCase() : "";

      const pEmail =
        profile && typeof (profile as { email?: unknown }).email === "string"
          ? ((profile as { email: string }).email as string).trim().toLowerCase()
          : "";
      if (!emailRaw && pEmail) emailRaw = pEmail;

      if (!emailRaw) {
        return "/login?error=OAuthEmailRequired";
      }

      if (account.provider === "google") {
        const gp = profile as { email_verified?: boolean | string };
        if (gp?.email_verified === false || gp?.email_verified === "false") {
          return "/login?error=OAuthAccountNotVerified";
        }
      }

      return true;
    },
    async jwt({ token, user, account, profile }) {
      if (account && user && account.provider !== "credentials") {
        let emailNorm =
          typeof (user as NextAuthUser).email === "string" && (user as NextAuthUser).email?.trim()
            ? ((user as NextAuthUser).email as string).trim().toLowerCase()
            : "";
        const fromProfile =
          profile && typeof (profile as { email?: unknown }).email === "string"
            ? ((profile as { email: string }).email as string).trim().toLowerCase()
            : "";
        if (!emailNorm && fromProfile) emailNorm = fromProfile;

        if (!emailNorm) {
          console.error("[auth] OAuth jwt: missing email on user/profile after Google/Apple callback");
          return token;
        }

        const u = user as NextAuthUser & { image?: string | null };
        const pname =
          profile && typeof profile === "object" && typeof (profile as { name?: string }).name === "string"
            ? ((profile as { name: string }).name as string).trim()
            : "";
        const displayName =
          (typeof u.name === "string" && u.name.trim()) ||
          pname ||
          emailNorm.split("@")[0] ||
          "Member";
        const image =
          typeof u.image === "string" && u.image.trim()
            ? u.image.trim()
            : null;

        try {
          const dbUser = await upsertUserFromOAuth({
            email: emailNorm,
            name: displayName,
            image,
          });

          token.userId = dbUser.id;
          token.sub = dbUser.id;
          token.email = dbUser.email;
        } catch (e) {
          console.error("[auth] OAuth jwt: failed to upsert user from profile", e);
          throw e;
        }
        return token;
      }

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
