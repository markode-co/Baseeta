"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Search, Edit, Trash2, Shield, User, Mail, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Modal, ModalContent, ModalHeader, ModalTitle, ModalBody, ModalFooter } from "@/components/ui/modal";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getInitials, formatDateTime } from "@/lib/utils";
import toast from "react-hot-toast";

type StaffMember = {
  id: string; name: string; email: string; phone: string | null; role: string;
  isActive: boolean; lastLogin: Date | null; createdAt: Date;
  branch: { name: string } | null;
};

const ROLE_CONFIG = {
  SUPER_ADMIN: { label: "مدير عام", color: "danger", bg: "bg-red-50 text-red-700" },
  ADMIN: { label: "مدير", color: "default", bg: "bg-blue-50 text-blue-700" },
  MANAGER: { label: "مشرف", color: "warning", bg: "bg-purple-50 text-purple-700" },
  CASHIER: { label: "كاشير", color: "success", bg: "bg-green-50 text-green-700" },
  WAITER: { label: "نادل", color: "secondary", bg: "bg-slate-50 text-slate-700" },
  KITCHEN: { label: "مطبخ", color: "warning", bg: "bg-orange-50 text-orange-700" },
};

const AVATAR_COLORS = [
  "bg-blue-500", "bg-green-500", "bg-purple-500", "bg-orange-500",
  "bg-pink-500", "bg-teal-500", "bg-red-500", "bg-indigo-500",
];

export function StaffClient({ staff, branches, organizationId }: {
  staff: StaffMember[];
  branches: { id: string; name: string }[];
  organizationId: string;
}) {
  const router = useRouter();
  const [members, setMembers] = useState<StaffMember[]>(staff);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [editMember, setEditMember] = useState<StaffMember | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [form, setForm] = useState({
    name: "", email: "", phone: "", role: "CASHIER", branchId: branches[0]?.id || "", password: "",
  });

  const filtered = members.filter((m) => {
    const matchSearch = !searchQuery ||
      m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchRole = !roleFilter || m.role === roleFilter;
    return matchSearch && matchRole;
  });

  function openAdd() {
    setForm({ name: "", email: "", phone: "", role: "CASHIER", branchId: branches[0]?.id || "", password: "" });
    setEditMember(null);
    setShowAdd(true);
  }

  function openEdit(member: StaffMember) {
    setForm({ name: member.name, email: member.email, phone: member.phone || "", role: member.role, branchId: "", password: "" });
    setEditMember(member);
    setShowAdd(true);
  }

  async function saveMember() {
    if (!form.name || !form.email) return toast.error("الاسم والبريد الإلكتروني مطلوبان");
    setIsSubmitting(true);
    try {
      const url = editMember ? `/api/staff/${editMember.id}` : "/api/staff";
      const method = editMember ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, organizationId }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "فشل الحفظ");
      }
      const saved = await res.json();
      if (editMember) {
        setMembers((prev) => prev.map((m) => m.id === saved.id ? { ...m, ...saved } : m));
      } else {
        setMembers((prev) => [...prev, saved]);
      }
      toast.success(editMember ? "تم تحديث بيانات الموظف" : "تم إضافة الموظف");
      setShowAdd(false);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "حدث خطأ");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function toggleActive(id: string, current: boolean) {
    try {
      await fetch(`/api/staff/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !current }),
      });
      setMembers((prev) => prev.map((m) => m.id === id ? { ...m, isActive: !current } : m));
    } catch {
      toast.error("فشل التحديث");
    }
  }

  async function deleteMember(id: string) {
    if (!confirm("هل تريد حذف هذا الموظف؟")) return;
    try {
      await fetch(`/api/staff/${id}`, { method: "DELETE" });
      setMembers((prev) => prev.filter((m) => m.id !== id));
      toast.success("تم حذف الموظف");
    } catch {
      toast.error("فشل الحذف");
    }
  }

  return (
    <main className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden">
      <div className="bg-white border-b border-slate-200 px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between" dir="rtl">
        <div>
          <h1 className="text-lg sm:text-xl font-bold text-slate-900">إدارة الموظفين</h1>
          <p className="text-xs sm:text-sm text-slate-500">{members.length} موظف</p>
        </div>
        <Button size="sm" onClick={openAdd}>
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">موظف جديد</span>
          <span className="sm:hidden">إضافة</span>
        </Button>
      </div>

      <div className="p-3 sm:p-4 md:p-6" dir="rtl">
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-4 sm:mb-6">
          <div className="relative flex-1 sm:max-w-xs">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ابحث عن موظف..."
              className="w-full rounded-lg border border-slate-200 bg-white pr-9 pl-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex gap-1.5 flex-wrap">
            <button
              onClick={() => setRoleFilter(null)}
              className={`px-3 py-1.5 rounded-full text-xs sm:text-sm font-medium transition-colors ${!roleFilter ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-600"}`}
            >
              الكل
            </button>
            {Object.entries(ROLE_CONFIG).map(([role, config]) => (
              <button
                key={role}
                onClick={() => setRoleFilter(role === roleFilter ? null : role)}
                className={`px-3 py-1.5 rounded-full text-xs sm:text-sm font-medium transition-colors ${roleFilter === role ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-600"}`}
              >
                {config.label}
              </button>
            ))}
          </div>
        </div>

        {/* Staff Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
          {filtered.map((member, idx) => {
            const roleConfig = ROLE_CONFIG[member.role as keyof typeof ROLE_CONFIG];
            const avatarColor = AVATAR_COLORS[idx % AVATAR_COLORS.length];
            return (
              <Card key={member.id} className={`${!member.isActive ? "opacity-60" : ""}`}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 ${avatarColor} rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0`}>
                        {getInitials(member.name)}
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-slate-900 truncate">{member.name}</p>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${roleConfig?.bg}`}>
                          <Shield className="w-2.5 h-2.5 inline ml-0.5" />
                          {roleConfig?.label}
                        </span>
                      </div>
                    </div>
                    <Switch
                      checked={member.isActive}
                      onCheckedChange={() => toggleActive(member.id, member.isActive)}
                    />
                  </div>

                  <div className="space-y-1.5 text-xs text-slate-500 mb-3">
                    <div className="flex items-center gap-1.5">
                      <Mail className="w-3 h-3 flex-shrink-0" />
                      <span className="truncate">{member.email}</span>
                    </div>
                    {member.phone && (
                      <div className="flex items-center gap-1.5">
                        <Phone className="w-3 h-3 flex-shrink-0" />
                        <span>{member.phone}</span>
                      </div>
                    )}
                    {member.branch && (
                      <div className="flex items-center gap-1.5">
                        <User className="w-3 h-3 flex-shrink-0" />
                        <span>{member.branch.name}</span>
                      </div>
                    )}
                    {member.lastLogin && (
                      <p className="text-slate-400">آخر دخول: {formatDateTime(member.lastLogin)}</p>
                    )}
                  </div>

                  <div className="flex gap-2 pt-3 border-t border-slate-100">
                    <Button variant="outline" size="sm" className="flex-1" onClick={() => openEdit(member)}>
                      <Edit className="w-3.5 h-3.5" /> تعديل
                    </Button>
                    <Button variant="destructive" size="icon-sm" onClick={() => deleteMember(member.id)}>
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}

          <button
            onClick={openAdd}
            className="border-2 border-dashed border-slate-300 rounded-xl p-8 flex flex-col items-center justify-center gap-2 text-slate-400 hover:border-blue-400 hover:text-blue-500 hover:bg-blue-50 transition-all"
          >
            <Plus className="w-8 h-8" />
            <span className="text-sm font-medium">موظف جديد</span>
          </button>
        </div>
      </div>

      {/* Add/Edit Modal */}
      <Modal open={showAdd} onOpenChange={setShowAdd}>
        <ModalContent size="md">
          <ModalHeader>
            <ModalTitle>{editMember ? "تعديل بيانات الموظف" : "إضافة موظف جديد"}</ModalTitle>
          </ModalHeader>
          <ModalBody dir="rtl">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <Input label="الاسم الكامل" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="محمد أحمد" required />
              <Input label="رقم الجوال" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="05xxxxxxxx" type="tel" />
              <div className="sm:col-span-2">
                <Input label="البريد الإلكتروني" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} type="email" placeholder="staff@restaurant.com" required />
              </div>
              {!editMember && (
                <div className="sm:col-span-2">
                  <Input label="كلمة المرور" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} type="password" placeholder="8 أحرف على الأقل" required />
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">الدور الوظيفي</label>
                <Select value={form.role} onValueChange={(v) => setForm({ ...form, role: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(ROLE_CONFIG).filter(([r]) => r !== "SUPER_ADMIN").map(([role, config]) => (
                      <SelectItem key={role} value={role}>{config.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">الفرع</label>
                <Select value={form.branchId} onValueChange={(v) => setForm({ ...form, branchId: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {branches.map((b) => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </ModalBody>
          <ModalFooter>
            <Button variant="outline" onClick={() => setShowAdd(false)}>إلغاء</Button>
            <Button onClick={saveMember} loading={isSubmitting}>
              {editMember ? "حفظ التغييرات" : "إضافة الموظف"}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </main>
  );
}
