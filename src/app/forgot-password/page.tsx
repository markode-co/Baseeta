"use client";
import { useState, FormEvent } from "react";
import Link from "next/link";
import { Utensils } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!email.trim()) return;
    setSubmitted(true);
  }

  return (
    <div className="min-h-screen flex" dir="rtl">
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blue-600 via-blue-700 to-blue-900 flex-col justify-between p-12 relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="absolute rounded-full bg-white/5"
              style={{
                width: `${(i + 2) * 80}px`,
                height: `${(i + 2) * 80}px`,
                top: `${i * 15 - 5}%`,
                right: `${i % 2 === 0 ? -10 : 60}%`,
              }}
            />
          ))}
        </div>
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
              <Utensils className="w-6 h-6 text-white" />
            </div>
            <span className="text-white text-3xl font-bold">بسيطة</span>
          </div>
          <p className="text-blue-200 text-lg">نظام إدارة المطاعم والكافيهات والكاشير السحابي</p>
        </div>
        <div className="relative z-10 space-y-6">
          <div className="flex items-start gap-3">
            <div className="text-2xl">🚀</div>
            <div>
              <p className="text-white font-semibold">سهل وسريع</p>
              <p className="text-blue-200 text-sm">إدارة كاملة للطعام والمبيعات.</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="text-2xl">📊</div>
            <div>
              <p className="text-white font-semibold">تقارير فورية</p>
              <p className="text-blue-200 text-sm">عرض المبيعات والأداء في لحظة.</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="text-2xl">☁️</div>
            <div>
              <p className="text-white font-semibold">سحابي بالكامل</p>
              <p className="text-blue-200 text-sm">الوصول من أي مكان بكل أمان.</p>
            </div>
          </div>
        </div>
        <p className="text-blue-300 text-sm relative z-10">© 2026 بسيطة · جميع الحقوق محفوظة</p>
      </div>

      <div className="flex-1 flex items-center justify-center p-6 bg-slate-50">
        <div className="w-full max-w-md">
          <div className="lg:hidden flex items-center gap-2 mb-8 justify-center">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
              <Utensils className="w-5 h-5 text-white" />
            </div>
            <span className="text-blue-600 text-2xl font-bold">بسيطة</span>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-slate-900">نسيت كلمة المرور؟</h1>
              <p className="text-slate-500 mt-1">أدخل بريدك الإلكتروني لاستعادة الوصول إلى حسابك.</p>
            </div>

            {submitted ? (
              <div className="rounded-2xl border border-green-200 bg-green-50 p-5 text-green-700">
                لقد أرسلنا تعليمات إعادة تعيين كلمة المرور إلى البريد الإلكتروني الذي أدخلته.
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <Input
                  name="email"
                  type="email"
                  label="البريد الإلكتروني"
                  placeholder="example@restaurant.com"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  required
                />

                <Button type="submit" className="w-full" size="lg">
                  إرسال رابط إعادة التعيين
                </Button>
              </form>
            )}

            <p className="mt-6 text-center text-sm text-slate-500">
              تذكرت كلمة المرور؟{' '}
              <Link href="/login" className="text-blue-600 font-medium hover:underline">
                عد إلى تسجيل الدخول
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
