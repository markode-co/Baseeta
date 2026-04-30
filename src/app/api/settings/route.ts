import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function PUT(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();

  const org = await db.organization.update({
    where: { id: session.organizationId },
    data: {
      name: body.name,
      email: body.email,
      phone: body.phone || null,
      address: body.address || null,
      currency: body.currency,
      timezone: body.timezone,
      taxRate: body.taxRate,
      receiptFooter: body.receiptFooter || null,
    },
  });

  return NextResponse.json(org);
}
