import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import jwt from "jsonwebtoken";

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.email || session.email !== "ca.markode@gmail.com") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { userId } = await req.json();
    if (!userId) {
      return NextResponse.json({ error: "User ID required" }, { status: 400 });
    }

    // Get the user to impersonate
    const user = await db.user.findUnique({
      where: { id: userId },
      include: { organization: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Create impersonation token
    const impersonationToken = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        name: user.name,
        organizationId: user.organizationId,
        impersonated: true,
        originalAdmin: session.email,
      },
      process.env.JWT_SECRET || "baseeta-jwt-secret",
      { expiresIn: "1h" }
    );

    return NextResponse.json({ token: impersonationToken });
  } catch (error) {
    console.error("Impersonation error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}