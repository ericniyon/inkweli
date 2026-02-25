import { PrismaClient } from "@prisma/client";
import { hashPassword } from "../lib/password";

const prisma = new PrismaClient();

const ADMIN_SEED_PASSWORD = "admin123";

async function main() {
  const adminPasswordHash = hashPassword(ADMIN_SEED_PASSWORD);

  // Admin login: admin@thinkup.com / admin123. Admins see paywall until they have a paid subscription (tier UNLIMITED).
  await prisma.user.upsert({
    where: { id: "auth_admin" },
    create: {
      id: "auth_admin",
      email: "admin@thinkup.com",
      name: "Admin Editor",
      role: "ADMIN",
      tier: "NONE",
      passwordHash: adminPasswordHash,
    },
    update: { email: "admin@thinkup.com", passwordHash: adminPasswordHash, tier: "NONE" },
  });

  await prisma.user.upsert({
    where: { id: "auth_katurebe" },
    create: {
      id: "auth_katurebe",
      email: "katurebe@inkwell.local",
      name: "Katurebe",
      role: "ADMIN",
      tier: "NONE",
      passwordHash: adminPasswordHash,
    },
    update: { passwordHash: adminPasswordHash, tier: "NONE" },
  });

  await prisma.subscriptionPlan.upsert({
    where: { id: "plan_novis" },
    create: {
      id: "plan_novis",
      tier: "ONE_ARTICLE",
      name: "Novis",
      price: 10000,
      interval: "month",
      features: ["1 story per month", "Highlight & comment", "Support writers"],
      color: "slate",
    },
    update: { name: "Novis", price: 10000, tier: "ONE_ARTICLE", interval: "month", features: ["1 story per month", "Highlight & comment", "Support writers"], color: "slate" },
  });
  await prisma.subscriptionPlan.upsert({
    where: { id: "plan_pro" },
    create: {
      id: "plan_pro",
      tier: "TWO_ARTICLES",
      name: "Pro",
      price: 20000,
      interval: "month",
      features: ["More stories per month", "Full highlighting", "Offline reading", "Support authors", "Audio read", "Article summarization"],
      color: "indigo",
    },
    update: { name: "Pro", price: 20000, tier: "TWO_ARTICLES", interval: "month", features: ["More stories per month", "Full highlighting", "Offline reading", "Support authors", "Audio read", "Article summarization"], color: "indigo" },
  });

  const writers = [
    {
      id: "auth_1",
      name: "Jean Bosco",
      role: "Senior Correspondent",
      bio: "Specializing in technological evolution and policy across East Africa. Former analyst at Kigali Tech Hub.",
      image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=256&h=256&auto=format&fit=crop",
      articlesCount: 42,
      twitter: "#",
      linkedin: "#",
    },
    {
      id: "auth_2",
      name: "Marie Louise",
      role: "Economics Editor",
      bio: "An expert in macro-economic frameworks and regional trade agreements. Passionate about sustainable growth.",
      image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=256&h=256&auto=format&fit=crop",
      articlesCount: 38,
      twitter: "#",
      linkedin: "#",
    },
  ];

  for (const w of writers) {
    await prisma.writer.upsert({
      where: { id: w.id },
      create: w,
      update: { name: w.name, role: w.role, bio: w.bio, image: w.image, articlesCount: w.articlesCount, twitter: w.twitter, linkedin: w.linkedin },
    });
  }

  const defaultCategories = ["Business (GTM)", "Politics", "Economy", "Culture", "Technology", "Science", "Opinion", "General"];
  for (const name of defaultCategories) {
    await prisma.siteCategory.upsert({
      where: { name },
      create: { name },
      update: {},
    });
  }

  console.log("Seed completed.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
