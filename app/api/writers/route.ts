import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const writers = await prisma.writer.findMany({
      orderBy: { createdAt: "desc" },
    });
    const withSocials = writers.map((w) => ({
      id: w.id,
      name: w.name,
      role: w.role ?? undefined,
      bio: w.bio ?? undefined,
      image: w.image ?? undefined,
      articlesCount: w.articlesCount,
      socials: {
        twitter: w.twitter ?? "#",
        linkedin: w.linkedin ?? "#",
      },
    }));
    return NextResponse.json(withSocials);
  } catch (e) {
    console.error("GET /api/writers", e);
    return NextResponse.json(
      { error: "Failed to fetch writers" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, role, bio, image, twitter, linkedin, articlesCount } = body;

    if (!name || typeof name !== "string" || !name.trim()) {
      return NextResponse.json(
        { error: "Name is required" },
        { status: 400 }
      );
    }

    const writer = await prisma.writer.create({
      data: {
        name: name.trim(),
        role: role && String(role).trim() ? String(role).trim() : null,
        bio: bio && String(bio).trim() ? String(bio).trim() : null,
        image: image && String(image).trim() ? String(image).trim() : null,
        twitter: twitter && String(twitter).trim() ? String(twitter).trim() : null,
        linkedin: linkedin && String(linkedin).trim() ? String(linkedin).trim() : null,
        articlesCount: typeof articlesCount === "number" && articlesCount >= 0 ? articlesCount : 0,
      },
    });

    return NextResponse.json({
      id: writer.id,
      name: writer.name,
      role: writer.role ?? undefined,
      bio: writer.bio ?? undefined,
      image: writer.image ?? undefined,
      articlesCount: writer.articlesCount,
      socials: {
        twitter: writer.twitter ?? "#",
        linkedin: writer.linkedin ?? "#",
      },
    });
  } catch (e) {
    console.error("POST /api/writers", e);
    return NextResponse.json(
      { error: "Failed to create writer" },
      { status: 500 }
    );
  }
}
