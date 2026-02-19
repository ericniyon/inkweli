import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const list = await prisma.siteCategory.findMany({
      orderBy: { name: "asc" },
    });
    return NextResponse.json(list.map((c) => c.name));
  } catch (e) {
    console.error("GET /api/categories", e);
    return NextResponse.json(
      { error: "Failed to fetch categories" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name } = body;
    if (!name || typeof name !== "string" || !name.trim()) {
      return NextResponse.json(
        { error: "Category name is required" },
        { status: 400 }
      );
    }
    const trimmed = name.trim();
    const existing = await prisma.siteCategory.findUnique({
      where: { name: trimmed },
    });
    if (existing) {
      return NextResponse.json(
        { error: "Category already exists" },
        { status: 409 }
      );
    }
    await prisma.siteCategory.create({
      data: { name: trimmed },
    });
    return NextResponse.json({ name: trimmed });
  } catch (e) {
    console.error("POST /api/categories", e);
    return NextResponse.json(
      { error: "Failed to create category" },
      { status: 500 }
    );
  }
}
