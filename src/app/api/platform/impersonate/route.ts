import { NextResponse } from "next/server";
import { getPlatformSession } from "@/lib/platform-auth";
import { createSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { cookies } from "next/headers";

export async function POST() {
  const platformSession = await getPlatformSession();
  if (!platformSession) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
  }

  const user = await db.user.findFirst({
    where: { email: platformSession.email },
    orderBy: { createdAt: "asc" },
  });

  if (!user) {
    return NextResponse.json(
      { error: "لا يوجد حساب مطعم مرتبط بهذا البريد الإلكتروني" },
      { status: 404 }
    );
  }

  const token = await createSession({
    userId: user.id,
    organizationId: user.organizationId,
    branchId: user.branchId ?? undefined,
    role: user.role,
    email: user.email,
    name: user.name,
  });

  const cookieStore = await cookies();
  cookieStore.set("auth-token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 7 * 24 * 60 * 60,
    path: "/",
  });

  return NextResponse.json({ success: true });
}
