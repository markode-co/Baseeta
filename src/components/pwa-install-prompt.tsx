"use client";
import { useEffect, useState, useCallback } from "react";
import { X, Download, Share, Plus, Smartphone, Monitor, MoreVertical, ArrowDown } from "lucide-react";

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
type StepScreen = "ios" | "android" | "desktop";

function getPlatform(): Platform | null {
  const ua = navigator.userAgent.toLowerCase();
  if (/iphone|ipad|ipod/.test(ua)) return "ios";
  if (/android/.test(ua)) return "android";
  if (/windows|macintosh|linux/.test(ua)) return "desktop";
  return null;
}

function isInstalled(): boolean {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (navigator as unknown as { standalone?: boolean }).standalone === true ||
    document.referrer.startsWith("android-app://")
  );
}

function getDismissedAt(): number {
  try { return parseInt(localStorage.getItem("pwa-dismissed") || "0"); } catch { return 0; }
}
function setDismissed() {
  try { localStorage.setItem("pwa-dismissed", String(Date.now())); } catch {}
}
function wasDismissed(): boolean {
  const t = getDismissedAt();
  if (!t) return false;
  // For testing: show again after 1 hour instead of 3 days
  return Date.now() - t < 1 * 60 * 60 * 1000;
}

// ── iOS instructions ─────────────────────────────────────────────────────────
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

// ── Android instructions (Chrome / Edge) ─────────────────────────────────────
function AndroidInstructions({ onClose }: { onClose: () => void }) {
  return (
    <div className="mt-5 space-y-3 text-right">
      <p className="text-sm font-semibold text-slate-700 mb-4">اتبع هذه الخطوات في Chrome:</p>
      {[
        {
          num: "١",
          icon: MoreVertical,
          text: "افتح قائمة المتصفح",
          sub: "اضغط النقاط الثلاث ⋮ في أعلى يمين الشاشة",
        },
        {
          num: "٢",
          icon: Plus,
          text: "اختر «إضافة إلى الشاشة الرئيسية»",
          sub: "أو «تثبيت التطبيق» إن ظهرت",
        },
        {
          num: "٣",
          icon: Download,
          text: "اضغط «إضافة»",
          sub: "سيظهر التطبيق كأيقونة على شاشتك",
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
      <button
        onClick={onClose}
        className="w-full py-2.5 rounded-xl border border-slate-200 text-sm text-slate-500 hover:bg-slate-50 transition-colors mt-2"
      >
        حسناً، فهمت
      </button>
    </div>
  );
}

// ── Desktop instructions (Chrome / Edge) ─────────────────────────────────────
function DesktopInstructions({ onClose }: { onClose: () => void }) {
  return (
    <div className="mt-5 space-y-3 text-right">
      <p className="text-sm font-semibold text-slate-700 mb-4">اتبع هذه الخطوات في Chrome أو Edge:</p>
      {[
        {
          num: "١",
          icon: Monitor,
          text: "ابحث عن أيقونة التثبيت",
          sub: "تظهر في شريط العنوان على اليسار أو اليمين ⊕",
        },
        {
          num: "٢",
          icon: Download,
          text: "اضغط «تثبيت» أو «Install»",
          sub: "أو من قائمة المتصفح ← «تثبيت بسيطة»",
        },
        {
          num: "٣",
          icon: Plus,
          text: "أكّد التثبيت",
          sub: "سيُفتح التطبيق كنافذة مستقلة بدون شريط متصفح",
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
      <button
        onClick={onClose}
        className="w-full py-2.5 rounded-xl border border-slate-200 text-sm text-slate-500 hover:bg-slate-50 transition-colors mt-2"
      >
        حسناً، فهمت
      </button>
    </div>
  );
}

// ── Main Modal ───────────────────────────────────────────────────────────────
export function PwaInstallPrompt() {
  const [show,       setShow]       = useState(false);
  const [platform,   setPlatform]   = useState<Platform | null>(null);
  const [stepScreen, setStepScreen] = useState<StepScreen | null>(null);
  const [installing, setInstalling] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      // Debug: always show for testing (remove in production)
      const isTestMode = true; // Set to false after testing
      if (!isTestMode && (isInstalled() || wasDismissed())) return;
      
      const p = getPlatform();
      console.log("PWA Platform detected:", p);
      console.log("PWA Installed:", isInstalled());
      console.log("PWA Dismissed:", wasDismissed());
      
      if (!p) return;
      setPlatform(p);
      setShow(true);
    }, 3000); // Show after 3 seconds to let splash screen finish
    return () => clearTimeout(timer);
  }, []);

  const close = useCallback((permanent = false) => {
    setShow(false);
    if (permanent) setDismissed();
  }, []);

  const handleInstall = useCallback(async () => {
    // iOS: always manual (no native prompt possible)
    if (platform === "ios") {
      setStepScreen("ios");
      return;
    }

    // Android / Desktop: try native prompt first
    const evt = window.__pwaPrompt;
    if (evt) {
      setInstalling(true);
      try {
        await evt.prompt();
        const { outcome } = await evt.userChoice;
        if (outcome === "accepted") {
          window.__pwaPrompt = null;
          close(true);
        }
      } finally {
        setInstalling(false);
      }
      return;
    }

    // No native prompt — show platform-specific manual instructions
    setStepScreen(platform === "android" ? "android" : "desktop");
  }, [platform, close]);

  if (!show || !platform) return null;

  const platformLabel =
    platform === "ios"     ? "iPhone / iPad" :
    platform === "android" ? "Android" :
                             "جهازك";

  const hasNativePrompt = platform !== "ios" && !!window.__pwaPrompt;

  return (
    <>
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
            {stepScreen === "ios" ? (
              <IOSInstructions onClose={() => close(true)} />
            ) : stepScreen === "android" ? (
              <AndroidInstructions onClose={() => close(true)} />
            ) : stepScreen === "desktop" ? (
              <DesktopInstructions onClose={() => close(true)} />
            ) : (
              <>
                <div className="text-center mb-5">
                  <p className="text-slate-800 font-semibold text-base leading-snug">
                    ثبّت التطبيق على {platformLabel}
                  </p>
                  <p className="text-slate-500 text-sm mt-1.5 leading-relaxed">
                    {hasNativePrompt
                      ? "أضفه كأيقونة على شاشتك الرئيسية للوصول السريع بدون متصفح"
                      : platform === "ios"
                        ? "أضفه كأيقونة على شاشتك الرئيسية من Safari"
                        : "أضفه كأيقونة للوصول السريع بدون متصفح"}
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
    </>
  );
}
