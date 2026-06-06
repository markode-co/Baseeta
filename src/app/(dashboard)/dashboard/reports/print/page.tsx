import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { formatCurrency } from "@/lib/utils";
import { getReportsData } from "../reports-data";

const ORDER_TYPE_LABELS: Record<string, string> = {
  DINE_IN: "داخل المطعم أو الكافيه",
  TAKEAWAY: "تيك أواي",
  DELIVERY: "توصيل",
};

export default async function ReportsPrintPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const org = await db.organization.findUnique({
    where: { id: session.organizationId },
    select: { name: true },
  });
  const data = await getReportsData(session.organizationId, session.branchId);
  const orgName = org?.name || "بسيطة";
  const printedAt = new Date().toLocaleString("ar-EG");

  return (
    <main className="min-h-screen bg-white text-slate-950" dir="rtl">
      <div className="no-print border-b border-slate-200 bg-slate-50 px-6 py-3">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3">
          <Link href="/dashboard/reports" className="text-sm font-medium text-blue-700 hover:underline">
            العودة للتقارير
          </Link>
          <span className="text-sm font-medium text-slate-600">نسخة الطباعة</span>
        </div>
      </div>

      <article className="mx-auto max-w-5xl px-6 py-8 print:max-w-none print:px-0 print:py-0">
        <header className="mb-8 border-b border-slate-300 pb-5 text-center">
          <h1 className="text-2xl font-black">{orgName}</h1>
          <p className="mt-1 text-base font-semibold text-slate-700">تقرير المبيعات</p>
          <p className="mt-1 text-sm text-slate-500">{printedAt}</p>
        </header>

        <section className="mb-8 grid grid-cols-2 gap-3 md:grid-cols-4 print:grid-cols-4">
          {[
            ["مبيعات اليوم", formatCurrency(data.todayRevenue), `${data.todayOrders} طلب`],
            ["مبيعات الشهر", formatCurrency(data.monthRevenue), `${data.monthOrders} طلب`],
            ["متوسط قيمة الطلب", formatCurrency(data.avgOrderValue), "هذا الشهر"],
            ["إجمالي الإيرادات", formatCurrency(data.allTimeRevenue), `${data.allTimeOrdersCount} طلب`],
          ].map(([label, value, sub]) => (
            <div key={label} className="rounded border border-slate-300 p-4">
              <p className="text-xs font-medium text-slate-500">{label}</p>
              <p className="mt-2 text-xl font-black">{value}</p>
              <p className="mt-1 text-xs text-slate-500">{sub}</p>
            </div>
          ))}
        </section>

        <section className="mb-8">
          <h2 className="mb-3 text-base font-bold">الإيرادات اليومية - آخر 30 يوم</h2>
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="bg-slate-100">
                <th className="border border-slate-300 p-2 text-right">التاريخ</th>
                <th className="border border-slate-300 p-2 text-right">الإيراد</th>
              </tr>
            </thead>
            <tbody>
              {data.dailyRevenue.map((day) => (
                <tr key={day.date}>
                  <td className="border border-slate-300 p-2">{day.date}</td>
                  <td className="border border-slate-300 p-2 font-semibold">{formatCurrency(day.revenue)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <section className="mb-8">
          <h2 className="mb-3 text-base font-bold">أكثر الأصناف مبيعاً هذا الشهر</h2>
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="bg-slate-100">
                <th className="border border-slate-300 p-2 text-right">#</th>
                <th className="border border-slate-300 p-2 text-right">الصنف</th>
                <th className="border border-slate-300 p-2 text-right">الكمية</th>
                <th className="border border-slate-300 p-2 text-right">الإيراد</th>
              </tr>
            </thead>
            <tbody>
              {data.topItems.length === 0 ? (
                <tr>
                  <td colSpan={4} className="border border-slate-300 p-3 text-center text-slate-500">
                    لا توجد مبيعات بعد
                  </td>
                </tr>
              ) : (
                data.topItems.map((item, index) => (
                  <tr key={`${item.name}-${index}`}>
                    <td className="border border-slate-300 p-2">{index + 1}</td>
                    <td className="border border-slate-300 p-2">{item.nameAr || item.name}</td>
                    <td className="border border-slate-300 p-2">{item._sum.quantity || 0}</td>
                    <td className="border border-slate-300 p-2 font-semibold">{formatCurrency(item._sum.total || 0)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </section>

        <section>
          <h2 className="mb-3 text-base font-bold">توزيع أنواع الطلبات</h2>
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="bg-slate-100">
                <th className="border border-slate-300 p-2 text-right">النوع</th>
                <th className="border border-slate-300 p-2 text-right">عدد الطلبات</th>
                <th className="border border-slate-300 p-2 text-right">الإيراد</th>
              </tr>
            </thead>
            <tbody>
              {data.ordersByType.map((orderType) => (
                <tr key={orderType.type}>
                  <td className="border border-slate-300 p-2">{ORDER_TYPE_LABELS[orderType.type] || orderType.type}</td>
                  <td className="border border-slate-300 p-2">{orderType._count}</td>
                  <td className="border border-slate-300 p-2 font-semibold">{formatCurrency(orderType._sum.total || 0)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      </article>
    </main>
  );
}
