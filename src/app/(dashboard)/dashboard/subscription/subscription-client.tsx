"use client";
import { useState, useRef } from "react";
import { useSearchParams } from "next/navigation";
import {
  Check, Star, Zap, Crown, AlertTriangle, Clock, CheckCircle,
  Phone, Upload, X, Loader2, Copy, Building2,
  ArrowRight, Shield, RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Topbar } from "@/components/layout/topbar";
import { formatDate } from "@/lib/utils";
import toast from "react-hot-toast";

const STATUS_MAP = {
  TRIALING: { label: "تجربة مجانية", color: "text-blue-600 bg-blue-50", icon: Clock },
  ACTIVE: { label: "نشط", color: "text-green-600 bg-green-50", icon: CheckCircle },
  PAST_DUE: { label: "متأخر في الدفع", color: "text-red-600 bg-red-50", icon: AlertTriangle },
  CANCELED: { label: "ملغي", color: "text-slate-600 bg-slate-50", icon: X },
  INCOMPLETE: { label: "غير مكتمل", color: "text-amber-600 bg-amber-50", icon: AlertTriangle },
  PAUSED: { label: "موقوف", color: "text-orange-600 bg-orange-50", icon: AlertTriangle },
};

const PLANS = {
  BASIC: {
    name: "أساسي",
    price: 1000,
    color: "blue",
    icon: Zap,
    features: ["فرع واحد", "5 مستخدمين", "100 صنف", "نقطة البيع", "إدارة الطاولات", "تقارير أساسية"],
  },
  PRO: {
    name: "احترافي",
    price: 2500,
    color: "purple",
    icon: Star,
    popular: true,
    features: ["3 فروع", "20 مستخدم", "500 صنف", "كل ميزات الأساسي", "إدارة المخزون", "تقارير متقدمة", "دعم أولوي"],
  },
  PREMIUM: {
    name: "بريميوم",
    price: 5000,
    color: "amber",
    icon: Crown,
    features: ["فروع غير محدودة", "مستخدمون غير محدودون", "أصناف غير محدودة", "كل ميزات الاحترافي", "مدير حساب مخصص", "دعم 24/7"],
  },
};

const BANK = {
  iban: "EG620002039803980333000049873",
  account: "3980333000049873",
  swift: "BMISEGCXXXX",
  name: "بنك مصر",
  holder: "بسيطة للتقنية",
};

const INSTAPAY_NUMBER = "+201090886364";

interface SubscriptionClientProps {
  subscription: { status: string; trialEnd: Date | null; currentPeriodEnd: Date | null; plan: { name: string; nameAr: string } | null } | null;
  orgStats: { branches: number; users: number; menuItems: number };
  pendingRequest: { id: string; status: string; planKey: string; createdAt: Date } | null;
}

export function SubscriptionClient({ subscription, orgStats, pendingRequest }: SubscriptionClientProps) {
  const searchParams = useSearchParams();
  const isExpired = searchParams.get("expired") === "1";

  const [step, setStep] = useState<"plans" | "pay" | "done">("plans");
  const [selectedPlan, setSelectedPlan] = useState<keyof typeof PLANS | null>(null);
  const [payMethod, setPayMethod] = useState<"INSTAPAY" | "BANK_TRANSFER">("INSTAPAY");
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [receiptPreview, setReceiptPreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const statusConfig = subscription ? STATUS_MAP[subscription.status as keyof typeof STATUS_MAP] : null;
  const StatusIcon = statusConfig?.icon || Clock;

  function copyText(text: string) {
    navigator.clipboard.writeText(text);
    toast.success("تم النسخ");
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) { toast.error("الملف كبير جداً (الحد 10 ميجا)"); return; }
    setReceiptFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setReceiptPreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  }

  async function uploadAndSubmit() {
    if (!receiptFile || !selectedPlan) return;
    setIsUploading(true);
    try {
      const form = new FormData();
      form.append("file", receiptFile);
      const uploadRes = await fetch("/api/upload", { method: "POST", body: form });
      if (!uploadRes.ok) throw new Error("فشل رفع الإيصال");
      const { url } = await uploadRes.json();

      setIsUploading(false);
      setIsSubmitting(true);

      const res = await fetch("/api/payment-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planKey: selectedPlan, method: payMethod, receiptUrl: url }),
      });

      if (!res.ok) throw new Error("فشل إرسال الطلب");
      toast.success("تم إرسال طلب الاشتراك بنجاح!");
      setStep("done");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "حدث خطأ");
    } finally {
      setIsUploading(false);
      setIsSubmitting(false);
    }
  }

  const planPrice = selectedPlan ? PLANS[selectedPlan].price : 0;
  const planName = selectedPlan ? PLANS[selectedPlan].name : "";

  return (
    <main className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden">
      <Topbar title="الاشتراك" subtitle="إدارة خطة اشتراكك" />

      <div className="p-3 sm:p-4 md:p-6 max-w-4xl mx-auto space-y-5" dir="rtl">

        {/* Expired Banner */}
        {isExpired && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-red-800">انتهت فترة التجربة المجانية</p>
              <p className="text-sm text-red-600 mt-0.5">يرجى الاشتراك لمواصلة استخدام التطبيق. خدمتك ستستمر 24 ساعة بعد رفع إيصال الدفع.</p>
            </div>
          </div>
        )}

        {/* Pending request banner */}
        {pendingRequest && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
            <Clock className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-amber-800">طلب قيد المراجعة</p>
              <p className="text-sm text-amber-600">
                طلب الاشتراك في باقة <strong>{PLANS[pendingRequest.planKey as keyof typeof PLANS]?.name}</strong> قيد المراجعة.
                سيتم تفعيل اشتراكك خلال 24 ساعة.
              </p>
            </div>
          </div>
        )}

        {/* Current status */}
        {subscription && !isExpired && (
          <Card>
            <CardContent className="p-4 sm:p-5">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-3">
                  <div className={`inline-flex items-center gap-1.5 text-sm font-medium px-3 py-1.5 rounded-full ${statusConfig?.color}`}>
                    <StatusIcon className="w-4 h-4" />
                    {statusConfig?.label}
                  </div>
                  <span className="text-slate-700 font-semibold">
                    خطة {subscription.plan?.nameAr || subscription.plan?.name || "تجريبية"}
                  </span>
                </div>
                {subscription.trialEnd && subscription.status === "TRIALING" && (
                  <p className="text-sm text-slate-500">
                    تنتهي التجربة: <span className="font-medium text-blue-600">{formatDate(subscription.trialEnd)}</span>
                  </p>
                )}
                {subscription.currentPeriodEnd && subscription.status === "ACTIVE" && (
                  <p className="text-sm text-slate-500">
                    تجديد الاشتراك: <span className="font-medium">{formatDate(subscription.currentPeriodEnd)}</span>
                  </p>
                )}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4">
                {[
                  { label: "الفروع", value: orgStats.branches },
                  { label: "الموظفون", value: orgStats.users },
                  { label: "الأصناف", value: orgStats.menuItems },
                ].map((s) => (
                  <div key={s.label} className="bg-slate-50 rounded-xl p-3 text-center">
                    <p className="text-xl font-bold text-slate-900">{s.value}</p>
                    <p className="text-xs text-slate-500">{s.label}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* STEP 1: Choose plan */}
        {step === "plans" && (
          <>
            <h2 className="text-lg font-bold text-slate-900">اختر الباقة المناسبة</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {(Object.entries(PLANS) as [keyof typeof PLANS, typeof PLANS[keyof typeof PLANS]][]).map(([key, plan]) => {
                const Icon = plan.icon;
                const isSelected = selectedPlan === key;
                return (
                  <button
                    key={key}
                    onClick={() => setSelectedPlan(key)}
                    className={`relative text-right rounded-2xl border-2 p-5 transition-all duration-150 hover:shadow-md ${
                      isSelected ? "border-blue-500 bg-blue-50 shadow-blue-100 shadow-lg" : "border-slate-200 bg-white hover:border-slate-300"
                    }`}
                  >
                    {"popular" in plan && plan.popular && (
                      <div className="absolute top-0 inset-x-0 bg-blue-600 text-white text-xs font-semibold text-center py-1 rounded-t-2xl">
                        الأكثر شيوعاً ⭐
                      </div>
                    )}
                    <div className={`mt-${("popular" in plan && plan.popular) ? "5" : "0"} flex items-center gap-2 mb-3`}>
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${isSelected ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-600"}`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <span className="font-bold text-slate-900">{plan.name}</span>
                      {isSelected && <Check className="w-4 h-4 text-blue-600 mr-auto" />}
                    </div>
                    <div className="mb-4">
                      <span className="text-3xl font-black text-slate-900">{plan.price.toLocaleString("ar-EG")}</span>
                      <span className="text-slate-500 text-sm"> ج.م / شهر</span>
                    </div>
                    <div className="space-y-1.5">
                      {plan.features.map((f) => (
                        <div key={f} className="flex items-center gap-2 text-xs text-slate-600">
                          <Check className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />
                          {f}
                        </div>
                      ))}
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="flex justify-end">
              <Button
                disabled={!selectedPlan}
                onClick={() => setStep("pay")}
                className="gap-2"
              >
                متابعة للدفع <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </>
        )}

        {/* STEP 2: Payment */}
        {step === "pay" && selectedPlan && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <button onClick={() => setStep("plans")} className="text-sm text-blue-600 hover:underline flex items-center gap-1">
                ← العودة لاختيار الباقة
              </button>
            </div>

            <Card className="border-blue-200 bg-blue-50">
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500">الباقة المختارة</p>
                  <p className="font-bold text-slate-900 text-lg">{planName}</p>
                </div>
                <div className="text-left">
                  <p className="text-sm text-slate-500">المبلغ</p>
                  <p className="font-black text-2xl text-blue-700">{planPrice.toLocaleString("ar-EG")} ج.م</p>
                </div>
              </CardContent>
            </Card>

            {/* Payment method tabs */}
            <div>
              <p className="font-semibold text-slate-800 mb-3">اختر طريقة الدفع</p>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setPayMethod("INSTAPAY")}
                  className={`p-4 rounded-xl border-2 text-right transition-all ${payMethod === "INSTAPAY" ? "border-blue-500 bg-blue-50" : "border-slate-200 bg-white hover:border-slate-300"}`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-7 h-7 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Phone className="w-4 h-4 text-blue-600" />
                    </div>
                    <span className="font-semibold text-slate-800">إنستاباي</span>
                    {payMethod === "INSTAPAY" && <Check className="w-4 h-4 text-blue-500 mr-auto" />}
                  </div>
                  <p className="text-xs text-slate-500">دفع فوري عبر تطبيق InstaPay</p>
                </button>
                <button
                  onClick={() => setPayMethod("BANK_TRANSFER")}
                  className={`p-4 rounded-xl border-2 text-right transition-all ${payMethod === "BANK_TRANSFER" ? "border-blue-500 bg-blue-50" : "border-slate-200 bg-white hover:border-slate-300"}`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-7 h-7 bg-green-100 rounded-lg flex items-center justify-center">
                      <Building2 className="w-4 h-4 text-green-600" />
                    </div>
                    <span className="font-semibold text-slate-800">تحويل بنكي</span>
                    {payMethod === "BANK_TRANSFER" && <Check className="w-4 h-4 text-blue-500 mr-auto" />}
                  </div>
                  <p className="text-xs text-slate-500">تحويل عبر البنك</p>
                </button>
              </div>
            </div>

            {/* Payment details */}
            {payMethod === "INSTAPAY" ? (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Phone className="w-4 h-4 text-blue-600" /> تعليمات InstaPay
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="bg-blue-50 rounded-xl p-4">
                    <p className="text-sm text-slate-600 mb-2">حوّل المبلغ إلى رقم InstaPay التالي:</p>
                    <div className="flex items-center justify-between bg-white rounded-lg p-3 border border-blue-200">
                      <span className="text-xl font-bold text-blue-700 tracking-wide">{INSTAPAY_NUMBER}</span>
                      <button onClick={() => copyText(INSTAPAY_NUMBER)} className="p-1.5 hover:bg-blue-50 rounded-lg transition-colors">
                        <Copy className="w-4 h-4 text-slate-400" />
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 bg-amber-50 rounded-lg p-3 text-sm text-amber-700">
                    <Shield className="w-4 h-4 flex-shrink-0" />
                    <p>اكتب اسم الباقة في ملاحظات التحويل: <strong>بسيطة - {planName}</strong></p>
                  </div>
                  <ol className="text-sm text-slate-600 space-y-1.5 list-decimal list-inside">
                    <li>افتح تطبيق InstaPay</li>
                    <li>اختر "تحويل" وأدخل الرقم أعلاه</li>
                    <li>أدخل المبلغ: <strong>{planPrice.toLocaleString("ar-EG")} ج.م</strong></li>
                    <li>اكتب في الملاحظات: بسيطة - {planName}</li>
                    <li>التقط لقطة شاشة بالإيصال وارفعها أدناه</li>
                  </ol>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-green-600" /> بيانات التحويل البنكي
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {[
                    { label: "اسم البنك", value: BANK.name },
                    { label: "اسم صاحب الحساب", value: BANK.holder },
                    { label: "رقم الحساب", value: BANK.account, copy: true },
                    { label: "IBAN", value: BANK.iban, copy: true },
                    { label: "SWIFT Code", value: BANK.swift, copy: true },
                  ].map((row) => (
                    <div key={row.label} className="flex items-center justify-between bg-slate-50 rounded-lg px-3 py-2.5">
                      <div className="min-w-0">
                        <p className="text-xs text-slate-400 mb-0.5">{row.label}</p>
                        <p className="text-sm font-mono font-semibold text-slate-800 truncate">{row.value}</p>
                      </div>
                      {row.copy && (
                        <button onClick={() => copyText(row.value)} className="p-1.5 hover:bg-slate-200 rounded-lg transition-colors flex-shrink-0">
                          <Copy className="w-4 h-4 text-slate-400" />
                        </button>
                      )}
                    </div>
                  ))}
                  <div className="flex items-center gap-2 bg-amber-50 rounded-lg p-3 text-sm text-amber-700 mt-2">
                    <Shield className="w-4 h-4 flex-shrink-0" />
                    <p>اكتب في بيان التحويل: <strong>بسيطة - {planName}</strong></p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Receipt upload */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Upload className="w-4 h-4 text-slate-600" /> رفع إيصال الدفع
                </CardTitle>
              </CardHeader>
              <CardContent>
                <input ref={fileRef} type="file" accept="image/*,application/pdf" className="hidden" onChange={handleFileChange} />

                {!receiptFile ? (
                  <button
                    onClick={() => fileRef.current?.click()}
                    className="w-full border-2 border-dashed border-slate-300 rounded-xl p-8 text-center hover:border-blue-400 hover:bg-blue-50 transition-all"
                  >
                    <Upload className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <p className="text-sm text-slate-500 font-medium">انقر لرفع الإيصال</p>
                    <p className="text-xs text-slate-400 mt-1">صورة أو PDF - حجم أقصى 10 ميجا</p>
                  </button>
                ) : (
                  <div className="relative">
                    <img
                      src={receiptPreview || ""}
                      alt="إيصال الدفع"
                      className="w-full max-h-48 object-contain rounded-xl border border-slate-200 bg-slate-50"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = "";
                        (e.target as HTMLImageElement).style.display = "none";
                      }}
                    />
                    <div className="mt-2 flex items-center justify-between text-sm">
                      <span className="text-slate-600 truncate">{receiptFile.name}</span>
                      <button onClick={() => { setReceiptFile(null); setReceiptPreview(null); }} className="text-red-500 hover:text-red-700 flex items-center gap-1 text-xs">
                        <X className="w-3.5 h-3.5" /> إزالة
                      </button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Button
              className="w-full h-12 text-base"
              disabled={!receiptFile || isUploading || isSubmitting}
              onClick={uploadAndSubmit}
            >
              {(isUploading || isSubmitting) && <Loader2 className="w-4 h-4 animate-spin" />}
              {isUploading ? "جاري رفع الإيصال..." : isSubmitting ? "جاري إرسال الطلب..." : "إرسال طلب الاشتراك"}
            </Button>

            <p className="text-center text-xs text-slate-400">
              بعد الإرسال ستستمر الخدمة 24 ساعة ريثما تتم مراجعة الطلب وتفعيل الاشتراك
            </p>
          </div>
        )}

        {/* STEP 3: Done */}
        {step === "done" && (
          <Card className="border-green-200 bg-green-50">
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">تم إرسال طلبك بنجاح!</h3>
              <p className="text-slate-600 mb-1">إيصالك في مرحلة المراجعة.</p>
              <p className="text-sm text-slate-500 mb-6">ستستمر خدمتك لمدة <strong>24 ساعة</strong> ريثما يتم التحقق من الدفع وتفعيل الاشتراك.</p>
              <div className="flex items-center justify-center gap-2 text-sm text-slate-500 bg-white rounded-xl p-3 border border-slate-200">
                <RefreshCw className="w-4 h-4" />
                <span>للمساعدة: <strong dir="ltr">+201090886364</strong></span>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </main>
  );
}
