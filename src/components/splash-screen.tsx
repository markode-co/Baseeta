"use client";
import { useEffect, useState } from "react";

export function SplashScreen() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Show only on first visit per session
    if (sessionStorage.getItem("app-started")) return;
    setVisible(true);
    const t = setTimeout(() => {
      setVisible(false);
      sessionStorage.setItem("app-started", "1");
    }, 2500);
    return () => clearTimeout(t);
  }, []);

  if (!visible) return null;

  return (
    <div
      className="fixed inset-0 z-[9999] flex flex-col items-center justify-center"
      style={{ background: "linear-gradient(145deg, #1d4ed8 0%, #2563eb 60%, #3b82f6 100%)" }}
    >
      {/* Logo */}
      <div className="flex flex-col items-center gap-5 animate-[fadeUp_0.5s_ease-out_forwards]">
        <div
          className="w-28 h-28 rounded-[2rem] flex items-center justify-center shadow-2xl"
          style={{ background: "rgba(255,255,255,0.15)", border: "2px solid rgba(255,255,255,0.3)" }}
        >
          <div
            className="w-20 h-20 rounded-full flex items-center justify-center"
            style={{ border: "3px solid rgba(255,255,255,0.9)" }}
          >
            <span className="text-white font-bold" style={{ fontSize: 42, fontFamily: "serif", lineHeight: 1 }}>
              ب
            </span>
          </div>
        </div>

        <div className="text-center">
          <h1 className="text-white text-4xl font-bold tracking-wide" style={{ fontFamily: "serif" }}>
            بسيطة
          </h1>
          <p className="text-blue-200 text-sm mt-1">نظام إدارة المطاعم</p>
        </div>
      </div>

      {/* Loader dots */}
      <div className="absolute bottom-16 flex gap-2">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="w-2 h-2 bg-white rounded-full animate-bounce"
            style={{ animationDelay: `${i * 150}ms`, opacity: 0.7 }}
          />
        ))}
      </div>

      {/* Loading text */}
      <div className="absolute bottom-8 text-blue-200 text-xs">
        جارٍ تحميل التطبيق...
      </div>
    </div>
  );
}
