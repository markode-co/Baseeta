"use client";
import { useState } from "react";
import { Check, Star, Zap, Crown, Shield, ArrowRight, Calendar, Users, Store, UtensilsCrossed, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Topbar } from "@/components/layout/topbar";
import { formatCurrency, formatDate } from "@/lib/utils";
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
  const [isLoading, setIsLoading] = useState<string | null>(null);

  async function handleSubscribe(planKey: string) {
    setIsLoading(planKey);
    try {
      const res = await fetch("/api/subscription/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: planKey }),
      });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
      else toast.error("فشل إنشاء جلسة الدفع");
    } catch {
      toast.error("حدث خطأ");
    } finally {
      setIsLoading(null);
    }
  }

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
          <h2 className="text-xl font-bold text-slate-900 mb-4">اختر خطتك</h2>
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
                      <span className="text-4xl font-black text-slate-900">{plan.price}</span>
                      <span className="text-slate-500 mr-1">ر.س / شهر</span>
                    </div>

                    <div className="space-y-2 mb-6">
                      {plan.features.map((feature) => (
                        <div key={feature} className="flex items-center gap-2.5 text-sm text-slate-600">
                          <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                          {feature}
                        </div>
                      ))}
                    </div>

                    <Button
                      className="w-full"
                      variant={plan.isPopular ? "default" : "outline"}
                      loading={isLoading === key}
                      disabled={isCurrentPlan}
                      onClick={() => handleSubscribe(key)}
                    >
                      {isCurrentPlan ? "خطتك الحالية" : "اشترك الآن"}
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* FAQ */}
        <Card>
          <CardHeader>
            <CardTitle>أسئلة شائعة</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              { q: "هل يمكنني إلغاء الاشتراك في أي وقت؟", a: "نعم، يمكنك الإلغاء في أي وقت وسيستمر اشتراكك حتى نهاية الفترة المدفوعة." },
              { q: "كيف يعمل التجربة المجانية؟", a: "تحصل على 14 يوماً مجاناً بكامل الميزات دون الحاجة إلى بطاقة ائتمانية." },
              { q: "هل يمكنني الترقية أو التخفيض في الخطة؟", a: "نعم، يمكنك تغيير خطتك في أي وقت وسيتم حساب الفرق تلقائياً." },
              { q: "ما طرق الدفع المتاحة؟", a: "نقبل جميع البطاقات الائتمانية (Visa, Mastercard, Mada) عبر بوابة Stripe الآمنة." },
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
