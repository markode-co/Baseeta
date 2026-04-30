import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();

  const branch = await db.branch.create({
    data: {
      organizationId: session.organizationId,
      name: body.name,
      nameAr: body.nameAr || null,
      address: body.address || null,
      phone: body.phone || null,
      openTime: body.openTime || null,
      closeTime: body.closeTime || null,
    },
  });

  return NextResponse.json(branch);
}
