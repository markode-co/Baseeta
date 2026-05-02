import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import { Toaster } from "react-hot-toast";
import { SplashScreen } from "@/components/splash-screen";
import { PwaRegister } from "@/components/pwa-register";
import { PwaInstallPrompt } from "@/components/pwa-install-prompt";

const geist = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  themeColor: "#2563eb",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export const metadata: Metadata = {
  title: "بسيطة | نظام إدارة المطاعم",
  description: "نظام سحابي متكامل لإدارة المطاعم والكاشير - بسيط، سريع، وقوي",
  keywords: ["نظام مطعم", "كاشير", "إدارة مطعم", "POS", "restaurant management"],
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "بسيطة",
  },
  formatDetection: { telephone: false },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl" className={`${geist.variable} h-full antialiased`}>
      <head>
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="msapplication-TileColor" content="#2563eb" />
        <meta name="msapplication-tap-highlight" content="no" />
        {/* Capture beforeinstallprompt + clear stale SW caches before chunks load */}
        <script dangerouslySetInnerHTML={{ __html: `
          window.__pwaPrompt = null;
          window.addEventListener('beforeinstallprompt', function(e) {
            e.preventDefault();
            window.__pwaPrompt = e;
          });
          var CURRENT_CACHE = 'baseeta-v3';
          if ('caches' in window) {
            caches.keys().then(function(keys) {
              keys.forEach(function(k) {
                if (k !== CURRENT_CACHE) { caches.delete(k); }
              });
            });
          }
          if ('serviceWorker' in navigator) {
            navigator.serviceWorker.getRegistrations().then(function(regs) {
              regs.forEach(function(reg) {
                reg.update().catch(function() {});
              });
            }).catch(function() {});
          }
        `}} />
      </head>
      <body className="min-h-full">
        <SplashScreen />
        <PwaRegister />
        <PwaInstallPrompt />
        {children}
        <Toaster
          position="top-center"
          toastOptions={{
            duration: 3000,
            style: {
              background: "#1e293b",
              color: "#f1f5f9",
              borderRadius: "12px",
              fontSize: "14px",
              fontFamily: "var(--font-geist-sans), Cairo, sans-serif",
            },
            success: { iconTheme: { primary: "#22c55e", secondary: "#f1f5f9" } },
            error: { iconTheme: { primary: "#ef4444", secondary: "#f1f5f9" } },
          }}
        />
      </body>
    </html>
  );
}
