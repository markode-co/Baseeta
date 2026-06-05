"use client";

import { useMemo, useState } from "react";
import {
  Banknote,
  CalendarDays,
  Download,
  Edit,
  FileText,
  Plus,
  Receipt,
  Search,
  Trash2,
  TrendingDown,
  Upload,
  Wallet,
  X,
} from "lucide-react";
import { Topbar } from "@/components/layout/topbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Modal, ModalBody, ModalContent, ModalFooter, ModalHeader, ModalTitle } from "@/components/ui/modal";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatCurrency, formatDate } from "@/lib/utils";
import toast from "react-hot-toast";

type Branch = { id: string; name: string; nameAr: string | null };
type Expense = {
  id: string;
  branchId: string | null;
  userId: string;
  title: string;
  category: string;
  amount: number;
  paymentMethod: string;
  vendor: string | null;
  notes: string | null;
  receiptUrl: string | null;
  expenseDate: Date;
  createdAt: Date;
  updatedAt: Date;
  branch: Branch | null;
  user: { id: string; name: string };
};

const CATEGORIES = [
  { value: "INGREDIENTS", label: "خامات ومشتريات" },
  { value: "SALARIES", label: "رواتب وسلف" },
  { value: "RENT", label: "إيجار" },
  { value: "UTILITIES", label: "كهرباء ومياه وغاز" },
  { value: "MAINTENANCE", label: "صيانة" },
  { value: "DELIVERY", label: "توصيل وشحن" },
  { value: "MARKETING", label: "تسويق" },
  { value: "SUPPLIES", label: "أدوات تشغيل" },
  { value: "OTHER", label: "أخرى" },
];

const PAYMENT_METHODS = [
  { value: "CASH", label: "نقدي" },
  { value: "CARD", label: "بطاقة" },
  { value: "BANK_TRANSFER", label: "تحويل بنكي" },
  { value: "WALLET", label: "محفظة" },
];

const FILTERS = [
  { value: "all", label: "كل الفترات" },
  { value: "today", label: "اليوم" },
  { value: "week", label: "هذا الأسبوع" },
  { value: "month", label: "هذا الشهر" },
];

function categoryLabel(value: string) {
  return CATEGORIES.find((item) => item.value === value)?.label || value;
}

function paymentLabel(value: string) {
  return PAYMENT_METHODS.find((item) => item.value === value)?.label || value;
}

function toDateInput(date: Date | string) {
  const d = new Date(date);
  return Number.isNaN(d.getTime()) ? "" : d.toISOString().slice(0, 10);
}

function inPeriod(date: Date | string, period: string) {
  if (period === "all") return true;
  const d = new Date(date);
  const now = new Date();
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);

  if (period === "today") return d >= start;
  if (period === "week") {
    const day = start.getDay();
    const diff = day === 0 ? 6 : day - 1;
    start.setDate(start.getDate() - diff);
    return d >= start;
  }
  if (period === "month") {
    start.setDate(1);
    return d >= start;
  }
  return true;
}

const emptyForm = {
  title: "",
  category: "INGREDIENTS",
  amount: "",
  paymentMethod: "CASH",
  branchId: "",
  vendor: "",
  notes: "",
  receiptUrl: "",
  expenseDate: toDateInput(new Date()),
};

export function ExpensesClient({
  expenses: initialExpenses,
  branches,
  defaultBranchId,
  canChooseBranch,
}: {
  expenses: Expense[];
  branches: Branch[];
  defaultBranchId: string;
  canChooseBranch: boolean;
}) {
  const [expenses, setExpenses] = useState<Expense[]>(initialExpenses);
  const [query, setQuery] = useState("");
  const [period, setPeriod] = useState("month");
  const [category, setCategory] = useState("all");
  const [branch, setBranch] = useState(defaultBranchId || "all");
  const [showForm, setShowForm] = useState(false);
  const [editExpense, setEditExpense] = useState<Expense | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [form, setForm] = useState({ ...emptyForm, branchId: defaultBranchId });

  const filtered = useMemo(() => {
    const text = query.trim().toLowerCase();
    return expenses.filter((expense) => {
      const matchesText =
        !text ||
        expense.title.toLowerCase().includes(text) ||
        (expense.vendor || "").toLowerCase().includes(text) ||
        (expense.notes || "").toLowerCase().includes(text);
      const matchesPeriod = inPeriod(expense.expenseDate, period);
      const matchesCategory = category === "all" || expense.category === category;
      const matchesBranch = branch === "all" || expense.branchId === branch;
      return matchesText && matchesPeriod && matchesCategory && matchesBranch;
    });
  }, [branch, category, expenses, period, query]);

  const monthExpenses = expenses.filter((expense) => inPeriod(expense.expenseDate, "month"));
  const todayExpenses = expenses.filter((expense) => inPeriod(expense.expenseDate, "today"));
  const totalFiltered = filtered.reduce((sum, expense) => sum + expense.amount, 0);
  const totalMonth = monthExpenses.reduce((sum, expense) => sum + expense.amount, 0);
  const totalToday = todayExpenses.reduce((sum, expense) => sum + expense.amount, 0);
  const averageExpense = filtered.length ? totalFiltered / filtered.length : 0;
  const topCategory = CATEGORIES.map((cat) => ({
    ...cat,
    amount: monthExpenses
      .filter((expense) => expense.category === cat.value)
      .reduce((sum, expense) => sum + expense.amount, 0),
  })).sort((a, b) => b.amount - a.amount)[0];

  function openAdd() {
    setEditExpense(null);
    setForm({ ...emptyForm, branchId: defaultBranchId });
    setShowForm(true);
  }

  function openEdit(expense: Expense) {
    setEditExpense(expense);
    setForm({
      title: expense.title,
      category: expense.category,
      amount: String(expense.amount),
      paymentMethod: expense.paymentMethod,
      branchId: expense.branchId || "",
      vendor: expense.vendor || "",
      notes: expense.notes || "",
      receiptUrl: expense.receiptUrl || "",
      expenseDate: toDateInput(expense.expenseDate),
    });
    setShowForm(true);
  }

  async function uploadReceipt(file: File) {
    if (file.size > 4 * 1024 * 1024) {
      toast.error("الملف كبير جداً (الحد 4 ميجا)");
      return;
    }

    setIsUploading(true);
    try {
      const data = new FormData();
      data.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: data });
      if (!res.ok) {
        const { error } = await res.json().catch(() => ({ error: null }));
        throw new Error(error ?? "فشل رفع الإيصال");
      }
      const { url } = await res.json();
      setForm((prev) => ({ ...prev, receiptUrl: url }));
      toast.success("تم رفع الإيصال");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "فشل رفع الإيصال");
    } finally {
      setIsUploading(false);
    }
  }

  async function saveExpense() {
    if (!form.title.trim() || !form.amount || Number(form.amount) <= 0) {
      toast.error("أدخل اسم المصروف والمبلغ");
      return;
    }

    setIsSubmitting(true);
    try {
      const url = editExpense ? `/api/expenses/${editExpense.id}` : "/api/expenses";
      const res = await fetch(url, {
        method: editExpense ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          branchId: form.branchId || null,
          amount: Number(form.amount),
        }),
      });
      if (!res.ok) {
        const { error } = await res.json().catch(() => ({ error: null }));
        throw new Error(error ?? "حدث خطأ");
      }
      const saved = await res.json();
      setExpenses((prev) => editExpense ? prev.map((item) => item.id === saved.id ? saved : item) : [saved, ...prev]);
      toast.success(editExpense ? "تم تحديث المصروف" : "تم تسجيل المصروف");
      setShowForm(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "حدث خطأ");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function deleteExpense(id: string) {
    if (!confirm("هل تريد حذف هذا المصروف؟")) return;
    try {
      const res = await fetch(`/api/expenses/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      setExpenses((prev) => prev.filter((expense) => expense.id !== id));
      toast.success("تم حذف المصروف");
    } catch {
      toast.error("فشل حذف المصروف");
    }
  }

  function exportCsv() {
    const rows = [
      ["التاريخ", "المصروف", "التصنيف", "المبلغ", "طريقة الدفع", "الفرع", "المورد", "الملاحظات"],
      ...filtered.map((expense) => [
        toDateInput(expense.expenseDate),
        expense.title,
        categoryLabel(expense.category),
        String(expense.amount),
        paymentLabel(expense.paymentMethod),
        expense.branch?.nameAr || expense.branch?.name || "",
        expense.vendor || "",
        expense.notes || "",
      ]),
    ];
    const csv = rows.map((row) => row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `expenses-${toDateInput(new Date())}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <main className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden">
      <Topbar
        title="المصروفات"
        subtitle="تسجيل ومتابعة مصروفات التشغيل اليومية"
        actions={
          <>
            <Button variant="outline" size="sm" onClick={exportCsv}>
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">تصدير</span>
            </Button>
            <Button size="sm" onClick={openAdd}>
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">مصروف جديد</span>
              <span className="sm:hidden">إضافة</span>
            </Button>
          </>
        }
      />

      <div className="p-3 sm:p-4 md:p-6" dir="rtl">
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-2 sm:gap-4 mb-4 sm:mb-6">
          <Card>
            <CardContent className="p-3 sm:p-4 flex items-center gap-3">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-red-50 flex items-center justify-center flex-shrink-0">
                <TrendingDown className="w-5 h-5 text-red-600" />
              </div>
              <div className="min-w-0">
                <p className="text-sm sm:text-xl font-bold text-slate-900 truncate">{formatCurrency(totalMonth)}</p>
                <p className="text-xs text-slate-500 truncate">مصروفات الشهر</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 sm:p-4 flex items-center gap-3">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0">
                <CalendarDays className="w-5 h-5 text-blue-600" />
              </div>
              <div className="min-w-0">
                <p className="text-sm sm:text-xl font-bold text-slate-900 truncate">{formatCurrency(totalToday)}</p>
                <p className="text-xs text-slate-500 truncate">مصروفات اليوم</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 sm:p-4 flex items-center gap-3">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-emerald-50 flex items-center justify-center flex-shrink-0">
                <Receipt className="w-5 h-5 text-emerald-600" />
              </div>
              <div className="min-w-0">
                <p className="text-sm sm:text-xl font-bold text-slate-900 truncate">{formatCurrency(averageExpense)}</p>
                <p className="text-xs text-slate-500 truncate">متوسط المصروف</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 sm:p-4 flex items-center gap-3">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-amber-50 flex items-center justify-center flex-shrink-0">
                <Wallet className="w-5 h-5 text-amber-600" />
              </div>
              <div className="min-w-0">
                <p className="text-sm sm:text-xl font-bold text-slate-900 truncate">{topCategory?.amount ? topCategory.label : "لا يوجد"}</p>
                <p className="text-xs text-slate-500 truncate">أعلى تصنيف هذا الشهر</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6 flex-wrap">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="ابحث باسم المصروف أو المورد..."
              className="w-full rounded-lg border border-slate-200 bg-white pr-9 pl-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-[145px]"><SelectValue /></SelectTrigger>
            <SelectContent>{FILTERS.map((item) => <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>)}</SelectContent>
          </Select>
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger className="w-[170px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">كل التصنيفات</SelectItem>
              {CATEGORIES.map((item) => <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>)}
            </SelectContent>
          </Select>
          {canChooseBranch && (
            <Select value={branch} onValueChange={setBranch}>
              <SelectTrigger className="w-[155px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">كل الفروع</SelectItem>
                {branches.map((item) => <SelectItem key={item.id} value={item.id}>{item.nameAr || item.name}</SelectItem>)}
              </SelectContent>
            </Select>
          )}
        </div>

        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100">
                  {["المصروف", "التصنيف", "المبلغ", "طريقة الدفع", "الفرع", "التاريخ", "الإيصال", "إجراءات"].map((h) => (
                    <th key={h} className="px-4 py-3 text-right text-xs font-semibold text-slate-500">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-12 text-slate-400">
                      <Receipt className="w-10 h-10 mx-auto mb-2 opacity-30" />
                      <p>لا توجد مصروفات مطابقة</p>
                    </td>
                  </tr>
                ) : filtered.map((expense) => (
                  <tr key={expense.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 min-w-[220px]">
                      <p className="font-semibold text-slate-900">{expense.title}</p>
                      <div className="flex items-center gap-2 mt-1 text-xs text-slate-400">
                        <span>{expense.vendor || "بدون مورد"}</span>
                        <span>•</span>
                        <span>{expense.user.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3"><Badge variant="secondary">{categoryLabel(expense.category)}</Badge></td>
                    <td className="px-4 py-3 font-bold text-red-600 whitespace-nowrap">{formatCurrency(expense.amount)}</td>
                    <td className="px-4 py-3 text-slate-600 whitespace-nowrap">{paymentLabel(expense.paymentMethod)}</td>
                    <td className="px-4 py-3 text-slate-600 whitespace-nowrap">{expense.branch?.nameAr || expense.branch?.name || "عام"}</td>
                    <td className="px-4 py-3 text-slate-600 whitespace-nowrap">{formatDate(expense.expenseDate)}</td>
                    <td className="px-4 py-3">
                      {expense.receiptUrl ? (
                        <a href={expense.receiptUrl} target="_blank" className="inline-flex items-center gap-1 text-blue-600 hover:underline" rel="noreferrer">
                          <FileText className="w-4 h-4" /> عرض
                        </a>
                      ) : <span className="text-slate-300">-</span>}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1.5">
                        <Button variant="outline" size="icon-sm" onClick={() => openEdit(expense)}>
                          <Edit className="w-3.5 h-3.5" />
                        </Button>
                        <Button variant="destructive" size="icon-sm" onClick={() => deleteExpense(expense.id)}>
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="border-t border-slate-100 px-4 py-3 flex items-center justify-between gap-3 text-sm">
            <span className="text-slate-500">{filtered.length} مصروف</span>
            <span className="font-bold text-slate-900">الإجمالي: {formatCurrency(totalFiltered)}</span>
          </div>
        </Card>
      </div>

      <Modal open={showForm} onOpenChange={setShowForm}>
        <ModalContent size="lg">
          <ModalHeader>
            <ModalTitle>{editExpense ? "تعديل المصروف" : "تسجيل مصروف جديد"}</ModalTitle>
          </ModalHeader>
          <ModalBody dir="rtl">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input label="اسم المصروف" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="شراء خامات للمطبخ" required />
              <Input label="المبلغ" type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} placeholder="0.00" required />
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">التصنيف</label>
                <Select value={form.category} onValueChange={(value) => setForm({ ...form, category: value })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{CATEGORIES.map((item) => <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">طريقة الدفع</label>
                <Select value={form.paymentMethod} onValueChange={(value) => setForm({ ...form, paymentMethod: value })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{PAYMENT_METHODS.map((item) => <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              {canChooseBranch && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">الفرع</label>
                  <Select value={form.branchId || "none"} onValueChange={(value) => setForm({ ...form, branchId: value === "none" ? "" : value })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">مصروف عام</SelectItem>
                      {branches.map((item) => <SelectItem key={item.id} value={item.id}>{item.nameAr || item.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              )}
              <Input label="التاريخ" type="date" value={form.expenseDate} onChange={(e) => setForm({ ...form, expenseDate: e.target.value })} />
              <Input label="المورد / الجهة" value={form.vendor} onChange={(e) => setForm({ ...form, vendor: e.target.value })} placeholder="اسم المورد" />
              <div className="sm:col-span-2">
                <Input label="ملاحظات" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="تفاصيل إضافية..." />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-1.5">الإيصال</label>
                <div className="flex items-center gap-3">
                  <label className="cursor-pointer inline-flex">
                    <div className={`flex items-center gap-2 px-4 py-2.5 border-2 border-dashed rounded-lg text-sm transition-colors ${isUploading ? "border-blue-300 bg-blue-50 text-blue-600" : "border-slate-300 text-slate-600 hover:border-blue-400 hover:bg-blue-50 hover:text-blue-600"}`}>
                      <Upload className="w-4 h-4" />
                      {isUploading ? "جاري الرفع..." : "رفع إيصال"}
                    </div>
                    <input type="file" accept="image/*,application/pdf" className="hidden" disabled={isUploading} onChange={(e) => e.target.files?.[0] && uploadReceipt(e.target.files[0])} />
                  </label>
                  {form.receiptUrl && (
                    <div className="flex items-center gap-2 text-sm">
                      <a href={form.receiptUrl} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">عرض الإيصال</a>
                      <button onClick={() => setForm((prev) => ({ ...prev, receiptUrl: "" }))} className="text-red-500 hover:text-red-700">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </ModalBody>
          <ModalFooter>
            <Button variant="outline" onClick={() => setShowForm(false)}>إلغاء</Button>
            <Button onClick={saveExpense} loading={isSubmitting}>
              <Banknote className="w-4 h-4" />
              {editExpense ? "حفظ التعديلات" : "تسجيل المصروف"}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </main>
  );
}
