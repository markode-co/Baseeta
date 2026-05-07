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
