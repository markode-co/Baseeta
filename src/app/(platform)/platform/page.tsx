import { redirect } from "next/navigation";
import { Suspense } from "react";
import { getPlatformSession } from "@/lib/platform-auth";
import { db } from "@/lib/db";
import { PlatformDashboard } from "./platform-client";

export const maxDuration = 120;

async function StatsSection() {
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const [totalUsers, totalOrders, revenueAgg, subscriptionStats, todayOrders, todayRevenueAgg] = await Promise.all([
    db.user.count(),
    db.order.count({ where: { status: { not: "CANCELLED" } } }),
    db.order.aggregate({ where: { status: { not: "CANCELLED" } }, _sum: { total: true } }),
    db.subscription.groupBy({ by: ["status"], _count: { id: true } }),
    db.order.count({ where: { createdAt: { gte: todayStart } } }),
    db.order.aggregate({ where: { createdAt: { gte: todayStart }, status: { not: "CANCELLED" } }, _sum: { total: true } }),
  ]);

  return {
    totalUsers,
    totalOrders,
    totalRevenue: revenueAgg._sum.total ?? 0,
    todayOrders,
    todayRevenue: todayRevenueAgg._sum.total ?? 0,
    activeSubscriptions: subscriptionStats.find((s: { status: string; _count: { id: number } }) => s.status === "ACTIVE")?._count.id ?? 0,
    trialSubscriptions: subscriptionStats.find((s: { status: string; _count: { id: number } }) => s.status === "TRIALING")?._count.id ?? 0,
  };
}

async function OrganizationsSection() {
  const [organizations, orgOrderStats] = await Promise.all([
    db.organization.findMany({
      include: {
        _count: { select: { users: true, branches: true } },
        subscription: { include: { plan: { select: { name: true, nameAr: true } } } },
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    }),
    db.order.groupBy({
      by: ["organizationId"],
      where: { status: { not: "CANCELLED" } },
      _count: { id: true },
      _sum: { total: true },
    }),
  ]);

  const orgStatsMap = new Map(orgOrderStats.map((s: { organizationId: string; _count: { id: number }; _sum: { total: number | null } }) => [s.organizationId, { orders: s._count.id, revenue: s._sum.total ?? 0 }]));

  return organizations.map((org: any) => ({
    ...org,
    orderCount: (orgStatsMap.get(org.id) as { orders: number; revenue: number } | undefined)?.orders ?? 0,
    revenue: (orgStatsMap.get(org.id) as { orders: number; revenue: number } | undefined)?.revenue ?? 0,
  }));
}

async function RecentDataSection() {
  const [recentOrgs, paymentRequests, allUsers] = await Promise.all([
    db.organization.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
      select: { id: true, name: true, email: true, createdAt: true },
    }),
    (db as any).paymentRequest.findMany({
      orderBy: { createdAt: "desc" },
      take: 50,
      include: {
        organization: { select: { name: true, email: true } },
      },
    }),
    db.user.findMany({
      include: {
        organization: { select: { name: true, address: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
  ]);

  return { recentOrgs, paymentRequests, allUsers };
}

export default async function PlatformPage() {
  const session = await getPlatformSession();
  if (!session) redirect("/login");

  const [stats, organizations, recentData] = await Promise.all([
    StatsSection(),
    OrganizationsSection(),
    RecentDataSection(),
  ]);

  const pendingPayments = recentData.paymentRequests.filter((r: { status: string }) => r.status === "PENDING").length;

  return (
    <PlatformDashboard
      organizations={organizations}
      stats={{
        totalOrgs: organizations.length,
        totalUsers: stats.totalUsers,
        totalOrders: stats.totalOrders,
        totalRevenue: stats.totalRevenue,
        todayOrders: stats.todayOrders,
        todayRevenue: stats.todayRevenue,
        activeSubscriptions: stats.activeSubscriptions,
        trialSubscriptions: stats.trialSubscriptions,
        pendingPayments: pendingPayments,
      }}
      recentOrgs={recentData.recentOrgs}
      paymentRequests={recentData.paymentRequests}
      allUsers={recentData.allUsers}
    />
  );
}
