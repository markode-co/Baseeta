import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { requireActiveSubscription } from "@/lib/subscription";

export async function PUT(req: NextRequest) {
  const session = await getSession();
  const subscriptionError = await requireActiveSubscription(session);
  if (subscriptionError) return subscriptionError;

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
      receiptHeader: body.receiptHeader || null,
      website: body.website || null,
    },
  });

  return NextResponse.json(org);
}
