import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const requests = await prisma.writerRequest.findMany({
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(
      requests.map((r) => ({
        id: r.id,
        name: r.name,
        email: r.email,
        bio: r.bio ?? undefined,
        motivation: r.motivation ?? undefined,
        topics: r.topics ?? undefined,
        status: r.status,
        createdAt: r.createdAt.toISOString(),
        updatedAt: r.updatedAt.toISOString(),
      }))
    );
  } catch (e) {
    console.error("GET /api/writer-requests", e);
    // Return empty list on any error so admin writers page still loads (e.g. table not migrated yet)
    return NextResponse.json([]);
  }
}

export async function POST(request: Request) {
  try {
    if (typeof (prisma as { writerRequest?: unknown }).writerRequest === "undefined") {
      return NextResponse.json(
        { error: "Writer requests service is not ready. Restart the dev server (e.g. stop and run npm run dev again)." },
        { status: 503 }
      );
    }
    const body = await request.json();
    const { name, email, bio, motivation, topics } = body;

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

    const normalizedEmail = email.trim().toLowerCase();

    const existing = await prisma.writerRequest.findUnique({
      where: { email: normalizedEmail },
    });
    if (existing) {
      if (existing.status === "PENDING") {
        return NextResponse.json(
          { error: "You already have a pending writer request. We'll be in touch soon." },
          { status: 409 }
        );
      }
      // Allow re-application if previously rejected; update the existing record
      const updated = await prisma.writerRequest.update({
        where: { id: existing.id },
        data: {
          name: name.trim(),
          bio: typeof bio === "string" ? bio.trim() || null : null,
          motivation: typeof motivation === "string" ? motivation.trim() || null : null,
          topics: typeof topics === "string" ? topics.trim() || null : null,
          status: "PENDING",
        },
      });
      return NextResponse.json({
        message: "Your writer request has been resubmitted.",
        id: updated.id,
      });
    }

    const writerRequest = await prisma.writerRequest.create({
      data: {
        name: name.trim(),
        email: normalizedEmail,
        bio: typeof bio === "string" ? bio.trim() || null : null,
        motivation: typeof motivation === "string" ? motivation.trim() || null : null,
        topics: typeof topics === "string" ? topics.trim() || null : null,
        status: "PENDING",
      },
    });

    return NextResponse.json({
      message: "Thank you! Your request to become a writer has been received. We'll review it and get back to you.",
      id: writerRequest.id,
    });
  } catch (e) {
    console.error("POST /api/writer-requests", e);
    return NextResponse.json(
      { error: "Failed to submit request. Please try again." },
      { status: 500 }
    );
  }
}
