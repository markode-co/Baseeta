import { NextResponse } from "next/server";
import { getPlatformSession } from "@/lib/platform-auth";
import { db } from "@/lib/db";

export async function GET() {
  const session = await getPlatformSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const requests = await db.paymentRequest.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      organization: {
        select: { name: true, email: true, subscription: { select: { status: true } } },
      },
    },
  });

  return NextResponse.json(requests);
}
