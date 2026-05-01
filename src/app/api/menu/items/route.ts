import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const item = await db.menuItem.create({
    data: {
      organizationId: session.organizationId,
      branchId: session.branchId || null,
      categoryId: body.categoryId,
      name: body.name,
      nameAr: body.nameAr || null,
      description: body.description || null,
      price: body.price,
      cost: body.cost || null,
      preparationTime: body.preparationTime || null,
      image: body.image || null,
      isAvailable: body.isAvailable ?? true,
      isFeatured: body.isFeatured ?? false,
    },
    include: { category: true },
  });

  return NextResponse.json(item);
}

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const items = await db.menuItem.findMany({
    where: { organizationId: session.organizationId },
    include: { category: true },
    orderBy: [{ categoryId: "asc" }, { sortOrder: "asc" }],
  });

  return NextResponse.json(items);
}
