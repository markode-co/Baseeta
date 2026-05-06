"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, ShoppingCart, UtensilsCrossed, ClipboardList,
  Table2, Users, BarChart3, CreditCard, Package, Settings,
  Utensils, ChevronLeft, Bell, LogOut, Store, X,
  ChevronsLeft, ChevronsRight, ShieldCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { logout } from "@/app/actions/auth";
import { ClosingButton } from "@/components/closing-modal";

const NAV_ITEMS = [
  { href: "/dashboard",              icon: LayoutDashboard, label: "لوحة التحكم",   roles: ["SUPER_ADMIN","ADMIN","MANAGER"] },
  { href: "/dashboard/pos",          icon: ShoppingCart,    label: "الكاشير",        roles: ["SUPER_ADMIN","ADMIN","MANAGER","CASHIER","WAITER"] },
  { href: "/dashboard/orders",       icon: ClipboardList,   label: "الطلبات",        roles: ["SUPER_ADMIN","ADMIN","MANAGER","CASHIER","WAITER","KITCHEN"] },
  { href: "/dashboard/tables",       icon: Table2,          label: "الطاولات",       roles: ["SUPER_ADMIN","ADMIN","MANAGER","WAITER"] },
  { href: "/dashboard/menu",         icon: UtensilsCrossed, label: "القائمة",        roles: ["SUPER_ADMIN","ADMIN","MANAGER"] },
  { href: "/dashboard/inventory",    icon: Package,         label: "المخزون",        roles: ["SUPER_ADMIN","ADMIN","MANAGER"] },
  { href: "/dashboard/staff",        icon: Users,           label: "الموظفون",       roles: ["SUPER_ADMIN","ADMIN","MANAGER"] },
  { href: "/dashboard/reports",      icon: BarChart3,       label: "التقارير",       roles: ["SUPER_ADMIN","ADMIN","MANAGER"] },
  { href: "/dashboard/subscription", icon: CreditCard,      label: "الاشتراك",       roles: ["SUPER_ADMIN","ADMIN"] },
  { href: "/dashboard/branches",     icon: Store,           label: "الفروع",         roles: ["SUPER_ADMIN","ADMIN"] },
  { href: "/dashboard/settings",     icon: Settings,        label: "الإعدادات",      roles: ["SUPER_ADMIN","ADMIN"] },
];

interface SidebarProps {
  orgName?: string;
  userRole?: string;
  userName?: string;
  notificationCount?: number;
  collapsed?: boolean;
  mobileOpen?: boolean;
  onToggleCollapse?: () => void;
  onCloseMobile?: () => void;
  isPlatformAdmin?: boolean;
}

export function Sidebar({
  orgName = "المطعم أو الكافيه",
  userRole = "ADMIN",
  userName = "المستخدم",
  notificationCount = 0,
  collapsed = false,
  mobileOpen = false,
  onToggleCollapse,
  onCloseMobile,
  isPlatformAdmin = false,
}: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside
      dir="rtl"
      className={cn(
        "flex flex-col h-screen bg-slate-900 text-slate-100",
        "fixed right-0 top-0 z-50 border-l border-slate-800",
        "transition-all duration-300 ease-in-out",
        collapsed ? "md:w-16 w-64" : "md:w-64 w-64",
        "max-md:shadow-xl",
        mobileOpen ? "max-md:translate-x-0" : "max-md:translate-x-full",
      )}
    >
      {/* ── Header ─────────────────────────────────────── */}
      <div className={cn(
        "flex items-center border-b border-slate-800 min-h-[64px] px-3",
        collapsed ? "md:flex-col md:justify-center md:py-3 md:gap-2 md:px-2" : "gap-3 py-4",
      )}>
        <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center flex-shrink-0">
          <Utensils className="w-5 h-5 text-white" />
        </div>

        {/* Title + buttons — hidden when collapsed on desktop */}
        <div className={cn("flex-1 min-w-0 flex items-center gap-1", collapsed && "md:hidden")}>
          <div className="flex-1 min-w-0">
            <p className="text-white font-bold text-base leading-none">بسيطة</p>
            {orgName && <p className="text-slate-400 text-xs truncate mt-0.5">{orgName}</p>}
          </div>
          {/* Close — mobile only */}
          <button
            onClick={onCloseMobile}
            className="md:hidden p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
          {/* Collapse — desktop only */}
          <button
            onClick={onToggleCollapse}
            className="hidden md:flex p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
            title="طي القائمة"
          >
            <ChevronsRight className="w-4 h-4" />
          </button>
        </div>

        {/* Expand button — desktop collapsed only */}
        <button
          onClick={onToggleCollapse}
          className={cn(
            "p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors",
            collapsed ? "hidden md:flex" : "hidden",
          )}
          title="توسيع القائمة"
        >
          <ChevronsLeft className="w-4 h-4" />
        </button>
      </div>

      {/* ── Navigation ─────────────────────────────────── */}
      <nav className="flex-1 overflow-y-auto py-3 px-2">
        <ul className="space-y-0.5">
          {NAV_ITEMS.filter((item) => item.roles.includes(userRole)).map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== "/dashboard" && pathname.startsWith(item.href));
            const Icon = item.icon;
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={onCloseMobile}
                  title={collapsed ? item.label : undefined}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-150",
                    collapsed && "md:justify-center md:px-0 md:py-3",
                    isActive
                      ? "bg-blue-600 text-white font-medium"
                      : "text-slate-400 hover:bg-slate-800 hover:text-slate-100",
                  )}
                >
                  <Icon className="w-[18px] h-[18px] flex-shrink-0" />
                  <span className={cn(collapsed && "md:hidden")}>{item.label}</span>
                  {isActive && (
                    <ChevronLeft className={cn("w-3 h-3 mr-auto opacity-60", collapsed && "md:hidden")} />
                  )}
                </Link>
              </li>
            );
          })}

          {isPlatformAdmin && (
            <li className="pt-2 mt-2 border-t border-slate-700">
              <Link
                href="/platform"
                onClick={onCloseMobile}
                title={collapsed ? "لوحة التحكم الكاملة" : undefined}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-150",
                  collapsed && "md:justify-center md:px-0 md:py-3",
                  "text-violet-400 hover:bg-violet-500/10 hover:text-violet-300",
                )}
              >
                <ShieldCheck className="w-[18px] h-[18px] flex-shrink-0" />
                <span className={cn(collapsed && "md:hidden")}>لوحة التحكم الكاملة</span>
              </Link>
            </li>
          )}
        </ul>
      </nav>

      {/* ── Footer ─────────────────────────────────────── */}
      <div className="border-t border-slate-800 p-3">
        {/* Expanded */}
        <div className={cn(collapsed && "md:hidden")}>
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 bg-blue-600/20 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-blue-400 text-sm font-bold">{userName.charAt(0)}</span>
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
          <div className="mb-1">
            <ClosingButton collapsed={false} />
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

        {/* Collapsed */}
        <div className={cn("flex-col items-center gap-2", collapsed ? "hidden md:flex" : "hidden")}>
          <Link
            href="/dashboard/orders"
            title="الإشعارات"
            className="relative p-2 text-slate-400 hover:text-white transition-colors rounded-lg hover:bg-slate-800"
          >
            <Bell className="w-4 h-4" />
            {notificationCount > 0 && (
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full border border-slate-900" />
            )}
          </Link>
          <ClosingButton collapsed={true} />
          <form action={logout}>
            <button
              type="submit"
              title="تسجيل الخروج"
              className="p-2 text-slate-400 hover:text-red-400 transition-colors rounded-lg hover:bg-slate-800"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </aside>
  );
}
