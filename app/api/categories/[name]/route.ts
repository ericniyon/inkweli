import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ name: string }> }
) {
  try {
    const { name: currentName } = await params;
    const decoded = decodeURIComponent(currentName);
    const body = await request.json();
    const newName =
      typeof body?.name === "string" ? body.name.trim() : "";
    if (!newName) {
      return NextResponse.json(
        { error: "Category name is required" },
        { status: 400 }
      );
    }
    if (newName === decoded) {
      return NextResponse.json({ name: newName });
    }
    const existing = await prisma.siteCategory.findUnique({
      where: { name: newName },
    });
    if (existing) {
      return NextResponse.json(
        { error: "A category with this name already exists" },
        { status: 409 }
      );
    }
    await prisma.siteCategory.updateMany({
      where: { name: decoded },
      data: { name: newName },
    });
    await prisma.article.updateMany({
      where: { category: decoded },
      data: { category: newName },
    });
    return NextResponse.json({ name: newName });
  } catch (e) {
    console.error("PATCH /api/categories/[name]", e);
    return NextResponse.json(
      { error: "Failed to update category" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ name: string }> }
) {
  try {
    const { name } = await params;
    const decoded = decodeURIComponent(name);
    const inUse = await prisma.article.count({
      where: { category: decoded },
    });
    if (inUse > 0) {
      return NextResponse.json(
        { error: `Cannot delete: ${inUse} article(s) use this category` },
        { status: 400 }
      );
    }
    await prisma.siteCategory.deleteMany({
      where: { name: decoded },
    });
    return new NextResponse(null, { status: 204 });
  } catch (e) {
    console.error("DELETE /api/categories/[name]", e);
    return NextResponse.json(
      { error: "Failed to delete category" },
      { status: 500 }
    );
  }
}
