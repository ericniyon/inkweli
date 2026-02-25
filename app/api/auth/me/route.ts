import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions, userToPayload } from "@/lib/auth";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    const userId = session && (session as { userId?: string }).userId;
    if (!userId) {
      return NextResponse.json({ user: null });
    }
    const user = await userToPayload(userId);
    if (!user) {
      return NextResponse.json({ user: null });
    }
    return NextResponse.json(user);
  } catch (e) {
    console.error("GET /api/auth/me", e);
    return NextResponse.json(
      { error: "Failed to get session" },
      { status: 500 }
    );
  }
}
