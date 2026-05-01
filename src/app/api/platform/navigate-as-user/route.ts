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

    // Find a default organization (first one) or create a test one
    let organization = await db.organization.findFirst({
      include: { users: true },
    });

    if (!organization) {
      return NextResponse.json({ error: "No organization found" }, { status: 404 });
    }

    // Check if a user with admin email exists in this organization
    let user = await db.user.findFirst({
      where: {
        email: "ca.markode@gmail.com",
        organizationId: organization.id,
      },
    });

    // If user doesn't exist, create one
    if (!user) {
      user = await db.user.create({
        data: {
          name: "Mark",
          email: "ca.markode@gmail.com",
          organizationId: organization.id,
          role: "ADMIN",
          isActive: true,
        },
      });
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
    console.error("Navigate as user error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
