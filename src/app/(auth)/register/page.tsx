"use client";
import { useState, useTransition } from "react";
import Link from "next/link";
import { Eye, EyeOff, Utensils, User, Mail, Lock, Phone, Store, Check } from "lucide-react";
import { register } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const FEATURES = [
  "تجربة مجانية 14 يوم",
  "لا تحتاج بطاقة ائتمانية",
  "إلغاء في أي وقت",
  "دعم فني 24/7",
];

export default function RegisterPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  async function handleSubmit(formData: FormData) {
    setError("");
    startTransition(async () => {
      const result = await register(formData);
      if (result?.error) setError(result.error);
    });
  }

  return (
    <div className="min-h-screen flex" dir="rtl">
      {/* Left decorative panel */}
      <div className="hidden lg:flex lg:w-5/12 bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 flex-col justify-between p-12 relative overflow-hidden">
        <div className="absolute inset-0">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="absolute rounded-full border border-blue-500/20"
              style={{
                width: `${(i + 1) * 200}px`,
                height: `${(i + 1) * 200}px`,
                top: "50%",
                left: "50%",
                transform: "translate(-50%, -50%)",
              }}
            />
          ))}
        </div>
        <div className="relative z-10 flex items-center gap-3">
          <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center">
            <Utensils className="w-6 h-6 text-white" />
          </div>
          <span className="text-white text-3xl font-bold">بسيطة</span>
        </div>

        <div className="relative z-10 space-y-8">
          <div>
            <h2 className="text-3xl font-bold text-white leading-tight">
              ابدأ رحلتك مع<br />
              <span className="text-blue-400">بسيطة</span> اليوم
            </h2>
            <p className="text-slate-300 mt-3 leading-relaxed">
              انضم لآلاف المطاعم والكافيهات التي تستخدم بسيطة لإدارة أعمالها بكفاءة وسهولة
            </p>
          </div>

          <div className="space-y-3">
            {FEATURES.map((f) => (
              <div key={f} className="flex items-center gap-3">
                <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                  <Check className="w-3 h-3 text-white" />
                </div>
                <span className="text-slate-200">{f}</span>
              </div>
            ))}
          </div>

          <div className="flex items-center gap-4 p-4 bg-white/5 rounded-xl border border-white/10">
            <div className="flex -space-x-2">
              {["A", "B", "C", "D"].map((l) => (
                <div key={l} className="w-8 h-8 rounded-full bg-blue-500 border-2 border-slate-900 flex items-center justify-center text-xs text-white font-bold">
                  {l}
                </div>
              ))}
            </div>
            <div>
              <p className="text-white text-sm font-medium">+2,500 مطعم وكافيه</p>
              <p className="text-slate-400 text-xs">يثقون في بسيطة</p>
            </div>
          </div>
        </div>

        <p className="text-slate-500 text-sm relative z-10">© 2024 بسيطة · جميع الحقوق محفوظة</p>
      </div>

      {/* Register form */}
      <div className="flex-1 flex items-center justify-center p-6 bg-slate-50 overflow-y-auto">
        <div className="w-full max-w-lg py-8">
          <div className="lg:hidden flex items-center gap-2 mb-8 justify-center">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
              <Utensils className="w-5 h-5 text-white" />
            </div>
            <span className="text-blue-600 text-2xl font-bold">بسيطة</span>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-slate-900">إنشاء حساب جديد 🎉</h1>
              <p className="text-slate-500 mt-1">سجّل مطعمك أو كافيهك وابدأ التجربة المجانية</p>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
                {error}
              </div>
            )}

            <form action={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Input
                  name="name"
                  label="الاسم الكامل"
                  placeholder="محمد أحمد"
                  startIcon={<User className="w-4 h-4" />}
                  required
                />
                <Input
                  name="phone"
                  type="tel"
                  label="رقم الجوال"
                  placeholder="05xxxxxxxx"
                  startIcon={<Phone className="w-4 h-4" />}
                />
              </div>

              <Input
                name="restaurantName"
                label="اسم المطعم أو الكافيه"
                placeholder="مطعم السلطة الخضراء أو كافيه القهوة"
                startIcon={<Store className="w-4 h-4" />}
                required
              />

              <Input
                name="email"
                type="email"
                label="البريد الإلكتروني"
                placeholder="info@restaurant.com"
                startIcon={<Mail className="w-4 h-4" />}
                required
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
                    placeholder="8 أحرف على الأقل"
                    required
                    minLength={8}
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

              <p className="text-xs text-slate-400">
                بالتسجيل، أنت توافق على{" "}
                <Link href="/terms" className="text-blue-600 hover:underline">شروط الخدمة</Link>
                {" "}و{" "}
                <Link href="/privacy" className="text-blue-600 hover:underline">سياسة الخصوصية</Link>
              </p>

              <Button type="submit" className="w-full" size="lg" loading={isPending}>
                {isPending ? "جاري إنشاء الحساب..." : "إنشاء الحساب مجاناً"}
              </Button>
            </form>

            <p className="mt-6 text-center text-sm text-slate-500">
              لديك حساب بالفعل؟{" "}
              <Link href="/login" className="text-blue-600 font-medium hover:underline">
                تسجيل الدخول
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
