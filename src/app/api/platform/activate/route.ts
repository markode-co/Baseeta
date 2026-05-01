import { NextRequest, NextResponse } from "next/server";
import { getPlatformSession } from "@/lib/platform-auth";
import { db } from "@/lib/db";

async function getOrCreateDefaultPlan() {
  const existing = await db.plan.findFirst({ where: { isActive: true } });
  if (existing) return existing;

  return db.plan.create({
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

// POST /api/platform/activate — approve or reject a payment request
export async function POST(req: NextRequest) {
  const session = await getPlatformSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { requestId, action, adminNote } = await req.json();

  const paymentRequest = await db.paymentRequest.findUnique({
    where: { id: requestId },
    include: { organization: { include: { subscription: true } } },
  });

  if (!paymentRequest) return NextResponse.json({ error: "الطلب غير موجود" }, { status: 404 });

  if (action === "APPROVE") {
    const dbPlan = await getOrCreateDefaultPlan();
    const periodEnd = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    await db.subscription.upsert({
      where: { organizationId: paymentRequest.organizationId },
      create: {
        organizationId: paymentRequest.organizationId,
        planId: dbPlan.id,
        status: "ACTIVE",
        currentPeriodStart: new Date(),
        currentPeriodEnd: periodEnd,
      },
      update: {
        planId: dbPlan.id,
        status: "ACTIVE",
        currentPeriodStart: new Date(),
        currentPeriodEnd: periodEnd,
      },
    });

    await db.paymentRequest.update({
      where: { id: requestId },
      data: { status: "APPROVED", adminNote: adminNote || null },
    });

    return NextResponse.json({ success: true, message: "تم تفعيل الاشتراك" });
  }

  if (action === "REJECT") {
    await db.paymentRequest.update({
      where: { id: requestId },
      data: { status: "REJECTED", adminNote: adminNote || "تم رفض الطلب" },
    });

    return NextResponse.json({ success: true, message: "تم رفض الطلب" });
  }

  return NextResponse.json({ error: "إجراء غير صحيح" }, { status: 400 });
}

// PATCH /api/platform/activate — manually set subscription for any org
export async function PATCH(req: NextRequest) {
  const session = await getPlatformSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { organizationId, status, months } = await req.json();

  const dbPlan = await getOrCreateDefaultPlan();
  const periodEnd = new Date(Date.now() + (months || 1) * 30 * 24 * 60 * 60 * 1000);

  await db.subscription.upsert({
    where: { organizationId },
    create: {
      organizationId,
      planId: dbPlan.id,
      status: status || "ACTIVE",
      currentPeriodStart: new Date(),
      currentPeriodEnd: periodEnd,
    },
    update: {
      planId: dbPlan.id,
      status: status || "ACTIVE",
      currentPeriodStart: new Date(),
      currentPeriodEnd: periodEnd,
    },
  });

  return NextResponse.json({ success: true });
}
