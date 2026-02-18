import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { name, role, bio, image, twitter, linkedin, articlesCount } = body;

    const writer = await prisma.writer.update({
      where: { id },
      data: {
        ...(name != null && { name: String(name).trim() }),
        ...(role !== undefined && { role: role === "" || role == null ? null : String(role).trim() }),
        ...(bio !== undefined && { bio: bio === "" || bio == null ? null : String(bio).trim() }),
        ...(image !== undefined && { image: image === "" || image == null ? null : String(image).trim() }),
        ...(twitter !== undefined && { twitter: twitter === "" || twitter == null ? null : String(twitter).trim() }),
        ...(linkedin !== undefined && { linkedin: linkedin === "" || linkedin == null ? null : String(linkedin).trim() }),
        ...(typeof articlesCount === "number" && articlesCount >= 0 && { articlesCount }),
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
    console.error("PATCH /api/writers/[id]", e);
    return NextResponse.json(
      { error: "Failed to update writer" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await prisma.writer.delete({
      where: { id },
    });
    return new NextResponse(null, { status: 204 });
  } catch (e) {
    console.error("DELETE /api/writers/[id]", e);
    return NextResponse.json(
      { error: "Failed to delete writer" },
      { status: 500 }
    );
  }
}
