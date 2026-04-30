import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { hashPassword } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();

  const existing = await db.user.findFirst({
    where: { email: body.email, organizationId: session.organizationId },
  });
  if (existing) return NextResponse.json({ error: "البريد الإلكتروني مستخدم بالفعل" }, { status: 400 });

  const hashed = await hashPassword(body.password || "Baseeta@123");

  const user = await db.user.create({
    data: {
      organizationId: session.organizationId,
      branchId: body.branchId || null,
      name: body.name,
      email: body.email,
      phone: body.phone || null,
      password: hashed,
      role: body.role || "CASHIER",
    },
    include: { branch: { select: { name: true } } },
  });

  return NextResponse.json(user);
}
