import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import type { SessionPayload } from "@/lib/auth";

export function isSubscriptionExpired(
  sub: { status: string; trialEnd: Date | null; currentPeriodEnd: Date | null } | null
): boolean {
  if (!sub) return true;
  const now = new Date();
  if (sub.status === "TRIALING") return sub.trialEnd ? sub.trialEnd < now : true;
  if (sub.status === "ACTIVE") return sub.currentPeriodEnd ? sub.currentPeriodEnd < now : false;
  if (sub.status === "PAST_DUE" || sub.status === "CANCELED" || sub.status === "PAUSED" || sub.status === "INCOMPLETE") {
    return true;
  }
  return true;
}

export async function requireActiveSubscription(
  session: SessionPayload | null
): Promise<NextResponse | null> {
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const subscription = await db.subscription.findUnique({
    where: { organizationId: session.organizationId },
    select: { status: true, trialEnd: true, currentPeriodEnd: true },
  });

  if (isSubscriptionExpired(subscription)) {
    return NextResponse.json(
      { error: "اشتراكك منتهي أو يتطلب التجديد" },
      { status: 403 }
    );
  }

  return null;
}
