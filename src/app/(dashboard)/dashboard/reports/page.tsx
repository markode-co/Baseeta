import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { ReportsClient } from "./reports-client";
import { startOfDay, endOfDay, startOfMonth, endOfMonth, subDays, format } from "date-fns";

async function getReportsData(orgId: string, branchId?: string) {
  const now = new Date();
  const todayStart = startOfDay(now);
  const todayEnd = endOfDay(now);
  const monthStart = startOfMonth(now);
  const monthEnd = endOfMonth(now);

  const where = {
    organizationId: orgId,
    ...(branchId ? { branchId } : {}),
    status: { not: "CANCELLED" as const },
  };

  // Daily revenue for last 30 days
  const dailyOrders = await db.order.findMany({
    where: { ...where, createdAt: { gte: subDays(now, 30) } },
    select: { total: true, createdAt: true, type: true },
    orderBy: { createdAt: "asc" },
  });

  // Group by day
  const dailyMap: Record<string, number> = {};
  for (let i = 29; i >= 0; i--) {
    const d = subDays(now, i);
    dailyMap[format(d, "MM/dd")] = 0;
  }
  dailyOrders.forEach((o) => {
    const key = format(o.createdAt, "MM/dd");
    if (dailyMap[key] !== undefined) dailyMap[key] += o.total;
  });

  const dailyRevenue = Object.entries(dailyMap).map(([date, revenue]) => ({ date, revenue }));

  // Monthly totals
  const [todayStats, monthStats, allTimeOrders] = await Promise.all([
    db.order.aggregate({
      where: { ...where, createdAt: { gte: todayStart, lte: todayEnd } },
      _sum: { total: true },
      _count: true,
    }),
    db.order.aggregate({
      where: { ...where, createdAt: { gte: monthStart, lte: monthEnd } },
      _sum: { total: true },
      _count: true,
    }),
    db.order.aggregate({ where, _sum: { total: true }, _count: true }),
  ]);

  // Top items this month
  const topItems = await db.orderItem.groupBy({
    by: ["name", "nameAr"],
    where: { order: { ...where, createdAt: { gte: monthStart, lte: monthEnd } } },
    _sum: { quantity: true, total: true },
    orderBy: { _sum: { quantity: "desc" } },
    take: 10,
  });

  // Orders by type
  const ordersByType = await db.order.groupBy({
    by: ["type"],
    where: { ...where, createdAt: { gte: monthStart, lte: monthEnd } },
    _count: true,
    _sum: { total: true },
  });

  // Hourly distribution today
  const hourlyOrders = await db.order.findMany({
    where: { ...where, createdAt: { gte: todayStart, lte: todayEnd } },
    select: { total: true, createdAt: true },
  });

  const hourlyMap: Record<number, number> = {};
  for (let h = 0; h < 24; h++) hourlyMap[h] = 0;
  hourlyOrders.forEach((o) => { hourlyMap[o.createdAt.getHours()] += o.total; });
  const hourlyRevenue = Object.entries(hourlyMap).map(([hour, revenue]) => ({
    hour: `${String(hour).padStart(2, "0")}:00`,
    revenue,
  }));

  return {
    todayRevenue: todayStats._sum.total ?? 0,
    todayOrders: todayStats._count,
    monthRevenue: monthStats._sum.total ?? 0,
    monthOrders: monthStats._count,
    allTimeRevenue: allTimeOrders._sum.total ?? 0,
    allTimeOrdersCount: allTimeOrders._count,
    dailyRevenue,
    topItems,
    ordersByType,
    hourlyRevenue,
    avgOrderValue: monthStats._count > 0 ? (monthStats._sum.total ?? 0) / monthStats._count : 0,
  };
}

export default async function ReportsPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const org = await db.organization.findUnique({
    where: { id: session.organizationId },
    select: { name: true },
  });
  const data = await getReportsData(session.organizationId, session.branchId);

  return <ReportsClient data={data} orgName={org?.name || "بسيطة"} />;
}
