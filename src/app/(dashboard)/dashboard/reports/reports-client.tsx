"use client";
import { Topbar } from "@/components/layout/topbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import {
  TrendingUp, ShoppingCart, Star, Clock, DollarSign,
  BarChart3, Calendar, Download, Printer
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from "recharts";

const ORDER_TYPE_LABELS: Record<string, string> = {
  DINE_IN: "داخل المطعم",
  TAKEAWAY: "تيك أواي",
  DELIVERY: "توصيل",
};

const PIE_COLORS = ["#2563eb", "#22c55e", "#f59e0b", "#ef4444", "#8b5cf6"];

interface ReportsData {
  todayRevenue: number;
  todayOrders: number;
  monthRevenue: number;
  monthOrders: number;
  allTimeRevenue: number;
  allTimeOrdersCount: number;
  avgOrderValue: number;
  dailyRevenue: { date: string; revenue: number }[];
  topItems: { name: string; nameAr: string | null; _sum: { quantity: number | null; total: number | null } }[];
  ordersByType: { type: string; _count: number; _sum: { total: number | null } }[];
  hourlyRevenue: { hour: string; revenue: number }[];
}

const ORDER_TYPE_LABELS_EXPORT: Record<string, string> = {
  DINE_IN: "داخل المطعم",
  TAKEAWAY: "تيك أواي",
  DELIVERY: "توصيل",
};

export function ReportsClient({ data }: { data: ReportsData }) {
  const {
    todayRevenue, todayOrders, monthRevenue, monthOrders,
    allTimeRevenue, allTimeOrdersCount, avgOrderValue,
    dailyRevenue, topItems, ordersByType, hourlyRevenue,
  } = data;

  function exportCSV() {
    const rows: string[][] = [
      ["بسيطة - تقرير المبيعات", new Date().toLocaleDateString("ar-EG")],
      [""],
      ["المؤشرات الرئيسية"],
      ["المبيعات اليوم", String(todayRevenue), "ج.م"],
      ["طلبات اليوم", String(todayOrders)],
      ["مبيعات الشهر", String(monthRevenue), "ج.م"],
      ["طلبات الشهر", String(monthOrders)],
      ["متوسط قيمة الطلب", String(avgOrderValue.toFixed(2)), "ج.م"],
      ["إجمالي الإيرادات الكلية", String(allTimeRevenue), "ج.م"],
      ["إجمالي عدد الطلبات", String(allTimeOrdersCount)],
      [""],
      ["الإيرادات اليومية (آخر 30 يوم)"],
      ["التاريخ", "الإيراد (ج.م)"],
      ...dailyRevenue.map((d) => [d.date, String(d.revenue)]),
      [""],
      ["أكثر الأصناف مبيعاً"],
      ["الصنف", "الكمية المباعة", "الإيراد (ج.م)"],
      ...topItems.map((i) => [
        i.nameAr || i.name,
        String(i._sum.quantity ?? 0),
        String((i._sum.total ?? 0).toFixed(2)),
      ]),
      [""],
      ["توزيع أنواع الطلبات"],
      ["النوع", "عدد الطلبات", "الإيراد (ج.م)"],
      ...ordersByType.map((o) => [
        ORDER_TYPE_LABELS_EXPORT[o.type] || o.type,
        String(o._count),
        String((o._sum.total ?? 0).toFixed(2)),
      ]),
    ];

    const csv = rows
      .map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `تقرير-بسيطة-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  const pieData = ordersByType.map((o) => ({
    name: ORDER_TYPE_LABELS[o.type] || o.type,
    value: o._count,
    revenue: o._sum.total || 0,
  }));

  return (
    <main className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden">
      <Topbar
        title="التقارير والإحصائيات"
        subtitle="تحليل الأداء ومتابعة المبيعات"
        actions={
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => window.print()}>
              <Printer className="w-4 h-4" /> طباعة
            </Button>
            <Button variant="outline" size="sm" onClick={exportCSV}>
              <Download className="w-4 h-4" /> تصدير CSV
            </Button>
          </div>
        }
      />

      <div className="p-3 sm:p-4 md:p-6 space-y-4 sm:space-y-6" dir="rtl">
        {/* KPI Row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4">
          {[
            { label: "مبيعات اليوم", value: formatCurrency(todayRevenue), sub: `${todayOrders} طلب`, icon: TrendingUp, color: "text-blue-600", bg: "bg-blue-50" },
            { label: "مبيعات الشهر", value: formatCurrency(monthRevenue), sub: `${monthOrders} طلب`, icon: Calendar, color: "text-green-600", bg: "bg-green-50" },
            { label: "متوسط قيمة الطلب", value: formatCurrency(avgOrderValue), sub: "هذا الشهر", icon: ShoppingCart, color: "text-purple-600", bg: "bg-purple-50" },
            { label: "إجمالي الإيرادات", value: formatCurrency(allTimeRevenue), sub: `${allTimeOrdersCount} طلب`, icon: DollarSign, color: "text-amber-600", bg: "bg-amber-50" },
          ].map((kpi) => (
            <Card key={kpi.label}>
              <CardContent className="p-5">
                <div className={`w-10 h-10 ${kpi.bg} rounded-xl flex items-center justify-center mb-3`}>
                  <kpi.icon className={`w-5 h-5 ${kpi.color}`} />
                </div>
                <p className="text-2xl font-bold text-slate-900 mb-0.5">{kpi.value}</p>
                <p className="text-sm font-medium text-slate-600">{kpi.label}</p>
                <p className="text-xs text-slate-400 mt-0.5">{kpi.sub}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Revenue Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-blue-600" />
              الإيرادات اليومية (آخر 30 يوم)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={dailyRevenue}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#94a3b8" }} />
                <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} />
                <Tooltip
                  formatter={(value) => [formatCurrency(Number(value)), "الإيراد"]}
                  contentStyle={{ borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 12 }}
                />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="#2563eb"
                  strokeWidth={2}
                  fill="url(#colorRevenue)"
                  dot={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          {/* Hourly distribution */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-purple-600" />
                  التوزيع الساعي لليوم
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={hourlyRevenue.filter((h) => h.revenue > 0 || (parseInt(h.hour) >= 6 && parseInt(h.hour) <= 24))}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="hour" tick={{ fontSize: 10, fill: "#94a3b8" }} />
                    <YAxis tick={{ fontSize: 10, fill: "#94a3b8" }} />
                    <Tooltip
                      formatter={(value) => [formatCurrency(Number(value)), "الإيراد"]}
                      contentStyle={{ borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 12 }}
                    />
                    <Bar dataKey="revenue" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Order Types */}
          <div>
            <Card className="h-full">
              <CardHeader>
                <CardTitle>أنواع الطلبات</CardTitle>
              </CardHeader>
              <CardContent>
                {pieData.length === 0 ? (
                  <div className="text-center py-8 text-slate-400">
                    <ShoppingCart className="w-8 h-8 mx-auto mb-2 opacity-30" />
                    <p className="text-sm">لا توجد بيانات</p>
                  </div>
                ) : (
                  <>
                    <ResponsiveContainer width="100%" height={180}>
                      <PieChart>
                        <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value">
                          {pieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                        </Pie>
                        <Tooltip formatter={(value) => [value, "طلب"]} />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="space-y-2 mt-2">
                      {pieData.map((d, i) => (
                        <div key={d.name} className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: PIE_COLORS[i] }} />
                            <span className="text-slate-600">{d.name}</span>
                          </div>
                          <div className="text-right">
                            <span className="font-medium text-slate-800">{d.value}</span>
                            <span className="text-slate-400 text-xs mr-1">طلب</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Top Items */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Star className="w-5 h-5 text-amber-500" />
              أكثر الأصناف مبيعاً هذا الشهر
            </CardTitle>
          </CardHeader>
          <CardContent>
            {topItems.length === 0 ? (
              <div className="text-center py-8 text-slate-400">
                <Star className="w-8 h-8 mx-auto mb-2 opacity-30" />
                <p className="text-sm">لا توجد مبيعات بعد</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-100">
                      <th className="text-right py-2 text-slate-500 font-medium">#</th>
                      <th className="text-right py-2 text-slate-500 font-medium">الصنف</th>
                      <th className="text-right py-2 text-slate-500 font-medium">الكمية</th>
                      <th className="text-right py-2 text-slate-500 font-medium">الإيراد</th>
                      <th className="text-right py-2 text-slate-500 font-medium">النسبة</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {topItems.map((item, idx) => {
                      const totalRevenue = topItems.reduce((s, i) => s + (i._sum.total || 0), 0);
                      const pct = totalRevenue > 0 ? ((item._sum.total || 0) / totalRevenue * 100).toFixed(1) : "0";
                      return (
                        <tr key={item.name} className="hover:bg-slate-50">
                          <td className="py-2.5 text-slate-400 font-medium">{idx + 1}</td>
                          <td className="py-2.5 font-medium text-slate-800">{item.nameAr || item.name}</td>
                          <td className="py-2.5 text-slate-600">{item._sum.quantity || 0}</td>
                          <td className="py-2.5 font-semibold text-slate-800">{formatCurrency(item._sum.total || 0)}</td>
                          <td className="py-2.5">
                            <div className="flex items-center gap-2">
                              <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                <div className="h-full bg-blue-500 rounded-full" style={{ width: `${pct}%` }} />
                              </div>
                              <span className="text-xs text-slate-500 w-10">{pct}%</span>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
