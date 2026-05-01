"use client";
import { useState, useCallback } from "react";
import { X, Lock, Printer, TrendingUp, ShoppingBag, Tag, Receipt, CreditCard, Loader2, ChevronDown } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";

type Period = "daily" | "weekly" | "monthly";

interface PaymentRow {
  method: string;
  label: string;
  total: number;
  count: number;
  percentage: number;
}

interface ClosingData {
  period: Period;
  startDate: string;
  endDate: string;
  ordersCount: number;
  totalRevenue: number;
  totalSubtotal: number;
  totalDiscount: number;
  totalTax: number;
  avgOrder: number;
  byPayment: PaymentRow[];
}

const PERIODS: { value: Period; label: string }[] = [
  { value: "daily",   label: "اليومي"   },
  { value: "weekly",  label: "الأسبوعي" },
  { value: "monthly", label: "الشهري"   },
];

const PERIOD_LABELS: Record<Period, string> = {
  daily:   "تقفيل يومي",
  weekly:  "تقفيل أسبوعي",
  monthly: "تقفيل شهري",
};

function formatRange(start: string, end: string, period: Period) {
  const s = new Date(start);
  const e = new Date(end);
  if (period === "daily") return formatDate(e);
  return `${formatDate(s)} – ${formatDate(e)}`;
}

// ── Print ─────────────────────────────────────────────────────────────────────
function buildPrintHtml(data: ClosingData): string {
  const periodLabel = PERIOD_LABELS[data.period];
  const range       = formatRange(data.startDate, data.endDate, data.period);
  const payRows = data.byPayment.map((p) =>
    `<tr><td>${p.label}</td><td>${p.count} طلب</td><td style="text-align:left">${p.total.toFixed(2)}</td></tr>`
  ).join("");

  return `<!DOCTYPE html><html dir="rtl"><head><meta charset="utf-8">
<title>${periodLabel}</title>
<style>
  body{font-family:'Courier New',monospace;font-size:13px;width:80mm;margin:0 auto;padding:12px}
  .c{text-align:center} .b{font-weight:bold} .hr{border-top:1px dashed #000;margin:8px 0}
  .row{display:flex;justify-content:space-between;margin:4px 0}
  table{width:100%;border-collapse:collapse;font-size:12px}
  td{padding:3px 0}
  @media print{body{width:80mm}@page{size:80mm auto;margin:0}}
</style></head><body>
<div class="c"><div class="b" style="font-size:18px">بسيطة</div>
<div style="font-size:11px;color:#555">نظام إدارة المطاعم</div></div>
<div class="hr"></div>
<div class="c b" style="font-size:15px">${periodLabel}</div>
<div class="c" style="font-size:11px;margin:3px 0">${range}</div>
<div class="hr"></div>
<div class="row"><span>عدد الطلبات</span><span class="b">${data.ordersCount}</span></div>
<div class="row"><span>إجمالي الإيرادات</span><span class="b">${data.totalRevenue.toFixed(2)}</span></div>
<div class="row"><span>إجمالي الخصومات</span><span>${data.totalDiscount.toFixed(2)}</span></div>
<div class="row"><span>الضريبة المحصلة</span><span>${data.totalTax.toFixed(2)}</span></div>
<div class="row"><span>متوسط قيمة الطلب</span><span>${data.avgOrder.toFixed(2)}</span></div>
<div class="hr"></div>
<div class="b" style="margin-bottom:4px">طرق الدفع</div>
<table>
${payRows}
</table>
<div class="hr"></div>
<div class="c" style="font-size:11px;margin-top:6px">طُبع في: ${new Date().toLocaleString("ar-EG")}</div>
</body></html>`;
}

// ── Main Component ────────────────────────────────────────────────────────────
export function ClosingButton({ collapsed = false }: { collapsed?: boolean }) {
  const [open,    setOpen]    = useState(false);
  const [period,  setPeriod]  = useState<Period>("daily");
  const [data,    setData]    = useState<ClosingData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState<string | null>(null);

  const fetchData = useCallback(async (p: Period) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/closing?period=${p}`);
      if (!res.ok) throw new Error("فشل تحميل البيانات");
      setData(await res.json());
    } catch (e: unknown) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  function handleOpen() {
    setOpen(true);
    fetchData("daily");
  }

  function handlePeriod(p: Period) {
    setPeriod(p);
    fetchData(p);
  }

  function handlePrint() {
    if (!data) return;
    const win = window.open("", "_blank", "width=420,height=700");
    if (!win) return;
    win.document.write(buildPrintHtml(data));
    win.document.close();
    win.focus();
    setTimeout(() => { win.print(); win.close(); }, 400);
  }

  return (
    <>
      {/* Trigger button */}
      <button
        onClick={handleOpen}
        title="تقفيل الكاشير"
        className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium
          bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 transition-colors
          ${collapsed ? "md:justify-center md:px-0 md:py-3" : ""}`}
      >
        <Lock className="w-[18px] h-[18px] flex-shrink-0" />
        <span className={collapsed ? "md:hidden" : ""}>تقفيل الكاشير</span>
      </button>

      {/* Modal */}
      {open && (
        <div
          className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setOpen(false)}
        >
          <div
            dir="rtl"
            role="dialog"
            aria-modal="true"
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center">
                  <Lock className="w-4 h-4 text-amber-600" />
                </div>
                <h2 className="font-bold text-slate-900 text-base">تقفيل الكاشير</h2>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Period selector */}
            <div className="px-5 pt-4">
              <div className="flex gap-1 bg-slate-100 rounded-xl p-1 overflow-hidden">
                {PERIODS.map((p) => (
                  <button
                    key={p.value}
                    onClick={() => handlePeriod(p.value)}
                    className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                      period === p.value
                        ? "bg-white text-slate-900 shadow-sm"
                        : "text-slate-500 hover:text-slate-700"
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
              {loading ? (
                <div className="flex flex-col items-center justify-center py-16 gap-3">
                  <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
                  <p className="text-sm text-slate-500">جارٍ تحميل البيانات...</p>
                </div>
              ) : error ? (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-center">
                  <p className="text-sm text-red-600">{error}</p>
                  <button onClick={() => fetchData(period)} className="mt-2 text-xs text-blue-600 hover:underline">
                    إعادة المحاولة
                  </button>
                </div>
              ) : data ? (
                <>
                  {/* Date range */}
                  <div className="bg-slate-50 rounded-xl px-4 py-2.5 text-center">
                    <p className="text-xs text-slate-500 mb-0.5">الفترة</p>
                    <p className="text-sm font-semibold text-slate-800">
                      {formatRange(data.startDate, data.endDate, data.period)}
                    </p>
                  </div>

                  {/* KPI grid */}
                  <div className="grid grid-cols-2 gap-3">
                    <KpiCard
                      icon={ShoppingBag}
                      iconColor="bg-blue-100 text-blue-600"
                      label="عدد الطلبات"
                      value={String(data.ordersCount)}
                      unit="طلب"
                    />
                    <KpiCard
                      icon={TrendingUp}
                      iconColor="bg-green-100 text-green-600"
                      label="إجمالي الإيرادات"
                      value={formatCurrency(data.totalRevenue)}
                    />
                    <KpiCard
                      icon={Tag}
                      iconColor="bg-amber-100 text-amber-600"
                      label="إجمالي الخصومات"
                      value={formatCurrency(data.totalDiscount)}
                    />
                    <KpiCard
                      icon={Receipt}
                      iconColor="bg-purple-100 text-purple-600"
                      label="الضريبة المحصلة"
                      value={formatCurrency(data.totalTax)}
                    />
                  </div>

                  {/* Avg order */}
                  <div className="flex items-center justify-between bg-blue-50 border border-blue-100 rounded-xl px-4 py-3">
                    <span className="text-sm text-slate-700 font-medium">متوسط قيمة الطلب</span>
                    <span className="text-base font-bold text-blue-700">{formatCurrency(data.avgOrder)}</span>
                  </div>

                  {/* Payment methods */}
                  {data.byPayment.length > 0 && (
                    <div>
                      <div className="flex items-center gap-2 mb-2.5">
                        <CreditCard className="w-4 h-4 text-slate-400" />
                        <p className="text-sm font-semibold text-slate-700">طرق الدفع</p>
                      </div>
                      <div className="space-y-2">
                        {data.byPayment.map((p) => (
                          <div key={p.method} className="bg-slate-50 rounded-xl px-4 py-3">
                            <div className="flex items-center justify-between mb-1.5">
                              <span className="text-sm font-medium text-slate-800">{p.label}</span>
                              <span className="text-sm font-bold text-slate-900">{formatCurrency(p.total)}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="flex-1 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-blue-500 rounded-full transition-all duration-500"
                                  style={{ width: `${p.percentage}%` }}
                                />
                              </div>
                              <span className="text-xs text-slate-500 w-12 text-left">
                                {p.count} طلب · {p.percentage}%
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Net */}
                  <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-xl px-4 py-3">
                    <span className="text-sm text-slate-700 font-semibold">صافي المبيعات (بعد الخصم)</span>
                    <span className="text-base font-bold text-green-700">
                      {formatCurrency(data.totalSubtotal - data.totalDiscount)}
                    </span>
                  </div>
                </>
              ) : null}
            </div>

            {/* Footer */}
            <div className="px-5 py-4 border-t border-slate-100 flex gap-2">
              <button
                onClick={handlePrint}
                disabled={!data || loading}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-slate-800 hover:bg-slate-900 text-white text-sm font-semibold rounded-xl transition-colors disabled:opacity-40"
              >
                <Printer className="w-4 h-4" />
                طباعة التقرير
              </button>
              <button
                onClick={() => setOpen(false)}
                className="px-4 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-600 hover:bg-slate-50 transition-colors"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// ── KPI Card ──────────────────────────────────────────────────────────────────
function KpiCard({
  icon: Icon, iconColor, label, value, unit,
}: {
  icon: React.ElementType;
  iconColor: string;
  label: string;
  value: string;
  unit?: string;
}) {
  return (
    <div className="bg-slate-50 rounded-xl p-3.5">
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center mb-2.5 ${iconColor}`}>
        <Icon className="w-4 h-4" />
      </div>
      <p className="text-xs text-slate-500 mb-0.5">{label}</p>
      <p className="text-base font-bold text-slate-900 leading-tight">
        {value}
        {unit && <span className="text-xs font-normal text-slate-500 mr-1">{unit}</span>}
      </p>
    </div>
  );
}
