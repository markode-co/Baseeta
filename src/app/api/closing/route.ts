import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";

const PAYMENT_LABELS: Record<string, string> = {
  CASH:   "نقداً",
  CARD:   "بطاقة",
  ONLINE: "أونلاين",
  OTHER:  "أخرى",
};

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const period = searchParams.get("period") || "daily";

  const now = new Date();
  let startDate: Date;

  if (period === "weekly") {
    startDate = new Date(now);
    startDate.setDate(now.getDate() - 6);
    startDate.setHours(0, 0, 0, 0);
  } else if (period === "monthly") {
    startDate = new Date(now.getFullYear(), now.getMonth(), 1);
  } else {
    // daily
    startDate = new Date(now);
    startDate.setHours(0, 0, 0, 0);
  }

  const where = {
    organizationId: session.organizationId,
    ...(session.branchId ? { branchId: session.branchId } : {}),
    createdAt: { gte: startDate, lte: now },
    status: { not: "CANCELLED" as const },
  };

  const [agg, byPayment] = await Promise.all([
    db.order.aggregate({
      where,
      _sum: { total: true, subtotal: true, discount: true, tax: true },
      _count: { id: true },
      _avg: { total: true },
    }),
    db.order.groupBy({
      by: ["paymentMethod"],
      where,
      _sum: { total: true },
      _count: { id: true },
      orderBy: { _sum: { total: "desc" } },
    }),
  ]);

  const totalRevenue = agg._sum.total ?? 0;

  return NextResponse.json({
    period,
    startDate: startDate.toISOString(),
    endDate: now.toISOString(),
    ordersCount:    agg._count.id,
    totalRevenue,
    totalSubtotal:  agg._sum.subtotal  ?? 0,
    totalDiscount:  agg._sum.discount  ?? 0,
    totalTax:       agg._sum.tax       ?? 0,
    avgOrder:       agg._avg.total     ?? 0,
    byPayment: byPayment.map((p) => ({
      method:      p.paymentMethod ?? "OTHER",
      label:       PAYMENT_LABELS[p.paymentMethod ?? "OTHER"] ?? p.paymentMethod ?? "أخرى",
      total:       p._sum.total ?? 0,
      count:       p._count.id,
      percentage:  totalRevenue > 0 ? Math.round(((p._sum.total ?? 0) / totalRevenue) * 100) : 0,
    })),
  });
}
