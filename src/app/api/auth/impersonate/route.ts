import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createSession } from "@/lib/auth";
import { db } from "@/lib/db";
import jwt from "jsonwebtoken";

export async function POST(req: NextRequest) {
  try {
    const { token } = await req.json();
    if (!token) {
      return NextResponse.json({ error: "Token required" }, { status: 400 });
    }

    // Verify impersonation token
    const payload = jwt.verify(token, process.env.JWT_SECRET || "baseeta-jwt-secret") as any;

    if (!payload.impersonated || !payload.userId) {
      return NextResponse.json({ error: "Invalid token" }, { status: 400 });
    }

    // Get the user
    const user = await db.user.findUnique({
      where: { id: payload.userId },
      include: { organization: { include: { subscription: true } } },
    });

    if (!user || !user.isActive) {
      return NextResponse.json({ error: "User not found or inactive" }, { status: 404 });
    }

    // Create regular session for the impersonated user
    const sessionToken = await createSession({
      userId: user.id,
      organizationId: user.organizationId,
      branchId: user.branchId ?? undefined,
      role: user.role,
      email: user.email,
      name: user.name,
    });

    // Update last login
    await db.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() },
    });

    // Set the session cookie
    const cookieStore = await cookies();
    cookieStore.set("auth-token", sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60,
      path: "/",
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Impersonation login error:", error);
    return NextResponse.json({ error: "Invalid token" }, { status: 400 });
  }
}