import { NextRequest, NextResponse } from "next/server";
import { getPlatformSession } from "@/lib/platform-auth";
import { db } from "@/lib/db";

// PATCH — suspend or unsuspend an organization
export async function PATCH(req: NextRequest) {
  const session = await getPlatformSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { organizationId, action } = await req.json();
  if (!organizationId || !action) return NextResponse.json({ error: "بيانات ناقصة" }, { status: 400 });

  if (action === "SUSPEND") {
    await db.subscription.updateMany({
      where: { organizationId },
      data: { status: "PAUSED" },
    });
    return NextResponse.json({ success: true, message: "تم إيقاف الحساب" });
  }

  if (action === "UNSUSPEND") {
    const periodEnd = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    await db.subscription.updateMany({
      where: { organizationId },
      data: { status: "ACTIVE", currentPeriodEnd: periodEnd },
    });
    return NextResponse.json({ success: true, message: "تم تفعيل الحساب" });
  }

  return NextResponse.json({ error: "إجراء غير صحيح" }, { status: 400 });
}

// DELETE — permanently remove an organization and all its data
export async function DELETE(req: NextRequest) {
  const session = await getPlatformSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { organizationId } = await req.json();
  if (!organizationId) return NextResponse.json({ error: "بيانات ناقصة" }, { status: 400 });

  const branches = await db.branch.findMany({
    where: { organizationId },
    select: { id: true },
  });
  const branchIds = branches.map((b) => b.id);

  const orders = branchIds.length
    ? await db.order.findMany({ where: { branchId: { in: branchIds } }, select: { id: true } })
    : [];
  const orderIds = orders.map((o) => o.id);

  await db.$transaction([
    db.shift.deleteMany({ where: { branchId: { in: branchIds } } }),
    ...(orderIds.length
      ? [
          db.orderItem.deleteMany({ where: { orderId: { in: orderIds } } }),
          db.payment.deleteMany({ where: { orderId: { in: orderIds } } }),
          db.order.deleteMany({ where: { id: { in: orderIds } } }),
        ]
      : []),
    db.organization.delete({ where: { id: organizationId } }),
  ]);

  return NextResponse.json({ success: true, message: "تم حذف المطعم نهائياً" });
}
