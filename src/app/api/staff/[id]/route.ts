import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();

  const user = await db.user.update({
    where: { id, organizationId: session.organizationId },
    data: {
      name: body.name,
      phone: body.phone || null,
      role: body.role,
      isActive: body.isActive !== undefined ? body.isActive : undefined,
    },
    include: { branch: { select: { name: true } } },
  });

  return NextResponse.json(user);
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  if (id === session.userId) return NextResponse.json({ error: "لا يمكن حذف حسابك الخاص" }, { status: 400 });

  await db.user.delete({ where: { id, organizationId: session.organizationId } });
  return NextResponse.json({ success: true });
}
