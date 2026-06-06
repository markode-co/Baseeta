"use client";
/* eslint-disable @typescript-eslint/no-unused-vars, react-hooks/set-state-in-effect, @typescript-eslint/no-explicit-any */
import { useState, useEffect } from "react";
import { Topbar } from "@/components/layout/topbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Building2, Globe, Percent, FileText, Save, Printer,
  Bluetooth, Wifi, Usb, Monitor, CheckCircle2, XCircle,
  Loader2, RefreshCw, Link2, QrCode, Info, ShieldCheck, ExternalLink,
  AlertCircle, Zap, Upload, Trash2,
} from "lucide-react";
import {
  type PrinterConfig, type PrinterType, type PaperWidth,
  loadPrinterConfig, savePrinterConfig,
  loadPrinterManagerConfig, savePrinterManagerConfig, resetPrinterManager,
  type PrinterId, type PrinterManagerConfig, type ConnectionType,
  buildCashierReceipt, buildKitchenTicket, buildHallTicket,
  loadReceiptSettings, saveReceiptSettings,
  buildReceiptHtml, buildEscPos,
  printBluetooth, printNetwork, printUSB, validatePrinterConnection,
} from "@/lib/printer";
import toast from "react-hot-toast";

type Org = {
  id: string; name: string; slug: string; email: string; phone: string | null;
  logo: string | null;
  address: string | null; currency: string; timezone: string; locale: string;
  taxRate: number; receiptFooter: string | null; receiptHeader: string | null; website: string | null;
};

const CURRENCIES = [
  { value: "EGP", label: "جنيه مصري (EGP)" },
  { value: "SAR", label: "ريال سعودي (SAR)" },
  { value: "AED", label: "درهم إماراتي (AED)" },
  { value: "KWD", label: "دينار كويتي (KWD)" },
  { value: "USD", label: "دولار أمريكي (USD)" },
];
const TIMEZONES = [
  { value: "Africa/Cairo",  label: "القاهرة (GMT+2)" },
  { value: "Asia/Riyadh",   label: "الرياض (GMT+3)" },
  { value: "Asia/Dubai",    label: "دبي (GMT+4)" },
  { value: "Asia/Kuwait",   label: "الكويت (GMT+3)" },
];

const PAPER_WIDTHS: Array<{ value: PaperWidth; label: string; desc: string }> = [
  { value: 80, label: "80 ملم", desc: "الحجم الكبير للطابعات المكتبية" },
  { value: 58, label: "58 ملم", desc: "الحجم الشائع للطابعات المحمولة" },
];

const FONT_SCALES = [
  { value: "0.9", label: "صغير" },
  { value: "1", label: "عادي" },
  { value: "1.15", label: "كبير" },
  { value: "1.3", label: "كبير جداً" },
];

const PRINTER_TYPES: { value: PrinterType; label: string; icon: React.ElementType; desc: string }[] = [
  { value: "browser",   label: "طباعة المتصفح",  icon: Monitor,   desc: "يفتح نافذة طباعة المتصفح — يعمل على جميع الأجهزة" },
  { value: "bluetooth", label: "بلوتوث",          icon: Bluetooth, desc: "طابعة حرارية عبر بلوتوث BLE — يتطلب Chrome أو Edge" },
  { value: "network",   label: "شبكة (WiFi/LAN)", icon: Wifi,      desc: "إرسال أوامر ESC/POS مباشرة عبر IP الطابعة" },
  { value: "usb",       label: "USB",              icon: Usb,       desc: "طباعة عبر Web USB API (Chrome فقط)" },
];

const TEST_ITEMS = [
  { name: "Cappuccino", nameAr: "كابتشينو",  qty: 2, price: 25 },
  { name: "Cheesecake", nameAr: "تشيزكيك",  qty: 1, price: 35 },
];

// ── Printer Settings Sub-Component ─────────────────────────────────────────────
function PrinterSettings({ orgName }: { orgName: string }) {
  const [cfg, setCfg]         = useState<PrinterConfig>({ type: "browser" });
  const [testing, setTesting] = useState(false);
  const [validating, setValidating] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<"idle" | "validating" | "valid" | "invalid">("idle");
  const [connectionMessage, setConnectionMessage] = useState("");
  const [btStatus, setBtStatus] = useState<"idle" | "connecting" | "ok" | "error">("idle");
  const [btDevice, setBtDevice] = useState<string>("");

  useEffect(() => {
    const cfg = loadPrinterConfig();
    setCfg(cfg);
    if (cfg.type !== "bluetooth" || !cfg.bluetoothDeviceId || !("bluetooth" in navigator)) return;
    const bt = (navigator as any).bluetooth;
    if (typeof bt.getDevices !== "function") return;
    bt.getDevices().then((devices: any[]) => {
      const device = devices.find((d) => d.id === cfg.bluetoothDeviceId);
      if (device) {
        setBtDevice(cfg.bluetoothName || device.name || "");
        setBtStatus(device.gatt?.connected ? "ok" : "idle");
      }
    }).catch(() => {});
  }, []);

  function save() {
    savePrinterConfig(cfg);
    toast.success("تم حفظ إعدادات الطابعة");
  }

  async function validateConnection() {
    setValidating(true);
    setConnectionStatus("validating");
    try {
      const result = await validatePrinterConnection(cfg);
      setConnectionStatus(result.success ? "valid" : "invalid");
      setConnectionMessage(result.message);
      if (!result.success) {
        toast.error(result.message);
      } else {
        toast.success(result.message);
      }
    } catch (e: unknown) {
      setConnectionStatus("invalid");
      const msg = (e as Error).message || "فشل التحقق";
      setConnectionMessage(msg);
      toast.error(msg);
    } finally {
      setValidating(false);
    }
  }

  async function connectBluetooth() {
    setBtStatus("connecting");
    try {
      const escData = buildEscPos({
        orgName, orderNumber: "TEST",
        items: TEST_ITEMS,
        subtotal: 85, tax: 12.75, total: 97.75,
        paymentMethod: "نقداً", footer: "اختبار اتصال",
      }, { paperWidth: cfg.paperWidth, fontScale: cfg.fontScale });
      const result = await printBluetooth(escData, {
        deviceId: cfg.bluetoothDeviceId,
        deviceName: cfg.bluetoothName,
        maxRetries: cfg.retryAttempts ?? 3,
      });
      setBtDevice(result.name);
      setBtStatus("ok");
      const nextCfg = { ...cfg, bluetoothName: result.name, bluetoothDeviceId: result.id };
      setCfg(nextCfg);
      savePrinterConfig(nextCfg);
      toast.success(`تم الاتصال بـ ${result.name}`);
    } catch (e: unknown) {
      setBtStatus("error");
      toast.error((e as Error).message);
    }
  }

  async function testPrint() {
    setTesting(true);
    const rs = loadReceiptSettings();
    const receiptData = {
      orgName, orderNumber: "TEST-001",
      items: TEST_ITEMS,
      subtotal: 85, tax: 12.75, total: 97.75,
      paymentMethod: "نقداً",
      receiptHeader: rs.header || undefined,
      footer: orgName,
      orgWebsite: rs.website || undefined,
    };
    try {
      if (cfg.type === "browser") {
        throw new Error("الطباعة الحرارية المباشرة لا تستخدم نافذة المتصفح. اختر Bluetooth أو USB/OTG.");
      } else if (cfg.type === "bluetooth") {
        const result = await printBluetooth(buildEscPos(receiptData, { paperWidth: cfg.paperWidth, fontScale: cfg.fontScale }), {
          deviceId: cfg.bluetoothDeviceId,
          deviceName: cfg.bluetoothName,
          maxRetries: cfg.retryAttempts ?? 3,
        });
        const nextCfg = cfg.bluetoothDeviceId ? cfg : { ...cfg, bluetoothName: result.name, bluetoothDeviceId: result.id };
        if (!cfg.bluetoothDeviceId) { setCfg(nextCfg); savePrinterConfig(nextCfg); }
        toast.success(`تمت الطباعة عبر البلوتوث ${result.name ? `(${result.name})` : ""}`);
      } else if (cfg.type === "network") {
        if (!cfg.networkIp) { toast.error("أدخل عنوان IP الطابعة أولاً"); return; }
        await printNetwork(cfg.networkIp, cfg.networkPort ?? 9100, buildEscPos(receiptData, { paperWidth: cfg.paperWidth, fontScale: cfg.fontScale }));
        toast.success("تمت الطباعة عبر الشبكة");
      } else if (cfg.type === "usb") {
        await printUSB(buildEscPos(receiptData, { paperWidth: cfg.paperWidth, fontScale: cfg.fontScale }));
        toast.success("تمت الطباعة عبر USB");
      }
    } catch (e: unknown) {
      toast.error((e as Error).message || "فشلت الطباعة");
    } finally {
      setTesting(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Printer className="w-5 h-5 text-blue-600" />
          إعدادات الطابعة الحرارية
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6" dir="rtl">

        {/* Type selection */}
        <div>
          <p className="text-sm font-medium text-slate-700 mb-3">نوع الاتصال</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {PRINTER_TYPES.map(({ value, label, icon: Icon, desc }) => (
              <button
                key={value}
                onClick={() => { setCfg((p) => ({ ...p, type: value })); setBtStatus("idle"); setConnectionStatus("idle"); }}
                className={`flex items-start gap-3 p-4 rounded-xl border-2 text-right transition-all ${
                  cfg.type === value
                    ? "border-blue-500 bg-blue-50"
                    : "border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                }`}
              >
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${
                  cfg.type === value ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-500"
                }`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <p className={`text-sm font-semibold ${cfg.type === value ? "text-blue-700" : "text-slate-800"}`}>{label}</p>
                  <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{desc}</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Common settings */}
        {(cfg.type === "bluetooth" || cfg.type === "network" || cfg.type === "usb") && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-slate-700 mb-2">عرض الورقة</p>
              <Select
                value={String(cfg.paperWidth || 80)}
                onValueChange={(value) => setCfg((p) => ({ ...p, paperWidth: parseInt(value) as PaperWidth }))}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {PAPER_WIDTHS.map((width) => (
                    <SelectItem key={width.value} value={String(width.value)}>
                      {width.label} - {width.desc}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        )}

        {/* Bluetooth section */}
        {cfg.type === "bluetooth" && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 space-y-4">
            <div className="space-y-2">
              <p className="text-sm font-medium text-blue-800">إعدادات البلوتوث</p>
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                  btStatus === "ok"         ? "bg-green-100 text-green-600" :
                  btStatus === "error"      ? "bg-red-100 text-red-600" :
                  btStatus === "connecting" ? "bg-blue-100 text-blue-600" :
                                             "bg-slate-100 text-slate-400"
                }`}>
                  {btStatus === "connecting" ? <Loader2 className="w-4 h-4 animate-spin" /> :
                   btStatus === "ok"         ? <CheckCircle2 className="w-4 h-4" /> :
                   btStatus === "error"      ? <XCircle className="w-4 h-4" /> :
                                              <Bluetooth className="w-4 h-4" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-slate-700">
                    {btStatus === "ok"         ? `متصل بـ: ${btDevice}` :
                     btStatus === "error"      ? "فشل الاتصال" :
                     btStatus === "connecting" ? "جاري البحث..." :
                     btDevice                    ? `آخر جهاز: ${btDevice}` :
                                                "غير متصل"}
                  </p>
                  {cfg.bluetoothName && btStatus !== "ok" && (
                    <p className="text-xs text-slate-500">آخر اتصال: {cfg.bluetoothName}</p>
                  )}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={connectBluetooth}
                  disabled={btStatus === "connecting"}
                  className="flex-shrink-0"
                >
                  {btStatus === "connecting"
                    ? <><Loader2 className="w-3 h-3 animate-spin" /> جاري...</>
                    : <><RefreshCw className="w-3 h-3" /> {btStatus === "ok" ? "إعادة اتصال" : "بحث وطباعة"}</>}
                </Button>
              </div>
            </div>
            
            {/* Retry settings */}
            <div className="border-t border-blue-200 pt-4">
              <label className="text-sm font-medium text-blue-800 block mb-2">محاولات إعادة الاتصال</label>
              <Select
                value={String(cfg.retryAttempts ?? 3)}
                onValueChange={(value) => setCfg((p) => ({ ...p, retryAttempts: parseInt(value) }))}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">محاولة واحدة</SelectItem>
                  <SelectItem value="2">محاولتان</SelectItem>
                  <SelectItem value="3">3 محاولات (موصى به)</SelectItem>
                  <SelectItem value="5">5 محاولات</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <p className="text-xs text-blue-600 leading-relaxed">
              💡 تأكد من تشغيل البلوتوث على الجهاز وأن الطابعة قريبة ومشغّلة. يدعم طابعات BLE الحرارية (XP-P323B وغيرها).
            </p>
          </div>
        )}

        {/* Network section */}
        {cfg.type === "network" && (
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-4">
            <p className="text-sm font-medium text-slate-700">إعدادات الشبكة</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <Input
                  label="عنوان IP الطابعة"
                  placeholder="مثال: 192.168.1.100"
                  value={cfg.networkIp || ""}
                  onChange={(e) => setCfg((p) => ({ ...p, networkIp: e.target.value }))}
                  dir="ltr"
                />
              </div>
              <div>
                <Input
                  label="المنفذ (Port)"
                  placeholder="9100"
                  type="number"
                  value={cfg.networkPort ?? 9100}
                  onChange={(e) => setCfg((p) => ({ ...p, networkPort: Number(e.target.value) }))}
                  dir="ltr"
                />
              </div>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              💡 المنفذ الافتراضي للطابعات الحرارية الشبكية هو 9100. تأكد من أن الطابعة متصلة بنفس الشبكة.
            </p>
          </div>
        )}

        {/* USB section */}
        {cfg.type === "usb" && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
            <p className="text-sm font-medium text-amber-800 mb-1">طباعة USB</p>
            <p className="text-xs text-amber-700 leading-relaxed">
              يستخدم Web USB API المتاح في Chrome و Edge. سيطلب منك اختيار الجهاز عند الطباعة. يدعم معظم طابعات XPrinter وغيرها.
            </p>
          </div>
        )}

        {/* Connection status */}
        {connectionStatus !== "idle" && (
          <div className={`rounded-xl p-4 flex items-start gap-3 ${
            connectionStatus === "validating" ? "bg-blue-50 border border-blue-200" :
            connectionStatus === "valid" ? "bg-green-50 border border-green-200" :
            "bg-red-50 border border-red-200"
          }`}>
            <div className="flex-shrink-0 mt-0.5">
              {connectionStatus === "validating" && <Loader2 className="w-4 h-4 text-blue-600 animate-spin" />}
              {connectionStatus === "valid" && <CheckCircle2 className="w-4 h-4 text-green-600" />}
              {connectionStatus === "invalid" && <AlertCircle className="w-4 h-4 text-red-600" />}
            </div>
            <p className={`text-sm ${
              connectionStatus === "validating" ? "text-blue-700" :
              connectionStatus === "valid" ? "text-green-700" :
              "text-red-700"
            }`}>
              {connectionMessage}
            </p>
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-200">
          <Button onClick={save} size="sm">
            <Save className="w-4 h-4" /> حفظ الإعدادات
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={validateConnection}
            loading={validating}
            disabled={validating}
          >
            <Zap className="w-4 h-4" /> التحقق من الاتصال
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={testPrint}
            loading={testing}
            disabled={testing}
          >
            <Printer className="w-4 h-4" /> طباعة تجريبية
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// ── Main Component ──────────────────────────────────────────────────────────────
const PRINTER_IDS: PrinterId[] = ["cashier_printer", "kitchen_printer", "hall_printer"];
const PRINTER_LABELS: Record<PrinterId, { title: string; desc: string }> = {
  cashier_printer: { title: "طابعة الكاشير", desc: "فاتورة كاملة مع QR والإجماليات" },
  kitchen_printer: { title: "طابعة المطبخ", desc: "تفاصيل الطلب فقط بدون أسعار" },
  hall_printer: { title: "طابعة الصالة", desc: "طلبات الترابيزة بدون إجماليات" },
};

const DIRECT_CONNECTIONS: Array<{ value: ConnectionType; label: string; icon: React.ElementType }> = [
  { value: "bluetooth", label: "Bluetooth", icon: Bluetooth },
  { value: "usb", label: "USB / OTG", icon: Usb },
  { value: "network", label: "Network Bridge", icon: Wifi },
];

function PrinterDiagnostics({ orgName, orgLogo }: { orgName: string; orgLogo?: string | null }) {
  const [config, setConfig] = useState<PrinterManagerConfig>(() => loadPrinterManagerConfig());
  const [busy, setBusy] = useState<string | null>(null);
  const [logs, setLogs] = useState<string[]>([]);

  function updatePrinter(id: PrinterId, patch: Partial<PrinterManagerConfig[PrinterId]>) {
    setConfig((prev) => ({ ...prev, [id]: { ...prev[id], ...patch } }));
  }

  function saveAll() {
    savePrinterManagerConfig(config);
    resetPrinterManager(config);
    toast.success("تم حفظ إعدادات الطابعات");
  }

  async function run(id: PrinterId, type: "connect" | "print" | "qr") {
    setBusy(`${id}:${type}`);
    const manager = resetPrinterManager(config);
    try {
      if (type === "connect") {
        await manager.testConnection(id);
      } else if (id === "cashier_printer") {
        await manager.printCashierReceipt({
            orgName,
            logoUrl: orgLogo || undefined,
            orderNumber: "TEST-001",
            createdAt: new Date(),
            customerName: "عميل تجريبي",
            customerPhone: "01000000000",
            tableInfo: "طاولة 1",
            items: [
              { name: "Koshary", nameAr: "كشري", qty: 1, price: 45, notes: "بدون شطة" },
              { name: "Tea", nameAr: "شاي", qty: 2, price: 15 },
            ],
            subtotal: 75,
            tax: 11.25,
            total: 86.25,
            paymentMethod: "نقداً",
            qrData: "https://baseeta.shop",
            footer: "شكراً لزيارتكم",
          
        });
      } else if (id === "kitchen_printer") {
        await manager.print({
          printerId: id,
          description: "اختبار مطبخ",
          data: buildKitchenTicket({
            orderNumber: "K-100",
            tableInfo: "طاولة 4",
            orderType: "داخل المطعم",
            items: [
              { name: "Burger", nameAr: "برجر", qty: 2, notes: "واحد بدون بصل" },
              { name: "Fries", nameAr: "بطاطس", qty: 1, notes: "زيادة جبنة" },
            ],
          }, config.kitchen_printer),
        });
      } else {
        await manager.print({
          printerId: id,
          description: "اختبار صالة",
          data: buildHallTicket({
            orderNumber: "H-100",
            tableInfo: "طاولة 7",
            items: [
              { name: "Coffee", nameAr: "قهوة", qty: 2, notes: "سكر قليل" },
              { name: "Cake", nameAr: "كيك", qty: 1 },
            ],
          }, config.hall_printer),
        });
      }
      setLogs(manager.getLogs());
      toast.success("تم تنفيذ الاختبار");
    } catch (error) {
      setLogs(manager.getLogs());
      toast.error(error instanceof Error ? error.message : "فشل الاختبار");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader><CardTitle className="text-base flex items-center gap-2"><Printer className="w-5 h-5 text-blue-600" /> Printer Diagnostics</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-800 leading-relaxed">
            طباعة ESC/POS مباشرة من الهاتف بدون طباعة المتصفح. يدعم Bluetooth BLE و USB/OTG عبر Chrome و Edge، مع تجهيز العربية تلقائياً داخل خدمة الطباعة.
          </div>
          {PRINTER_IDS.map((id) => {
            const printer = config[id];
            return (
              <div key={id} className="rounded-xl border border-slate-200 p-4 space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-bold text-slate-900">{PRINTER_LABELS[id].title}</h3>
                    <p className="text-xs text-slate-500">{PRINTER_LABELS[id].desc}</p>
                    <p className="text-xs text-slate-400" dir="ltr">{id}</p>
                  </div>
                  <label className="flex items-center gap-2 text-sm text-slate-600">
                    <input type="checkbox" checked={printer.enabled} disabled={id === "cashier_printer"} onChange={(e) => updatePrinter(id, { enabled: e.target.checked })} />
                    مفعلة
                  </label>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {DIRECT_CONNECTIONS.map(({ value, label, icon: Icon }) => (
                    <button key={value} onClick={() => updatePrinter(id, { connectionType: value })} className={`rounded-lg border p-3 text-right ${printer.connectionType === value ? "border-blue-500 bg-blue-50" : "border-slate-200 hover:bg-slate-50"}`}>
                      <span className="flex items-center gap-2 text-sm font-semibold text-slate-800"><Icon className="w-4 h-4 text-blue-600" /> {label}</span>
                    </button>
                  ))}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <Input label="اسم الطابعة" value={printer.deviceName || ""} onChange={(e) => updatePrinter(id, { deviceName: e.target.value })} placeholder="XP-P323B" />
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Paper Width</label>
                    <Select value={String(printer.paperWidth)} onValueChange={(value) => updatePrinter(id, { paperWidth: Number(value) as PaperWidth })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="58">58mm</SelectItem>
                        <SelectItem value="80">80mm</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">مقاس الكلام</label>
                    <Select value={String(printer.fontScale || 1)} onValueChange={(value) => updatePrinter(id, { fontScale: Number(value) })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {FONT_SCALES.map((scale) => (
                          <SelectItem key={scale.value} value={scale.value}>{scale.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  {printer.connectionType === "network" && (
                    <>
                      <Input label="IP" value={printer.networkIp || ""} onChange={(e) => updatePrinter(id, { networkIp: e.target.value })} dir="ltr" />
                      <Input label="Port" type="number" value={printer.networkPort || 9100} onChange={(e) => updatePrinter(id, { networkPort: Number(e.target.value) })} dir="ltr" />
                      <p className="sm:col-span-3 rounded-lg bg-amber-50 border border-amber-200 px-3 py-2 text-xs text-amber-800 leading-relaxed">
                        اتصال Network يستخدم مسار HTTP: http://IP:PORT/print لإرسال أوامر ESC/POS. الطباعة الشبكية الخام على منفذ 9100 لا يمكن للمتصفح الاتصال بها مباشرة بدون Bridge.
                      </p>
                    </>
                  )}
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" size="sm" onClick={() => run(id, "connect")} loading={busy === `${id}:connect`}><RefreshCw className="w-4 h-4" /> اختبار اتصال</Button>
                  <Button variant="outline" size="sm" onClick={() => run(id, "print")} loading={busy === `${id}:print`}><FileText className="w-4 h-4" /> اختبار عربي</Button>
                  {id === "cashier_printer" && <Button variant="outline" size="sm" onClick={() => run(id, "qr")} loading={busy === `${id}:qr`}><QrCode className="w-4 h-4" /> اختبار QR</Button>}
                </div>
              </div>
            );
          })}
          <div className="flex justify-end"><Button onClick={saveAll}><Save className="w-4 h-4" /> حفظ إعدادات الطابعات</Button></div>
        </CardContent>
      </Card>
      {logs.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-base">Printer Logs</CardTitle></CardHeader>
          <CardContent><div className="max-h-48 overflow-y-auto rounded-lg bg-slate-950 p-3 text-xs text-slate-100" dir="ltr">{logs.map((line) => <div key={line}>{line}</div>)}</div></CardContent>
        </Card>
      )}
    </div>
  );
}

export function SettingsClient({ org, isPlatformAdmin }: { org: Org; isPlatformAdmin?: boolean }) {
  const [form, setForm] = useState({
    name: org.name, email: org.email, phone: org.phone || "",
    logo: org.logo || "",
    address: org.address || "", currency: org.currency, timezone: org.timezone,
    taxRate: String(org.taxRate * 100), receiptFooter: org.receiptFooter || "",
    receiptHeader: org.receiptHeader || "",
    website: org.website || "",
  });
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [receiptLocal, setReceiptLocal] = useState({ address: "", website: "", header: "" });
  const [receiptSaved, setReceiptSaved] = useState(false);

  useEffect(() => { setReceiptLocal(loadReceiptSettings()); }, []);

  function saveReceiptLocal() {
    saveReceiptSettings(receiptLocal);
    setReceiptSaved(true);
    toast.success("تم حفظ إعدادات الفاتورة");
    setTimeout(() => setReceiptSaved(false), 2000);
  }

  const qrPreviewUrl = form.website
    ? `https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${encodeURIComponent(form.website)}&margin=2`
    : "";

  async function save() {
    setIsSaving(true);
    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, taxRate: parseFloat(form.taxRate) / 100 }),
      });
      if (!res.ok) throw new Error();
      toast.success("تم حفظ الإعدادات");
    } catch {
      toast.error("فشل الحفظ");
    } finally {
      setIsSaving(false);
    }
  }

  async function uploadLogo(file: File) {
    if (!file.type.startsWith("image/")) {
      toast.error("اختر صورة للوجو فقط");
      return;
    }
    setIsUploadingLogo(true);
    try {
      const data = new FormData();
      data.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: data });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "فشل رفع اللوجو");
      setForm((prev) => ({ ...prev, logo: json.url }));
      toast.success("تم رفع اللوجو");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "فشل رفع اللوجو");
    } finally {
      setIsUploadingLogo(false);
    }
  }

  return (
    <main className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden">
      <Topbar title="الإعدادات" subtitle="إعدادات المطعم والكافيه والنظام" />

      <div className="p-4 sm:p-6 max-w-3xl" dir="rtl">
        {isPlatformAdmin && (
          <Card className="mb-6 border-violet-200 bg-violet-50">
            <CardContent className="flex items-center justify-between gap-4 p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-violet-600 rounded-xl flex items-center justify-center flex-shrink-0">
                  <ShieldCheck className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="font-semibold text-violet-900 text-sm">لوحة التحكم الكاملة</p>
                  <p className="text-xs text-violet-600">إدارة جميع الحسابات والاشتراكات على المنصة</p>
                </div>
              </div>
              <a
                href="/platform"
                className="flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium rounded-lg transition-colors flex-shrink-0"
              >
                <ExternalLink className="w-4 h-4" />
                الدخول
              </a>
            </CardContent>
          </Card>
        )}

        <Tabs defaultValue="general">
          <TabsList className="mb-6 flex-wrap gap-1">
            <TabsTrigger value="general"><Building2 className="w-4 h-4" /> عام</TabsTrigger>
            <TabsTrigger value="localization"><Globe className="w-4 h-4" /> الإقليمية</TabsTrigger>
            <TabsTrigger value="receipts"><FileText className="w-4 h-4" /> الفواتير</TabsTrigger>
            <TabsTrigger value="printer"><Printer className="w-4 h-4" /> الطابعة</TabsTrigger>
          </TabsList>

          <TabsContent value="general">
            <Card>
              <CardHeader><CardTitle>معلومات المطعم</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                    <div className="w-20 h-20 rounded-2xl bg-white border border-slate-200 overflow-hidden flex items-center justify-center flex-shrink-0">
                      {form.logo ? (
                        <img src={form.logo} alt="Logo" className="w-full h-full object-contain p-2" />
                      ) : (
                        <Building2 className="w-8 h-8 text-slate-300" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-slate-900">لوجو المطعم</p>
                      <p className="text-xs text-slate-500 mt-1">يظهر في الشريط الجانبي وأعلى فاتورة الكاشير بين الرسالة الترحيبية واسم المطعم.</p>
                      <div className="flex flex-wrap gap-2 mt-3">
                        <label className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium cursor-pointer hover:bg-blue-700 transition-colors">
                          {isUploadingLogo ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                          رفع لوجو
                          <input
                            type="file"
                            accept="image/png,image/jpeg,image/webp"
                            className="hidden"
                            disabled={isUploadingLogo}
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              e.currentTarget.value = "";
                              if (file) uploadLogo(file);
                            }}
                          />
                        </label>
                        {form.logo && (
                          <Button variant="outline" size="sm" onClick={() => setForm({ ...form, logo: "" })}>
                            <Trash2 className="w-4 h-4" /> حذف
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input label="اسم المطعم"         value={form.name}    onChange={(e) => setForm({ ...form, name: e.target.value })}    required />
                  <Input label="البريد الإلكتروني"  value={form.email}   onChange={(e) => setForm({ ...form, email: e.target.value })}   type="email" />
                  <Input label="رقم الهاتف"          value={form.phone}   onChange={(e) => setForm({ ...form, phone: e.target.value })}   type="tel" />
                  <Input label="العنوان"              value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
                </div>
                <div className="flex justify-end">
                  <Button onClick={save} loading={isSaving}><Save className="w-4 h-4" /> حفظ</Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="localization">
            <Card>
              <CardHeader><CardTitle>الإعدادات الإقليمية</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">العملة</label>
                    <Select value={form.currency} onValueChange={(v) => setForm({ ...form, currency: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{CURRENCIES.map((c) => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">المنطقة الزمنية</label>
                    <Select value={form.timezone} onValueChange={(v) => setForm({ ...form, timezone: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{TIMEZONES.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <Input
                    label="نسبة ضريبة القيمة المضافة (%)"
                    value={form.taxRate}
                    onChange={(e) => setForm({ ...form, taxRate: e.target.value })}
                    type="number" min="0" max="100"
                    startIcon={<Percent className="w-4 h-4" />}
                  />
                </div>
                <div className="flex justify-end">
                  <Button onClick={save} loading={isSaving}><Save className="w-4 h-4" /> حفظ</Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="receipts">
            <div className="space-y-4">
              {/* Info from general settings */}
              <Card>
                <CardHeader><CardTitle className="text-base">بيانات المطعم على الفاتورة</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-start gap-2 bg-blue-50 border border-blue-200 rounded-lg px-3 py-2 text-xs text-blue-700">
                    <Info className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                    <span>اسم المطعم والعنوان يؤخذان من تبويب «عام» ويظهران تلقائياً على الفاتورة.</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="bg-slate-50 rounded-lg px-3 py-2.5">
                      <p className="text-xs text-slate-400 mb-0.5">اسم المطعم</p>
                      <p className="text-sm font-semibold text-slate-800">{form.name || "—"}</p>
                    </div>
                    <div className="bg-slate-50 rounded-lg px-3 py-2.5">
                      <p className="text-xs text-slate-400 mb-0.5">العنوان</p>
                      <p className="text-sm text-slate-700">{form.address || "—"}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Extra receipt fields stored in localStorage */}
              <Card>
                <CardHeader><CardTitle className="text-base">تخصيص الفاتورة</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5 flex items-center gap-1.5">
                      <Link2 className="w-4 h-4 text-blue-500" />
                      رابط الموقع الإلكتروني
                    </label>
                    <Input
                      value={form.website}
                      onChange={(e) => setForm({ ...form, website: e.target.value })}
                      placeholder="https://example.com"
                      dir="ltr"
                    />
                    <p className="text-xs text-slate-400 mt-1">ينشئ QR Code للربط الموجود أعلاه وسيتم طباعته في أسفل الفاتورة بعد الحفظ.</p>
                  </div>

                  {/* QR Preview */}
                  {qrPreviewUrl && (
                    <div className="flex items-center gap-4 bg-slate-50 border border-slate-200 rounded-xl p-4">
                      <img src={qrPreviewUrl} width={80} height={80} alt="QR Preview" className="rounded-lg border border-slate-200 bg-white p-1 flex-shrink-0" />
                      <div>
                        <div className="flex items-center gap-1.5 mb-1">
                          <QrCode className="w-4 h-4 text-green-600" />
                          <p className="text-sm font-semibold text-slate-800">معاينة QR Code</p>
                        </div>
                        <p className="text-xs text-slate-500 break-all">{form.website.replace(/^https?:\/\//, "").replace(/\/$/, "")}</p>
                        <p className="text-xs text-green-600 mt-1">سيظهر هذا الكود في أسفل الفاتورة</p>
                      </div>
                    </div>
                  )}

                  <div className="flex justify-end pt-1 border-t border-slate-100">
                    <Button onClick={saveReceiptLocal}>
                      {receiptSaved ? <CheckCircle2 className="w-4 h-4" /> : <Save className="w-4 h-4" />}
                      {receiptSaved ? "تم الحفظ" : "حفظ إعدادات الفاتورة"}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Footer — saved to DB */}
              <Card>
                <CardHeader><CardTitle className="text-base">رأس وذيل الفاتورة</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">نص رسالة أعلى الفاتورة</label>
                    <textarea
                      value={form.receiptHeader}
                      onChange={(e) => setForm({ ...form, receiptHeader: e.target.value })}
                      placeholder="أهلاً بكم في مطعمنا"
                      rows={3}
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                    />
                    <p className="text-xs text-slate-400 mt-1">يظهر هذا النص في أعلى الفاتورة لجميع موظفي المطعم بعد الحفظ.</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">نص ذيل الفاتورة</label>
                    <textarea
                      value={form.receiptFooter}
                      onChange={(e) => setForm({ ...form, receiptFooter: e.target.value })}
                      placeholder="شكراً لزيارتكم، نتمنى أن تكونوا راضين..."
                      rows={3}
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                    />
                    <p className="text-xs text-slate-400 mt-1">يظهر في أسفل الفاتورة لجميع موظفي المطعم.</p>
                  </div>
                  <div className="flex justify-end">
                    <Button onClick={save} loading={isSaving}><Save className="w-4 h-4" /> حفظ</Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="printer">
            <PrinterDiagnostics orgName={org.name} orgLogo={form.logo || undefined} />
          </TabsContent>
        </Tabs>
      </div>
    </main>
  );
}
