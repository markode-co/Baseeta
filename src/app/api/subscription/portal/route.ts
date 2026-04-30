import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { stripe } from "@/lib/stripe";
import { db } from "@/lib/db";

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const subscription = await db.subscription.findUnique({
    where: { organizationId: session.organizationId },
  });

  if (!subscription?.stripeCustomerId) {
    return NextResponse.json({ error: "No active subscription" }, { status: 400 });
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  const portalSession = await stripe.billingPortal.sessions.create({
    customer: subscription.stripeCustomerId,
    return_url: `${appUrl}/dashboard/subscription`,
  });

  return NextResponse.json({ url: portalSession.url });
}
