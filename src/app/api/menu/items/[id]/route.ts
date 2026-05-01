import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();

  const item = await db.menuItem.update({
    where: { id, organizationId: session.organizationId },
    data: {
      name: body.name,
      nameAr: body.nameAr || null,
      description: body.description || null,
      price: body.price !== undefined ? body.price : undefined,
      cost: body.cost !== undefined ? body.cost : undefined,
      categoryId: body.categoryId,
      preparationTime: body.preparationTime !== undefined ? body.preparationTime : undefined,
      image: body.image !== undefined ? body.image || null : undefined,
      isAvailable: body.isAvailable !== undefined ? body.isAvailable : undefined,
      isFeatured: body.isFeatured !== undefined ? body.isFeatured : undefined,
    },
    include: { category: true },
  });

  return NextResponse.json(item);
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  await db.menuItem.delete({ where: { id, organizationId: session.organizationId } });

  return NextResponse.json({ success: true });
}
