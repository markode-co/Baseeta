import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import { Topbar } from "@/components/layout/topbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  TrendingUp, ShoppingCart, Users, Package, ArrowUpRight,
  ArrowDownRight, Clock, CheckCircle2, ChefHat, Flame
} from "lucide-react";
import Link from "next/link";

async function getDashboardData(orgId: string, branchId?: string) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const where = branchId ? { branchId } : {};

  const [todayOrders, yesterdayOrders, recentOrders, topItems] = await Promise.all([
    db.order.aggregate({
      where: { ...where, organizationId: orgId, createdAt: { gte: today }, status: { not: "CANCELLED" } },
      _sum: { total: true },
      _count: true,
    }),
    db.order.aggregate({
      where: { ...where, organizationId: orgId, createdAt: { gte: yesterday, lt: today }, status: { not: "CANCELLED" } },
      _sum: { total: true },
      _count: true,
    }),
    db.order.findMany({
      where: { ...where, organizationId: orgId },
      include: { items: true, table: true },
      orderBy: { createdAt: "desc" },
      take: 8,
    }),
    db.orderItem.groupBy({
      by: ["name"],
      where: {
        order: { ...where, organizationId: orgId, createdAt: { gte: today } },
      },
      _sum: { quantity: true, total: true },
      orderBy: { _sum: { quantity: "desc" } },
      take: 5,
    }),
  ]);

  const activeOrders = await db.order.count({
    where: { ...where, organizationId: orgId, status: { in: ["PENDING", "CONFIRMED", "PREPARING", "READY"] } },
  });

  return { todayOrders, yesterdayOrders, recentOrders, topItems, activeOrders };
}

function calcChange(today: number, yesterday: number) {
  if (yesterday === 0) return { pct: 100, up: true };
  const pct = Math.round(((today - yesterday) / yesterday) * 100);
  return { pct: Math.abs(pct), up: pct >= 0 };
}

const STATUS_BADGE: Record<string, string> = {
  PENDING: "pending",
  CONFIRMED: "preparing",
  PREPARING: "preparing",
  READY: "ready",
  SERVED: "ready",
  COMPLETED: "completed",
  CANCELLED: "cancelled",
};

const STATUS_AR: Record<string, string> = {
  PENDING: "معلق",
  CONFIRMED: "مؤكد",
  PREPARING: "يُحضَّر",
  READY: "جاهز",
  SERVED: "قُدِّم",
  COMPLETED: "مكتمل",
  CANCELLED: "ملغي",
};

export default async function DashboardPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const { todayOrders, yesterdayOrders, recentOrders, topItems, activeOrders } = await getDashboardData(
    session.organizationId,
    session.branchId
  );

  const revenueToday = todayOrders._sum.total ?? 0;
  const revenueYesterday = yesterdayOrders._sum.total ?? 0;
  const ordersToday = todayOrders._count;
  const ordersYesterday = yesterdayOrders._count;

  const revenueChange = calcChange(revenueToday, revenueYesterday);
  const ordersChange = calcChange(ordersToday, ordersYesterday);
  const avgOrder = ordersToday > 0 ? revenueToday / ordersToday : 0;

  return (
    <main className="flex-1 overflow-auto">
      <Topbar
        title={`مرحباً، ${session.name} 👋`}
        subtitle={new Date().toLocaleDateString("ar-SA", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
        notificationCount={activeOrders}
      />

      <div className="p-6 space-y-6" dir="rtl">
        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard
            title="مبيعات اليوم"
            value={formatCurrency(revenueToday)}
            change={revenueChange}
            icon={<TrendingUp className="w-5 h-5 text-blue-600" />}
            color="blue"
          />
          <KpiCard
            title="طلبات اليوم"
            value={ordersToday.toString()}
            change={ordersChange}
            icon={<ShoppingCart className="w-5 h-5 text-green-600" />}
            color="green"
          />
          <KpiCard
            title="طلبات نشطة"
            value={activeOrders.toString()}
            icon={<Flame className="w-5 h-5 text-orange-600" />}
            color="orange"
            live
          />
          <KpiCard
            title="متوسط الطلب"
            value={formatCurrency(avgOrder)}
            icon={<ChefHat className="w-5 h-5 text-purple-600" />}
            color="purple"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Orders */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader className="flex-row items-center justify-between pb-4">
                <CardTitle>أحدث الطلبات</CardTitle>
                <Link href="/dashboard/orders" className="text-sm text-blue-600 hover:underline">
                  عرض الكل
                </Link>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-0 divide-y divide-slate-100">
                  {recentOrders.length === 0 ? (
                    <div className="text-center py-12 text-slate-400">
                      <ShoppingCart className="w-10 h-10 mx-auto mb-3 opacity-40" />
                      <p>لا توجد طلبات حتى الآن</p>
                    </div>
                  ) : (
                    recentOrders.map((order) => (
                      <div key={order.id} className="flex items-center justify-between py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 bg-slate-100 rounded-lg flex items-center justify-center text-sm font-bold text-slate-600">
                            #{order.orderNumber.slice(-3)}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-slate-800">
                              {order.table ? `طاولة ${order.table.name}` : order.type === "TAKEAWAY" ? "تيك أواي" : "توصيل"}
                            </p>
                            <p className="text-xs text-slate-400">
                              {order.items.length} أصناف · {formatDateTime(order.createdAt)}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-semibold text-slate-900">{formatCurrency(order.total)}</span>
                          <Badge variant={STATUS_BADGE[order.status] as Parameters<typeof Badge>[0]["variant"]}>
                            {STATUS_AR[order.status]}
                          </Badge>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Top selling */}
          <div>
            <Card>
              <CardHeader className="pb-4">
                <CardTitle>الأكثر مبيعاً اليوم</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                {topItems.length === 0 ? (
                  <div className="text-center py-8 text-slate-400">
                    <Package className="w-8 h-8 mx-auto mb-2 opacity-40" />
                    <p className="text-sm">لا توجد مبيعات بعد</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {topItems.map((item, idx) => (
                      <div key={item.name} className="flex items-center gap-3">
                        <div className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-500 flex-shrink-0">
                          {idx + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-slate-800 truncate">{item.name}</p>
                          <p className="text-xs text-slate-400">{item._sum.quantity} وحدة</p>
                        </div>
                        <span className="text-sm font-semibold text-slate-700 flex-shrink-0">
                          {formatCurrency(item._sum.total ?? 0)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Quick actions */}
            <Card className="mt-4">
              <CardHeader className="pb-3">
                <CardTitle>إجراءات سريعة</CardTitle>
              </CardHeader>
              <CardContent className="pt-0 grid grid-cols-2 gap-2">
                {[
                  { href: "/dashboard/pos", label: "طلب جديد", icon: ShoppingCart, color: "bg-blue-50 text-blue-600 hover:bg-blue-100" },
                  { href: "/dashboard/orders", label: "الطلبات", icon: Clock, color: "bg-green-50 text-green-600 hover:bg-green-100" },
                  { href: "/dashboard/tables", label: "الطاولات", icon: Users, color: "bg-amber-50 text-amber-600 hover:bg-amber-100" },
                  { href: "/dashboard/reports", label: "التقارير", icon: TrendingUp, color: "bg-purple-50 text-purple-600 hover:bg-purple-100" },
                ].map((action) => (
                  <Link
                    key={action.href}
                    href={action.href}
                    className={`flex flex-col items-center gap-2 p-3 rounded-xl text-sm font-medium transition-colors ${action.color}`}
                  >
                    <action.icon className="w-5 h-5" />
                    {action.label}
                  </Link>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </main>
  );
}

function KpiCard({ title, value, change, icon, color, live }: {
  title: string;
  value: string;
  change?: { pct: number; up: boolean };
  icon: React.ReactNode;
  color: string;
  live?: boolean;
}) {
  const colorMap: Record<string, string> = {
    blue: "bg-blue-50",
    green: "bg-green-50",
    orange: "bg-orange-50",
    purple: "bg-purple-50",
  };

  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-start justify-between mb-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${colorMap[color]}`}>
            {icon}
          </div>
          {live && (
            <div className="flex items-center gap-1.5 text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
              <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
              مباشر
            </div>
          )}
          {change && (
            <div className={`flex items-center gap-1 text-xs font-medium ${change.up ? "text-green-600" : "text-red-500"}`}>
              {change.up ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
              {change.pct}%
            </div>
          )}
        </div>
        <p className="text-2xl font-bold text-slate-900 mb-0.5">{value}</p>
        <p className="text-sm text-slate-500">{title}</p>
      </CardContent>
    </Card>
  );
}
