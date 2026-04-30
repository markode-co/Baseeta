import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import { Toaster } from "react-hot-toast";

const geist = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "بسيطة | نظام إدارة المطاعم",
  description: "نظام سحابي متكامل لإدارة المطاعم والكاشير - بسيط، سريع، وقوي",
  keywords: ["نظام مطعم", "كاشير", "إدارة مطعم", "POS", "restaurant management"],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl" className={`${geist.variable} h-full antialiased`}>
      <body className="min-h-full">
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
