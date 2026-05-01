"use client";
import { useState, useEffect } from "react";
import { Sidebar } from "./sidebar";
import { Menu, Utensils } from "lucide-react";

interface SidebarLayoutProps {
  children: React.ReactNode;
  orgName?: string;
  userRole?: string;
  userName?: string;
  notificationCount?: number;
}

export function SidebarLayout({
  children, orgName, userRole, userName, notificationCount,
}: SidebarLayoutProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    try {
      const v = localStorage.getItem("sidebar-collapsed");
      if (v !== null) setCollapsed(v === "true");
    } catch {}
  }, []);

  function toggleCollapse() {
    setCollapsed((prev) => {
      const next = !prev;
      try { localStorage.setItem("sidebar-collapsed", String(next)); } catch {}
      return next;
    });
  }

  return (
    <div className="flex min-h-screen bg-slate-50" dir="rtl">
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <Sidebar
        orgName={orgName}
        userRole={userRole}
        userName={userName}
        notificationCount={notificationCount}
        collapsed={collapsed}
        mobileOpen={mobileOpen}
        onToggleCollapse={toggleCollapse}
        onCloseMobile={() => setMobileOpen(false)}
      />

      <div
        className={`flex-1 flex flex-col min-h-screen transition-[margin] duration-300 ${
          collapsed ? "md:mr-16" : "md:mr-64"
        }`}
      >
        {/* Mobile top bar */}
        <div className="md:hidden sticky top-0 z-30 bg-white border-b border-slate-100 flex items-center justify-between px-4 h-14 flex-shrink-0">
          <button
            onClick={() => setMobileOpen(true)}
            className="w-9 h-9 flex items-center justify-center rounded-lg text-slate-600 hover:bg-slate-100 transition-colors"
            aria-label="فتح القائمة"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-blue-600 rounded-lg flex items-center justify-center">
              <Utensils className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-slate-900">بسيطة</span>
          </div>
          <div className="w-9" />
        </div>

        {children}
      </div>
    </div>
  );
}
