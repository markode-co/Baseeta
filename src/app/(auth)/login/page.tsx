"use client";
import { useState, useTransition } from "react";
import Link from "next/link";
import { Eye, EyeOff, Utensils, Mail, Lock } from "lucide-react";
import { login } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  async function handleSubmit(formData: FormData) {
    setError("");
    startTransition(async () => {
      const result = await login(formData);
      if (result?.error) setError(result.error);
    });
  }

  return (
    <div className="min-h-screen flex" dir="rtl">
      {/* Left panel - decorative */}
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
          {[
            { icon: "🚀", title: "سريع وسهل", desc: "واجهة بديهية تناسب جميع المستخدمين" },
            { icon: "📊", title: "تقارير متقدمة", desc: "تحليلات فورية لمبيعاتك ومخزونك" },
            { icon: "☁️", title: "سحابي بالكامل", desc: "وصول من أي مكان وأي وقت" },
          ].map((f) => (
            <div key={f.title} className="flex items-start gap-3">
              <div className="text-2xl">{f.icon}</div>
              <div>
                <p className="text-white font-semibold">{f.title}</p>
                <p className="text-blue-200 text-sm">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
        <p className="text-blue-300 text-sm relative z-10">© 2024 بسيطة · جميع الحقوق محفوظة</p>
      </div>

      {/* Right panel - form */}
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
              <h1 className="text-2xl font-bold text-slate-900">مرحباً بعودتك 👋</h1>
              <p className="text-slate-500 mt-1">سجّل دخولك للوصول إلى لوحة التحكم</p>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
                {error}
              </div>
            )}

            <form action={handleSubmit} className="space-y-4">
              <Input
                name="email"
                type="email"
                label="البريد الإلكتروني"
                placeholder="example@restaurant.com"
                startIcon={<Mail className="w-4 h-4" />}
                required
                autoComplete="email"
              />

              <div className="w-full">
                <label className="block text-sm font-medium text-slate-700 mb-1.5">كلمة المرور</label>
                <div className="relative">
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    name="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    required
                    autoComplete="current-password"
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 pr-10 pl-10 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-end">
                <Link href="/forgot-password" className="text-sm text-blue-600 hover:underline">
                  نسيت كلمة المرور؟
                </Link>
              </div>

              <Button type="submit" className="w-full" size="lg" loading={isPending}>
                {isPending ? "جاري تسجيل الدخول..." : "تسجيل الدخول"}
              </Button>
            </form>

            <p className="mt-6 text-center text-sm text-slate-500">
              ليس لديك حساب؟{" "}
              <Link href="/register" className="text-blue-600 font-medium hover:underline">
                سجّل مجاناً
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
