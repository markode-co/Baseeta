import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getSession, deleteSession } from "@/lib/auth";

export async function POST() {
  const session = await getSession();
  const cookieStore = await cookies();
  const token = cookieStore.get("auth-token")?.value;

  if (token) {
    await deleteSession(token);
    cookieStore.delete("auth-token");
  }

  return NextResponse.json({ success: true });
}
