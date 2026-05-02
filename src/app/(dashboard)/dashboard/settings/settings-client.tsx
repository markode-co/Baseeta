"use client";
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
} from "lucide-react";
import {
  type PrinterConfig, type PrinterType,
  loadPrinterConfig, savePrinterConfig,
  loadReceiptSettings, saveReceiptSettings,
  buildReceiptHtml, buildEscPos,
  printBrowser, printBluetooth, printNetwork,
} from "@/lib/printer";
import toast from "react-hot-toast";

type Org = {
  id: string; name: string; slug: string; email: string; phone: string | null;
  address: string | null; currency: string; timezone: string; locale: string;
  taxRate: number; receiptFooter: string | null;
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

const PRINTER_TYPES: { value: PrinterType; label: string; icon: React.ElementType; desc: string }[] = [
  { value: "browser",   label: "طباعة المتصفح",  icon: Monitor,   desc: "يفتح نافذة طباعة المتصفح — يعمل على جميع الأجهزة" },
  { value: "bluetooth", label: "بلوتوث",          icon: Bluetooth, desc: "طابعة حرارية عبر بلوتوث BLE — يتطلب Chrome أو Edge" },
  { value: "network",   label: "شبكة (WiFi/LAN)", icon: Wifi,      desc: "إرسال أوامر ESC/POS مباشرة عبر IP الطابعة" },
  { value: "usb",       label: "USB",              icon: Usb,       desc: "طباعة عبر Web USB API — تجريبي" },
];

const TEST_ITEMS = [
  { name: "Cappuccino", nameAr: "كابتشينو",  qty: 2, price: 25 },
  { name: "Cheesecake", nameAr: "تشيزكيك",  qty: 1, price: 35 },
];

// ── Printer Settings Sub-Component ─────────────────────────────────────────────
function PrinterSettings({ orgName }: { orgName: string }) {
  const [cfg, setCfg]         = useState<PrinterConfig>({ type: "browser" });
  const [testing, setTesting] = useState(false);
  const [btStatus, setBtStatus] = useState<"idle" | "connecting" | "ok" | "error">("idle");
  const [btDevice, setBtDevice] = useState<string>("");

  useEffect(() => { setCfg(loadPrinterConfig()); }, []);

  function save() {
    savePrinterConfig(cfg);
    toast.success("تم حفظ إعدادات الطابعة");
  }

  async function connectBluetooth() {
    setBtStatus("connecting");
    try {
      const escData = buildEscPos({
        orgName, orderNumber: "TEST",
        items: TEST_ITEMS,
        subtotal: 85, tax: 12.75, total: 97.75,
        paymentMethod: "نقداً", footer: "اختبار اتصال",
      });
      const name = await printBluetooth(escData);
      setBtDevice(name);
      setBtStatus("ok");
      setCfg((prev) => ({ ...prev, bluetoothName: name }));
      toast.success(`تم الاتصال بـ ${name}`);
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
      paymentMethod: "نقداً", footer: orgName,
      orgWebsite: rs.website || undefined,
      receiptHeader: rs.header || undefined,
    };
    try {
      if (cfg.type === "browser" || cfg.type === "usb") {
        await printBrowser(buildReceiptHtml(receiptData));
        toast.success("تم إرسال الطباعة للمتصفح");
      } else if (cfg.type === "bluetooth") {
        const name = await printBluetooth(buildEscPos(receiptData));
        toast.success(`تمت الطباعة عبر البلوتوث ${name ? `(${name})` : ""}`);
      } else if (cfg.type === "network") {
        if (!cfg.networkIp) { toast.error("أدخل عنوان IP الطابعة أولاً"); return; }
        await printNetwork(cfg.networkIp, cfg.networkPort ?? 9100, buildEscPos(receiptData));
        toast.success("تمت الطباعة عبر الشبكة");
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
          إعدادات الطابعة
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
                onClick={() => { setCfg((p) => ({ ...p, type: value })); setBtStatus("idle"); }}
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

        {/* Bluetooth section */}
        {cfg.type === "bluetooth" && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 space-y-3">
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
                   btStatus === "connecting" ? "جارٍ البحث..." :
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
                  ? <><Loader2 className="w-3 h-3 animate-spin" /> جارٍ...</>
                  : <><RefreshCw className="w-3 h-3" /> {btStatus === "ok" ? "إعادة اتصال" : "بحث وطباعة"}</>}
              </Button>
            </div>
            <p className="text-xs text-blue-600 leading-relaxed">
              💡 تأكد من تشغيل البلوتوث على الجهاز وأن الطابعة قريبة ومشغّلة. يدعم طابعات BLE الحرارية (58mm / 80mm).
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
              يستخدم Web USB API المتاح في Chrome. سيُطلب منك اختيار الجهاز عند الطباعة. تُعامَل حالياً كطباعة المتصفح.
            </p>
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-slate-200">
          <Button onClick={save}>
            <Save className="w-4 h-4" /> حفظ الإعدادات
          </Button>
          <Button
            variant="outline"
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
export function SettingsClient({ org, isPlatformAdmin }: { org: Org; isPlatformAdmin?: boolean }) {
  const [form, setForm] = useState({
    name: org.name, email: org.email, phone: org.phone || "",
    address: org.address || "", currency: org.currency, timezone: org.timezone,
    taxRate: String(org.taxRate * 100), receiptFooter: org.receiptFooter || "",
  });
  const [isSaving, setIsSaving] = useState(false);
  const [receiptLocal, setReceiptLocal] = useState({ address: "", website: "", header: "" });
  const [receiptSaved, setReceiptSaved] = useState(false);

  useEffect(() => { setReceiptLocal(loadReceiptSettings()); }, []);

  function saveReceiptLocal() {
    saveReceiptSettings(receiptLocal);
    setReceiptSaved(true);
    toast.success("تم حفظ إعدادات الفاتورة");
    setTimeout(() => setReceiptSaved(false), 2000);
  }

  const qrPreviewUrl = receiptLocal.website
    ? `https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${encodeURIComponent(receiptLocal.website)}&margin=2`
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

  return (
    <main className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden">
      <Topbar title="الإعدادات" subtitle="إعدادات المطعم والنظام" />

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
                    <span>اسم المطعم والعنوان يُؤخذان من تبويب «عام» ويظهران تلقائياً على الفاتورة.</span>
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
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">نص الترحيب (أعلى الفاتورة)</label>
                    <Input
                      value={receiptLocal.header}
                      onChange={(e) => setReceiptLocal({ ...receiptLocal, header: e.target.value })}
                      placeholder="أهلاً بكم في مطعمنا"
                    />
                    <p className="text-xs text-slate-400 mt-1">يظهر بخط صغير فوق اسم المطعم</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5 flex items-center gap-1.5">
                      <Link2 className="w-4 h-4 text-blue-500" />
                      رابط الموقع الإلكتروني
                    </label>
                    <Input
                      value={receiptLocal.website}
                      onChange={(e) => setReceiptLocal({ ...receiptLocal, website: e.target.value })}
                      placeholder="https://example.com"
                      dir="ltr"
                    />
                    <p className="text-xs text-slate-400 mt-1">يظهر كـ QR Code في أسفل الفاتورة — عند مسحه يفتح الموقع مباشرة</p>
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
                        <p className="text-xs text-slate-500 break-all">{receiptLocal.website.replace(/^https?:\/\//, "").replace(/\/$/, "")}</p>
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
                <CardHeader><CardTitle className="text-base">ذيل الفاتورة</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">نص ذيل الفاتورة</label>
                    <textarea
                      value={form.receiptFooter}
                      onChange={(e) => setForm({ ...form, receiptFooter: e.target.value })}
                      placeholder="شكراً لزيارتكم، نتمنى أن تكونوا راضين..."
                      rows={3}
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                    />
                  </div>
                  <div className="flex justify-end">
                    <Button onClick={save} loading={isSaving}><Save className="w-4 h-4" /> حفظ</Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="printer">
            <PrinterSettings orgName={org.name} />
          </TabsContent>
        </Tabs>
      </div>
    </main>
  );
}
