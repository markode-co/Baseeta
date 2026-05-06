import type { Metadata } from "next";
import { Utensils, Target, Heart, Users, Zap, Globe, Star, CheckCircle } from "lucide-react";

export const metadata: Metadata = {
  title: "نبذة عن بسيطة | إدارة المطاعم والكافيهات",
  description: "تعرّف على بسيطة — نظام إدارة المطاعم والكافيهات السحابي الذي يخدم آلاف المطاعم والكافيهات.",
};

const STATS = [
  { value: "+2,500", label: "مطعم وكافيه يثق بنا" },
  { value: "+500K", label: "طلب يومياً" },
  { value: "99.9%", label: "وقت التشغيل" },
  { value: "2023",  label: "سنة التأسيس" },
];

const VALUES = [
  { icon: Zap,    title: "البساطة أولاً",    desc: "نؤمن أن أفضل التقنيات هي تلك التي لا تشعر بها. واجهة بديهية يتعلمها فريقك في دقائق." },
  { icon: Heart,  title: "نجاحك هو نجاحنا", desc: "لسنا مجرد مزود خدمة — نحن شركاء في نجاح مطعمك وكافيهك. دعمنا متاح 24/7 لأن مطعمك وكافيهك لا ينام." },
  { icon: Globe,  title: "موثوقية لا تتنازل عنها", desc: "بنية تحتية سحابية بمعدل تشغيل 99.9%، مع نسخ احتياطي تلقائي وتشفير كامل لبياناتك." },
  { icon: Target, title: "تطوير مستمر",      desc: "نستمع لعملائنا ونطلق تحديثات أسبوعية. ميزاتنا تُبنى بناءً على احتياجاتك الحقيقية." },
];

const TEAM_HIGHLIGHTS = [
  "خبرة تقنية تزيد على 10 سنوات في بناء منصات SaaS",
  "فريق متخصص في صناعة المطاعم والكافيهات والضيافة",
  "شركاء دعم في مصر والسعودية والإمارات",
  "بنية تحتية على AWS بمراكز بيانات إقليمية",
];

export default function AboutPage() {
  return (
    <div dir="rtl">
      {/* Hero */}
      <section className="bg-gradient-to-b from-blue-600 to-blue-700 text-white py-20 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <div className="w-20 h-20 bg-white/20 rounded-3xl flex items-center justify-center mx-auto mb-6 backdrop-blur-sm">
            <Utensils className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl sm:text-5xl font-black mb-4">نبذة عن بسيطة</h1>
          <p className="text-blue-100 text-lg leading-relaxed max-w-2xl mx-auto">
            بدأنا بسؤال بسيط: لماذا إدارة المطاعم والكافيهات معقدة جداً؟ فبنينا الجواب — نظام سحابي متكامل يجعل كل شيء أسهل.
          </p>
        </div>
      </section>

      {/* Stats */}
      <section className="bg-white border-b border-slate-200 py-12 px-4">
        <div className="max-w-4xl mx-auto grid grid-cols-2 sm:grid-cols-4 gap-8 text-center">
          {STATS.map((s) => (
            <div key={s.label}>
              <p className="text-3xl font-black text-blue-600">{s.value}</p>
              <p className="text-slate-500 text-sm mt-1">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      <div className="max-w-3xl mx-auto px-4 py-14 space-y-14">
        {/* Story */}
        <section>
          <h2 className="text-2xl font-black text-slate-900 mb-5 flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
              <Star className="w-4 h-4 text-blue-600" />
            </div>
            قصتنا
          </h2>
          <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4 text-slate-600 leading-relaxed">
            <p>
              في عام 2023، لاحظ مؤسسو بسيطة أن أصحاب المطاعم والكافيهات يعانون يومياً من أنظمة قديمة ومعقدة تستهلك وقتهم بدلاً من مساعدتهم. كانت أنظمة الكاشير تتعطل، والتقارير مبعثرة، وإدارة الموظفين والمخزون تتم على أوراق.
            </p>
            <p>
              قررنا بناء حل مختلف — نظام سحابي حديث، سريع، وبديهي. يعمل على أي جهاز بدون تثبيت. يتحدث العربية ويفهم احتياجات السوق المحلي. ويُحدَّث باستمرار بناءً على ملاحظات العملاء.
            </p>
            <p>
              اليوم، تثق بنا أكثر من 2,500 مطعم وكافيه في مصر ودول الخليج، من المطاعم والكافيهات الصغيرة إلى سلاسل المطاعم والكافيهات المتعددة الفروع.
            </p>
          </div>
        </section>

        {/* Mission */}
        <section>
          <h2 className="text-2xl font-black text-slate-900 mb-5 flex items-center gap-3">
            <div className="w-8 h-8 bg-green-50 rounded-lg flex items-center justify-center">
              <Target className="w-4 h-4 text-green-600" />
            </div>
            رسالتنا
          </h2>
          <div className="bg-blue-600 rounded-2xl p-6 text-white">
            <p className="text-xl font-bold leading-relaxed">
              &ldquo;تمكين أصحاب المطاعم والكافيهات من التركيز على ما يحبونه — الطعام الرائع والضيافة الأصيلة — بينما نتولى نحن تعقيدات الإدارة.&rdquo;
            </p>
          </div>
        </section>

        {/* Values */}
        <section>
          <h2 className="text-2xl font-black text-slate-900 mb-5 flex items-center gap-3">
            <div className="w-8 h-8 bg-purple-50 rounded-lg flex items-center justify-center">
              <Heart className="w-4 h-4 text-purple-600" />
            </div>
            قيمنا
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {VALUES.map((v) => (
              <div key={v.title} className="bg-white rounded-2xl border border-slate-200 p-5">
                <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center mb-3">
                  <v.icon className="w-5 h-5 text-blue-600" />
                </div>
                <h3 className="font-bold text-slate-900 mb-1">{v.title}</h3>
                <p className="text-slate-500 text-sm leading-relaxed">{v.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Team */}
        <section>
          <h2 className="text-2xl font-black text-slate-900 mb-5 flex items-center gap-3">
            <div className="w-8 h-8 bg-orange-50 rounded-lg flex items-center justify-center">
              <Users className="w-4 h-4 text-orange-600" />
            </div>
            فريقنا
          </h2>
          <div className="bg-white rounded-2xl border border-slate-200 p-6">
            <p className="text-slate-600 leading-relaxed mb-5">
              يتكون فريق بسيطة من مهندسين ومتخصصين في المنتجات وخبراء في صناعة المطاعم والكافيهات، يجمعهم شغف واحد: بناء أدوات تُحدث فرقاً حقيقياً.
            </p>
            <ul className="space-y-3">
              {TEAM_HIGHLIGHTS.map((item) => (
                <li key={item} className="flex items-center gap-3 text-sm text-slate-600">
                  <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </section>
      </div>
    </div>
  );
}
