"use client";
import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Search, Plus, Minus, Trash2, ShoppingCart, ChefHat, Printer,
  Tag, Percent, CreditCard, Banknote, Smartphone, X, Check,
  Coffee, UtensilsCrossed, Timer, Table2, ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal, ModalContent, ModalHeader, ModalTitle, ModalBody, ModalFooter } from "@/components/ui/modal";
import { formatCurrency } from "@/lib/utils";
import { buildReceiptHtml, printBrowser, loadPrinterConfig } from "@/lib/printer";
import toast from "react-hot-toast";

type Category  = { id: string; name: string; nameAr: string | null; color: string | null };
type MenuItem  = { id: string; name: string; nameAr: string | null; price: number; image: string | null; categoryId: string; preparationTime: number | null; isAvailable: boolean };
type Table     = { id: string; name: string; capacity: number; status: string; section: string | null };
type CartItem  = { menuItemId: string; name: string; nameAr: string | null; price: number; quantity: number; notes: string };
type OrderType = "DINE_IN" | "TAKEAWAY" | "DELIVERY";
type Session   = { userId: string; organizationId: string; branchId?: string; role: string };

const ORDER_TYPES = [
  { value: "DINE_IN",  label: "داخل",   labelFull: "داخل المطعم", icon: UtensilsCrossed },
  { value: "TAKEAWAY", label: "تيك أواي", labelFull: "تيك أواي",  icon: Coffee },
  { value: "DELIVERY", label: "توصيل",  labelFull: "توصيل",       icon: Timer },
] as const;

const PAYMENT_METHODS = [
  { value: "CASH",     label: "نقداً",    icon: Banknote,    color: "text-green-600" },
  { value: "CARD",     label: "بطاقة",   icon: CreditCard,  color: "text-blue-600" },
  { value: "INSTAPAY", label: "إنستاباي", icon: Smartphone, color: "text-purple-600" },
];

const PAYMENT_LABELS: Record<string, string> = { CASH: "نقداً", CARD: "بطاقة", INSTAPAY: "إنستاباي" };

export function POSClient({ categories, menuItems, tables, session }: {
  categories: Category[];
  menuItems:  MenuItem[];
  tables:     Table[];
  session:    Session;
}) {
  const router = useRouter();
  const [mobileView,      setMobileView]      = useState<"menu" | "cart">("menu");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchQuery,      setSearchQuery]      = useState("");
  const [cart,             setCart]             = useState<CartItem[]>([]);
  const [orderType,        setOrderType]        = useState<OrderType>("DINE_IN");
  const [selectedTable,    setSelectedTable]    = useState<string | null>(null);
  const [customerName,     setCustomerName]     = useState("");
  const [discount,         setDiscount]         = useState(0);
  const [discountType,     setDiscountType]     = useState<"FIXED" | "PERCENT">("PERCENT");
  const [showPayment,      setShowPayment]      = useState(false);
  const [showTablePicker,  setShowTablePicker]  = useState(false);
  const [paymentMethod,    setPaymentMethod]    = useState("CASH");
  const [isSubmitting,     setIsSubmitting]     = useState(false);
  const [noteItemId,       setNoteItemId]       = useState<string | null>(null);
  const [noteText,         setNoteText]         = useState("");
  const [lastOrder,        setLastOrder]        = useState<{ number: string; orgName?: string } | null>(null);

  const TAX_RATE = 0.15;

  const filtered = useMemo(() => {
    let items = menuItems;
    if (selectedCategory) items = items.filter((i) => i.categoryId === selectedCategory);
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      items = items.filter((i) => i.name.toLowerCase().includes(q) || (i.nameAr?.toLowerCase() || "").includes(q));
    }
    return items;
  }, [menuItems, selectedCategory, searchQuery]);

  const subtotal      = cart.reduce((s, i) => s + i.price * i.quantity, 0);
  const discountAmount = discountType === "PERCENT" ? (subtotal * discount) / 100 : discount;
  const taxable       = subtotal - discountAmount;
  const tax           = taxable * TAX_RATE;
  const total         = taxable + tax;
  const cartCount     = cart.reduce((s, i) => s + i.quantity, 0);

  function addToCart(item: MenuItem) {
    setCart((prev) => {
      const ex = prev.find((i) => i.menuItemId === item.id);
      if (ex) return prev.map((i) => i.menuItemId === item.id ? { ...i, quantity: i.quantity + 1 } : i);
      return [...prev, { menuItemId: item.id, name: item.name, nameAr: item.nameAr, price: item.price, quantity: 1, notes: "" }];
    });
  }

  function updateQty(id: string, delta: number) {
    setCart((prev) => prev.flatMap((i) => {
      if (i.menuItemId !== id) return [i];
      const q = i.quantity + delta;
      return q <= 0 ? [] : [{ ...i, quantity: q }];
    }));
  }

  function clearCart() {
    setCart([]); setDiscount(0); setCustomerName(""); setSelectedTable(null);
  }

  function saveNote() {
    if (!noteItemId) return;
    setCart((prev) => prev.map((i) => i.menuItemId === noteItemId ? { ...i, notes: noteText } : i));
    setNoteItemId(null); setNoteText("");
  }

  async function submitOrder() {
    if (cart.length === 0) return toast.error("أضف أصناف للطلب");
    if (orderType === "DINE_IN" && !selectedTable) { setShowTablePicker(true); return; }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: cart, type: orderType, tableId: selectedTable,
          customerName, discount: discountAmount, discountType,
          tax, subtotal, total, paymentMethod, branchId: session.branchId,
        }),
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setLastOrder({ number: data.orderNumber });
      toast.success(`تم إنشاء الطلب #${data.orderNumber} بنجاح ✓`);
      setShowPayment(false);
      clearCart();
      setMobileView("menu");
      router.refresh();
    } catch {
      toast.error("حدث خطأ، حاول مجدداً");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handlePrint() {
    try {
      const cfg = loadPrinterConfig();
      const html = buildReceiptHtml({
        orgName: "بسيطة",
        orderNumber: lastOrder?.number || "—",
        items: cart.map((i) => ({ name: i.name, nameAr: i.nameAr, qty: i.quantity, price: i.price })),
        subtotal, discount: discountAmount || undefined, tax, total,
        paymentMethod: PAYMENT_LABELS[paymentMethod] || paymentMethod,
        tableInfo: selectedTable ? `طاولة ${tables.find((t) => t.id === selectedTable)?.name}` : undefined,
      });
      if (cfg.type === "browser" || cfg.type !== "bluetooth") {
        await printBrowser(html);
      }
    } catch (e: unknown) {
      toast.error((e as Error).message || "فشلت الطباعة");
    }
  }

  const selectedTableData = tables.find((t) => t.id === selectedTable);

  // ── Menu Panel ──────────────────────────────────────────────────────────────
  const MenuPanel = (
    <div className="flex-1 flex flex-col overflow-hidden min-w-0">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-3 py-2.5 flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-2 flex-shrink-0">
          <ShoppingCart className="w-5 h-5 text-blue-600" />
          <h1 className="text-base font-bold text-slate-900 hidden sm:block">نقطة البيع</h1>
        </div>

        {/* Search */}
        <div className="flex-1 min-w-[140px] relative">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="ابحث عن صنف..."
            className="w-full rounded-lg border border-slate-200 bg-slate-50 pr-9 pl-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Order type */}
        <div className="flex gap-1 bg-slate-100 rounded-lg p-1 flex-shrink-0 overflow-hidden">
          {ORDER_TYPES.map((t) => (
            <button
              key={t.value}
              onClick={() => { setOrderType(t.value as OrderType); if (t.value !== "DINE_IN") setSelectedTable(null); }}
              className={`flex items-center gap-1 px-2 py-1.5 rounded-md text-xs font-medium transition-colors ${
                orderType === t.value ? "bg-white text-blue-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
              }`}
            >
              <t.icon className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{t.label}</span>
            </button>
          ))}
        </div>

        {orderType === "DINE_IN" && (
          <button
            onClick={() => setShowTablePicker(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-200 text-xs hover:bg-slate-50 transition-colors flex-shrink-0"
          >
            <Table2 className="w-4 h-4 text-slate-500" />
            <span className="text-slate-600">{selectedTableData ? `طاولة ${selectedTableData.name}` : "اختر طاولة"}</span>
          </button>
        )}
      </div>

      {/* Categories */}
      <div className="flex gap-2 px-3 py-2.5 overflow-x-auto border-b border-slate-100 bg-white scrollbar-none">
        {[{ id: null, name: "الكل", nameAr: "الكل", color: null }, ...categories].map((cat) => (
          <button
            key={cat.id ?? "all"}
            onClick={() => setSelectedCategory(cat.id === selectedCategory ? null : cat.id)}
            className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
              selectedCategory === cat.id
                ? "bg-blue-600 text-white"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
            style={selectedCategory === cat.id && cat.color ? { backgroundColor: cat.color } : undefined}
          >
            {cat.nameAr || cat.name}
          </button>
        ))}
      </div>

      {/* Items grid */}
      <div className="flex-1 overflow-y-auto p-3">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-slate-400">
            <UtensilsCrossed className="w-10 h-10 mb-2 opacity-40" />
            <p className="text-sm">لا توجد أصناف</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2.5">
            {filtered.map((item) => {
              const inCart = cart.find((c) => c.menuItemId === item.id);
              return (
                <button
                  key={item.id}
                  onClick={() => { addToCart(item); }}
                  className={`relative bg-white rounded-xl border-2 p-3 text-right flex flex-col gap-2 transition-all duration-150 hover:shadow-md hover:-translate-y-0.5 active:scale-95 ${
                    inCart ? "border-blue-500 shadow-md" : "border-slate-200"
                  }`}
                >
                  {inCart && (
                    <div className="absolute -top-2 -left-2 w-6 h-6 bg-blue-600 rounded-full text-white text-xs font-bold flex items-center justify-center">
                      {inCart.quantity}
                    </div>
                  )}
                  <div className="w-full h-14 bg-slate-100 rounded-lg flex items-center justify-center overflow-hidden">
                    {item.image
                      ? <img src={item.image} alt={item.name} className="w-full h-full object-cover rounded-lg" />
                      : <ChefHat className="w-6 h-6 text-slate-300" />}
                  </div>
                  <div>
                    <p className="text-xs font-medium text-slate-800 leading-tight line-clamp-2">{item.nameAr || item.name}</p>
                    <p className="text-sm font-bold text-blue-600 mt-1">{formatCurrency(item.price)}</p>
                  </div>
                  {item.preparationTime && (
                    <p className="text-xs text-slate-400 flex items-center gap-1">
                      <Timer className="w-3 h-3" /> {item.preparationTime} د
                    </p>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );

  // ── Cart Panel ───────────────────────────────────────────────────────────────
  const CartPanel = (
    <div className="flex flex-col bg-white border-r border-slate-200 w-full md:w-80 lg:w-96 flex-shrink-0">
      <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {/* Back button — mobile only */}
          <button
            onClick={() => setMobileView("menu")}
            className="md:hidden p-1.5 -ml-1 text-slate-500 hover:text-slate-800 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <ArrowRight className="w-4 h-4" />
          </button>
          <ShoppingCart className="w-5 h-5 text-slate-600" />
          <h2 className="font-bold text-slate-900">الطلب الحالي</h2>
          {cartCount > 0 && (
            <span className="w-5 h-5 bg-blue-600 text-white text-xs rounded-full flex items-center justify-center">
              {cartCount}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {cart.length > 0 && (
            <button onClick={handlePrint} className="p-1.5 text-slate-400 hover:text-blue-600 rounded-lg hover:bg-slate-100 transition-colors" title="طباعة">
              <Printer className="w-4 h-4" />
            </button>
          )}
          {cart.length > 0 && (
            <button onClick={clearCart} className="text-xs text-red-500 hover:text-red-700 flex items-center gap-1">
              <Trash2 className="w-3.5 h-3.5" /> مسح
            </button>
          )}
        </div>
      </div>

      {/* Cart items */}
      <div className="flex-1 overflow-y-auto">
        {cart.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-slate-300 gap-3 py-12">
            <ShoppingCart className="w-14 h-14 opacity-30" />
            <p className="text-sm">لم يتم إضافة أصناف بعد</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {cart.map((item) => (
              <div key={item.menuItemId} className="px-4 py-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-800 truncate">{item.nameAr || item.name}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{formatCurrency(item.price)} × {item.quantity}</p>
                    {item.notes && (
                      <p className="text-xs text-amber-600 mt-0.5 bg-amber-50 px-1.5 py-0.5 rounded">📝 {item.notes}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button onClick={() => updateQty(item.menuItemId, -1)} className="w-7 h-7 bg-slate-100 hover:bg-slate-200 rounded-md flex items-center justify-center transition-colors">
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="w-6 text-center text-sm font-bold text-slate-800">{item.quantity}</span>
                    <button onClick={() => updateQty(item.menuItemId, 1)} className="w-7 h-7 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-md flex items-center justify-center transition-colors">
                      <Plus className="w-3 h-3" />
                    </button>
                    <button onClick={() => { setNoteItemId(item.menuItemId); setNoteText(item.notes); }} className="w-7 h-7 bg-amber-50 hover:bg-amber-100 text-amber-600 rounded-md flex items-center justify-center transition-colors mr-1">
                      <Tag className="w-3 h-3" />
                    </button>
                    <button onClick={() => setCart((p) => p.filter((i) => i.menuItemId !== item.menuItemId))} className="w-7 h-7 bg-red-50 hover:bg-red-100 text-red-500 rounded-md flex items-center justify-center transition-colors">
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
                <div className="flex justify-end mt-1">
                  <span className="text-sm font-bold text-slate-800">{formatCurrency(item.price * item.quantity)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Totals + actions */}
      <div className="border-t border-slate-200 p-4 space-y-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setDiscountType(discountType === "PERCENT" ? "FIXED" : "PERCENT")}
            className="flex items-center gap-1 px-2 py-1 bg-slate-100 rounded-lg text-xs text-slate-600 hover:bg-slate-200 transition-colors flex-shrink-0"
          >
            {discountType === "PERCENT" ? <Percent className="w-3 h-3" /> : <Tag className="w-3 h-3" />}
            {discountType === "PERCENT" ? "%" : "ج.م"}
          </button>
          <input
            type="number"
            value={discount || ""}
            onChange={(e) => setDiscount(Number(e.target.value) || 0)}
            placeholder="خصم"
            min={0}
            className="w-16 rounded-lg border border-slate-200 px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <Input
            placeholder="اسم الزبون"
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            className="flex-1"
          />
        </div>

        <div className="space-y-1.5 text-sm">
          <div className="flex justify-between text-slate-600">
            <span>المجموع الفرعي</span><span>{formatCurrency(subtotal)}</span>
          </div>
          {discountAmount > 0 && (
            <div className="flex justify-between text-green-600">
              <span>الخصم</span><span>- {formatCurrency(discountAmount)}</span>
            </div>
          )}
          <div className="flex justify-between text-slate-600">
            <span>الضريبة (15%)</span><span>{formatCurrency(tax)}</span>
          </div>
          <div className="flex justify-between font-bold text-base text-slate-900 pt-1.5 border-t border-slate-200">
            <span>الإجمالي</span>
            <span className="text-blue-600">{formatCurrency(total)}</span>
          </div>
        </div>

        <Button onClick={() => cart.length > 0 && setShowPayment(true)} className="w-full" size="lg" disabled={cart.length === 0}>
          <ShoppingCart className="w-4 h-4" />
          إتمام الطلب · {formatCurrency(total)}
        </Button>
      </div>
    </div>
  );

  return (
    <div className="flex flex-1 min-h-0 overflow-hidden bg-slate-50" dir="rtl">
      {/* Desktop: side by side | Mobile: one at a time */}
      <div className={`flex-1 flex flex-col overflow-hidden ${mobileView === "cart" ? "hidden md:flex" : "flex"}`}>
        {MenuPanel}
      </div>
      <div className={`flex flex-col overflow-hidden ${mobileView === "menu" ? "hidden md:flex" : "flex w-full"} md:w-80 lg:w-96`}>
        {CartPanel}
      </div>

      {/* Mobile floating cart button */}
      {mobileView === "menu" && (
        <button
          onClick={() => setMobileView("cart")}
          className="md:hidden fixed bottom-5 left-1/2 -translate-x-1/2 flex items-center gap-2.5 px-5 py-3 bg-blue-600 text-white rounded-2xl shadow-xl shadow-blue-300/50 active:scale-95 transition-all z-20"
        >
          <ShoppingCart className="w-5 h-5" />
          <span className="font-semibold text-sm">الطلب</span>
          {cartCount > 0 && (
            <span className="w-5 h-5 bg-white text-blue-600 text-xs font-bold rounded-full flex items-center justify-center">
              {cartCount}
            </span>
          )}
          {total > 0 && <span className="text-sm font-bold">{formatCurrency(total)}</span>}
        </button>
      )}

      {/* Payment Modal */}
      <Modal open={showPayment} onOpenChange={setShowPayment}>
        <ModalContent size="sm">
          <ModalHeader><ModalTitle>تأكيد الدفع</ModalTitle></ModalHeader>
          <ModalBody className="space-y-4" dir="rtl">
            <div className="bg-slate-50 rounded-xl p-4 space-y-2">
              <div className="flex justify-between text-sm text-slate-600">
                <span>عدد الأصناف</span><span>{cartCount}</span>
              </div>
              <div className="flex justify-between text-sm text-slate-600">
                <span>الضريبة</span><span>{formatCurrency(tax)}</span>
              </div>
              <div className="flex justify-between font-bold text-xl text-slate-900 pt-2 border-t border-slate-200">
                <span>المبلغ المطلوب</span>
                <span className="text-blue-600">{formatCurrency(total)}</span>
              </div>
            </div>
            <div>
              <p className="text-sm font-medium text-slate-700 mb-2">طريقة الدفع</p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {PAYMENT_METHODS.map((m) => (
                  <button
                    key={m.value}
                    onClick={() => setPaymentMethod(m.value)}
                    className={`flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-colors ${
                      paymentMethod === m.value ? "border-blue-500 bg-blue-50" : "border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    <m.icon className={`w-5 h-5 ${paymentMethod === m.value ? "text-blue-600" : m.color}`} />
                    <span className="text-xs font-medium text-slate-700">{m.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </ModalBody>
          <ModalFooter>
            <Button variant="outline" onClick={() => setShowPayment(false)}>إلغاء</Button>
            <Button onClick={submitOrder} loading={isSubmitting}>
              <Check className="w-4 h-4" /> تأكيد الدفع
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Table Picker Modal */}
      <Modal open={showTablePicker} onOpenChange={setShowTablePicker}>
        <ModalContent size="lg">
          <ModalHeader><ModalTitle>اختر الطاولة</ModalTitle></ModalHeader>
          <ModalBody dir="rtl">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
              {tables.map((table) => (
                <button
                  key={table.id}
                  onClick={() => { setSelectedTable(table.id); setShowTablePicker(false); }}
                  disabled={table.status === "OCCUPIED"}
                  className={`p-3 rounded-xl border-2 transition-all text-center ${
                    selectedTable === table.id    ? "border-blue-500 bg-blue-50" :
                    table.status === "OCCUPIED"  ? "border-red-200 bg-red-50 opacity-60 cursor-not-allowed" :
                    table.status === "RESERVED"  ? "border-amber-200 bg-amber-50" :
                                                   "border-green-200 bg-green-50/50 hover:border-green-400 hover:bg-green-50"
                  }`}
                >
                  <Table2 className={`w-5 h-5 mx-auto mb-1 ${
                    table.status === "OCCUPIED" ? "text-red-400" :
                    table.status === "RESERVED" ? "text-amber-400" :
                    selectedTable === table.id  ? "text-blue-600" : "text-slate-400"
                  }`} />
                  <p className="text-sm font-bold text-slate-800">{table.name}</p>
                  <p className="text-xs text-slate-400">{table.capacity} أشخاص</p>
                  <p className={`text-xs font-medium mt-0.5 ${
                    table.status === "OCCUPIED" ? "text-red-500" :
                    table.status === "RESERVED" ? "text-amber-500" : "text-green-500"
                  }`}>
                    {table.status === "OCCUPIED" ? "مشغولة" : table.status === "RESERVED" ? "محجوزة" : "متاحة"}
                  </p>
                </button>
              ))}
            </div>
          </ModalBody>
        </ModalContent>
      </Modal>

      {/* Note Modal */}
      <Modal open={!!noteItemId} onOpenChange={() => setNoteItemId(null)}>
        <ModalContent size="sm">
          <ModalHeader><ModalTitle>ملاحظة على الصنف</ModalTitle></ModalHeader>
          <ModalBody dir="rtl">
            <textarea
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              placeholder="مثال: بدون بصل، حار جداً..."
              rows={3}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </ModalBody>
          <ModalFooter>
            <Button variant="outline" onClick={() => setNoteItemId(null)}>إلغاء</Button>
            <Button onClick={saveNote}><X className="w-4 h-4 hidden" />حفظ</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}
