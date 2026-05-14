import Stripe from "stripe";

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
  apiVersion: "2026-04-22.dahlia",
});

export const PLANS = {
  BASIC: {
    name: "أساسي",
    nameEn: "Basic",
    monthlyPrice: 1000,
    yearlyPrice: 9000,
    yearlySavings: 3000,
    price: 1000, // For backward compatibility
    currency: "EGP",
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
    name: "متكامل",
    nameEn: "Premium",
    monthlyPrice: 3500,
    yearlyPrice: 31500,
    yearlySavings: 10500,
    price: 3500, // For backward compatibility
    currency: "EGP",
    stripePriceId: process.env.STRIPE_PRICE_PRO || "",
    maxBranches: 3,
    maxUsers: 20,
    maxMenuItems: 500,
    isPopular: true,
    features: [
      "حتى 3 فروع",
      "20 مستخدم",
      "500 صنف في القائمة",
      "إدارة المخزون",
      "ذكاء اصطناعي",
      "تقارير متقدمة",
      "نظام المطبخ KDS",
      "دعم ذو أولوية",
    ],
  },
};
