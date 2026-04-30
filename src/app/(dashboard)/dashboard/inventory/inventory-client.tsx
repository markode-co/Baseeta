"use client";
import { useState } from "react";
import { Plus, Search, AlertTriangle, Package, TrendingDown, TrendingUp, Edit, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Modal, ModalContent, ModalHeader, ModalTitle, ModalBody, ModalFooter } from "@/components/ui/modal";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Topbar } from "@/components/layout/topbar";
import { formatCurrency } from "@/lib/utils";
import toast from "react-hot-toast";

type Transaction = { id: string; type: string; quantity: number; notes: string | null; createdAt: Date; };
type InventoryItem = { id: string; name: string; nameAr: string | null; unit: string; quantity: number; minQuantity: number; costPerUnit: number; isActive: boolean; transactions: Transaction[]; };

const UNITS = ["kg", "g", "liter", "ml", "piece", "box", "bag", "can"];
const UNIT_LABELS: Record<string, string> = {
  kg: "كيلو", g: "جرام", liter: "لتر", ml: "مل", piece: "قطعة", box: "صندوق", bag: "كيس", can: "علبة",
};

export function InventoryClient({ items: initialItems, branchId }: { items: InventoryItem[]; branchId: string }) {
  const [items, setItems] = useState<InventoryItem[]>(initialItems);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterLow, setFilterLow] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [showAdjust, setShowAdjust] = useState<InventoryItem | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [form, setForm] = useState({ name: "", nameAr: "", unit: "kg", quantity: "", minQuantity: "", costPerUnit: "" });
  const [adjustForm, setAdjustForm] = useState({ type: "ADD", quantity: "", notes: "" });

  const filtered = items.filter((item) => {
    const matchSearch = !searchQuery || item.name.toLowerCase().includes(searchQuery.toLowerCase()) || (item.nameAr?.toLowerCase() || "").includes(searchQuery.toLowerCase());
    const matchLow = !filterLow || item.quantity <= item.minQuantity;
    return matchSearch && matchLow;
  });

  const lowStockCount = items.filter((i) => i.quantity <= i.minQuantity).length;
  const totalValue = items.reduce((sum, i) => sum + i.quantity * i.costPerUnit, 0);

  async function saveItem() {
    if (!form.name) return toast.error("أدخل اسم المادة");
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/inventory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          branchId,
          quantity: parseFloat(form.quantity) || 0,
          minQuantity: parseFloat(form.minQuantity) || 0,
          costPerUnit: parseFloat(form.costPerUnit) || 0,
        }),
      });
      if (!res.ok) throw new Error();
      const saved = await res.json();
      setItems((prev) => [...prev, { ...saved, transactions: [] }]);
      toast.success("تم إضافة المادة");
      setShowAdd(false);
      setForm({ name: "", nameAr: "", unit: "kg", quantity: "", minQuantity: "", costPerUnit: "" });
    } catch {
      toast.error("حدث خطأ");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function adjustStock() {
    if (!showAdjust || !adjustForm.quantity) return;
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/inventory/${showAdjust.id}/adjust`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: adjustForm.type,
          quantity: parseFloat(adjustForm.quantity),
          notes: adjustForm.notes,
        }),
      });
      if (!res.ok) throw new Error();
      const updated = await res.json();
      setItems((prev) => prev.map((i) => i.id === showAdjust.id ? { ...i, quantity: updated.quantity } : i));
      toast.success("تم تحديث المخزون");
      setShowAdjust(null);
      setAdjustForm({ type: "ADD", quantity: "", notes: "" });
    } catch {
      toast.error("فشل التحديث");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="flex-1 overflow-auto">
      <Topbar title="إدارة المخزون" subtitle="تتبع المواد والمستلزمات" />

      <div className="p-6" dir="rtl">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
                <Package className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">{items.length}</p>
                <p className="text-sm text-slate-500">إجمالي المواد</p>
              </div>
            </CardContent>
          </Card>
          <Card className={lowStockCount > 0 ? "border-red-200" : ""}>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-red-600">{lowStockCount}</p>
                <p className="text-sm text-slate-500">مخزون منخفض</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">{formatCurrency(totalValue)}</p>
                <p className="text-sm text-slate-500">قيمة المخزون</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters + Add */}
        <div className="flex items-center gap-3 mb-6">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ابحث..."
              className="w-full rounded-lg border border-slate-200 bg-white pr-9 pl-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button
            onClick={() => setFilterLow(!filterLow)}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-medium transition-colors ${filterLow ? "border-red-300 bg-red-50 text-red-600" : "border-slate-200 text-slate-600 hover:bg-slate-50"}`}
          >
            <AlertTriangle className="w-4 h-4" />
            منخفض فقط
            {lowStockCount > 0 && (
              <span className="w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">{lowStockCount}</span>
            )}
          </button>
          <Button size="sm" onClick={() => setShowAdd(true)}>
            <Plus className="w-4 h-4" /> إضافة مادة
          </Button>
        </div>

        {/* Inventory Table */}
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100">
                  {["المادة", "الوحدة", "الكمية المتاحة", "الحد الأدنى", "التكلفة/الوحدة", "القيمة الإجمالية", "الحالة", "إجراءات"].map((h) => (
                    <th key={h} className="px-4 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-12 text-slate-400">
                      <Package className="w-10 h-10 mx-auto mb-2 opacity-30" />
                      <p>لا توجد مواد</p>
                    </td>
                  </tr>
                ) : (
                  filtered.map((item) => {
                    const isLow = item.quantity <= item.minQuantity;
                    return (
                      <tr key={item.id} className={`hover:bg-slate-50 ${isLow ? "bg-red-50/50" : ""}`}>
                        <td className="px-4 py-3">
                          <p className="font-medium text-slate-800">{item.nameAr || item.name}</p>
                          {item.nameAr && <p className="text-xs text-slate-400">{item.name}</p>}
                        </td>
                        <td className="px-4 py-3 text-slate-600">{UNIT_LABELS[item.unit] || item.unit}</td>
                        <td className="px-4 py-3">
                          <span className={`font-bold ${isLow ? "text-red-600" : "text-slate-800"}`}>
                            {item.quantity}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-slate-500">{item.minQuantity}</td>
                        <td className="px-4 py-3 text-slate-600">{formatCurrency(item.costPerUnit)}</td>
                        <td className="px-4 py-3 font-medium text-slate-800">{formatCurrency(item.quantity * item.costPerUnit)}</td>
                        <td className="px-4 py-3">
                          {isLow ? (
                            <Badge variant="danger"><AlertTriangle className="w-3 h-3" /> منخفض</Badge>
                          ) : (
                            <Badge variant="success">كافٍ</Badge>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex gap-1.5">
                            <Button variant="outline" size="icon-sm" onClick={() => setShowAdjust(item)}>
                              <TrendingUp className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      {/* Add Item Modal */}
      <Modal open={showAdd} onOpenChange={setShowAdd}>
        <ModalContent size="md">
          <ModalHeader><ModalTitle>إضافة مادة مخزون</ModalTitle></ModalHeader>
          <ModalBody dir="rtl">
            <div className="grid grid-cols-2 gap-4">
              <Input label="الاسم (عربي)" value={form.nameAr} onChange={(e) => setForm({ ...form, nameAr: e.target.value })} placeholder="طماطم" required />
              <Input label="الاسم (إنجليزي)" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Tomatoes" required />
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">وحدة القياس</label>
                <Select value={form.unit} onValueChange={(v) => setForm({ ...form, unit: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {UNITS.map((u) => <SelectItem key={u} value={u}>{UNIT_LABELS[u] || u}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <Input label="الكمية الحالية" type="number" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} placeholder="0" />
              <Input label="الحد الأدنى للتنبيه" type="number" value={form.minQuantity} onChange={(e) => setForm({ ...form, minQuantity: e.target.value })} placeholder="0" />
              <Input label="تكلفة الوحدة (ر.س)" type="number" value={form.costPerUnit} onChange={(e) => setForm({ ...form, costPerUnit: e.target.value })} placeholder="0.00" />
            </div>
          </ModalBody>
          <ModalFooter>
            <Button variant="outline" onClick={() => setShowAdd(false)}>إلغاء</Button>
            <Button onClick={saveItem} loading={isSubmitting}>إضافة</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Adjust Stock Modal */}
      <Modal open={!!showAdjust} onOpenChange={() => setShowAdjust(null)}>
        <ModalContent size="sm">
          <ModalHeader>
            <ModalTitle>تعديل المخزون - {showAdjust?.nameAr || showAdjust?.name}</ModalTitle>
          </ModalHeader>
          <ModalBody dir="rtl" className="space-y-4">
            <div className="bg-slate-50 rounded-lg p-3 text-sm">
              <span className="text-slate-500">الكمية الحالية: </span>
              <span className="font-bold text-slate-800">{showAdjust?.quantity} {UNIT_LABELS[showAdjust?.unit || ""] || showAdjust?.unit}</span>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">نوع العملية</label>
              <Select value={adjustForm.type} onValueChange={(v) => setAdjustForm({ ...adjustForm, type: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ADD"><TrendingUp className="w-4 h-4 inline ml-2 text-green-500" />إضافة</SelectItem>
                  <SelectItem value="REMOVE"><TrendingDown className="w-4 h-4 inline ml-2 text-red-500" />خصم</SelectItem>
                  <SelectItem value="SET">تحديد قيمة</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Input label="الكمية" type="number" value={adjustForm.quantity} onChange={(e) => setAdjustForm({ ...adjustForm, quantity: e.target.value })} placeholder="0" />
            <Input label="ملاحظة" value={adjustForm.notes} onChange={(e) => setAdjustForm({ ...adjustForm, notes: e.target.value })} placeholder="توريد جديد..." />
          </ModalBody>
          <ModalFooter>
            <Button variant="outline" onClick={() => setShowAdjust(null)}>إلغاء</Button>
            <Button onClick={adjustStock} loading={isSubmitting}>تحديث</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </main>
  );
}
