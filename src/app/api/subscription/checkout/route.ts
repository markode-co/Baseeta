import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { stripe, PLANS } from "@/lib/stripe";
import { db } from "@/lib/db";

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { plan: planKey } = await req.json();
  const plan = PLANS[planKey as keyof typeof PLANS];
  if (!plan) return NextResponse.json({ error: "Invalid plan" }, { status: 400 });

  const org = await db.organization.findUnique({
    where: { id: session.organizationId },
    include: { subscription: true },
  });

  if (!org) return NextResponse.json({ error: "Organization not found" }, { status: 404 });

  let customerId = org.subscription?.stripeCustomerId;

  if (!customerId) {
    const customer = await stripe.customers.create({
      email: org.email,
      name: org.name,
      metadata: { organizationId: org.id },
    });
    customerId = customer.id;
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  const checkoutSession = await stripe.checkout.sessions.create({
    customer: customerId,
    payment_method_types: ["card"],
    line_items: plan.stripePriceId
      ? [{ price: plan.stripePriceId, quantity: 1 }]
      : [
          {
            price_data: {
              currency: "sar",
              product_data: { name: `بسيطة - خطة ${plan.name}` },
              unit_amount: plan.price * 100,
              recurring: { interval: "month" },
            },
            quantity: 1,
          },
        ],
    mode: "subscription",
    success_url: `${appUrl}/dashboard/subscription?success=true`,
    cancel_url: `${appUrl}/dashboard/subscription`,
    metadata: { organizationId: org.id, plan: planKey },
    subscription_data: {
      trial_period_days: 14,
      metadata: { organizationId: org.id, plan: planKey },
    },
  });

  return NextResponse.json({ url: checkoutSession.url });
}
