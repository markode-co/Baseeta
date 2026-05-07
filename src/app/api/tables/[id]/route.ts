import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { requireActiveSubscription } from "@/lib/subscription";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  const subscriptionError = await requireActiveSubscription(session);
  if (subscriptionError) return subscriptionError;

  const { id } = await params;
  const body = await req.json();

  // where clause includes branch.organizationId to prevent cross-org updates
  const table = await db.table.update({
    where: { id, branch: { organizationId: session.organizationId } },
    data: {
      status: body.status,
      posX: body.posX,
      posY: body.posY,
    },
  });

  return NextResponse.json(table);
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  const subscriptionError = await requireActiveSubscription(session);
  if (subscriptionError) return subscriptionError;

  const { id } = await params;

  await db.table.delete({
    where: { id, branch: { organizationId: session.organizationId } },
  });

  return NextResponse.json({ success: true });
}
