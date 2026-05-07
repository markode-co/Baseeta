import { NextResponse } from "next/server";
import { createPlatformSession, PLATFORM_ADMIN_EMAIL } from "@/lib/platform-auth";
import { getSession } from "@/lib/auth";

export async function POST() {
  try {
    const session = await getSession();
    if (!session || session.email !== PLATFORM_ADMIN_EMAIL) {
      return NextResponse.json({ error: "غير مصرح لك بالوصول" }, { status: 403 });
    }

    const token = await createPlatformSession();

    const response = NextResponse.json({ success: true });
    response.cookies.set("platform-token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24, // 24 hours
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("Platform login error:", error);
    return NextResponse.json({ error: "حدث خطأ في تسجيل الدخول" }, { status: 500 });
  }
}