import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number, currency = "SAR"): string {
  return new Intl.NumberFormat("ar-SA", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  }).format(amount);
}

export function formatDate(date: Date | string, locale = "ar-SA"): string {
  return new Intl.DateTimeFormat(locale, {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date(date));
}

export function formatDateTime(date: Date | string, locale = "ar-SA"): string {
  return new Intl.DateTimeFormat(locale, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
}

export function generateOrderNumber(): string {
  const timestamp = Date.now().toString().slice(-6);
  const random = Math.floor(Math.random() * 100)
    .toString()
    .padStart(2, "0");
  return `ORD-${timestamp}-${random}`;
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^\w-]/g, "")
    .replace(/--+/g, "-")
    .trim();
}

export function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export const ORDER_STATUS_MAP: Record<string, { label: string; labelAr: string; color: string }> = {
  PENDING: { label: "Pending", labelAr: "معلق", color: "warning" },
  CONFIRMED: { label: "Confirmed", labelAr: "مؤكد", color: "primary" },
  PREPARING: { label: "Preparing", labelAr: "يُحضَّر", color: "primary" },
  READY: { label: "Ready", labelAr: "جاهز", color: "success" },
  SERVED: { label: "Served", labelAr: "قُدِّم", color: "success" },
  COMPLETED: { label: "Completed", labelAr: "مكتمل", color: "muted" },
  CANCELLED: { label: "Cancelled", labelAr: "ملغي", color: "danger" },
};

export const TABLE_STATUS_MAP: Record<string, { label: string; labelAr: string; color: string }> = {
  AVAILABLE: { label: "Available", labelAr: "متاحة", color: "success" },
  OCCUPIED: { label: "Occupied", labelAr: "مشغولة", color: "danger" },
  RESERVED: { label: "Reserved", labelAr: "محجوزة", color: "warning" },
  MAINTENANCE: { label: "Maintenance", labelAr: "صيانة", color: "muted" },
};
