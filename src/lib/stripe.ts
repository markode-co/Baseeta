import Stripe from "stripe";

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
  apiVersion: "2026-04-22.dahlia",
});

export const PLANS = {
  BASIC: {
    name: "أساسي",
    nameEn: "Basic",
    price: 149,
    currency: "SAR",
    stripePriceId: process.env.STRIPE_PRICE_BASIC || "",
    maxBranches: 1,
    maxUsers: 5,
    maxMenuItems: 100,
    features: [
      "فرع واحد",
      "5 مستخدمين",
      "100 صنف في القائمة",
      "نقطة البيع",
      "إدارة الطاولات",
      "تقارير أساسية",
    ],
  },
  PRO: {
    name: "احترافي",
    nameEn: "Pro",
    price: 299,
    currency: "SAR",
    stripePriceId: process.env.STRIPE_PRICE_PRO || "",
    maxBranches: 3,
    maxUsers: 20,
    maxMenuItems: 500,
    isPopular: true,
    features: [
      "3 فروع",
      "20 مستخدم",
      "500 صنف في القائمة",
      "كل ميزات الأساسي",
      "نظام المطبخ KDS",
      "إدارة المخزون",
      "تقارير متقدمة",
      "دعم ذو أولوية",
    ],
  },
  PREMIUM: {
    name: "بريميوم",
    nameEn: "Premium",
    price: 599,
    currency: "SAR",
    stripePriceId: process.env.STRIPE_PRICE_PREMIUM || "",
    maxBranches: -1,
    maxUsers: -1,
    maxMenuItems: -1,
    features: [
      "فروع غير محدودة",
      "مستخدمون غير محدودون",
      "أصناف غير محدودة",
      "كل ميزات الاحترافي",
      "تكامل التوصيل",
      "واجهة برمجية API",
      "مدير حساب مخصص",
      "دعم 24/7",
    ],
  },
};
