import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const users = await prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        tier: true,
        createdAt: true,
      },
    });
    const mapped = users.map((u) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.role,
      tier: u.tier,
      joined: u.createdAt.toISOString().slice(0, 10),
      status: u.tier === "NONE" ? "Free" : "Active",
    }));
    return NextResponse.json(mapped);
  } catch (e) {
    console.error("GET /api/users", e);
    return NextResponse.json(
      { error: "Failed to fetch users" },
      { status: 500 }
    );
  }
}
