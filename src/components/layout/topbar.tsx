"use client";
import Link from "next/link";
import { Bell, Search, ChevronDown, Settings } from "lucide-react";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator } from "@/components/ui/dropdown";
import { logout } from "@/app/actions/auth";

interface TopbarProps {
  title: string;
  subtitle?: string;
  userName?: string;
  actions?: React.ReactNode;
  notificationCount?: number;
}

export function Topbar({ title, subtitle, userName = "المستخدم", actions, notificationCount = 0 }: TopbarProps) {
  return (
    <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 sticky top-0 z-30" dir="rtl">
      <div>
        <h1 className="text-lg font-bold text-slate-900">{title}</h1>
        {subtitle && <p className="text-xs text-slate-500">{subtitle}</p>}
      </div>

      <div className="flex items-center gap-3">
        {actions}

        {/* Search */}
        <div className="relative hidden md:block">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            placeholder="بحث..."
            className="w-52 rounded-lg border border-slate-200 bg-slate-50 pr-9 pl-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Notifications */}
        <Link
          href="/dashboard/orders"
          className="relative w-9 h-9 flex items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-slate-700 transition-colors"
        >
          <Bell className="w-4.5 h-4.5" />
          {notificationCount > 0 && (
            <span className="absolute -top-1 -right-1 min-w-[1rem] h-4 px-0.5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
              {notificationCount > 9 ? "9+" : notificationCount}
            </span>
          )}
        </Link>

        {/* User menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors">
              <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center">
                <span className="text-white text-xs font-bold">{userName.charAt(0)}</span>
              </div>
              <span className="text-sm text-slate-700 hidden md:block">{userName}</span>
              <ChevronDown className="w-4 h-4 text-slate-400" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem asChild>
              <Link href="/dashboard/settings" className="flex items-center gap-2 w-full">
                <Settings className="w-4 h-4" /> الإعدادات
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <form action={logout}>
              <DropdownMenuItem asChild>
                <button type="submit" className="w-full text-right text-red-600">
                  تسجيل الخروج
                </button>
              </DropdownMenuItem>
            </form>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
