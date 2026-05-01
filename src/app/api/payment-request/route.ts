import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { PLANS } from "@/lib/stripe";

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { planKey, method, receiptUrl } = await req.json();

  if (!planKey || !method || !receiptUrl) {
    return NextResponse.json({ error: "بيانات ناقصة" }, { status: 400 });
  }

  const plan = PLANS[planKey as keyof typeof PLANS];
  if (!plan) return NextResponse.json({ error: "باقة غير صحيحة" }, { status: 400 });

  const org = await db.organization.findUnique({
    where: { id: session.organizationId },
    select: { name: true, email: true },
  });

  if (!org) return NextResponse.json({ error: "المؤسسة غير موجودة" }, { status: 404 });

  // Create payment request
  const paymentRequest = await db.paymentRequest.create({
    data: {
      organizationId: session.organizationId,
      planKey,
      amount: plan.price,
      method,
      receiptUrl,
      orgName: org.name,
      orgEmail: org.email,
      userName: session.name,
      userEmail: session.email,
    },
  });

  // Extend trial by 24 hours as grace period
  let dbPlan = await db.plan.findFirst({ where: { isActive: true } });
  if (!dbPlan) {
    dbPlan = await db.plan.create({
      data: {
        name: "Standard",
        nameAr: "الباقة الأساسية",
        price: 299,
        currency: "EGP",
        interval: "month",
        maxBranches: 5,
        maxUsers: 20,
        maxMenuItems: 500,
        features: [],
        isActive: true,
      },
    });
  }

  await db.subscription.upsert({
    where: { organizationId: session.organizationId },
    create: {
      organizationId: session.organizationId,
      planId: dbPlan.id,
      status: "TRIALING",
      trialEnd: new Date(Date.now() + 24 * 60 * 60 * 1000),
    },
    update: {
      trialEnd: new Date(Date.now() + 24 * 60 * 60 * 1000),
    },
  });

  return NextResponse.json({ success: true, id: paymentRequest.id });
}

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const requests = await db.paymentRequest.findMany({
    where: { organizationId: session.organizationId },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(requests);
}
