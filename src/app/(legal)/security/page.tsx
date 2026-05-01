import type { Metadata } from "next";
import { Lock, Server, Eye, Bug, CheckCircle, ShieldAlert } from "lucide-react";

export const metadata: Metadata = {
  title: "الأمان | بسيطة",
  description: "تعرّف على إجراءات الأمان وحماية البيانات في منصة بسيطة.",
};

const MEASURES = [
  {
    icon: Lock,
    title: "تشفير البيانات",
    color: "bg-blue-50 text-blue-600",
    items: [
      "TLS 1.3 لتشفير جميع البيانات أثناء النقل",
      "AES-256 لتشفير البيانات المخزّنة",
      "مفاتيح تشفير خاصة بكل عميل (tenant isolation)",
      "شهادات SSL/TLS موثّقة من جهات موثوقة",
    ],
  },
  {
    icon: Server,
    title: "البنية التحتية",
    color: "bg-purple-50 text-purple-600",
    items: [
      "استضافة على AWS بمراكز بيانات في منطقة الشرق الأوسط",
      "نسخ احتياطي تلقائي يومي مع احتفاظ 30 يوماً",
      "مراكز بيانات احتياطية للتعافي من الكوارث",
      "بنية microservices مع عزل كامل بين المستأجرين",
    ],
  },
  {
    icon: Eye,
    title: "المراقبة والرصد",
    color: "bg-green-50 text-green-600",
    items: [
      "مراقبة مستمرة 24/7 لجميع الأنظمة",
      "كشف تلقائي للأنشطة المشبوهة وتنبيهات فورية",
      "سجلات (audit logs) لجميع العمليات الحساسة",
      "اختبارات اختراق دورية من جهات خارجية معتمدة",
    ],
  },
  {
    icon: ShieldAlert,
    title: "المصادقة والتحكم في الوصول",
    color: "bg-orange-50 text-orange-600",
    items: [
      "دعم المصادقة الثنائية (2FA) لجميع الحسابات",
      "تشفير كلمات المرور بخوارزمية bcrypt",
      "جلسات محمية مع انتهاء صلاحية تلقائي",
      "نظام صلاحيات دقيق بمبدأ أقل الامتيازات",
    ],
  },
];

const CERTIFICATIONS = [
  "HTTPS / TLS 1.3 على جميع الاتصالات",
  "امتثال لمعايير PCI DSS لمعالجة بيانات الدفع",
  "سياسة خصوصية متوافقة مع GDPR",
  "نسخ احتياطي مشفّر مع SLA بنسبة 99.9% للتوفر",
];

export default function SecurityPage() {
  return (
    <div dir="rtl">
      {/* Header */}
      <div className="bg-gradient-to-b from-slate-900 to-slate-800 text-white py-16 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-5 backdrop-blur-sm">
            <Lock className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl font-black mb-3">الأمان في بسيطة</h1>
          <p className="text-slate-300 text-lg leading-relaxed">
            بياناتك أمانة. نتخذ كل الإجراءات التقنية والتنظيمية لحمايتها.
          </p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-12 space-y-10">
        {/* Security measures */}
        <section>
          <h2 className="text-2xl font-black text-slate-900 mb-6">إجراءات الحماية</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {MEASURES.map((m) => (
              <div key={m.title} className="bg-white rounded-2xl border border-slate-200 p-5">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4 ${m.color}`}>
                  <m.icon className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-slate-900 mb-3">{m.title}</h3>
                <ul className="space-y-2">
                  {m.items.map((item) => (
                    <li key={item} className="flex items-start gap-2 text-sm text-slate-600">
                      <CheckCircle className="w-3.5 h-3.5 text-green-500 flex-shrink-0 mt-0.5" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        {/* Compliance */}
        <section>
          <h2 className="text-2xl font-black text-slate-900 mb-5">الامتثال والمعايير</h2>
          <div className="bg-white rounded-2xl border border-slate-200 p-6">
            <ul className="space-y-3">
              {CERTIFICATIONS.map((cert) => (
                <li key={cert} className="flex items-center gap-3 text-sm text-slate-700">
                  <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <CheckCircle className="w-3.5 h-3.5 text-green-600" />
                  </div>
                  {cert}
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Vulnerability disclosure */}
        <section>
          <h2 className="text-2xl font-black text-slate-900 mb-5 flex items-center gap-3">
            <Bug className="w-6 h-6 text-red-500" />
            الإبلاغ عن الثغرات
          </h2>
          <div className="bg-red-50 border border-red-200 rounded-2xl p-6 space-y-3">
            <p className="text-slate-700 text-sm leading-relaxed">
              إذا اكتشفت ثغرة أمنية في منصة بسيطة، نطلب منك الإبلاغ عنها بشكل مسؤول قبل نشرها علناً. سنتعامل مع تقريرك بجدية تامة ونعمل على إصلاحها في أسرع وقت.
            </p>
            <div className="bg-white rounded-xl p-4 border border-red-100">
              <p className="text-sm font-semibold text-slate-800 mb-1">للإبلاغ عن ثغرة أمنية:</p>
              <p className="text-sm text-blue-600 font-mono">security@baseeta.app</p>
              <p className="text-xs text-slate-500 mt-2">
                سنرد خلال 48 ساعة ونقدّر مساهمتك في تحسين أمان المنصة.
              </p>
            </div>
          </div>
        </section>

        {/* Last updated */}
        <p className="text-xs text-slate-400 text-center">آخر تحديث: يناير 2026</p>
      </div>
    </div>
  );
}
