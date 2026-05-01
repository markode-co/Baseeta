"use client";
import { useEffect, useState, useCallback } from "react";
import { X, Download, Share, Plus, Smartphone, Monitor, ArrowDown } from "lucide-react";

declare global {
  interface Window {
    __pwaPrompt: BeforeInstallPromptEvent | null;
  }
}

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
  prompt(): Promise<void>;
}

type Platform = "ios" | "android" | "desktop";

function isIOS(): boolean {
  return /iphone|ipad|ipod/.test(navigator.userAgent.toLowerCase());
}

function isInstalled(): boolean {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (navigator as unknown as { standalone?: boolean }).standalone === true ||
    document.referrer.startsWith("android-app://")
  );
}

function wasDismissed(): boolean {
  try {
    const t = parseInt(localStorage.getItem("pwa-dismissed") || "0");
    if (!t) return false;
    return Date.now() - t < 3 * 24 * 60 * 60 * 1000; // 3 days
  } catch { return false; }
}

function setDismissed() {
  try { localStorage.setItem("pwa-dismissed", String(Date.now())); } catch {}
}

function getPlatform(): Platform {
  const ua = navigator.userAgent.toLowerCase();
  if (/iphone|ipad|ipod/.test(ua)) return "ios";
  if (/android/.test(ua)) return "android";
  return "desktop";
}

// ── iOS install instructions (only platform that needs manual steps) ──────────
function IOSInstructions({ onClose }: { onClose: () => void }) {
  const isIpad = /ipad/.test(navigator.userAgent.toLowerCase());
  return (
    <div className="mt-5 space-y-3 text-right">
      <p className="text-sm font-semibold text-slate-700 mb-4">اتبع هذه الخطوات في Safari:</p>
      {[
        {
          num: "١",
          icon: Share,
          text: "اضغط على زر المشاركة",
          sub: isIpad ? "في شريط Safari العلوي" : "في شريط الأدوات السفلي ⬆",
        },
        {
          num: "٢",
          icon: Plus,
          text: "اختر «إضافة إلى الشاشة الرئيسية»",
          sub: "مرّر القائمة للأسفل إذا لزم",
        },
        {
          num: "٣",
          icon: Download,
          text: "اضغط «إضافة»",
          sub: "سيظهر التطبيق فوراً كأيقونة",
        },
      ].map((s) => (
        <div key={s.num} className="flex items-start gap-3 bg-slate-50 rounded-xl p-3">
          <div className="w-7 h-7 bg-blue-600 text-white text-sm font-black rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
            {s.num}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-slate-800">{s.text}</p>
            <p className="text-xs text-slate-500 mt-0.5">{s.sub}</p>
          </div>
          <div className="w-8 h-8 bg-white border border-slate-200 rounded-lg flex items-center justify-center flex-shrink-0">
            <s.icon className="w-4 h-4 text-slate-400" />
          </div>
        </div>
      ))}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-center gap-2 text-xs text-amber-700">
        <ArrowDown className="w-4 h-4 flex-shrink-0 rotate-180" />
        <span>تأكد من فتح هذه الصفحة في متصفح Safari وليس متصفحاً آخر</span>
      </div>
      <button
        onClick={onClose}
        className="w-full py-2.5 rounded-xl border border-slate-200 text-sm text-slate-500 hover:bg-slate-50 transition-colors mt-2"
      >
        حسناً، فهمت
      </button>
    </div>
  );
}

// ── Main Modal ────────────────────────────────────────────────────────────────
export function PwaInstallPrompt() {
  const [show,       setShow]       = useState(false);
  const [platform,   setPlatform]   = useState<Platform>("desktop");
  const [iosSteps,   setIosSteps]   = useState(false);
  const [installing, setInstalling] = useState(false);

  useEffect(() => {
    if (isInstalled()) return;

    function tryShow() {
      if (isInstalled() || wasDismissed()) return;
      setPlatform(getPlatform());
      setShow(true);
    }

    // iOS: native prompt not supported — show manual steps after delay
    if (isIOS()) {
      const t = setTimeout(tryShow, 3000);
      return () => clearTimeout(t);
    }

    // Android / Desktop: only show when native install prompt is available
    if (window.__pwaPrompt) {
      // Already captured by the inline <head> script before React mounted
      const t = setTimeout(tryShow, 2000);
      return () => clearTimeout(t);
    }

    // Capture it if it fires after mount (late service worker registration)
    const handler = (e: Event) => {
      e.preventDefault();
      window.__pwaPrompt = e as BeforeInstallPromptEvent;
      setTimeout(tryShow, 500);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const close = useCallback((permanent = false) => {
    setShow(false);
    setIosSteps(false);
    if (permanent) setDismissed();
  }, []);

  const handleInstall = useCallback(async () => {
    // iOS: no native prompt possible — show manual steps
    if (platform === "ios") {
      setIosSteps(true);
      return;
    }

    // Android / Desktop: trigger the browser's native install dialog directly
    const evt = window.__pwaPrompt;
    if (!evt) return;

    setInstalling(true);
    try {
      await evt.prompt();
      const { outcome } = await evt.userChoice;
      if (outcome === "accepted") {
        window.__pwaPrompt = null;
        close(true);
      } else {
        // User dismissed the browser dialog — close modal temporarily
        close(false);
      }
    } finally {
      setInstalling(false);
    }
  }, [platform, close]);

  if (!show) return null;

  const platformLabel =
    platform === "ios"     ? "iPhone / iPad" :
    platform === "android" ? "Android" :
                             "جهازك";

  return (
    <div
      className="fixed inset-0 z-[9990] bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-4"
      onClick={() => close(false)}
    >
      <div
        dir="rtl"
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
        className="pwa-modal-enter w-full sm:w-[400px] bg-white rounded-3xl shadow-2xl overflow-hidden"
      >
        {/* Blue header */}
        <div className="bg-gradient-to-br from-blue-600 to-blue-700 px-6 pt-8 pb-6 text-center relative">
          <button
            onClick={() => close(false)}
            className="absolute top-4 left-4 w-8 h-8 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center text-white transition-colors"
            aria-label="إغلاق"
          >
            <X className="w-4 h-4" />
          </button>
          <div className="w-20 h-20 bg-white rounded-[22px] flex items-center justify-center mx-auto mb-3 shadow-xl shadow-blue-900/30">
            <span
              className="text-blue-600 font-black leading-none"
              style={{ fontSize: 48, fontFamily: "Georgia, serif" }}
            >
              ب
            </span>
          </div>
          <h2 className="text-white text-xl font-black">بسيطة</h2>
          <p className="text-blue-200 text-sm mt-1">نظام إدارة المطاعم</p>
        </div>

        {/* Body */}
        <div className="px-6 py-5">
          {iosSteps ? (
            <IOSInstructions onClose={() => close(true)} />
          ) : (
            <>
              <div className="text-center mb-5">
                <p className="text-slate-800 font-semibold text-base leading-snug">
                  ثبّت التطبيق على {platformLabel}
                </p>
                <p className="text-slate-500 text-sm mt-1.5 leading-relaxed">
                  {platform === "ios"
                    ? "أضفه كأيقونة على شاشتك الرئيسية من Safari"
                    : "أضفه كأيقونة على شاشتك الرئيسية للوصول السريع بدون متصفح"}
                </p>
              </div>

              <div className="flex justify-center gap-2 flex-wrap mb-6">
                {["يعمل بدون إنترنت", "وصول سريع", "مثل تطبيق عادي"].map((f) => (
                  <span key={f} className="text-xs bg-blue-50 text-blue-700 px-3 py-1 rounded-full font-medium">
                    {f}
                  </span>
                ))}
              </div>

              <button
                onClick={handleInstall}
                disabled={installing}
                className="w-full flex items-center justify-center gap-2 py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-base rounded-2xl transition-colors shadow-lg shadow-blue-200 disabled:opacity-60 active:scale-[.98]"
              >
                {installing ? (
                  <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : platform === "ios" ? (
                  <Share className="w-5 h-5" />
                ) : platform === "android" ? (
                  <Smartphone className="w-5 h-5" />
                ) : (
                  <Monitor className="w-5 h-5" />
                )}
                {installing ? "جارٍ التثبيت..." : "تثبيت التطبيق"}
              </button>

              <button
                onClick={() => close(true)}
                className="w-full py-2.5 mt-2.5 text-sm text-slate-400 hover:text-slate-600 transition-colors"
              >
                لاحقاً
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
