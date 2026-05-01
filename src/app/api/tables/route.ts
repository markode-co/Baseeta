import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const branchId = body.branchId || session.branchId;

  if (!branchId) return NextResponse.json({ error: "No branch" }, { status: 400 });

  // Verify the branch belongs to this organization
  const branch = await db.branch.findUnique({
    where: { id: branchId, organizationId: session.organizationId },
    select: { id: true },
  });
  if (!branch) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const count = await db.table.count({ where: { branchId } });

  const table = await db.table.create({
    data: {
      branchId,
      name: body.name,
      capacity: body.capacity || 4,
      section: body.section || null,
      posX: (count % 5) * 120 + 40,
      posY: Math.floor(count / 5) * 120 + 40,
    },
  });

  return NextResponse.json(table);
}
