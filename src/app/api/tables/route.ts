import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();

  const count = await db.table.count({ where: { branchId: body.branchId } });

  const table = await db.table.create({
    data: {
      branchId: body.branchId,
      name: body.name,
      capacity: body.capacity || 4,
      section: body.section || null,
      posX: (count % 5) * 120 + 40,
      posY: Math.floor(count / 5) * 120 + 40,
    },
  });

  return NextResponse.json(table);
}
