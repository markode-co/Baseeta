"use client";
import { useEffect, useState, useCallback, useRef } from "react";
import { X, Download, Share, Plus, Smartphone, Monitor, ArrowDown, Check } from "lucide-react";

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

function isInStandaloneMode(): boolean {
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

// ── iOS Direct Install Button ─────────────────────────────────────────────────────
function IOSInstallButton({ onComplete }: { onComplete: () => void }) {
  const [showShareSheet, setShowShareSheet] = useState(false);
  const [installed, setInstalled] = useState(false);
  const shareRef = useRef<HTMLAnchorElement>(null);

  useEffect(() => {
    // Check if already installed
    if (isInStandaloneMode()) {
      setInstalled(true);
      onComplete();
    }
  }, [onComplete]);

  const handleInstall = () => {
    // Trigger native share sheet which includes "Add to Home Screen"
    setShowShareSheet(true);
    // Use setTimeout to allow the state to update before triggering
    setTimeout(() => {
      if (shareRef.current) {
        shareRef.current.click();
      }
    }, 100);
  };

  if (installed) {
    return (
      <div className="mt-5 text-center">
        <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
          <Check className="w-8 h-8 text-green-600" />
        </div>
        <p className="text-green-600 font-semibold">تم تثبيت التطبيق!</p>
        <p className="text-slate-500 text-sm mt-1">تجد الأيقونة على شاشتك الرئيسية</p>
      </div>
    );
  }

  return (
    <div className="mt-5">
      {/* Hidden share link that triggers iOS share sheet */}
      <a
        ref={shareRef}
        href={typeof window !== 'undefined' ? window.location.href : '#'}
        onClick={(e) => {
          e.preventDefault();
          // The share sheet will appear and user can select "Add to Home Screen"
        }}
        style={{ display: 'none' }}
        aria-hidden="true"
      />
      
      <button
        onClick={handleInstall}
        className="w-full flex items-center justify-center gap-2 py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold text-lg rounded-2xl transition-all shadow-lg shadow-blue-200 active:scale-[.98]"
      >
        <Download className="w-6 h-6" />
        تنزيل التطبيق
      </button>
      
      <p className="text-xs text-slate-400 mt-3 text-center">
        سينتقل بك إلى قائمة المشاركة. اختر "إضافة إلى الشاشة الرئيسية"
      </p>
      
      <button
        onClick={onComplete}
        className="w-full py-2.5 mt-4 text-sm text-slate-400 hover:text-slate-600 transition-colors"
      >
        لاحقاً
      </button>
    </div>
  );
}

// ── Main Modal ────────────────────────────────────────────────────────────────
export function PwaInstallPrompt() {
  const [show,       setShow]       = useState(false);
  const [platform,   setPlatform]   = useState<Platform>("desktop");
  const [installing, setInstalling] = useState(false);

  useEffect(() => {
    if (isInStandaloneMode()) return;

    function tryShow() {
      if (isInStandaloneMode() || wasDismissed()) return;
      setPlatform(getPlatform());
      setShow(true);
    }

    // iOS: show prompt after delay
    if (isIOS()) {
      const t = setTimeout(tryShow, 2000);
      return () => clearTimeout(t);
    }

    // Android / Desktop: only show when native install prompt is available
    if (window.__pwaPrompt) {
      const t = setTimeout(tryShow, 2000);
      return () => clearTimeout(t);
    }

    // Capture it if it fires after mount
    const handler = (e: Event) => {
      e.preventDefault();
      window.__pwaPrompt = e as BeforeInstallPromptEvent;
      setTimeout(tryShow, 500);
    };
    window.addEventListener("beforeinstallprompt", handler);

    // Listen for custom event to show prompt from anywhere
    const showPromptHandler = () => {
      setPlatform(getPlatform());
      setShow(true);
    };
    window.addEventListener("show-pwa-prompt", showPromptHandler);

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
      window.removeEventListener("show-pwa-prompt", showPromptHandler);
    };
  }, []);

  const close = useCallback((permanent = false) => {
    setShow(false);
    if (permanent) setDismissed();
  }, []);

  const handleInstall = useCallback(async () => {
    // iOS: trigger share sheet for direct add to home screen
    if (platform === "ios") {
      // Try to use Web Share API if available
      if (navigator.share) {
        try {
          await navigator.share({
            title: "بسيطة - نظام إدارة المطاعم",
            text: "فتح تطبيق بسيطة",
            url: window.location.href,
          });
        } catch (e) {
          // User cancelled or error - fall back to opening share sheet manually
          const shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent('Check out بسيطة app')}&url=${encodeURIComponent(window.location.href)}`;
          window.open(shareUrl, '_blank');
        }
      } else {
        // Fallback: open a new window that might trigger share sheet
        window.open(window.location.href, '_blank');
      }
      return;
    }

    // Android / Desktop: trigger the browser's native install dialog
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
          {platform === "ios" ? (
            <IOSInstallButton onComplete={() => close(true)} />
          ) : (
            <>
              <div className="text-center mb-5">
                <p className="text-slate-800 font-semibold text-base leading-snug">
                  ثبّت التطبيق على {platformLabel}
                </p>
                <p className="text-slate-500 text-sm mt-1.5 leading-relaxed">
                  أضفه كأيقونة على شاشتك الرئيسية للوصول السريع بدون متصفح
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
