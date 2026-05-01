"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import { Topbar } from "@/components/layout/topbar";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Modal, ModalContent, ModalHeader, ModalTitle, ModalBody, ModalFooter } from "@/components/ui/modal";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  ChevronRight, Clock, CheckCircle2, XCircle, ChefHat,
  ShoppingCart, Eye, Printer, Filter
} from "lucide-react";
import toast from "react-hot-toast";
import { loadReceiptSettings } from "@/lib/printer";

type OrderItem = { id: string; name: string; nameAr: string | null; quantity: number; price: number; total: number; notes: string | null; };
type Table = { id: string; name: string; } | null;
type Order = {
  id: string; orderNumber: string; status: string; type: string; total: number; subtotal: number; tax: number;
  discount: number; paymentMethod: string | null; createdAt: Date; customerName: string | null;
  table: Table; items: OrderItem[]; user: { name: string } | null;
};

const STATUS_FLOW: Record<string, string> = {
  PENDING: "CONFIRMED",
  CONFIRMED: "PREPARING",
  PREPARING: "READY",
  READY: "SERVED",
  SERVED: "COMPLETED",
};

const STATUS_CONFIG = {
  PENDING: { label: "معلق", color: "pending", icon: Clock },
  CONFIRMED: { label: "مؤكد", color: "preparing", icon: ChevronRight },
  PREPARING: { label: "يُحضَّر", color: "preparing", icon: ChefHat },
  READY: { label: "جاهز", color: "ready", icon: CheckCircle2 },
  SERVED: { label: "قُدِّم", color: "ready", icon: CheckCircle2 },
  COMPLETED: { label: "مكتمل", color: "completed", icon: CheckCircle2 },
  CANCELLED: { label: "ملغي", color: "cancelled", icon: XCircle },
};

const TYPE_LABEL: Record<string, string> = {
  DINE_IN: "داخل المطعم",
  TAKEAWAY: "تيك أواي",
  DELIVERY: "توصيل",
};

const PAYMENT_LABEL: Record<string, string> = {
  CASH: "نقداً",
  CARD: "بطاقة بنكية",
  INSTAPAY: "إنستاباي",
};

const TABS = ["ALL", "PENDING", "PREPARING", "READY", "COMPLETED", "CANCELLED"] as const;
const TAB_LABELS: Record<string, string> = {
  ALL: "الكل", PENDING: "معلقة", PREPARING: "قيد التحضير", READY: "جاهزة", COMPLETED: "مكتملة", CANCELLED: "ملغاة"
};

export function OrdersClient({ initialOrders, orgName = "بسيطة" }: { initialOrders: Order[]; orgName?: string }) {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>(initialOrders);
  const [activeTab, setActiveTab] = useState<string>("ALL");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isUpdating, setIsUpdating] = useState<string | null>(null);
  const [receiptSettings, setReceiptSettings] = useState({ address: "", website: "", header: "" });

  useEffect(() => {
    setReceiptSettings(loadReceiptSettings());
  }, []);

  const filtered = orders.filter((o) => {
    if (activeTab === "ALL") return true;
    if (activeTab === "PREPARING") return ["CONFIRMED", "PREPARING"].includes(o.status);
    return o.status === activeTab;
  });

  async function updateStatus(orderId: string, status: string) {
    setIsUpdating(orderId);
    try {
      const res = await fetch("/api/orders", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: orderId, status }),
      });
      if (!res.ok) throw new Error();
      setOrders((prev) => prev.map((o) => o.id === orderId ? { ...o, status } : o));
      if (selectedOrder?.id === orderId) setSelectedOrder((prev) => prev ? { ...prev, status } : null);
      toast.success("تم تحديث حالة الطلب");
    } catch {
      toast.error("فشل تحديث الحالة");
    } finally {
      setIsUpdating(null);
    }
  }

  function printInvoice(order: Order) {
    const { address, website, header } = receiptSettings;
    const websiteDomain = website ? website.replace(/^https?:\/\//, "").replace(/\/$/, "") : "";
    const qrUrl = website ? `https://api.qrserver.com/v1/create-qr-code/?size=80x80&data=${encodeURIComponent(website)}&margin=2` : "";
    
    const html = `<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
  <meta charset="UTF-8"/>
  <title>فاتورة #${order.orderNumber}</title>
  <style>
    *{margin:0;padding:0;box-sizing:border-box}
    body{font-family:'Courier New',monospace;font-size:13px;color:#000;width:80mm;margin:0 auto;padding:12px}
    .c{text-align:center}
    .b{font-weight:bold}
    .hr{border-top:1px dashed #000;margin:8px 0}
    .row{display:flex;justify-content:space-between;align-items:flex-start;margin:3px 0}
    .note{font-size:11px;color:#444;padding-right:10px;margin-bottom:2px}
    @media print{body{width:80mm}@page{size:80mm auto;margin:0}}
  </style>
</head>
<body>
  ${header ? `<div class="c" style="margin-bottom:4px;font-size:11px;color:#555">${header}</div>` : ""}
  <div class="c">
    <div class="b" style="font-size:22px;margin-bottom:2px">بسيطة</div>
    <div style="font-size:11px;color:#555">نظام إدارة المطاعم</div>
    ${address ? `<div style="font-size:10px;color:#666;margin-top:2px">${address}</div>` : ""}
  </div>
  <div class="hr"></div>
  <div class="c">
    <div class="b" style="font-size:15px">فاتورة #${order.orderNumber}</div>
    <div style="font-size:11px;margin-top:2px">${formatDateTime(order.createdAt)}</div>
    <div style="margin-top:3px">${order.table ? `طاولة: ${order.table.name}` : TYPE_LABEL[order.type] || order.type}</div>
    ${order.customerName ? `<div>العميل: ${order.customerName}</div>` : ""}
  </div>
  <div class="hr"></div>
  ${order.items.map((item) => `
    <div class="row">
      <span>${item.nameAr || item.name} × ${item.quantity}</span>
      <span>${formatCurrency(item.total)}</span>
    </div>
    ${item.notes ? `<div class="note">↳ ${item.notes}</div>` : ""}
  `).join("")}
  <div class="hr"></div>
  <div class="row"><span>المجموع الفرعي</span><span>${formatCurrency(order.subtotal)}</span></div>
  ${order.discount > 0 ? `<div class="row"><span>الخصم</span><span>- ${formatCurrency(order.discount)}</span></div>` : ""}
  <div class="row"><span>ضريبة القيمة المضافة (15%)</span><span>${formatCurrency(order.tax)}</span></div>
  <div class="hr"></div>
  <div class="row b" style="font-size:15px"><span>الإجمالي</span><span>${formatCurrency(order.total)}</span></div>
  ${order.paymentMethod ? `<div class="row" style="margin-top:4px"><span>طريقة الدفع</span><span>${PAYMENT_LABEL[order.paymentMethod] || order.paymentMethod}</span></div>` : ""}
  <div class="hr"></div>
  <div class="c" style="margin-top:6px;font-size:12px">
    <div class="b">شكراً لزيارتكم</div>
    <div style="color:#555;margin-top:3px">نتمنى أن تكونوا راضين عن خدمتنا</div>
  </div>
  ${qrUrl ? `
  <div class="hr"></div>
  <div class="c">
    <img src="${qrUrl}" width="80" height="80" style="display:block;margin:4px auto;" />
    <div style="font-size:10px;color:#555">${websiteDomain}</div>
  </div>
  ` : ""}
</body>
</html>`;

    const win = window.open("", "_blank", "width=420,height=650");
    if (!win) { toast.error("يرجى السماح بفتح النوافذ المنبثقة"); return; }
    win.document.write(html);
    win.document.close();
    win.focus();
    setTimeout(() => { win.print(); win.close(); }, 400);
  }

  function getTabCount(tab: string) {
    if (tab === "ALL") return orders.length;
    if (tab === "PREPARING") return orders.filter((o) => ["CONFIRMED", "PREPARING"].includes(o.status)).length;
    return orders.filter((o) => o.status === tab).length;
  }

  return (
    <main className="flex-1 overflow-auto">
      <Topbar title="إدارة الطلبات" subtitle="تتبع ومتابعة جميع الطلبات" />

      <div className="p-3 sm:p-4 md:p-6" dir="rtl">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <div className="flex items-center gap-2 mb-4 sm:mb-6">
            <TabsList className="flex-1 min-w-0">
              {TABS.map((tab) => (
                <TabsTrigger key={tab} value={tab}>
                  {TAB_LABELS[tab]}
                  <span className="px-1.5 py-0.5 bg-slate-200 rounded-full text-xs">
                    {getTabCount(tab)}
                  </span>
                </TabsTrigger>
              ))}
            </TabsList>
            <Button variant="outline" size="sm" className="flex-shrink-0">
              <Filter className="w-4 h-4" />
              <span className="hidden sm:inline">تصفية</span>
            </Button>
          </div>

          {TABS.map((tab) => (
            <TabsContent key={tab} value={tab}>
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4">
                {filtered.length === 0 ? (
                  <div className="col-span-full text-center py-16 text-slate-400">
                    <ShoppingCart className="w-12 h-12 mx-auto mb-3 opacity-30" />
                    <p>لا توجد طلبات</p>
                  </div>
                ) : (
                  filtered.map((order) => {
                    const config = STATUS_CONFIG[order.status as keyof typeof STATUS_CONFIG];
                    const StatusIcon = config?.icon || Clock;
                    return (
                      <Card key={order.id} className="hover:shadow-md transition-shadow">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between mb-3">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-slate-900">#{order.orderNumber}</span>
                                <Badge variant={config?.color as Parameters<typeof Badge>[0]["variant"]}>
                                  <StatusIcon className="w-3 h-3" />
                                  {config?.label}
                                </Badge>
                              </div>
                              <p className="text-xs text-slate-400 mt-0.5">{formatDateTime(order.createdAt)}</p>
                            </div>
                            <span className="font-bold text-blue-600">{formatCurrency(order.total)}</span>
                          </div>

                          <div className="flex items-center gap-2 text-sm text-slate-600 mb-3">
                            <span className="px-2 py-0.5 bg-slate-100 rounded text-xs">{TYPE_LABEL[order.type]}</span>
                            {order.table && <span className="text-slate-500">· طاولة {order.table.name}</span>}
                            {order.customerName && <span className="text-slate-500">· {order.customerName}</span>}
                          </div>

                          <div className="space-y-1 mb-3">
                            {order.items.slice(0, 3).map((item) => (
                              <div key={item.id} className="flex justify-between text-xs text-slate-600">
                                <span>{item.nameAr || item.name} × {item.quantity}</span>
                                <span>{formatCurrency(item.total)}</span>
                              </div>
                            ))}
                            {order.items.length > 3 && (
                              <p className="text-xs text-slate-400">+{order.items.length - 3} أصناف أخرى</p>
                            )}
                          </div>

                          <div className="flex items-center gap-2 pt-3 border-t border-slate-100">
                            <Button
                              variant="outline"
                              size="sm"
                              className="flex-1 min-w-0"
                              onClick={() => setSelectedOrder(order)}
                            >
                              <Eye className="w-3.5 h-3.5 flex-shrink-0" />
                              <span className="truncate">التفاصيل</span>
                            </Button>
                            {STATUS_FLOW[order.status] && (
                              <Button
                                size="sm"
                                className="flex-1 min-w-0"
                                loading={isUpdating === order.id}
                                onClick={() => updateStatus(order.id, STATUS_FLOW[order.status])}
                              >
                                <ChevronRight className="w-3.5 h-3.5 flex-shrink-0" />
                                <span className="truncate">{STATUS_CONFIG[STATUS_FLOW[order.status] as keyof typeof STATUS_CONFIG]?.label}</span>
                              </Button>
                            )}
                            {order.status === "PENDING" && (
                              <Button
                                variant="destructive"
                                size="sm"
                                className="flex-shrink-0 px-2.5"
                                loading={isUpdating === order.id}
                                onClick={() => updateStatus(order.id, "CANCELLED")}
                              >
                                <XCircle className="w-3.5 h-3.5" />
                              </Button>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })
                )}
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </div>

      {/* Order Details Modal */}
      <Modal open={!!selectedOrder} onOpenChange={() => setSelectedOrder(null)}>
        <ModalContent size="md">
          <ModalHeader>
            <ModalTitle>تفاصيل الطلب #{selectedOrder?.orderNumber}</ModalTitle>
          </ModalHeader>
          <ModalBody dir="rtl">
            {selectedOrder && (
              <div className="space-y-4">
                <div className="flex items-center gap-3 flex-wrap">
                  <Badge variant={STATUS_CONFIG[selectedOrder.status as keyof typeof STATUS_CONFIG]?.color as Parameters<typeof Badge>[0]["variant"]}>
                    {STATUS_CONFIG[selectedOrder.status as keyof typeof STATUS_CONFIG]?.label}
                  </Badge>
                  <span className="text-sm text-slate-500">{TYPE_LABEL[selectedOrder.type]}</span>
                  {selectedOrder.table && <span className="text-sm text-slate-500">طاولة {selectedOrder.table.name}</span>}
                  <span className="text-sm text-slate-500">{formatDateTime(selectedOrder.createdAt)}</span>
                </div>

                <div className="divide-y divide-slate-100">
                  {selectedOrder.items.map((item) => (
                    <div key={item.id} className="py-2.5 flex justify-between">
                      <div>
                        <p className="text-sm font-medium text-slate-800">{item.nameAr || item.name}</p>
                        {item.notes && <p className="text-xs text-amber-600 mt-0.5">📝 {item.notes}</p>}
                        <p className="text-xs text-slate-400">{formatCurrency(item.price)} × {item.quantity}</p>
                      </div>
                      <span className="text-sm font-semibold text-slate-800">{formatCurrency(item.total)}</span>
                    </div>
                  ))}
                </div>

                <div className="bg-slate-50 rounded-lg p-3 space-y-1.5 text-sm">
                  <div className="flex justify-between text-slate-600">
                    <span>المجموع الفرعي</span>
                    <span>{formatCurrency(selectedOrder.subtotal)}</span>
                  </div>
                  {selectedOrder.discount > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>الخصم</span>
                      <span>- {formatCurrency(selectedOrder.discount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-slate-600">
                    <span>الضريبة (15%)</span>
                    <span>{formatCurrency(selectedOrder.tax)}</span>
                  </div>
                  <div className="flex justify-between font-bold text-base border-t border-slate-200 pt-2 mt-1">
                    <span>الإجمالي</span>
                    <span className="text-blue-600">{formatCurrency(selectedOrder.total)}</span>
                  </div>
                </div>
              </div>
            )}
          </ModalBody>
          <ModalFooter>
            <Button variant="outline" size="sm" onClick={() => selectedOrder && printInvoice(selectedOrder)}>
              <Printer className="w-4 h-4" /> طباعة الفاتورة
            </Button>
            {selectedOrder && STATUS_FLOW[selectedOrder.status] && (
              <Button
                loading={isUpdating === selectedOrder.id}
                onClick={() => updateStatus(selectedOrder.id, STATUS_FLOW[selectedOrder.status])}
              >
                تحديث الحالة إلى {STATUS_CONFIG[STATUS_FLOW[selectedOrder.status] as keyof typeof STATUS_CONFIG]?.label}
              </Button>
            )}
          </ModalFooter>
        </ModalContent>
      </Modal>
    </main>
  );
}
