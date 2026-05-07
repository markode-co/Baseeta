import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { requireActiveSubscription } from "@/lib/subscription";

export async function POST(req: NextRequest) {
  const session = await getSession();
  const subscriptionError = await requireActiveSubscription(session);
  if (subscriptionError) return subscriptionError;

  const body = await req.json();

  const category = await db.category.create({
    data: {
      organizationId: session.organizationId,
      name: body.name,
      nameAr: body.nameAr || null,
      color: body.color || null,
    },
  });

  return NextResponse.json(category);
}
