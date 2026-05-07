"use client";
import { useState } from "react";
import { platformLogout } from "@/app/actions/auth";
import {
  Building2, Users, ShoppingCart, TrendingUp, LogOut,
  Search, CheckCircle, Clock, Globe,
  LayoutDashboard, Calendar, DollarSign,
  CreditCard, X, Check, RefreshCw,
  Loader2, Eye, Phone, MapPin, Mail, Store, Hash,
  PauseCircle, PlayCircle, Trash2, AlertTriangle, Download,
  ChevronRight, ChevronLeft,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import toast from "react-hot-toast";

type Org = {
  id: string; name: string; email: string; phone: string | null; address: string | null; createdAt: Date;
  _count: { users: number; branches: number };
  subscription: { status: string; currentPeriodEnd: Date | null; trialEnd: Date | null; plan: { name: string; nameAr: string } | null } | null;
  orderCount: number; revenue: number;
};

type Stats = {
  totalOrgs: number; totalUsers: number; totalOrders: number; totalRevenue: number;
  todayOrders: number; todayRevenue: number; activeSubscriptions: number; trialSubscriptions: number;
  pendingPayments: number;
};

type RecentOrg = { id: string; name: string; email: string; createdAt: Date };

type PaymentRequest = {
  id: string; organizationId: string; planKey: string; amount: number; method: string;
  receiptUrl: string; status: string; adminNote: string | null;
  orgName: string; orgEmail: string; userName: string; userEmail: string;
  createdAt: Date;
  organization: { name: string; email: string };
};

const PLANS: Record<string, { name: string; price: number }> = {
  BASIC: { name: "أساسي", price: 1000 },
  PRO: { name: "احترافي", price: 2500 },
  PREMIUM: { name: "بريميوم", price: 5000 },
};

const SUB_STATUS: Record<string, { label: string; color: string; bg: string }> = {
  ACTIVE: { label: "نشط", color: "text-green-700", bg: "bg-green-100" },
  TRIALING: { label: "تجريبي", color: "text-blue-700", bg: "bg-blue-100" },
  PAST_DUE: { label: "متأخر", color: "text-red-700", bg: "bg-red-100" },
  CANCELED: { label: "ملغي", color: "text-slate-500", bg: "bg-slate-100" },
  PAUSED: { label: "موقوف", color: "text-slate-500", bg: "bg-slate-100" },
};

const REQUEST_STATUS: Record<string, { label: string; color: string; bg: string }> = {
  PENDING: { label: "قيد المراجعة", color: "text-amber-700", bg: "bg-amber-100" },
  APPROVED: { label: "مقبول", color: "text-green-700", bg: "bg-green-100" },
  REJECTED: { label: "مرفوض", color: "text-red-700", bg: "bg-red-100" },
};

type Tab = "dashboard" | "orgs" | "users" | "payments";

export function PlatformDashboard({ organizations, stats, recentOrgs, paymentRequests: initialRequests, allUsers }: {
  organizations: Org[];
  stats: Stats;
  recentOrgs: RecentOrg[];
  paymentRequests: PaymentRequest[];
  allUsers: Array<{
    id: string;
    name: string;
    email: string;
    phone: string | null;
    organization: { name: string; address: string | null };
    createdAt: Date;
  }>;
}) {
  const [tab, setTab] = useState<Tab>("dashboard");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<"createdAt" | "revenue" | "orders" | "users">("createdAt");
  const [paymentRequests, setPaymentRequests] = useState(initialRequests);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [activatingOrgId, setActivatingOrgId] = useState<string | null>(null);
  const [activatePlan, setActivatePlan] = useState("BASIC");
  const [activateMonths, setActivateMonths] = useState("1");
  const [isActivating, setIsActivating] = useState(false);
  const [detailOrg, setDetailOrg] = useState<Org | null>(null);
  const [orgs, setOrgs] = useState(organizations);
  const [suspendingId, setSuspendingId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const pendingCount = paymentRequests.filter((r) => r.status === "PENDING").length;

  const filtered = orgs
    .filter((o) => {
      const matchSearch = !search || o.name.toLowerCase().includes(search.toLowerCase()) || o.email.toLowerCase().includes(search.toLowerCase());
      const matchStatus = !statusFilter || o.subscription?.status === statusFilter;
      return matchSearch && matchStatus;
    })
    .sort((a, b) => {
      if (sortBy === "revenue") return b.revenue - a.revenue;
      if (sortBy === "orders") return b.orderCount - a.orderCount;
      if (sortBy === "users") return b._count.users - a._count.users;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

  async function handleRequest(id: string, action: "APPROVE" | "REJECT", note?: string) {
    setProcessingId(id);
    try {
      const res = await fetch("/api/platform/activate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requestId: id, action, adminNote: note }),
      });
      if (!res.ok) throw new Error();
      setPaymentRequests((prev) => prev.map((r) => r.id === id ? { ...r, status: action === "APPROVE" ? "APPROVED" : "REJECTED" } : r));
      toast.success(action === "APPROVE" ? "تم تفعيل الاشتراك!" : "تم رفض الطلب");
    } catch {
      toast.error("حدث خطأ");
    } finally {
      setProcessingId(null);
    }
  }

  async function manualActivate(orgId: string) {
    setIsActivating(true);
    try {
      const res = await fetch("/api/platform/activate", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ organizationId: orgId, status: "ACTIVE", months: parseInt(activateMonths) }),
      });
      if (!res.ok) throw new Error();
      toast.success("تم تفعيل الاشتراك!");
      setActivatingOrgId(null);
      setOrgs((prev) => prev.map((o) => o.id !== orgId ? o : { ...o, subscription: { ...o.subscription!, status: "ACTIVE" } }));
    } catch {
      toast.error("حدث خطأ");
    } finally {
      setIsActivating(false);
    }
  }

  async function toggleSuspend(org: Org) {
    const isSuspended = org.subscription?.status === "PAUSED";
    const action = isSuspended ? "UNSUSPEND" : "SUSPEND";
    setSuspendingId(org.id);
    try {
      const res = await fetch("/api/platform/org", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ organizationId: org.id, action }),
      });
      if (!res.ok) throw new Error();
      const newStatus = isSuspended ? "ACTIVE" : "PAUSED";
      toast.success(isSuspended ? "تم تفعيل الحساب" : "تم إيقاف الحساب");
      setOrgs((prev) => prev.map((o) => o.id !== org.id ? o : { ...o, subscription: { ...o.subscription!, status: newStatus } }));
      setDetailOrg((prev) => prev?.id === org.id ? { ...prev, subscription: { ...prev.subscription!, status: newStatus } } : prev);
    } catch {
      toast.error("حدث خطأ");
    } finally {
      setSuspendingId(null);
    }
  }

  async function deleteOrg(orgId: string) {
    setIsDeleting(true);
    try {
      const res = await fetch("/api/platform/org", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ organizationId: orgId }),
      });
      if (!res.ok) throw new Error();
      toast.success("تم حذف المطعم نهائياً");
      setDeleteConfirmId(null);
      setDetailOrg(null);
      setOrgs((prev) => prev.filter((o) => o.id !== orgId));
    } catch {
      toast.error("حدث خطأ أثناء الحذف");
    } finally {
      setIsDeleting(false);
    }
  }

  async function navigateAsRegularUser() {
    try {
      const res = await fetch("/api/platform/impersonate", { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "حدث خطأ في الدخول");
        return;
      }
      window.location.href = "/dashboard";
    } catch {
      toast.error("حدث خطأ في الدخول");
    }
  }

  function downloadUsersAsExcel() {
    try {
      // Create CSV content
      const headers = ["الاسم", "البريد الإلكتروني", "رقم الهاتف", "المطعم", "العنوان", "تاريخ التسجيل"];
      const rows = allUsers.map((user) => [
        user.name,
        user.email,
        user.phone || "-",
        user.organization.name,
        user.organization.address || "-",
        new Date(user.createdAt).toLocaleDateString("ar-EG"),
      ]);

      // Create CSV string
      const csvContent = [
        headers.join(","),
        ...rows.map((row) => row.map((cell) => `"${cell}"`).join(",")),
      ].join("\n");

      // Add BOM for UTF-8 encoding
      const BOM = "\uFEFF";
      const blob = new Blob([BOM + csvContent], { type: "text/csv;charset=utf-8;" });

      // Create download link
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute("download", `المستخدمون_${new Date().toLocaleDateString("ar-EG")}.csv`);
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success("تم تنزيل المستخدمين");
    } catch {
      toast.error("حدث خطأ في التنزيل");
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100" dir="rtl">
      {/* Image preview modal */}
      {previewUrl && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4" onClick={() => setPreviewUrl(null)}>
          <div className="relative max-w-2xl w-full" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setPreviewUrl(null)} className="absolute -top-10 left-0 text-white hover:text-slate-300">
              <X className="w-6 h-6" />
            </button>
            <img src={previewUrl} alt="إيصال الدفع" className="w-full rounded-xl shadow-2xl" />
          </div>
        </div>
      )}

      {/* Activate modal */}
      {activatingOrgId && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="bg-slate-800 rounded-2xl p-6 w-full max-w-sm border border-slate-700" dir="rtl">
            <h3 className="font-bold text-white text-lg mb-4">تفعيل اشتراك يدوي</h3>
            <div className="space-y-3 mb-5">
              <div>
                <label className="block text-xs text-slate-400 mb-1">الباقة</label>
                <select value={activatePlan} onChange={(e) => setActivatePlan(e.target.value)} className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm">
                  {Object.entries(PLANS).map(([k, p]) => <option key={k} value={k}>{p.name} - {p.price.toLocaleString("ar-EG")} ج.م</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">مدة الاشتراك</label>
                <select value={activateMonths} onChange={(e) => setActivateMonths(e.target.value)} className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm">
                  <option value="1">شهر واحد</option>
                  <option value="3">3 أشهر</option>
                  <option value="6">6 أشهر</option>
                  <option value="12">سنة كاملة</option>
                </select>
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setActivatingOrgId(null)} className="flex-1 px-4 py-2 rounded-lg bg-slate-700 text-slate-300 text-sm hover:bg-slate-600 transition-colors">إلغاء</button>
              <button onClick={() => manualActivate(activatingOrgId)} disabled={isActivating} className="flex-1 px-4 py-2 rounded-lg bg-blue-600 text-white text-sm hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                {isActivating && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                تفعيل
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirm modal */}
      {deleteConfirmId && (() => {
        const org = orgs.find((o) => o.id === deleteConfirmId);
        if (!org) return null;
        return (
          <div className="fixed inset-0 z-[60] bg-black/80 flex items-center justify-center p-4">
            <div className="bg-slate-900 rounded-2xl border border-red-800/50 w-full max-w-sm p-6" dir="rtl">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-red-500/10 rounded-xl flex items-center justify-center flex-shrink-0">
                  <AlertTriangle className="w-5 h-5 text-red-400" />
                </div>
                <div>
                  <h3 className="font-bold text-white">تأكيد الحذف النهائي</h3>
                  <p className="text-xs text-slate-400">هذا الإجراء لا يمكن التراجع عنه</p>
                </div>
              </div>
              <div className="bg-red-500/5 border border-red-800/30 rounded-xl px-4 py-3 mb-5">
                <p className="text-sm text-slate-300">سيتم حذف <span className="font-bold text-white">«{org.name}»</span> مع جميع بياناته:</p>
                <ul className="text-xs text-slate-400 mt-2 space-y-0.5 list-disc list-inside">
                  <li>جميع المستخدمين والفروع</li>
                  <li>جميع الطلبات والفواتير</li>
                  <li>القائمة والمخزون</li>
                  <li>بيانات الاشتراك</li>
                </ul>
              </div>
              <div className="flex gap-2">
                <button onClick={() => setDeleteConfirmId(null)} className="flex-1 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm rounded-xl transition-colors">
                  إلغاء
                </button>
                <button
                  onClick={() => deleteOrg(deleteConfirmId)}
                  disabled={isDeleting}
                  className="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                  حذف نهائياً
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Org detail modal */}
      {detailOrg && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4" onClick={() => setDetailOrg(null)}>
          <div className="bg-slate-900 rounded-2xl border border-slate-700 w-full max-w-lg" dir="rtl" onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div className="flex items-center gap-4 p-5 border-b border-slate-800">
              <div className="w-12 h-12 bg-blue-600/20 rounded-xl flex items-center justify-center flex-shrink-0">
                <Building2 className="w-6 h-6 text-blue-400" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-white text-lg leading-tight">{detailOrg.name}</h3>
                {(() => {
                  const sub = detailOrg.subscription;
                  const cfg = SUB_STATUS[sub?.status || ""] || { label: "بدون اشتراك", color: "text-slate-400", bg: "bg-slate-800" };
                  return (
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium mt-1 ${cfg.bg} ${cfg.color}`}>
                      {cfg.label}
                    </span>
                  );
                })()}
              </div>
              <button onClick={() => setDetailOrg(null)} className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors flex-shrink-0">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="p-5 space-y-3">
              <DetailRow icon={Mail} label="البريد الإلكتروني" value={detailOrg.email} mono />
              <DetailRow icon={Phone} label="رقم الهاتف" value={detailOrg.phone || "—"} />
              <DetailRow icon={MapPin} label="العنوان" value={detailOrg.address || "—"} />
              <div className="grid grid-cols-3 gap-3 pt-1">
                <StatBox label="المستخدمون" value={detailOrg._count.users} icon={Users} color="blue" />
                <StatBox label="الفروع" value={detailOrg._count.branches} icon={Store} color="purple" />
                <StatBox label="الطلبات" value={detailOrg.orderCount} icon={ShoppingCart} color="green" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <StatBox label="الإيرادات" value={formatCurrency(detailOrg.revenue)} icon={TrendingUp} color="amber" />
                <DetailRow icon={Calendar} label="تاريخ التسجيل" value={new Date(detailOrg.createdAt).toLocaleString("ar-EG", { year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit" })} inline />
              </div>
              {detailOrg.subscription?.currentPeriodEnd && (
                <DetailRow icon={Hash} label="انتهاء الاشتراك" value={new Date(detailOrg.subscription.currentPeriodEnd).toLocaleDateString("ar-EG", { year: "numeric", month: "long", day: "numeric" })} />
              )}
              {detailOrg.subscription?.trialEnd && !detailOrg.subscription.currentPeriodEnd && (
                <DetailRow icon={Clock} label="انتهاء التجربة" value={new Date(detailOrg.subscription.trialEnd).toLocaleDateString("ar-EG", { year: "numeric", month: "long", day: "numeric" })} />
              )}
            </div>

            {/* Footer */}
            <div className="px-5 pb-5 space-y-2">
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => { setDetailOrg(null); setActivatingOrgId(detailOrg.id); setActivatePlan("BASIC"); setActivateMonths("1"); }}
                  className="flex flex-col items-center gap-1 px-2 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded-lg transition-colors"
                >
                  <CheckCircle className="w-4 h-4" />
                  <span className="text-center leading-tight">تفعيل</span>
                </button>
                <button
                  onClick={() => toggleSuspend(detailOrg)}
                  disabled={suspendingId === detailOrg.id}
                  className={`flex flex-col items-center gap-1 px-2 py-2 text-xs font-medium rounded-lg transition-colors disabled:opacity-50 ${
                    detailOrg.subscription?.status === "PAUSED"
                      ? "bg-green-600 hover:bg-green-700 text-white"
                      : "bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30"
                  }`}
                >
                  {suspendingId === detailOrg.id
                    ? <Loader2 className="w-4 h-4 animate-spin" />
                    : detailOrg.subscription?.status === "PAUSED"
                      ? <PlayCircle className="w-4 h-4" />
                      : <PauseCircle className="w-4 h-4" />}
                  <span className="text-center leading-tight">{detailOrg.subscription?.status === "PAUSED" ? "تفعيل" : "إيقاف"}</span>
                </button>
                <button
                  onClick={() => { setDeleteConfirmId(detailOrg.id); }}
                  className="flex flex-col items-center gap-1 px-2 py-2 bg-red-600/10 hover:bg-red-600/20 text-red-400 border border-red-600/30 text-xs font-medium rounded-lg transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  <span className="text-center leading-tight">حذف</span>
                </button>
              </div>
              <button onClick={() => setDetailOrg(null)} className="w-full px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-400 text-sm rounded-xl transition-colors">
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sidebar */}
      <div className={`fixed right-0 top-0 h-screen bg-slate-900 border-l border-slate-800 flex flex-col z-10 transition-all duration-300 ${sidebarOpen ? 'w-64' : 'w-16'}`}>
        <div className="p-5 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center flex-shrink-0">
              <Globe className="w-5 h-5 text-white" />
            </div>
            {sidebarOpen && (
              <div>
                <p className="font-bold text-white text-sm">بسيطة</p>
                <p className="text-xs text-slate-400">Platform Admin</p>
              </div>
            )}
          </div>
        </div>

        <nav className={`flex-1 p-3 space-y-1 ${!sidebarOpen && 'px-2'}`}>
          <NavBtn icon={LayoutDashboard} label={sidebarOpen ? "لوحة التحكم" : ""} active={tab === "dashboard"} onClick={() => setTab("dashboard")} />
          <NavBtn icon={Building2} label={sidebarOpen ? "المطاعم والكافيهات" : ""} count={stats.totalOrgs} active={tab === "orgs"} onClick={() => setTab("orgs")} />
          <NavBtn icon={Users} label={sidebarOpen ? "المستخدمون" : ""} count={allUsers.length} active={tab === "users"} onClick={() => setTab("users")} />
          <NavBtn icon={CreditCard} label={sidebarOpen ? "طلبات الدفع" : ""} count={pendingCount} active={tab === "payments"} onClick={() => setTab("payments")} highlight={pendingCount > 0} />
        </nav>

        <div className={`p-3 border-t border-slate-800 space-y-2 ${!sidebarOpen && 'px-2'}`}>
          <button
            onClick={navigateAsRegularUser}
            className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-slate-300 hover:bg-slate-800 hover:text-green-400 transition-colors ${!sidebarOpen && 'justify-center px-2'}`}
          >
            <Globe className="w-4 h-4" />
            {sidebarOpen && "دخول كمستخدم عادي"}
          </button>

          {sidebarOpen && (
            <div className="flex items-center gap-3 p-2 rounded-lg">
              <div className="w-8 h-8 bg-blue-600/20 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-blue-400 text-sm font-bold">M</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-slate-200 font-medium truncate">Mark</p>
                <p className="text-xs text-slate-500 truncate">ca.markode@gmail.com</p>
              </div>
            </div>
          )}
          <form action={platformLogout}>
            <button type="submit" className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-slate-400 hover:bg-slate-800 hover:text-red-400 transition-colors ${!sidebarOpen && 'justify-center px-2'}`}>
              <LogOut className="w-4 h-4" />
              {sidebarOpen && "تسجيل الخروج"}
            </button>
          </form>
        </div>
      </div>

      {/* Main */}
      <div className={`flex flex-col min-h-screen transition-all duration-300 ${sidebarOpen ? 'mr-64' : 'mr-16'}`}>
        <header className="sticky top-0 z-10 bg-slate-950/90 backdrop-blur border-b border-slate-800 px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
            >
              {sidebarOpen ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
            </button>
            <div>
              <h1 className="text-xl font-bold text-white">
                {tab === "dashboard" ? "لوحة تحكم المنصة" : tab === "orgs" ? "إدارة المطاعم والكافيهات" : tab === "users" ? "إدارة المستخدمين" : "طلبات الدفع"}
              </h1>
              <p className="text-sm text-slate-400">إحصائيات وبيانات جميع المطاعم والكافيهات</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {pendingCount > 0 && (
              <button onClick={() => setTab("payments")} className="flex items-center gap-2 bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs px-3 py-1.5 rounded-full hover:bg-amber-500/20 transition-colors">
                <span className="w-2 h-2 bg-amber-400 rounded-full animate-pulse" />
                {pendingCount} طلب معلق
              </button>
            )}
            <button onClick={() => window.location.reload()} className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors">
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </header>

        <main className="flex-1 p-8">

          {/* ── DASHBOARD TAB ── */}
          {tab === "dashboard" && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
                <KpiCard icon={Building2} label="إجمالي المطاعم والكافيهات" value={stats.totalOrgs} color="blue" />
                <KpiCard icon={Users} label="إجمالي المستخدمين" value={stats.totalUsers} color="purple" />
                <KpiCard icon={ShoppingCart} label="إجمالي الطلبات" value={stats.totalOrders.toLocaleString("ar")} color="green" />
                <KpiCard icon={TrendingUp} label="إجمالي الإيرادات" value={formatCurrency(stats.totalRevenue)} color="amber" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
                <KpiCard icon={ShoppingCart} label="طلبات اليوم" value={stats.todayOrders} color="green" small />
                <KpiCard icon={DollarSign} label="إيرادات اليوم" value={formatCurrency(stats.todayRevenue)} color="amber" small />
                <KpiCard icon={CheckCircle} label="اشتراكات نشطة" value={stats.activeSubscriptions} color="green" small />
                <KpiCard icon={Clock} label="اشتراكات تجريبية" value={stats.trialSubscriptions} color="blue" small />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="bg-slate-900 rounded-xl border border-slate-800 p-5">
                  <h3 className="font-semibold text-slate-200 mb-4">توزيع الاشتراكات</h3>
                  <div className="space-y-3">
                    {Object.entries(SUB_STATUS).map(([status, config]) => {
                      const count = organizations.filter((o) => o.subscription?.status === status).length;
                      if (count === 0) return null;
                      const pct = Math.round((count / organizations.length) * 100);
                      return (
                        <div key={status}>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm text-slate-300">{config.label}</span>
                            <span className="text-sm font-semibold text-white">{count}</span>
                          </div>
                          <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                            <div className={`h-full rounded-full ${status === "ACTIVE" ? "bg-green-500" : status === "TRIALING" ? "bg-blue-500" : "bg-slate-500"}`} style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
                <div className="col-span-2 bg-slate-900 rounded-xl border border-slate-800 p-5">
                  <h3 className="font-semibold text-slate-200 mb-4">أحدث التسجيلات</h3>
                  <div className="space-y-3">
                    {recentOrgs.map((org, i) => (
                      <div key={org.id} className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-slate-800 rounded-lg flex items-center justify-center text-xs font-bold text-slate-400 flex-shrink-0">{i + 1}</div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-slate-200 truncate">{org.name}</p>
                          <p className="text-xs text-slate-500">{org.email}</p>
                        </div>
                        <div className="flex items-center gap-1 text-xs text-slate-500 flex-shrink-0">
                          <Calendar className="w-3 h-3" />
                          {new Date(org.createdAt).toLocaleDateString("ar-EG")}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </>
          )}

          {/* ── ORGANIZATIONS TAB ── */}
          {tab === "orgs" && (
            <div className="bg-slate-900 rounded-xl border border-slate-800">
              <div className="p-5 border-b border-slate-800 flex items-center gap-4 flex-wrap">
                <h2 className="font-bold text-white flex-1">جميع المطاعم والكافيهات ({filtered.length})</h2>
                <div className="relative">
                  <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="ابحث..." className="bg-slate-800 border border-slate-700 rounded-lg pr-9 pl-3 py-2 text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 w-48" />
                </div>
                <div className="flex gap-1.5">
                  <FilterBtn active={!statusFilter} onClick={() => setStatusFilter(null)} label="الكل" />
                  <FilterBtn active={statusFilter === "ACTIVE"} onClick={() => setStatusFilter("ACTIVE")} label="نشط" />
                  <FilterBtn active={statusFilter === "TRIALING"} onClick={() => setStatusFilter("TRIALING")} label="تجريبي" />
                  <FilterBtn active={statusFilter === "CANCELED"} onClick={() => setStatusFilter("CANCELED")} label="ملغي" />
                </div>
                <select value={sortBy} onChange={(e) => setSortBy(e.target.value as typeof sortBy)} className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none">
                  <option value="createdAt">الأحدث</option>
                  <option value="revenue">الإيرادات</option>
                  <option value="orders">الطلبات</option>
                  <option value="users">المستخدمون</option>
                </select>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-800">
                      {["المطعم", "الاشتراك", "المستخدمون", "الطلبات", "الإيرادات", "تاريخ التسجيل", "إجراءات"].map((h) => (
                        <th key={h} className="px-4 py-3 text-right text-xs font-medium text-slate-500 uppercase whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/50">
                    {filtered.map((org) => {
                      const sub = org.subscription;
                      const statusCfg = SUB_STATUS[sub?.status || ""] || { label: "بدون", color: "text-slate-500", bg: "bg-slate-800" };
                      const isExpired = sub?.status === "TRIALING" && sub.trialEnd && new Date(sub.trialEnd) < new Date();
                      return (
                        <tr key={org.id} onClick={() => setDetailOrg(org)} className="hover:bg-slate-800/40 transition-colors cursor-pointer">
                          <td className="px-4 py-3.5">
                            <div className="flex items-center gap-2.5">
                              <div className="w-8 h-8 bg-blue-600/20 rounded-lg flex items-center justify-center flex-shrink-0">
                                <Building2 className="w-4 h-4 text-blue-400" />
                              </div>
                              <div className="min-w-0">
                                <p className="font-medium text-slate-200 truncate max-w-[130px]">{org.name}</p>
                                <p className="text-xs text-slate-500 truncate max-w-[130px]">{org.email}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3.5">
                            <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${statusCfg.bg} ${statusCfg.color}`}>
                              {statusCfg.label}
                              {isExpired && <span className="text-red-400"> (منتهي)</span>}
                            </span>
                          </td>
                          <td className="px-4 py-3.5 text-slate-300 font-medium">{org._count.users}</td>
                          <td className="px-4 py-3.5 text-slate-300 font-medium">{org.orderCount.toLocaleString("ar")}</td>
                          <td className="px-4 py-3.5 font-semibold text-green-400">{formatCurrency(org.revenue)}</td>
                          <td className="px-4 py-3.5 text-slate-500 text-xs whitespace-nowrap">
                            {new Date(org.createdAt).toLocaleDateString("ar-EG", { year: "numeric", month: "short", day: "numeric" })}
                          </td>
                          <td className="px-4 py-3.5">
                            <button
                              onClick={(e) => { e.stopPropagation(); setActivatingOrgId(org.id); setActivatePlan("BASIC"); setActivateMonths("1"); }}
                              className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded-lg transition-colors whitespace-nowrap"
                            >
                              <CheckCircle className="w-3 h-3" /> تفعيل
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="px-5 py-3 border-t border-slate-800">
                <p className="text-xs text-slate-500">
                  {filtered.length} مطعم · {filtered.reduce((s, o) => s + o._count.users, 0)} مستخدم · {formatCurrency(filtered.reduce((s, o) => s + o.revenue, 0))} إيرادات
                </p>
              </div>
            </div>
          )}

          {/* ── USERS TAB ── */}
          {tab === "users" && (
            <div className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-800 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h3 className="font-semibold text-slate-200">جميع المستخدمين في النظام</h3>
                  <p className="text-sm text-slate-500">عرض بيانات المستخدمين وتنزيلها بدقة</p>
                </div>
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                  <button
                    onClick={downloadUsersAsExcel}
                    className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm transition-colors"
                  >
                    <Download className="w-4 h-4" />تنزيل المستخدمين
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-800/50">
                    <tr>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-slate-400 uppercase tracking-wider">المستخدم</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-slate-400 uppercase tracking-wider">المطعم</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-slate-400 uppercase tracking-wider">البريد الإلكتروني</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-slate-400 uppercase tracking-wider">الهاتف</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-slate-400 uppercase tracking-wider">العنوان</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-slate-400 uppercase tracking-wider">تاريخ التسجيل</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {allUsers.map((user) => (
                      <tr key={user.id} className="hover:bg-slate-800/40 transition-colors">
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 bg-purple-600/20 rounded-lg flex items-center justify-center flex-shrink-0">
                              <Users className="w-4 h-4 text-purple-400" />
                            </div>
                            <div className="min-w-0">
                              <p className="font-medium text-slate-200 truncate max-w-[130px]">{user.name}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3.5">
                          <span className="text-sm text-slate-300">{user.organization.name}</span>
                        </td>
                        <td className="px-4 py-3.5">
                          <span className="text-sm text-slate-300 font-mono">{user.email}</span>
                        </td>
                        <td className="px-4 py-3.5">
                          <span className="text-sm text-slate-300">{user.phone || "—"}</span>
                        </td>
                        <td className="px-4 py-3.5">
                          <span className="text-sm text-slate-300 truncate max-w-[150px]">{user.organization.address || "—"}</span>
                        </td>
                        <td className="px-4 py-3.5 text-slate-500 text-xs whitespace-nowrap">
                          {new Date(user.createdAt).toLocaleDateString("ar-EG", { year: "numeric", month: "short", day: "numeric" })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="px-5 py-3 border-t border-slate-800">
                <p className="text-xs text-slate-500">
                  {allUsers.length} مستخدم
                </p>
              </div>
            </div>
          )}

          {/* ── PAYMENTS TAB ── */}
          {tab === "payments" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="font-bold text-white text-lg">طلبات الدفع ({paymentRequests.length})</h2>
                <div className="flex gap-2">
                  <span className="text-xs bg-amber-500/10 border border-amber-500/30 text-amber-400 px-2.5 py-1 rounded-full">{pendingCount} معلق</span>
                </div>
              </div>

              {paymentRequests.length === 0 ? (
                <div className="bg-slate-900 rounded-xl border border-slate-800 p-16 text-center">
                  <CreditCard className="w-10 h-10 text-slate-600 mx-auto mb-3" />
                  <p className="text-slate-400">لا توجد طلبات دفع</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {paymentRequests.map((req) => {
                    const reqStatus = REQUEST_STATUS[req.status] || REQUEST_STATUS.PENDING;
                    const plan = PLANS[req.planKey];
                    const isPending = req.status === "PENDING";
                    return (
                      <div key={req.id} className={`bg-slate-900 rounded-xl border p-5 ${isPending ? "border-amber-500/30" : "border-slate-800"}`}>
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                              <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${reqStatus.bg} ${reqStatus.color}`}>
                                {reqStatus.label}
                              </span>
                              <span className="text-white font-semibold">{req.organization.name}</span>
                              <span className="text-slate-500 text-xs">{req.organization.email}</span>
                            </div>
                            <div className="flex items-center gap-4 text-sm mt-2 flex-wrap">
                              <div>
                                <span className="text-slate-500 text-xs">الباقة: </span>
                                <span className="text-slate-200 font-medium">{plan?.name || req.planKey}</span>
                              </div>
                              <div>
                                <span className="text-slate-500 text-xs">المبلغ: </span>
                                <span className="text-green-400 font-bold">{req.amount.toLocaleString("ar-EG")} ج.م</span>
                              </div>
                              <div>
                                <span className="text-slate-500 text-xs">طريقة الدفع: </span>
                                <span className="text-slate-200">{req.method === "INSTAPAY" ? "إنستاباي" : "تحويل بنكي"}</span>
                              </div>
                              <div>
                                <span className="text-slate-500 text-xs">المستخدم: </span>
                                <span className="text-slate-200">{req.userName}</span>
                              </div>
                            </div>
                            {req.adminNote && (
                              <p className="text-xs text-slate-400 mt-2 bg-slate-800 rounded-lg px-3 py-1.5">{req.adminNote}</p>
                            )}
                            <p className="text-xs text-slate-600 mt-2">
                              {new Date(req.createdAt).toLocaleString("ar-EG")}
                            </p>
                          </div>

                          <div className="flex flex-col items-end gap-2 flex-shrink-0">
                            <button
                              onClick={() => setPreviewUrl(req.receiptUrl)}
                              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-200 text-xs rounded-lg transition-colors"
                            >
                              <Eye className="w-3.5 h-3.5" /> عرض الإيصال
                            </button>
                            {isPending && (
                              <div className="flex gap-2">
                                <button
                                  disabled={processingId === req.id}
                                  onClick={() => handleRequest(req.id, "REJECT")}
                                  className="flex items-center gap-1 px-3 py-1.5 bg-red-600/20 hover:bg-red-600/30 text-red-400 text-xs rounded-lg transition-colors disabled:opacity-50"
                                >
                                  {processingId === req.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <X className="w-3 h-3" />}
                                  رفض
                                </button>
                                <button
                                  disabled={processingId === req.id}
                                  onClick={() => handleRequest(req.id, "APPROVE")}
                                  className="flex items-center gap-1 px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-xs rounded-lg transition-colors disabled:opacity-50"
                                >
                                  {processingId === req.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
                                  قبول وتفعيل
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

function KpiCard({ icon: Icon, label, value, color, small }: { icon: React.ElementType; label: string; value: string | number; color: string; small?: boolean }) {
  const colors: Record<string, string> = {
    blue: "from-blue-600/20 to-blue-600/5 border-blue-800/50 text-blue-400",
    purple: "from-purple-600/20 to-purple-600/5 border-purple-800/50 text-purple-400",
    green: "from-green-600/20 to-green-600/5 border-green-800/50 text-green-400",
    amber: "from-amber-600/20 to-amber-600/5 border-amber-800/50 text-amber-400",
  };
  return (
    <div className={`bg-gradient-to-br ${colors[color]} border rounded-xl p-${small ? "4" : "5"}`}>
      <Icon className={`w-${small ? "4" : "5"} h-${small ? "4" : "5"} mb-2`} />
      <p className={`font-bold text-white ${small ? "text-xl" : "text-3xl"} mb-0.5 truncate`}>{value}</p>
      <p className={`text-slate-400 ${small ? "text-xs" : "text-sm"}`}>{label}</p>
    </div>
  );
}

function NavBtn({ icon: Icon, label, active, onClick, count, highlight }: { icon: React.ElementType; label: string; active: boolean; onClick: () => void; count?: number; highlight?: boolean }) {
  const showLabel = label.trim() !== "";
  return (
    <button onClick={onClick} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${active ? "bg-blue-600 text-white" : "text-slate-400 hover:bg-slate-800 hover:text-slate-200"} ${!showLabel && 'justify-center px-2'}`}>
      <Icon className="w-4 h-4 flex-shrink-0" />
      {showLabel && <span className="flex-1 text-right">{label}</span>}
      {showLabel && count !== undefined && count > 0 && (
        <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${highlight ? "bg-amber-400 text-amber-900" : active ? "bg-white/20 text-white" : "bg-slate-700 text-slate-400"}`}>{count}</span>
      )}
    </button>
  );
}

function FilterBtn({ active, onClick, label }: { active: boolean; onClick: () => void; label: string }) {
  return (
    <button onClick={onClick} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${active ? "bg-blue-600 text-white" : "bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-slate-200"}`}>
      {label}
    </button>
  );
}

function DetailRow({ icon: Icon, label, value, mono, inline }: { icon: React.ElementType; label: string; value: string; mono?: boolean; inline?: boolean }) {
  if (inline) {
    return (
      <div className="flex items-center gap-2 bg-slate-800/50 rounded-xl px-4 py-3">
        <Icon className="w-4 h-4 text-slate-500 flex-shrink-0" />
        <span className="text-xs text-slate-500">{label}:</span>
        <span className="text-sm text-slate-200 flex-1">{value}</span>
      </div>
    );
  }
  return (
    <div className="bg-slate-800/50 rounded-xl px-4 py-3">
      <div className="flex items-center gap-1.5 mb-1">
        <Icon className="w-3.5 h-3.5 text-slate-500" />
        <span className="text-xs text-slate-500">{label}</span>
      </div>
      <p className={`text-sm text-slate-200 ${mono ? "font-mono" : ""}`}>{value}</p>
    </div>
  );
}

function StatBox({ label, value, icon: Icon, color }: { label: string; value: string | number; icon: React.ElementType; color: string }) {
  const colors: Record<string, string> = {
    blue: "text-blue-400 bg-blue-500/10",
    purple: "text-purple-400 bg-purple-500/10",
    green: "text-green-400 bg-green-500/10",
    amber: "text-amber-400 bg-amber-500/10",
  };
  return (
    <div className="bg-slate-800/50 rounded-xl px-4 py-3 text-center">
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center mx-auto mb-2 ${colors[color]}`}>
        <Icon className="w-4 h-4" />
      </div>
      <p className="font-bold text-white text-lg">{value}</p>
      <p className="text-xs text-slate-500 mt-0.5">{label}</p>
    </div>
  );
}
