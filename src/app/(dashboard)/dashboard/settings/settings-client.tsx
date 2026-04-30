"use client";
import { useState } from "react";
import { Topbar } from "@/components/layout/topbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Building2, Globe, Percent, FileText, Save } from "lucide-react";
import toast from "react-hot-toast";

type Org = {
  id: string; name: string; slug: string; email: string; phone: string | null;
  address: string | null; currency: string; timezone: string; locale: string;
  taxRate: number; receiptFooter: string | null;
};

const CURRENCIES = [{ value: "SAR", label: "ريال سعودي (SAR)" }, { value: "AED", label: "درهم إماراتي (AED)" }, { value: "KWD", label: "دينار كويتي (KWD)" }, { value: "USD", label: "دولار أمريكي (USD)" }];
const TIMEZONES = [{ value: "Asia/Riyadh", label: "الرياض (GMT+3)" }, { value: "Asia/Dubai", label: "دبي (GMT+4)" }, { value: "Asia/Kuwait", label: "الكويت (GMT+3)" }];

export function SettingsClient({ org }: { org: Org }) {
  const [form, setForm] = useState({
    name: org.name, email: org.email, phone: org.phone || "",
    address: org.address || "", currency: org.currency, timezone: org.timezone,
    taxRate: String(org.taxRate * 100), receiptFooter: org.receiptFooter || "",
  });
  const [isSaving, setIsSaving] = useState(false);

  async function save() {
    setIsSaving(true);
    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          taxRate: parseFloat(form.taxRate) / 100,
        }),
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
    <main className="flex-1 overflow-auto">
      <Topbar title="الإعدادات" subtitle="إعدادات المطعم والنظام" />

      <div className="p-6 max-w-3xl" dir="rtl">
        <Tabs defaultValue="general">
          <TabsList className="mb-6">
            <TabsTrigger value="general"><Building2 className="w-4 h-4" /> عام</TabsTrigger>
            <TabsTrigger value="localization"><Globe className="w-4 h-4" /> الإعدادات الإقليمية</TabsTrigger>
            <TabsTrigger value="receipts"><FileText className="w-4 h-4" /> الفواتير</TabsTrigger>
          </TabsList>

          <TabsContent value="general">
            <Card>
              <CardHeader><CardTitle>معلومات المطعم</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <Input label="اسم المطعم" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
                  <Input label="البريد الإلكتروني" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} type="email" />
                  <Input label="رقم الهاتف" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} type="tel" />
                  <Input label="العنوان" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="localization">
            <Card>
              <CardHeader><CardTitle>الإعدادات الإقليمية</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
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
                  <div>
                    <Input
                      label="نسبة ضريبة القيمة المضافة (%)"
                      value={form.taxRate}
                      onChange={(e) => setForm({ ...form, taxRate: e.target.value })}
                      type="number"
                      min="0"
                      max="100"
                      startIcon={<Percent className="w-4 h-4" />}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="receipts">
            <Card>
              <CardHeader><CardTitle>إعدادات الفاتورة</CardTitle></CardHeader>
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
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="mt-6 flex justify-end">
          <Button onClick={save} loading={isSaving}>
            <Save className="w-4 h-4" /> حفظ الإعدادات
          </Button>
        </div>
      </div>
    </main>
  );
}
