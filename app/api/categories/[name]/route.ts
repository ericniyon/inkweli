import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

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
