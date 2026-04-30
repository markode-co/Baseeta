"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Search, Edit, Trash2, Eye, EyeOff, Star, Package, Tag, ChefHat } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Modal, ModalContent, ModalHeader, ModalTitle, ModalBody, ModalFooter } from "@/components/ui/modal";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { formatCurrency } from "@/lib/utils";
import toast from "react-hot-toast";

type Category = { id: string; name: string; nameAr: string | null; color: string | null; isActive: boolean; _count: { menuItems: number }; };
type MenuItem = { id: string; name: string; nameAr: string | null; description: string | null; price: number; cost: number | null; image: string | null; categoryId: string; category: { name: string; nameAr: string | null }; isAvailable: boolean; isFeatured: boolean; preparationTime: number | null; };

const COLORS = ["#ef4444","#f97316","#f59e0b","#22c55e","#3b82f6","#8b5cf6","#ec4899","#14b8a6"];

export function MenuClient({ categories, menuItems, organizationId }: {
  categories: Category[];
  menuItems: MenuItem[];
  organizationId: string;
}) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [items, setItems] = useState<MenuItem[]>(menuItems);
  const [cats, setCats] = useState<Category[]>(categories);
  const [showAddItem, setShowAddItem] = useState(false);
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [editItem, setEditItem] = useState<MenuItem | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState("items");

  const [itemForm, setItemForm] = useState({
    name: "", nameAr: "", description: "", price: "", cost: "",
    categoryId: "", preparationTime: "", isAvailable: true, isFeatured: false,
  });
  const [catForm, setCatForm] = useState({ name: "", nameAr: "", color: "#3b82f6" });

  const filtered = items.filter((item) => {
    const matchCat = !selectedCategory || item.categoryId === selectedCategory;
    const matchSearch = !searchQuery || item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.nameAr?.toLowerCase() || "").includes(searchQuery.toLowerCase());
    return matchCat && matchSearch;
  });

  function openAddItem() {
    setItemForm({ name: "", nameAr: "", description: "", price: "", cost: "", categoryId: categories[0]?.id || "", preparationTime: "", isAvailable: true, isFeatured: false });
    setEditItem(null);
    setShowAddItem(true);
  }

  function openEditItem(item: MenuItem) {
    setItemForm({
      name: item.name, nameAr: item.nameAr || "", description: item.description || "",
      price: String(item.price), cost: String(item.cost || ""),
      categoryId: item.categoryId, preparationTime: String(item.preparationTime || ""),
      isAvailable: item.isAvailable, isFeatured: item.isFeatured,
    });
    setEditItem(item);
    setShowAddItem(true);
  }

  async function saveItem() {
    if (!itemForm.name || !itemForm.price || !itemForm.categoryId) {
      return toast.error("يرجى تعبئة الحقول المطلوبة");
    }
    setIsSubmitting(true);
    try {
      const url = editItem ? `/api/menu/items/${editItem.id}` : "/api/menu/items";
      const method = editItem ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...itemForm,
          price: parseFloat(itemForm.price),
          cost: itemForm.cost ? parseFloat(itemForm.cost) : null,
          preparationTime: itemForm.preparationTime ? parseInt(itemForm.preparationTime) : null,
          organizationId,
        }),
      });
      if (!res.ok) throw new Error();
      const saved = await res.json();
      if (editItem) {
        setItems((prev) => prev.map((i) => i.id === saved.id ? saved : i));
      } else {
        setItems((prev) => [...prev, saved]);
      }
      toast.success(editItem ? "تم تحديث الصنف" : "تم إضافة الصنف");
      setShowAddItem(false);
      router.refresh();
    } catch {
      toast.error("حدث خطأ");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function deleteItem(id: string) {
    if (!confirm("هل أنت متأكد من حذف هذا الصنف؟")) return;
    try {
      await fetch(`/api/menu/items/${id}`, { method: "DELETE" });
      setItems((prev) => prev.filter((i) => i.id !== id));
      toast.success("تم حذف الصنف");
    } catch {
      toast.error("فشل الحذف");
    }
  }

  async function toggleAvailability(id: string, current: boolean) {
    try {
      await fetch(`/api/menu/items/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isAvailable: !current }),
      });
      setItems((prev) => prev.map((i) => i.id === id ? { ...i, isAvailable: !current } : i));
    } catch {
      toast.error("فشل التحديث");
    }
  }

  async function saveCategory() {
    if (!catForm.name) return toast.error("أدخل اسم الفئة");
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/menu/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...catForm, organizationId }),
      });
      if (!res.ok) throw new Error();
      const saved = await res.json();
      setCats((prev) => [...prev, { ...saved, _count: { menuItems: 0 } }]);
      toast.success("تم إضافة الفئة");
      setShowAddCategory(false);
      setCatForm({ name: "", nameAr: "", color: "#3b82f6" });
    } catch {
      toast.error("حدث خطأ");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="flex-1 overflow-auto">
      <div className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between" dir="rtl">
        <div>
          <h1 className="text-xl font-bold text-slate-900">إدارة القائمة</h1>
          <p className="text-sm text-slate-500">{items.length} صنف · {cats.length} فئة</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setShowAddCategory(true)}>
            <Tag className="w-4 h-4" /> فئة جديدة
          </Button>
          <Button size="sm" onClick={openAddItem}>
            <Plus className="w-4 h-4" /> إضافة صنف
          </Button>
        </div>
      </div>

      <div className="p-6" dir="rtl">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="items">الأصناف</TabsTrigger>
            <TabsTrigger value="categories">الفئات</TabsTrigger>
          </TabsList>

          <TabsContent value="items">
            <div className="flex items-center gap-3 mb-6">
              <div className="relative flex-1 max-w-xs">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="ابحث عن صنف..."
                  className="w-full rounded-lg border border-slate-200 bg-white pr-9 pl-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="flex gap-2 overflow-x-auto">
                <button
                  onClick={() => setSelectedCategory(null)}
                  className={`flex-shrink-0 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${!selectedCategory ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}
                >
                  الكل ({items.length})
                </button>
                {cats.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id === selectedCategory ? null : cat.id)}
                    className={`flex-shrink-0 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${selectedCategory === cat.id ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}
                  >
                    {cat.nameAr || cat.name} ({cat._count.menuItems})
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filtered.map((item) => (
                <Card key={item.id} className={`overflow-hidden ${!item.isAvailable ? "opacity-60" : ""}`}>
                  <div className="h-36 bg-gradient-to-br from-slate-100 to-slate-200 relative flex items-center justify-center">
                    {item.image ? (
                      <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                    ) : (
                      <ChefHat className="w-10 h-10 text-slate-300" />
                    )}
                    {item.isFeatured && (
                      <div className="absolute top-2 right-2 bg-amber-400 rounded-full p-1">
                        <Star className="w-3 h-3 text-white fill-white" />
                      </div>
                    )}
                    <div className="absolute top-2 left-2">
                      <Switch
                        checked={item.isAvailable}
                        onCheckedChange={() => toggleAvailability(item.id, item.isAvailable)}
                      />
                    </div>
                  </div>
                  <CardContent className="p-3">
                    <div className="flex items-start justify-between mb-1">
                      <div className="min-w-0">
                        <p className="font-semibold text-slate-900 text-sm truncate">{item.nameAr || item.name}</p>
                        <p className="text-xs text-slate-400 truncate">{item.category?.nameAr || item.category?.name}</p>
                      </div>
                      <span className="font-bold text-blue-600 text-sm flex-shrink-0">{formatCurrency(item.price)}</span>
                    </div>
                    {item.description && (
                      <p className="text-xs text-slate-500 line-clamp-2 mb-2">{item.description}</p>
                    )}
                    <div className="flex gap-2 pt-2 border-t border-slate-100">
                      <Button variant="outline" size="icon-sm" className="flex-1" onClick={() => openEditItem(item)}>
                        <Edit className="w-3.5 h-3.5" />
                      </Button>
                      <Button variant="destructive" size="icon-sm" onClick={() => deleteItem(item.id)}>
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}

              <button
                onClick={openAddItem}
                className="border-2 border-dashed border-slate-300 rounded-xl p-8 flex flex-col items-center justify-center gap-2 text-slate-400 hover:border-blue-400 hover:text-blue-500 hover:bg-blue-50 transition-all"
              >
                <Plus className="w-8 h-8" />
                <span className="text-sm font-medium">إضافة صنف</span>
              </button>
            </div>
          </TabsContent>

          <TabsContent value="categories">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {cats.map((cat) => (
                <Card key={cat.id}>
                  <CardContent className="p-4 flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: cat.color + "20" || "#e2e8f0" }}
                    >
                      <Tag className="w-5 h-5" style={{ color: cat.color || "#64748b" }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-slate-900 truncate">{cat.nameAr || cat.name}</p>
                      <p className="text-xs text-slate-400">{cat._count.menuItems} صنف</p>
                    </div>
                    <Badge variant={cat.isActive ? "success" : "secondary"}>
                      {cat.isActive ? "نشط" : "معطل"}
                    </Badge>
                  </CardContent>
                </Card>
              ))}
              <button
                onClick={() => setShowAddCategory(true)}
                className="border-2 border-dashed border-slate-300 rounded-xl p-8 flex flex-col items-center justify-center gap-2 text-slate-400 hover:border-blue-400 hover:text-blue-500 hover:bg-blue-50 transition-all"
              >
                <Plus className="w-8 h-8" />
                <span className="text-sm font-medium">فئة جديدة</span>
              </button>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Add/Edit Item Modal */}
      <Modal open={showAddItem} onOpenChange={setShowAddItem}>
        <ModalContent size="lg">
          <ModalHeader>
            <ModalTitle>{editItem ? "تعديل الصنف" : "إضافة صنف جديد"}</ModalTitle>
          </ModalHeader>
          <ModalBody dir="rtl">
            <div className="grid grid-cols-2 gap-4">
              <Input label="اسم الصنف (عربي)" value={itemForm.nameAr} onChange={(e) => setItemForm({ ...itemForm, nameAr: e.target.value })} placeholder="برجر لحم" required />
              <Input label="اسم الصنف (إنجليزي)" value={itemForm.name} onChange={(e) => setItemForm({ ...itemForm, name: e.target.value })} placeholder="Beef Burger" required />
              <div className="col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-1.5">الفئة</label>
                <Select value={itemForm.categoryId} onValueChange={(v) => setItemForm({ ...itemForm, categoryId: v })}>
                  <SelectTrigger><SelectValue placeholder="اختر الفئة" /></SelectTrigger>
                  <SelectContent>
                    {cats.map((c) => <SelectItem key={c.id} value={c.id}>{c.nameAr || c.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <Input label="السعر (ر.س)" type="number" value={itemForm.price} onChange={(e) => setItemForm({ ...itemForm, price: e.target.value })} placeholder="0.00" required />
              <Input label="التكلفة (ر.س)" type="number" value={itemForm.cost} onChange={(e) => setItemForm({ ...itemForm, cost: e.target.value })} placeholder="0.00" />
              <Input label="وقت التحضير (دقيقة)" type="number" value={itemForm.preparationTime} onChange={(e) => setItemForm({ ...itemForm, preparationTime: e.target.value })} placeholder="10" />
              <div className="col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-1.5">الوصف</label>
                <textarea value={itemForm.description} onChange={(e) => setItemForm({ ...itemForm, description: e.target.value })} placeholder="وصف مختصر للصنف..." rows={2} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
              </div>
              <div className="flex items-center gap-3">
                <Switch checked={itemForm.isAvailable} onCheckedChange={(v) => setItemForm({ ...itemForm, isAvailable: v })} />
                <label className="text-sm text-slate-700">متاح للطلب</label>
              </div>
              <div className="flex items-center gap-3">
                <Switch checked={itemForm.isFeatured} onCheckedChange={(v) => setItemForm({ ...itemForm, isFeatured: v })} />
                <label className="text-sm text-slate-700">مميز</label>
              </div>
            </div>
          </ModalBody>
          <ModalFooter>
            <Button variant="outline" onClick={() => setShowAddItem(false)}>إلغاء</Button>
            <Button onClick={saveItem} loading={isSubmitting}>
              {editItem ? "حفظ التغييرات" : "إضافة الصنف"}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Add Category Modal */}
      <Modal open={showAddCategory} onOpenChange={setShowAddCategory}>
        <ModalContent size="sm">
          <ModalHeader>
            <ModalTitle>فئة جديدة</ModalTitle>
          </ModalHeader>
          <ModalBody dir="rtl" className="space-y-4">
            <Input label="اسم الفئة (عربي)" value={catForm.nameAr} onChange={(e) => setCatForm({ ...catForm, nameAr: e.target.value })} placeholder="مشروبات ساخنة" />
            <Input label="اسم الفئة (إنجليزي)" value={catForm.name} onChange={(e) => setCatForm({ ...catForm, name: e.target.value })} placeholder="Hot Drinks" />
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">اللون</label>
              <div className="flex gap-2 flex-wrap">
                {COLORS.map((c) => (
                  <button
                    key={c}
                    onClick={() => setCatForm({ ...catForm, color: c })}
                    className={`w-8 h-8 rounded-full border-2 transition-transform hover:scale-110 ${catForm.color === c ? "border-slate-900 scale-110" : "border-transparent"}`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>
          </ModalBody>
          <ModalFooter>
            <Button variant="outline" onClick={() => setShowAddCategory(false)}>إلغاء</Button>
            <Button onClick={saveCategory} loading={isSubmitting}>إضافة</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </main>
  );
}
