import Link from "next/link";
import {
  ShoppingCart, Table2, BarChart3, Users, Package, Globe,
  Check, Star, Zap, ChevronLeft, Utensils, ArrowLeft,
} from "lucide-react";

const FEATURES = [
  { icon: ShoppingCart, title: "نقطة بيع متطورة", desc: "كاشير سريع وبديهي يعمل على أي جهاز مع دعم مختلف طرق الدفع", color: "bg-blue-50 text-blue-600" },
  { icon: Table2, title: "إدارة الطاولات", desc: "مخطط تفاعلي للطاولات مع تتبع الحالة في الوقت الفعلي", color: "bg-green-50 text-green-600" },
  { icon: BarChart3, title: "تقارير وتحليلات", desc: "إحصائيات شاملة للمبيعات والأرباح وأكثر الأصناف طلباً", color: "bg-purple-50 text-purple-600" },
  { icon: Users, title: "إدارة الموظفين", desc: "نظام أدوار وصلاحيات متكامل مع تتبع الأداء", color: "bg-orange-50 text-orange-600" },
  { icon: Package, title: "إدارة المخزون", desc: "تتبع المواد والمستلزمات مع تنبيهات المخزون المنخفض", color: "bg-red-50 text-red-600" },
  { icon: Globe, title: "دعم متعدد الفروع", desc: "إدارة جميع فروعك من لوحة تحكم موحدة", color: "bg-teal-50 text-teal-600" },
];

const TESTIMONIALS = [
  { name: "أحمد الشمري", role: "صاحب مطعم فيصل", text: "بسيطة غيّرت طريقة إدارتي للمطعم بالكامل. كل شيء أصبح أسهل وأسرع!", rating: 5 },
  { name: "سارة العتيبي", role: "مديرة كافيه مود", text: "الواجهة جميلة جداً وسهلة الاستخدام. موظفينا تعلموها خلال ساعة واحدة.", rating: 5 },
  { name: "محمد الدوسري", role: "مالك سلسلة مطاعم", text: "التقارير التفصيلية ساعدتني على اتخاذ قرارات أفضل وزيادة أرباحي بـ30%.", rating: 5 },
];

const PLANS = [
  {
    name: "أساسي", price: 149, popular: false,
    features: ["فرع واحد", "5 مستخدمين", "100 صنف", "نقطة البيع", "إدارة الطاولات", "تقارير أساسية"],
  },
  {
    name: "احترافي", price: 299, popular: true,
    features: ["3 فروع", "20 مستخدم", "500 صنف", "كل ميزات الأساسي", "نظام المطبخ KDS", "إدارة المخزون", "تقارير متقدمة"],
  },
  {
    name: "بريميوم", price: 599, popular: false,
    features: ["فروع غير محدودة", "مستخدمون غير محدودون", "أصناف غير محدودة", "كل ميزات الاحترافي", "API كامل", "مدير حساب مخصص", "دعم 24/7"],
  },
];

const STATS = [
  { value: "+2,500", label: "مطعم يثق بنا" },
  { value: "+500K", label: "طلب يومياً" },
  { value: "99.9%", label: "وقت التشغيل" },
  { value: "24/7", label: "دعم فني" },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white" dir="rtl">
      {/* Navbar */}
      <nav className="fixed top-0 inset-x-0 z-50 bg-white/90 backdrop-blur-md border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center">
              <Utensils className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-slate-900">بسيطة</span>
          </div>
          <div className="hidden md:flex items-center gap-6 text-sm text-slate-600">
            <a href="#features" className="hover:text-blue-600 transition-colors">المميزات</a>
            <a href="#pricing" className="hover:text-blue-600 transition-colors">الأسعار</a>
            <a href="#testimonials" className="hover:text-blue-600 transition-colors">آراء العملاء</a>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login" className="text-sm text-slate-600 hover:text-blue-600 font-medium transition-colors">
              تسجيل الدخول
            </Link>
            <Link href="/register" className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors">
              ابدأ مجاناً
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-20 px-4 overflow-hidden bg-gradient-to-b from-slate-50 to-white">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-blue-50 border border-blue-200 text-blue-700 text-sm font-medium px-4 py-2 rounded-full mb-6">
            <Zap className="w-4 h-4" />
            تجربة مجانية 14 يوم — لا بطاقة ائتمانية
          </div>
          <h1 className="text-5xl sm:text-6xl font-black text-slate-900 leading-tight mb-6">
            إدارة مطعمك
            <br />
            <span className="text-blue-600">بطريقة أبسط</span>
          </h1>
          <p className="text-xl text-slate-500 leading-relaxed mb-8 max-w-2xl mx-auto">
            نظام سحابي متكامل لإدارة المطاعم والكاشير. من نقطة البيع إلى التقارير، كل ما تحتاجه في مكان واحد.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/register" className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-blue-600 text-white text-lg font-semibold rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-200">
              ابدأ التجربة المجانية
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <a href="#features" className="inline-flex items-center justify-center gap-2 px-8 py-4 border-2 border-slate-200 text-slate-700 text-lg font-semibold rounded-xl hover:border-blue-300 hover:text-blue-600 transition-all">
              اكتشف المميزات
            </a>
          </div>

          {/* Mock UI */}
          <div className="mt-16 bg-slate-900 rounded-2xl shadow-2xl border border-slate-800 overflow-hidden">
            <div className="flex items-center gap-1.5 px-4 py-3 border-b border-slate-800">
              <div className="w-3 h-3 rounded-full bg-red-500" />
              <div className="w-3 h-3 rounded-full bg-yellow-500" />
              <div className="w-3 h-3 rounded-full bg-green-500" />
              <div className="flex-1 mx-4 h-5 bg-slate-800 rounded-md" />
            </div>
            <div className="flex h-64 bg-slate-800">
              <div className="w-48 bg-slate-900 p-4 space-y-2">
                {["لوحة التحكم", "الكاشير", "الطلبات", "الطاولات", "القائمة"].map((item, i) => (
                  <div key={item} className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs ${i === 1 ? "bg-blue-600 text-white" : "text-slate-400"}`}>
                    <div className="w-3 h-3 bg-current rounded-sm opacity-70" />
                    {item}
                  </div>
                ))}
              </div>
              <div className="flex-1 p-4">
                <div className="grid grid-cols-3 gap-3 mb-4">
                  {["مبيعات اليوم", "طلبات نشطة", "إجمالي الشهر"].map((label, i) => (
                    <div key={label} className="bg-slate-700 rounded-lg p-3">
                      <p className="text-slate-400 text-xs mb-1">{label}</p>
                      <p className="text-white font-bold text-lg">{["2,840", "12", "28K"][i]}</p>
                    </div>
                  ))}
                </div>
                <div className="bg-slate-700 rounded-lg p-3 h-28 flex items-end gap-1">
                  {[40, 65, 45, 80, 60, 90, 70, 55, 85, 75, 95, 80].map((h, i) => (
                    <div key={i} className="flex-1 bg-blue-500 rounded-t-sm opacity-80" style={{ height: `${h}%` }} />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-12 bg-blue-600">
        <div className="max-w-5xl mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {STATS.map((stat) => (
              <div key={stat.label} className="text-center">
                <p className="text-4xl font-black text-white">{stat.value}</p>
                <p className="text-blue-200 mt-1">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-4xl font-black text-slate-900 mb-3">كل ما يحتاجه مطعمك</h2>
            <p className="text-lg text-slate-500">ميزات متكاملة تغطي كل جانب من جوانب إدارة مطعمك</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map((feature) => (
              <div key={feature.title} className="p-6 rounded-2xl border border-slate-200 hover:border-blue-300 hover:shadow-lg transition-all duration-200 hover:-translate-y-1 bg-white">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${feature.color}`}>
                  <feature.icon className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">{feature.title}</h3>
                <p className="text-slate-500 text-sm leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="py-20 px-4 bg-slate-50">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-4xl font-black text-slate-900 mb-3">آراء عملائنا</h2>
            <p className="text-lg text-slate-500">آلاف المطاعم تثق في بسيطة</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {TESTIMONIALS.map((t) => (
              <div key={t.name} className="bg-white rounded-2xl border border-slate-200 p-6 hover:shadow-lg transition-shadow">
                <div className="flex gap-0.5 mb-4">
                  {[...Array(t.rating)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="text-slate-600 leading-relaxed mb-4">&ldquo;{t.text}&rdquo;</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold">
                    {t.name.charAt(0)}
                  </div>
                  <div>
                    <p className="font-semibold text-slate-800">{t.name}</p>
                    <p className="text-sm text-slate-400">{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-20 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-4xl font-black text-slate-900 mb-3">أسعار شفافة وبسيطة</h2>
            <p className="text-lg text-slate-500">جميع الخطط تشمل تجربة مجانية 14 يوم</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {PLANS.map((plan) => (
              <div key={plan.name} className={`bg-white rounded-2xl border-2 ${plan.popular ? "border-blue-500 shadow-xl shadow-blue-100" : "border-slate-200"} p-6 relative`}>
                {plan.popular && (
                  <div className="absolute -top-3.5 right-1/2 translate-x-1/2 bg-blue-600 text-white text-xs font-bold px-4 py-1 rounded-full whitespace-nowrap">
                    الأكثر شيوعاً
                  </div>
                )}
                <h3 className="text-xl font-bold text-slate-900 mb-2">{plan.name}</h3>
                <div className="mb-5">
                  <span className="text-4xl font-black text-slate-900">{plan.price}</span>
                  <span className="text-slate-400 mr-1">ر.س / شهر</span>
                </div>
                <div className="space-y-2.5 mb-6">
                  {plan.features.map((f) => (
                    <div key={f} className="flex items-center gap-2 text-sm text-slate-600">
                      <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                      {f}
                    </div>
                  ))}
                </div>
                <Link href="/register" className={`w-full flex items-center justify-center py-3 rounded-xl text-sm font-semibold transition-colors ${plan.popular ? "bg-blue-600 text-white hover:bg-blue-700" : "border-2 border-slate-200 text-slate-700 hover:border-blue-300 hover:text-blue-600"}`}>
                  ابدأ التجربة المجانية
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4 bg-blue-600">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-4xl font-black text-white mb-4">جاهز لتحويل مطعمك؟</h2>
          <p className="text-blue-200 text-lg mb-8">انضم لـ 2,500+ مطعم يستخدم بسيطة لإدارة أعمالهم</p>
          <Link href="/register" className="inline-flex items-center gap-2 px-10 py-4 bg-white text-blue-700 text-lg font-bold rounded-xl hover:bg-blue-50 transition-all shadow-2xl">
            ابدأ مجاناً الآن
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <p className="text-blue-300 text-sm mt-4">14 يوم مجاناً · لا بطاقة ائتمانية · إلغاء في أي وقت</p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 py-12 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center">
                <Utensils className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-white">بسيطة</span>
            </div>
            <div className="flex gap-6 text-sm">
              {["الشروط والأحكام", "سياسة الخصوصية", "تواصل معنا"].map((link) => (
                <a key={link} href="#" className="hover:text-white transition-colors">{link}</a>
              ))}
            </div>
          </div>
          <div className="border-t border-slate-800 pt-8 text-center text-sm">
            © 2024 بسيطة لأنظمة المطاعم. جميع الحقوق محفوظة.
          </div>
        </div>
      </footer>
    </div>
  );
}
