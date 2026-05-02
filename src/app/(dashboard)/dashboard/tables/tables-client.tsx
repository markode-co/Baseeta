"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Table2, Users, ShoppingCart, Edit, Trash2, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Modal, ModalContent, ModalHeader, ModalTitle, ModalBody, ModalFooter } from "@/components/ui/modal";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatCurrency } from "@/lib/utils";
import toast from "react-hot-toast";

type OrderItem = { id: string; name: string; nameAr: string | null; quantity: number; price: number; total: number; };
type Order = { id: string; orderNumber: string; total: number; status: string; items: OrderItem[]; };
type Table = { id: string; name: string; capacity: number; section: string | null; status: string; shape: string; posX: number; posY: number; orders: Order[]; };

const STATUS_CONFIG = {
  AVAILABLE: { label: "متاحة", color: "available", bg: "bg-green-50 border-green-300", text: "text-green-700" },
  OCCUPIED: { label: "مشغولة", color: "occupied", bg: "bg-red-50 border-red-300", text: "text-red-700" },
  RESERVED: { label: "محجوزة", color: "reserved", bg: "bg-amber-50 border-amber-300", text: "text-amber-700" },
  MAINTENANCE: { label: "صيانة", color: "secondary", bg: "bg-slate-50 border-slate-300", text: "text-slate-600" },
};

const SECTIONS = ["Indoor", "Outdoor", "VIP", "Terrace"];

export function TablesClient({ tables: initialTables, branchId }: { tables: Table[]; branchId: string }) {
  const router = useRouter();
  const [tables, setTables] = useState<Table[]>(initialTables);
  const [viewMode, setViewMode] = useState<"grid" | "floor">("grid");
  const [showAddTable, setShowAddTable] = useState(false);
  const [selectedTable, setSelectedTable] = useState<Table | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [tableForm, setTableForm] = useState({ name: "", capacity: "4", section: "Indoor" });
  const [sectionFilter, setSectionFilter] = useState<string | null>(null);

  const sections = [...new Set(tables.map((t) => t.section).filter(Boolean))] as string[];

  const filtered = sectionFilter ? tables.filter((t) => t.section === sectionFilter) : tables;

  const stats = {
    total: tables.length,
    available: tables.filter((t) => t.status === "AVAILABLE").length,
    occupied: tables.filter((t) => t.status === "OCCUPIED").length,
    reserved: tables.filter((t) => t.status === "RESERVED").length,
  };

  async function addTable() {
    if (!tableForm.name) return toast.error("أدخل رقم الطاولة");
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/tables", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...tableForm, capacity: parseInt(tableForm.capacity), branchId }),
      });
      if (!res.ok) throw new Error();
      const saved = await res.json();
      setTables((prev) => [...prev, { ...saved, orders: [] }]);
      toast.success("تم إضافة الطاولة");
      setShowAddTable(false);
      setTableForm({ name: "", capacity: "4", section: "Indoor" });
    } catch {
      toast.error("فشل الإضافة");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function updateStatus(id: string, status: string) {
    try {
      await fetch(`/api/tables/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      setTables((prev) => prev.map((t) => t.id === id ? { ...t, status } : t));
      if (selectedTable?.id === id) setSelectedTable((prev) => prev ? { ...prev, status } : null);
      toast.success("تم تحديث حالة الطاولة");
    } catch {
      toast.error("فشل التحديث");
    }
  }

  return (
    <main className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden">
      <div className="bg-white border-b border-slate-200 px-3 sm:px-6 py-3 sm:py-4" dir="rtl">
        <div className="flex items-center justify-between gap-2 mb-3 sm:mb-4">
          <div>
            <h1 className="text-lg sm:text-xl font-bold text-slate-900">إدارة الطاولات</h1>
            <p className="text-xs sm:text-sm text-slate-500">{tables.length} طاولة</p>
          </div>
          <div className="flex gap-2 flex-shrink-0">
            <div className="flex bg-slate-100 rounded-lg p-1 overflow-hidden">
              <button
                onClick={() => setViewMode("grid")}
                className={`px-2 sm:px-3 py-1.5 rounded-md text-xs sm:text-sm font-medium transition-colors ${viewMode === "grid" ? "bg-white text-blue-600 shadow-sm" : "text-slate-500"}`}
              >
                شبكة
              </button>
              <button
                onClick={() => setViewMode("floor")}
                className={`px-2 sm:px-3 py-1.5 rounded-md text-xs sm:text-sm font-medium transition-colors ${viewMode === "floor" ? "bg-white text-blue-600 shadow-sm" : "text-slate-500"}`}
              >
                مخطط
              </button>
            </div>
            <Button size="sm" onClick={() => setShowAddTable(true)}>
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">طاولة جديدة</span>
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="flex gap-4">
          {[
            { label: "الإجمالي", value: stats.total, color: "text-slate-700" },
            { label: "متاحة", value: stats.available, color: "text-green-600" },
            { label: "مشغولة", value: stats.occupied, color: "text-red-600" },
            { label: "محجوزة", value: stats.reserved, color: "text-amber-600" },
          ].map((s) => (
            <div key={s.label} className="text-center">
              <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
              <p className="text-xs text-slate-400">{s.label}</p>
            </div>
          ))}
          <div className="border-r border-slate-200 mx-2" />
          <div className="flex gap-2 overflow-x-auto">
            <button
              onClick={() => setSectionFilter(null)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${!sectionFilter ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-600"}`}
            >
              الكل
            </button>
            {sections.map((s) => (
              <button
                key={s}
                onClick={() => setSectionFilter(s === sectionFilter ? null : s)}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${sectionFilter === s ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-600"}`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="p-3 sm:p-4 md:p-6" dir="rtl">
        {viewMode === "grid" ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2 sm:gap-4">
            {filtered.map((table) => {
              const config = STATUS_CONFIG[table.status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.AVAILABLE;
              const activeOrder = table.orders[0];
              return (
                <button
                  key={table.id}
                  onClick={() => setSelectedTable(table)}
                  className={`relative p-4 rounded-xl border-2 transition-all hover:shadow-md hover:-translate-y-0.5 text-right ${config.bg}`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <Table2 className={`w-6 h-6 ${config.text}`} />
                    <Badge variant={config.color as Parameters<typeof Badge>[0]["variant"]} className="text-xs">
                      {config.label}
                    </Badge>
                  </div>
                  <p className={`text-xl font-bold ${config.text}`}>{table.name}</p>
                  <p className="text-xs text-slate-500 mt-1">
                    <Users className="w-3 h-3 inline ml-0.5" /> {table.capacity} أشخاص
                  </p>
                  {table.section && <p className="text-xs text-slate-400">{table.section}</p>}
                  {activeOrder && (
                    <div className="mt-2 pt-2 border-t border-current/20">
                      <p className="text-xs font-medium text-slate-700">
                        <ShoppingCart className="w-3 h-3 inline ml-0.5" />
                        {formatCurrency(activeOrder.total)}
                      </p>
                      <p className="text-xs text-slate-500">{activeOrder.items.length} أصناف</p>
                    </div>
                  )}
                </button>
              );
            })}
            <button
              onClick={() => setShowAddTable(true)}
              className="border-2 border-dashed border-slate-300 rounded-xl p-4 flex flex-col items-center justify-center gap-2 text-slate-400 hover:border-blue-400 hover:text-blue-500 hover:bg-blue-50 transition-all"
            >
              <Plus className="w-6 h-6" />
              <span className="text-xs">إضافة</span>
            </button>
          </div>
        ) : (
          // Floor plan view
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden" style={{ height: "600px" }}>
            <div className="relative w-full h-full bg-slate-50">
              {/* Grid pattern */}
              <div className="absolute inset-0" style={{
                backgroundImage: "radial-gradient(circle, #e2e8f0 1px, transparent 1px)",
                backgroundSize: "24px 24px",
              }} />
              {filtered.map((table) => {
                const config = STATUS_CONFIG[table.status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.AVAILABLE;
                return (
                  <button
                    key={table.id}
                    onClick={() => setSelectedTable(table)}
                    className={`absolute w-20 h-20 rounded-xl border-2 flex flex-col items-center justify-center transition-all hover:shadow-lg hover:scale-105 ${config.bg}`}
                    style={{ right: table.posX, top: table.posY }}
                  >
                    <span className={`text-sm font-bold ${config.text}`}>{table.name}</span>
                    <span className="text-xs text-slate-500">{table.capacity}p</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Table Detail Modal */}
      <Modal open={!!selectedTable} onOpenChange={() => setSelectedTable(null)}>
        <ModalContent size="sm">
          <ModalHeader>
            <ModalTitle>طاولة {selectedTable?.name}</ModalTitle>
          </ModalHeader>
          <ModalBody dir="rtl">
            {selectedTable && (
              <div className="space-y-4">
                <div className="flex items-center gap-3 flex-wrap">
                  <Badge variant={STATUS_CONFIG[selectedTable.status as keyof typeof STATUS_CONFIG]?.color as Parameters<typeof Badge>[0]["variant"]}>
                    {STATUS_CONFIG[selectedTable.status as keyof typeof STATUS_CONFIG]?.label}
                  </Badge>
                  <span className="text-sm text-slate-500"><Users className="w-3.5 h-3.5 inline ml-1" />{selectedTable.capacity} أشخاص</span>
                  {selectedTable.section && <span className="text-sm text-slate-500">{selectedTable.section}</span>}
                </div>

                {selectedTable.orders[0] && (
                  <div className="bg-slate-50 rounded-lg p-3">
                    <p className="text-sm font-semibold text-slate-800 mb-2">الطلب الحالي</p>
                    {selectedTable.orders[0].items.slice(0, 4).map((item) => (
                      <div key={item.id} className="flex justify-between text-xs text-slate-600 py-1">
                        <span>{item.nameAr || item.name} × {item.quantity}</span>
                        <span>{formatCurrency(item.total)}</span>
                      </div>
                    ))}
                    <div className="flex justify-between font-bold text-sm pt-2 border-t border-slate-200 mt-1">
                      <span>الإجمالي</span>
                      <span className="text-blue-600">{formatCurrency(selectedTable.orders[0].total)}</span>
                    </div>
                  </div>
                )}

                <div>
                  <p className="text-sm font-medium text-slate-700 mb-2">تغيير الحالة</p>
                  <div className="grid grid-cols-2 gap-2">
                    {Object.entries(STATUS_CONFIG).map(([status, config]) => (
                      <button
                        key={status}
                        onClick={() => updateStatus(selectedTable.id, status)}
                        className={`p-2 rounded-lg border-2 text-sm font-medium transition-colors ${
                          selectedTable.status === status
                            ? `${config.bg} ${config.text}`
                            : "border-slate-200 text-slate-600 hover:border-slate-300"
                        }`}
                      >
                        {config.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </ModalBody>
        </ModalContent>
      </Modal>

      {/* Add Table Modal */}
      <Modal open={showAddTable} onOpenChange={setShowAddTable}>
        <ModalContent size="sm">
          <ModalHeader>
            <ModalTitle>إضافة طاولة</ModalTitle>
          </ModalHeader>
          <ModalBody dir="rtl" className="space-y-4">
            <Input label="رقم / اسم الطاولة" value={tableForm.name} onChange={(e) => setTableForm({ ...tableForm, name: e.target.value })} placeholder="T1, طاولة VIP..." required />
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">السعة</label>
              <Select value={tableForm.capacity} onValueChange={(v) => setTableForm({ ...tableForm, capacity: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {[1,2,4,6,8,10,12].map((n) => <SelectItem key={n} value={String(n)}>{n} أشخاص</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">القسم</label>
              <Select value={tableForm.section} onValueChange={(v) => setTableForm({ ...tableForm, section: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {SECTIONS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </ModalBody>
          <ModalFooter>
            <Button variant="outline" onClick={() => setShowAddTable(false)}>إلغاء</Button>
            <Button onClick={addTable} loading={isSubmitting}>إضافة</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </main>
  );
}
