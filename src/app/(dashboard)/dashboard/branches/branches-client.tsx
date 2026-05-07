"use client";
import { useState } from "react";
import { Plus, Store, Users, Table2, ShoppingCart, MapPin, Phone, Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Modal, ModalContent, ModalHeader, ModalTitle, ModalBody, ModalFooter } from "@/components/ui/modal";
import { Topbar } from "@/components/layout/topbar";
import toast from "react-hot-toast";

type Branch = {
  id: string; name: string; nameAr: string | null; address: string | null; phone: string | null;
  isActive: boolean; openTime: string | null; closeTime: string | null;
  _count: { users: number; tables: number; orders: number };
};

export function BranchesClient({ branches: initialBranches, organizationId, currentEmail }: {
  branches: Branch[];
  organizationId: string;
  currentEmail?: string;
}) {
  const [branches, setBranches] = useState<Branch[]>(initialBranches);
  const [showAdd, setShowAdd] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: "", nameAr: "", address: "", phone: "", openTime: "08:00", closeTime: "23:00",
  });

  async function saveBranch() {
    if (!form.name) return toast.error("أدخل اسم الفرع");
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/branches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, organizationId }),
      });
      if (!res.ok) throw new Error();
      const saved = await res.json();
      setBranches((prev) => [...prev, { ...saved, _count: { users: 0, tables: 0, orders: 0 } }]);
      toast.success("تم إضافة الفرع");
      setShowAdd(false);
      setForm({ name: "", nameAr: "", address: "", phone: "", openTime: "08:00", closeTime: "23:00" });
    } catch {
      toast.error("فشل الإضافة");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function toggleBranch(id: string, current: boolean) {
    try {
      await fetch(`/api/branches/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !current }),
      });
      setBranches((prev) => prev.map((b) => b.id === id ? { ...b, isActive: !current } : b));
    } catch {
      toast.error("فشل التحديث");
    }
  }

  async function deleteBranch(id: string) {
    if (!confirm("هل أنت متأكد من حذف هذا الفرع؟")) return;
    setDeletingId(id);
    try {
      const res = await fetch(`/api/branches/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      setBranches((prev) => prev.filter((b) => b.id !== id));
      toast.success("تم حذف الفرع");
    } catch {
      toast.error("فشل الحذف");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <main className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden">
      <Topbar title="إدارة الفروع" subtitle={`${branches.length} فرع`} />

      <div className="p-3 sm:p-4 md:p-6" dir="rtl">
        <div className="flex justify-end mb-6">
          <Button onClick={() => setShowAdd(true)} size="sm">
            <Plus className="w-4 h-4" /> فرع جديد
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {branches.map((branch) => (
            <Card key={branch.id} className={`${!branch.isActive ? "opacity-60" : ""}`}>
              <CardContent className="p-5">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center flex-shrink-0">
                      <Store className="w-6 h-6 text-blue-600" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-slate-900 truncate">{branch.nameAr || branch.name}</p>
                      {branch.nameAr && <p className="text-xs text-slate-400 truncate">{branch.name}</p>}
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 justify-end flex-shrink-0 min-w-0">
                    <Switch
                      checked={branch.isActive}
                      onCheckedChange={() => toggleBranch(branch.id, branch.isActive)}
                      className={currentEmail === "ca.markode@gmail.com" ? "flex-shrink-0 w-12" : "flex-shrink-0"}
                    />
                    <Badge variant={branch.isActive ? "success" : "secondary"} className="whitespace-nowrap text-xs">
                      {branch.isActive ? "نشط" : "معطل"}
                    </Badge>
                    <button
                      onClick={() => deleteBranch(branch.id)}
                      disabled={deletingId === branch.id}
                      className="h-7 w-7 flex items-center justify-center text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-40"
                      title="حذف الفرع"
                    >
                      {deletingId === branch.id
                        ? <Loader2 className="w-4 h-4 animate-spin" />
                        : <Trash2 className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {branch.address && (
                  <div className="flex items-center gap-2 text-sm text-slate-500 mb-1.5">
                    <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                    <span className="truncate">{branch.address}</span>
                  </div>
                )}
                {branch.phone && (
                  <div className="flex items-center gap-2 text-sm text-slate-500 mb-3">
                    <Phone className="w-3.5 h-3.5 flex-shrink-0" />
                    <span>{branch.phone}</span>
                  </div>
                )}
                {branch.openTime && (
                  <p className="text-xs text-slate-400 mb-3">
                    🕐 {branch.openTime} - {branch.closeTime}
                  </p>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-3 border-t border-slate-100">
                  {[
                    { icon: Users, label: "موظف", value: branch._count.users },
                    { icon: Table2, label: "طاولة", value: branch._count.tables },
                    { icon: ShoppingCart, label: "طلب", value: branch._count.orders },
                  ].map((stat) => (
                    <div key={stat.label} className="text-center">
                      <p className="font-bold text-slate-800">{stat.value}</p>
                      <p className="text-xs text-slate-400">{stat.label}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}

          <button
            onClick={() => setShowAdd(true)}
            className="border-2 border-dashed border-slate-300 rounded-xl p-8 flex flex-col items-center justify-center gap-2 text-slate-400 hover:border-blue-400 hover:text-blue-500 hover:bg-blue-50 transition-all"
          >
            <Plus className="w-8 h-8" />
            <span className="text-sm font-medium">إضافة فرع</span>
          </button>
        </div>
      </div>

      <Modal open={showAdd} onOpenChange={setShowAdd}>
        <ModalContent size="md">
          <ModalHeader><ModalTitle>إضافة فرع جديد</ModalTitle></ModalHeader>
          <ModalBody dir="rtl">
            <div className="grid grid-cols-2 gap-4">
              <Input label="اسم الفرع (عربي)" value={form.nameAr} onChange={(e) => setForm({ ...form, nameAr: e.target.value })} placeholder="فرع النخيل" />
              <Input label="اسم الفرع (إنجليزي)" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Al Nakheel Branch" required />
              <div className="col-span-2">
                <Input label="العنوان" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} placeholder="الرياض، حي النخيل..." />
              </div>
              <Input label="الهاتف" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="01xxxxxxxx" type="tel" />
              <div />
              <Input label="وقت الفتح" value={form.openTime} onChange={(e) => setForm({ ...form, openTime: e.target.value })} type="time" />
              <Input label="وقت الإغلاق" value={form.closeTime} onChange={(e) => setForm({ ...form, closeTime: e.target.value })} type="time" />
            </div>
          </ModalBody>
          <ModalFooter>
            <Button variant="outline" onClick={() => setShowAdd(false)}>إلغاء</Button>
            <Button onClick={saveBranch} loading={isSubmitting}>إضافة الفرع</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </main>
  );
}
