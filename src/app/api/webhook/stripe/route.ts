import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { db } from "@/lib/db";
import Stripe from "stripe";

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = req.headers.get("stripe-signature");

  if (!sig) return NextResponse.json({ error: "Missing signature" }, { status: 400 });

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET || "");
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  switch (event.type) {
    case "customer.subscription.created":
    case "customer.subscription.updated": {
      const sub = event.data.object as Stripe.Subscription & {
        current_period_start?: number;
        current_period_end?: number;
      };
      const orgId = sub.metadata?.organizationId;
      if (!orgId) break;

      const plan = await db.plan.findFirst({
        where: { name: sub.metadata?.plan || "" },
      });

      const statusMap: Record<string, string> = {
        active: "ACTIVE",
        trialing: "TRIALING",
        past_due: "PAST_DUE",
        canceled: "CANCELED",
        incomplete: "INCOMPLETE",
        paused: "PAUSED",
      };

      const periodStart = sub.current_period_start ? new Date(sub.current_period_start * 1000) : null;
      const periodEnd = sub.current_period_end ? new Date(sub.current_period_end * 1000) : null;
      const trialEnd = sub.trial_end ? new Date(sub.trial_end * 1000) : null;

      await db.subscription.upsert({
        where: { organizationId: orgId },
        create: {
          organizationId: orgId,
          planId: plan?.id || "",
          stripeCustomerId: sub.customer as string,
          stripeSubscriptionId: sub.id,
          status: (statusMap[sub.status] as never) || "ACTIVE",
          currentPeriodStart: periodStart,
          currentPeriodEnd: periodEnd,
          trialEnd,
          cancelAtPeriodEnd: sub.cancel_at_period_end,
        },
        update: {
          status: (statusMap[sub.status] as never) || "ACTIVE",
          currentPeriodStart: periodStart,
          currentPeriodEnd: periodEnd,
          trialEnd,
          cancelAtPeriodEnd: sub.cancel_at_period_end,
        },
      });
      break;
    }

    case "customer.subscription.deleted": {
      const sub = event.data.object as Stripe.Subscription;
      const orgId = sub.metadata?.organizationId;
      if (!orgId) break;

      await db.subscription.update({
        where: { organizationId: orgId },
        data: { status: "CANCELED" },
      });
      break;
    }
  }

  return NextResponse.json({ received: true });
}
