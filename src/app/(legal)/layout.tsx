import Link from "next/link";
import { Utensils, ArrowLeft } from "lucide-react";

const LEGAL_LINKS = [
  { href: "/about",    label: "نبذة عنا" },
  { href: "/terms",    label: "الشروط والأحكام" },
  { href: "/privacy",  label: "سياسة الخصوصية" },
  { href: "/security", label: "الأمان" },
  { href: "/contact",  label: "تواصل معنا" },
];

export default function LegalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col" dir="rtl">
      {/* Navbar */}
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <Utensils className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-slate-900 text-base">بسيطة</span>
          </Link>
          <Link
            href="/"
            className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-blue-600 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            الصفحة الرئيسية
          </Link>
        </div>
      </nav>

      {/* Page content */}
      <main className="flex-1">{children}</main>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 py-10 px-4 mt-auto">
        <div className="max-w-5xl mx-auto">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 mb-6">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <Utensils className="w-4 h-4 text-white" />
              </div>
              <span className="text-white font-bold">بسيطة</span>
            </div>
            <div className="flex flex-wrap gap-4 text-sm">
              {LEGAL_LINKS.map((l) => (
                <Link key={l.href} href={l.href} className="hover:text-white transition-colors">
                  {l.label}
                </Link>
              ))}
            </div>
          </div>
          <div className="border-t border-slate-800 pt-6 text-center text-xs">
            © 2026 بسيطة لأنظمة المطاعم. جميع الحقوق محفوظة.
          </div>
        </div>
      </footer>
    </div>
  );
}
