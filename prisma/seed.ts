import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const db = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  // Create Plans
  const plans = await Promise.all([
    db.plan.upsert({
      where: { stripePriceId: "price_basic_monthly" },
      update: {},
      create: {
        name: "Basic",
        nameAr: "أساسي",
        description: "Perfect for single restaurants",
        descriptionAr: "مناسب للمطاعم الفردية",
        price: 149,
        currency: "SAR",
        interval: "month",
        stripePriceId: "price_basic_monthly",
        maxBranches: 1,
        maxUsers: 5,
        maxMenuItems: 100,
        features: ["فرع واحد", "5 مستخدمين", "100 صنف", "نقطة البيع", "إدارة الطاولات"],
        isActive: true,
      },
    }),
    db.plan.upsert({
      where: { stripePriceId: "price_pro_monthly" },
      update: {},
      create: {
        name: "Pro",
        nameAr: "احترافي",
        price: 299,
        currency: "SAR",
        interval: "month",
        stripePriceId: "price_pro_monthly",
        maxBranches: 3,
        maxUsers: 20,
        maxMenuItems: 500,
        features: ["3 فروع", "20 مستخدم", "500 صنف", "كل ميزات الأساسي", "نظام KDS", "إدارة المخزون"],
        isPopular: true,
        isActive: true,
      },
    }),
    db.plan.upsert({
      where: { stripePriceId: "price_premium_monthly" },
      update: {},
      create: {
        name: "Premium",
        nameAr: "بريميوم",
        price: 599,
        currency: "SAR",
        interval: "month",
        stripePriceId: "price_premium_monthly",
        maxBranches: -1,
        maxUsers: -1,
        maxMenuItems: -1,
        features: ["فروع غير محدودة", "مستخدمون غير محدودون", "كل الميزات", "دعم 24/7"],
        isActive: true,
      },
    }),
  ]);

  const [basicPlan] = plans;

  // Create demo organization
  const existingOrg = await db.organization.findUnique({ where: { slug: "demo-restaurant" } });

  if (!existingOrg) {
    const org = await db.organization.create({
      data: {
        name: "مطعم بسيطة التجريبي",
        slug: "demo-restaurant",
        email: "demo@baseeta.app",
        phone: "0500000000",
        address: "الرياض، المملكة العربية السعودية",
        taxRate: 0.15,
        subscription: {
          create: {
            planId: basicPlan.id,
            status: "TRIALING",
            trialEnd: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
          },
        },
      },
    });

    const branch = await db.branch.create({
      data: {
        organizationId: org.id,
        name: "الفرع الرئيسي",
        address: "الرياض، حي النخيل",
        phone: "0500000000",
        openTime: "08:00",
        closeTime: "23:00",
      },
    });

    const hashedPassword = await bcrypt.hash("Demo@12345", 12);

    await db.user.create({
      data: {
        organizationId: org.id,
        branchId: branch.id,
        name: "مدير النظام",
        email: "admin@baseeta.app",
        password: hashedPassword,
        role: "ADMIN",
      },
    });

    // Categories
    const categories = await db.category.createManyAndReturn({
      data: [
        { organizationId: org.id, name: "Hot Drinks", nameAr: "مشروبات ساخنة", color: "#ef4444", sortOrder: 1 },
        { organizationId: org.id, name: "Cold Drinks", nameAr: "مشروبات باردة", color: "#3b82f6", sortOrder: 2 },
        { organizationId: org.id, name: "Main Dishes", nameAr: "أطباق رئيسية", color: "#22c55e", sortOrder: 3 },
        { organizationId: org.id, name: "Sandwiches", nameAr: "سندويشات", color: "#f59e0b", sortOrder: 4 },
        { organizationId: org.id, name: "Desserts", nameAr: "حلويات", color: "#ec4899", sortOrder: 5 },
      ],
    });

    const [hotDrinks, coldDrinks, mainDishes, sandwiches, desserts] = categories;

    // Menu items
    await db.menuItem.createMany({
      data: [
        // Hot Drinks
        { organizationId: org.id, categoryId: hotDrinks.id, name: "Espresso", nameAr: "إسبريسو", price: 12, cost: 3, preparationTime: 3, sortOrder: 1 },
        { organizationId: org.id, categoryId: hotDrinks.id, name: "Cappuccino", nameAr: "كابتشينو", price: 18, cost: 5, preparationTime: 4, sortOrder: 2 },
        { organizationId: org.id, categoryId: hotDrinks.id, name: "Latte", nameAr: "لاتيه", price: 20, cost: 6, preparationTime: 4, sortOrder: 3 },
        { organizationId: org.id, categoryId: hotDrinks.id, name: "Tea", nameAr: "شاي", price: 8, cost: 1, preparationTime: 3, sortOrder: 4 },
        // Cold Drinks
        { organizationId: org.id, categoryId: coldDrinks.id, name: "Ice Latte", nameAr: "آيس لاتيه", price: 22, cost: 7, preparationTime: 3, sortOrder: 1 },
        { organizationId: org.id, categoryId: coldDrinks.id, name: "Lemonade", nameAr: "ليمون نعنع", price: 15, cost: 4, preparationTime: 3, sortOrder: 2 },
        { organizationId: org.id, categoryId: coldDrinks.id, name: "Orange Juice", nameAr: "عصير برتقال", price: 14, cost: 4, preparationTime: 3, sortOrder: 3 },
        { organizationId: org.id, categoryId: coldDrinks.id, name: "Cola", nameAr: "كولا", price: 8, cost: 2, preparationTime: 1, sortOrder: 4 },
        // Main Dishes
        { organizationId: org.id, categoryId: mainDishes.id, name: "Beef Burger", nameAr: "برجر لحم", price: 35, cost: 12, preparationTime: 12, isFeatured: true, sortOrder: 1 },
        { organizationId: org.id, categoryId: mainDishes.id, name: "Chicken Shawarma", nameAr: "شاورما دجاج", price: 28, cost: 9, preparationTime: 10, isFeatured: true, sortOrder: 2 },
        { organizationId: org.id, categoryId: mainDishes.id, name: "Margherita Pizza", nameAr: "بيتزا مارغريتا", price: 45, cost: 15, preparationTime: 15, sortOrder: 3 },
        { organizationId: org.id, categoryId: mainDishes.id, name: "Grilled Chicken", nameAr: "دجاج مشوي", price: 40, cost: 13, preparationTime: 18, sortOrder: 4 },
        // Sandwiches
        { organizationId: org.id, categoryId: sandwiches.id, name: "Club Sandwich", nameAr: "كلوب سندويش", price: 25, cost: 8, preparationTime: 8, sortOrder: 1 },
        { organizationId: org.id, categoryId: sandwiches.id, name: "Chicken Sandwich", nameAr: "سندويش دجاج", price: 22, cost: 7, preparationTime: 7, sortOrder: 2 },
        // Desserts
        { organizationId: org.id, categoryId: desserts.id, name: "Chocolate Cake", nameAr: "كيك شوكولاتة", price: 22, cost: 7, preparationTime: 2, sortOrder: 1 },
        { organizationId: org.id, categoryId: desserts.id, name: "Cheesecake", nameAr: "تشيز كيك", price: 25, cost: 8, preparationTime: 2, sortOrder: 2 },
      ],
    });

    // Tables
    await db.table.createMany({
      data: Array.from({ length: 12 }, (_, i) => ({
        branchId: branch.id,
        name: `T${i + 1}`,
        capacity: i < 4 ? 2 : i < 8 ? 4 : 6,
        section: i < 6 ? "Indoor" : "Outdoor",
        posX: (i % 4) * 120 + 40,
        posY: Math.floor(i / 4) * 120 + 40,
      })),
    });

    console.log("✅ Demo organization created!");
    console.log("📧 Email: admin@baseeta.app");
    console.log("🔑 Password: Demo@12345");
  }

  console.log("✅ Seeding complete!");
}

main()
  .catch(console.error)
  .finally(() => db.$disconnect());
