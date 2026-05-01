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

  const item = await db.inventoryItem.create({
    data: {
      branchId,
      name: body.name,
      nameAr: body.nameAr || null,
      unit: body.unit || "kg",
      quantity: body.quantity || 0,
      minQuantity: body.minQuantity || 0,
      costPerUnit: body.costPerUnit || 0,
    },
  });

  return NextResponse.json(item);
}
