import { redirect } from "next/navigation";
import { getPlatformSession } from "@/lib/platform-auth";
import { db } from "@/lib/db";
import { PlatformDashboard } from "./platform-client";

export default async function PlatformPage() {
  const session = await getPlatformSession();
  if (!session) redirect("/login");

  const [organizations, totalUsers, totalOrders, revenueAgg, recentOrgs, subscriptionStats, paymentRequests, allUsers] = await Promise.all([
    db.organization.findMany({
      include: {
        _count: { select: { users: true, branches: true } },
        subscription: { include: { plan: { select: { name: true, nameAr: true } } } },
      },
      orderBy: { createdAt: "desc" },
    }),
    db.user.count(),
    db.order.count({ where: { status: { not: "CANCELLED" } } }),
    db.order.aggregate({ where: { status: { not: "CANCELLED" } }, _sum: { total: true } }),
    db.organization.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
      select: { id: true, name: true, email: true, createdAt: true },
    }),
    db.subscription.groupBy({ by: ["status"], _count: { id: true } }),
    (db as any).paymentRequest.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        organization: { select: { name: true, email: true } },
      },
    }),
    db.user.findMany({
      include: {
        organization: { select: { name: true, address: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const orgOrderStats = await db.order.groupBy({
    by: ["organizationId"],
    where: { status: { not: "CANCELLED" } },
    _count: { id: true },
    _sum: { total: true },
  });

  const orgStatsMap = new Map(orgOrderStats.map((s: { organizationId: string; _count: { id: number }; _sum: { total: number | null } }) => [s.organizationId, { orders: s._count.id, revenue: s._sum.total ?? 0 }]));

  const orgsWithStats = organizations.map((org: any) => ({
    ...org,
    orderCount: (orgStatsMap.get(org.id) as { orders: number; revenue: number } | undefined)?.orders ?? 0,
    revenue: (orgStatsMap.get(org.id) as { orders: number; revenue: number } | undefined)?.revenue ?? 0,
  }));

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const [todayOrders, todayRevenueAgg] = await Promise.all([
    db.order.count({ where: { createdAt: { gte: todayStart } } }),
    db.order.aggregate({ where: { createdAt: { gte: todayStart }, status: { not: "CANCELLED" } }, _sum: { total: true } }),
  ]);

  return (
    <PlatformDashboard
      organizations={orgsWithStats}
      stats={{
        totalOrgs: organizations.length,
        totalUsers,
        totalOrders,
        totalRevenue: revenueAgg._sum.total ?? 0,
        todayOrders,
        todayRevenue: todayRevenueAgg._sum.total ?? 0,
        activeSubscriptions: subscriptionStats.find((s: { status: string; _count: { id: number } }) => s.status === "ACTIVE")?._count.id ?? 0,
        trialSubscriptions: subscriptionStats.find((s: { status: string; _count: { id: number } }) => s.status === "TRIALING")?._count.id ?? 0,
        pendingPayments: paymentRequests.filter((r: { status: string }) => r.status === "PENDING").length,
      }}
      recentOrgs={recentOrgs}
      paymentRequests={paymentRequests}
      allUsers={allUsers}
    />
  );
}
