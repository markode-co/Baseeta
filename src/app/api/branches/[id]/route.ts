import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();

  const branch = await db.branch.update({
    where: { id, organizationId: session.organizationId },
    data: {
      isActive: body.isActive !== undefined ? body.isActive : undefined,
      name: body.name,
      address: body.address,
      phone: body.phone,
    },
  });

  return NextResponse.json(branch);
}
