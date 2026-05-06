"use client";
import { useState } from "react";
import { Mail, Phone, MessageSquare, MapPin, Clock, Send, CheckCircle } from "lucide-react";

const CONTACT_ITEMS = [
  { icon: Mail,    label: "البريد الإلكتروني", value: "ca.markode@gmail.com",   href: "mailto:ca.markode@gmail.com" },
  { icon: Phone,   label: "الهاتف / واتساب",  value: "0109088636",      href: "tel:0109088636" },
  { icon: MapPin,  label: "الموقع",             value: "القاهرة، مصر",         href: null },
  { icon: Clock,   label: "ساعات الدعم",        value: "السبت – الخميس | 9ص – 9م", href: null },
];

export default function ContactPage() {
  const [form, setForm]       = useState({ name: "", email: "", subject: "", message: "" });
  const [sending, setSending] = useState(false);
  const [sent, setSent]       = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSending(true);
    // Simulate send
    await new Promise((r) => setTimeout(r, 1200));
    setSent(true);
    setSending(false);
  }

  return (
    <div dir="rtl">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 py-12 px-4">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
              <MessageSquare className="w-5 h-5 text-blue-600" />
            </div>
            <h1 className="text-3xl font-black text-slate-900">تواصل معنا</h1>
          </div>
          <p className="text-slate-600">فريق الدعم لدينا جاهز لمساعدتك. نرد في غضون ساعات قليلة.</p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-10 grid grid-cols-1 md:grid-cols-5 gap-8">
        {/* Contact Info */}
        <div className="md:col-span-2 space-y-4">
          <h2 className="font-bold text-slate-900 text-lg mb-4">معلومات التواصل</h2>
          {CONTACT_ITEMS.map((item) => (
            <div key={item.label} className="flex items-start gap-3">
              <div className="w-9 h-9 bg-blue-50 rounded-lg flex items-center justify-center flex-shrink-0">
                <item.icon className="w-4 h-4 text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-slate-400">{item.label}</p>
                {item.href ? (
                  <a href={item.href} className="text-sm font-medium text-slate-800 hover:text-blue-600 transition-colors">
                    {item.value}
                  </a>
                ) : (
                  <p className="text-sm font-medium text-slate-800">{item.value}</p>
                )}
              </div>
            </div>
          ))}

          <div className="pt-4 border-t border-slate-200">
            <p className="text-xs text-slate-400 mb-3">تابعنا على</p>
            <div className="flex gap-3">
              {[
                { label: "X (Twitter)", href: "#" },
                { label: "LinkedIn",    href: "#" },
                { label: "Instagram",   href: "#" },
              ].map((s) => (
                <a
                  key={s.label}
                  href={s.href}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-blue-50 hover:text-blue-600 rounded-lg text-xs text-slate-600 transition-colors"
                >
                  {s.label}
                </a>
              ))}
            </div>
          </div>
        </div>

        {/* Contact Form */}
        <div className="md:col-span-3">
          {sent ? (
            <div className="bg-green-50 border border-green-200 rounded-2xl p-8 text-center">
              <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
              <h3 className="text-lg font-bold text-slate-900 mb-2">تم الإرسال!</h3>
              <p className="text-slate-600 text-sm">
                شكراً لتواصلك معنا. سيرد فريق الدعم على بريدك الإلكتروني خلال بضع ساعات.
              </p>
              <button
                onClick={() => { setSent(false); setForm({ name: "", email: "", subject: "", message: "" }); }}
                className="mt-5 text-sm text-blue-600 hover:underline"
              >
                إرسال رسالة أخرى
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
              <h2 className="font-bold text-slate-900 text-lg mb-2">أرسل لنا رسالة</h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">الاسم <span className="text-red-500">*</span></label>
                  <input
                    required
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="اسمك الكريم"
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">البريد الإلكتروني <span className="text-red-500">*</span></label>
                  <input
                    required
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    placeholder="example@email.com"
                    dir="ltr"
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">الموضوع <span className="text-red-500">*</span></label>
                <select
                  required
                  value={form.subject}
                  onChange={(e) => setForm({ ...form, subject: e.target.value })}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  <option value="">اختر الموضوع</option>
                  <option value="support">دعم فني</option>
                  <option value="billing">الفواتير والدفع</option>
                  <option value="sales">الاستفسار عن الخطط</option>
                  <option value="partnership">شراكة تجارية</option>
                  <option value="other">أخرى</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">الرسالة <span className="text-red-500">*</span></label>
                <textarea
                  required
                  value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                  placeholder="اكتب رسالتك هنا..."
                  rows={5}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={sending}
                className="w-full flex items-center justify-center gap-2 py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {sending ? (
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
                {sending ? "جارٍ الإرسال..." : "إرسال الرسالة"}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
