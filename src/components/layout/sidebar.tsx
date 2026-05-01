"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, ShoppingCart, UtensilsCrossed, ClipboardList,
  Table2, Users, BarChart3, CreditCard, Package, Settings,
  Utensils, ChevronLeft, Bell, LogOut, Store
} from "lucide-react";
import { cn } from "@/lib/utils";
import { logout } from "@/app/actions/auth";

const NAV_ITEMS = [
  { href: "/dashboard", icon: LayoutDashboard, label: "لوحة التحكم", labelEn: "Dashboard" },
  { href: "/dashboard/pos", icon: ShoppingCart, label: "الكاشير", labelEn: "POS" },
  { href: "/dashboard/orders", icon: ClipboardList, label: "الطلبات", labelEn: "Orders" },
  { href: "/dashboard/tables", icon: Table2, label: "الطاولات", labelEn: "Tables" },
  { href: "/dashboard/menu", icon: UtensilsCrossed, label: "القائمة", labelEn: "Menu" },
  { href: "/dashboard/inventory", icon: Package, label: "المخزون", labelEn: "Inventory" },
  { href: "/dashboard/staff", icon: Users, label: "الموظفون", labelEn: "Staff" },
  { href: "/dashboard/reports", icon: BarChart3, label: "التقارير", labelEn: "Reports" },
  { href: "/dashboard/subscription", icon: CreditCard, label: "الاشتراك", labelEn: "Subscription" },
  { href: "/dashboard/branches", icon: Store, label: "الفروع", labelEn: "Branches" },
  { href: "/dashboard/settings", icon: Settings, label: "الإعدادات", labelEn: "Settings" },
];

interface SidebarProps {
  orgName?: string;
  userRole?: string;
  userName?: string;
  notificationCount?: number;
}

export function Sidebar({ orgName = "المطعم", userRole = "ADMIN", userName = "المستخدم", notificationCount = 0 }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside className="flex flex-col w-64 h-screen bg-slate-900 text-slate-100 fixed right-0 top-0 z-40 border-l border-slate-800" dir="rtl">
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-5 border-b border-slate-800">
        <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center flex-shrink-0">
          <Utensils className="w-5 h-5 text-white" />
        </div>
        <div className="min-w-0">
          <p className="text-white font-bold text-lg leading-none">بسيطة</p>
          <p className="text-slate-400 text-xs truncate mt-0.5">{orgName}</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-3">
        <ul className="space-y-0.5">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
            const Icon = item.icon;
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-150",
                    isActive
                      ? "bg-blue-600 text-white font-medium"
                      : "text-slate-400 hover:bg-slate-800 hover:text-slate-100"
                  )}
                >
                  <Icon className="w-4.5 h-4.5 flex-shrink-0" />
                  <span>{item.label}</span>
                  {isActive && <ChevronLeft className="w-3 h-3 mr-auto opacity-60" />}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* User footer */}
      <div className="border-t border-slate-800 p-4">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-9 h-9 bg-blue-600/20 rounded-full flex items-center justify-center flex-shrink-0">
            <span className="text-blue-400 text-sm font-bold">
              {userName.charAt(0)}
            </span>
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-slate-200 text-sm font-medium truncate">{userName}</p>
            <p className="text-slate-500 text-xs">{userRole}</p>
          </div>
          <Link href="/dashboard/orders" className="relative text-slate-500 hover:text-slate-300 transition-colors">
            <Bell className="w-4 h-4" />
            {notificationCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                {notificationCount > 9 ? "9+" : notificationCount}
              </span>
            )}
          </Link>
        </div>
        <form action={logout}>
          <button
            type="submit"
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-slate-400 hover:bg-slate-800 hover:text-red-400 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>تسجيل الخروج</span>
          </button>
        </form>
      </div>
    </aside>
  );
}
