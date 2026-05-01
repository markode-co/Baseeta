"use client";
import { useState } from "react";
import { Check, Star, Zap, Crown, ArrowRight, Users, Store, UtensilsCrossed, AlertCircle, Phone, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Topbar } from "@/components/layout/topbar";
import { formatDate } from "@/lib/utils";
import toast from "react-hot-toast";

const STATUS_MAP = {
  TRIALING: { label: "تجربة مجانية", color: "text-blue-600 bg-blue-50", icon: Zap },
  ACTIVE: { label: "نشط", color: "text-green-600 bg-green-50", icon: Check },
  PAST_DUE: { label: "متأخر", color: "text-red-600 bg-red-50", icon: AlertCircle },
  CANCELED: { label: "ملغي", color: "text-slate-600 bg-slate-50", icon: AlertCircle },
  INCOMPLETE: { label: "غير مكتمل", color: "text-amber-600 bg-amber-50", icon: AlertCircle },
  PAUSED: { label: "موقوف", color: "text-orange-600 bg-orange-50", icon: AlertCircle },
};

const PLAN_ICONS = { BASIC: Zap, PRO: Star, PREMIUM: Crown };

const COUNTRIES = [
  { code: "EG", label: "🇪🇬 مصر",       currency: "EGP", symbol: "ج.م", rate: 1    },
  { code: "SA", label: "🇸🇦 السعودية",  currency: "SAR", symbol: "ر.س", rate: 1/14  },
  { code: "AE", label: "🇦🇪 الإمارات",  currency: "AED", symbol: "د.إ", rate: 1/12  },
  { code: "KW", label: "🇰🇼 الكويت",    currency: "KWD", symbol: "د.ك", rate: 1/100 },
  { code: "US", label: "🇺🇸 الولايات المتحدة", currency: "USD", symbol: "$",   rate: 1/40  },
];

interface Plan {
  name: string; nameEn: string; price: number; currency: string;
  maxBranches: number; maxUsers: number; maxMenuItems: number;
  features: string[]; isPopular?: boolean;
}

export function SubscriptionClient({ subscription, plans, orgStats }: {
  subscription: { status: string; trialEnd: Date | null; currentPeriodEnd: Date | null; plan: { name: string; nameAr: string } | null } | null;
  plans: Record<string, Plan>;
  orgStats: { branches: number; users: number; menuItems: number };
}) {
  const [countryCode, setCountryCode] = useState("EG");

  async function handleManage() {
    try {
      const res = await fetch("/api/subscription/portal", { method: "POST" });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
    } catch {
      toast.error("فشل فتح بوابة الإدارة");
    }
  }

  const statusConfig = subscription ? STATUS_MAP[subscription.status as keyof typeof STATUS_MAP] : null;
  const StatusIcon = statusConfig?.icon || AlertCircle;
  const country = COUNTRIES.find((c) => c.code === countryCode) ?? COUNTRIES[0];

  function convertPrice(priceEgp: number) {
    const converted = priceEgp * country.rate;
    if (country.currency === "EGP") return Math.round(converted).toLocaleString("ar-EG");
    if (country.rate < 0.05) return converted.toFixed(1);
    return Math.round(converted).toLocaleString("ar-EG");
  }

  return (
    <main className="flex-1 overflow-auto">
      <Topbar title="الاشتراك" subtitle="إدارة خطة اشتراكك" />

      <div className="p-6 space-y-6 max-w-5xl mx-auto" dir="rtl">
        {/* Current Plan Status */}
        {subscription && (
          <Card className="border-blue-200 bg-gradient-to-l from-blue-50 to-white">
            <CardContent className="p-6">
              <div className="flex items-start justify-between flex-wrap gap-4">
                <div>
                  <div className={`inline-flex items-center gap-1.5 text-sm font-medium px-3 py-1 rounded-full mb-3 ${statusConfig?.color}`}>
                    <StatusIcon className="w-4 h-4" />
                    {statusConfig?.label}
                  </div>
                  <h2 className="text-2xl font-bold text-slate-900">
                    خطة {subscription.plan?.nameAr || subscription.plan?.name || "مجانية"}
                  </h2>
                  {subscription.status === "TRIALING" && subscription.trialEnd && (
                    <p className="text-slate-500 mt-1">
                      تنتهي التجربة المجانية: <span className="font-medium text-blue-600">{formatDate(subscription.trialEnd)}</span>
                    </p>
                  )}
                  {subscription.status === "ACTIVE" && subscription.currentPeriodEnd && (
                    <p className="text-slate-500 mt-1">
                      تجديد الاشتراك: <span className="font-medium">{formatDate(subscription.currentPeriodEnd)}</span>
                    </p>
                  )}
                </div>
                <Button variant="outline" onClick={handleManage}>
                  إدارة الاشتراك <ArrowRight className="w-4 h-4" />
                </Button>
              </div>

              {/* Usage Stats */}
              <div className="grid grid-cols-3 gap-4 mt-6">
                {[
                  { icon: Store, label: "الفروع", value: orgStats.branches, color: "text-blue-600" },
                  { icon: Users, label: "الموظفون", value: orgStats.users, color: "text-green-600" },
                  { icon: UtensilsCrossed, label: "الأصناف", value: orgStats.menuItems, color: "text-purple-600" },
                ].map((stat) => (
                  <div key={stat.label} className="bg-white rounded-xl p-4 border border-slate-100">
                    <stat.icon className={`w-5 h-5 ${stat.color} mb-2`} />
                    <p className="text-2xl font-bold text-slate-900">{stat.value}</p>
                    <p className="text-sm text-slate-500">{stat.label}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Plans */}
        <div>
          <div className="flex items-center justify-between flex-wrap gap-3 mb-5">
            <h2 className="text-xl font-bold text-slate-900">اختر خطتك</h2>
            {/* Country / currency selector */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-slate-500">العملة:</span>
              <select
                value={countryCode}
                onChange={(e) => setCountryCode(e.target.value)}
                className="text-sm border border-slate-200 rounded-lg px-3 py-1.5 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {COUNTRIES.map((c) => (
                  <option key={c.code} value={c.code}>{c.label} — {c.currency}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {Object.entries(plans).map(([key, plan]) => {
              const Icon = PLAN_ICONS[key as keyof typeof PLAN_ICONS] || Zap;
              const isCurrentPlan = subscription?.plan?.name === plan.nameEn;
              return (
                <Card
                  key={key}
                  className={`relative overflow-hidden transition-all duration-200 hover:shadow-lg ${
                    plan.isPopular ? "border-blue-500 shadow-blue-100 shadow-lg" : ""
                  } ${isCurrentPlan ? "ring-2 ring-green-500" : ""}`}
                >
                  {plan.isPopular && (
                    <div className="absolute top-0 inset-x-0 bg-blue-600 text-white text-xs font-semibold text-center py-1">
                      الأكثر شيوعاً ⭐
                    </div>
                  )}
                  {isCurrentPlan && (
                    <div className="absolute top-0 inset-x-0 bg-green-500 text-white text-xs font-semibold text-center py-1">
                      خطتك الحالية ✓
                    </div>
                  )}
                  <CardContent className={`p-6 ${plan.isPopular || isCurrentPlan ? "pt-8" : ""}`}>
                    <div className="flex items-center gap-3 mb-4">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${plan.isPopular ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-600"}`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="font-bold text-slate-900">{plan.name}</p>
                        <p className="text-xs text-slate-400">{plan.nameEn}</p>
                      </div>
                    </div>

                    <div className="mb-5">
                      <span className="text-4xl font-black text-slate-900">{convertPrice(plan.price)}</span>
                      <span className="text-slate-500 mr-1">{country.symbol} / شهر</span>
                    </div>

                    <div className="space-y-2 mb-6">
                      {plan.features.map((feature) => (
                        <div key={feature} className="flex items-center gap-2.5 text-sm text-slate-600">
                          <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                          {feature}
                        </div>
                      ))}
                    </div>

                    {/* Contact us instead of subscribe button */}
                    <div className="space-y-2">
                      <a
                        href="tel:+201090886364"
                        className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold transition-colors"
                      >
                        <Phone className="w-4 h-4" />
                        تواصل معانا
                      </a>
                      <a
                        href="mailto:ca.markode@gmail.com"
                        className="flex items-center justify-center gap-2 w-full py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs transition-colors"
                      >
                        <Mail className="w-3.5 h-3.5" />
                        ca.markode@gmail.com
                      </a>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Contact banner */}
          <div className="mt-6 bg-gradient-to-l from-blue-600 to-blue-700 rounded-2xl p-6 text-white flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <p className="font-bold text-lg mb-1">هل تحتاج مساعدة في اختيار الخطة؟</p>
              <p className="text-blue-100 text-sm">تواصل معنا وسنساعدك في إيجاد الخطة المناسبة لمطعمك</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 flex-shrink-0">
              <a
                href="tel:+201090886364"
                className="flex items-center gap-2 bg-white text-blue-700 font-bold px-5 py-2.5 rounded-xl text-sm hover:bg-blue-50 transition-colors"
              >
                <Phone className="w-4 h-4" />
                +201090886364
              </a>
              <a
                href="mailto:ca.markode@gmail.com"
                className="flex items-center gap-2 bg-white/20 hover:bg-white/30 text-white font-medium px-5 py-2.5 rounded-xl text-sm transition-colors"
              >
                <Mail className="w-4 h-4" />
                البريد الإلكتروني
              </a>
            </div>
          </div>
        </div>

        {/* FAQ */}
        <Card>
          <CardHeader>
            <CardTitle>أسئلة شائعة</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              { q: "كيف يمكنني الاشتراك؟", a: "تواصل معنا عبر الهاتف +201090886364 أو البريد الإلكتروني ca.markode@gmail.com وسنرتب لك الاشتراك مباشرة." },
              { q: "هل يمكنني إلغاء الاشتراك في أي وقت؟", a: "نعم، يمكنك الإلغاء في أي وقت وسيستمر اشتراكك حتى نهاية الفترة المدفوعة." },
              { q: "كيف يعمل التجربة المجانية؟", a: "تحصل على 14 يوماً مجاناً بكامل الميزات دون الحاجة إلى بطاقة ائتمانية." },
              { q: "هل يمكنني الترقية أو التخفيض في الخطة؟", a: "نعم، يمكنك تغيير خطتك في أي وقت وسيتم حساب الفرق تلقائياً." },
            ].map((faq) => (
              <div key={faq.q} className="pb-4 border-b border-slate-100 last:border-0">
                <p className="font-medium text-slate-800 mb-1">{faq.q}</p>
                <p className="text-sm text-slate-500">{faq.a}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
