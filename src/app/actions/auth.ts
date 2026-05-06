"use server";
import { z } from "zod";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { hashPassword, verifyPassword, createSession, deleteSession, getSession } from "@/lib/auth";
import { createPlatformSession, PLATFORM_ADMIN_EMAIL } from "@/lib/platform-auth";
import { slugify } from "@/lib/utils";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

const registerSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
  restaurantName: z.string().min(2),
  phone: z.string().optional(),
});

export async function login(formData: FormData) {
  const raw = {
      email: formData.get("email") as string,
      password: formData.get("password") as string,
    };

    const parsed = loginSchema.safeParse(raw);
    if (!parsed.success) {
      return { error: "بيانات غير صحيحة" };
    }

    // Platform super admin check
    if (
      parsed.data.email === PLATFORM_ADMIN_EMAIL &&
      parsed.data.password === process.env.PLATFORM_ADMIN_PASSWORD
    ) {
      const token = await createPlatformSession();
      const cookieStore = await cookies();
      cookieStore.set("platform-token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 24 * 60 * 60,
        path: "/",
      });
      redirect("/platform");
    }

    // Database query with error handling
    let user;
    try {
      user = await db.user.findFirst({
        where: { email: parsed.data.email, isActive: true },
        include: { organization: { include: { subscription: true } } },
      });
    } catch (dbError) {
      // Handle Prisma P1000 (Authentication failed) or other DB errors
      console.error("Database query error:", dbError);
      return { error: "حدث خطأ في الاتصال بخادم البيانات. يرجى المحاولة لاحقاً." };
    }

    if (!user || !user.password) {
      return { error: "البريد الإلكتروني أو كلمة المرور غير صحيحة" };
    }

    const valid = await verifyPassword(parsed.data.password, user.password);
    if (!valid) {
      return { error: "البريد الإلكتروني أو كلمة المرور غير صحيحة" };
    }

    const token = await createSession({
      userId: user.id,
      organizationId: user.organizationId,
      branchId: user.branchId ?? undefined,
      role: user.role,
      email: user.email,
      name: user.name,
    });

    // Update last login with error handling
    try {
      await db.user.update({
        where: { id: user.id },
        data: { lastLogin: new Date() },
      });
    } catch (updateError) {
      // Log but don't fail the login if update fails
      console.error("Failed to update lastLogin:", updateError);
    }

    const cookieStore = await cookies();
    cookieStore.set("auth-token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60,
      path: "/",
    });

    // Success - redirect (this throws NEXT_REDIRECT which Next.js catches)
    redirect("/dashboard");
}

export async function register(formData: FormData) {
  const raw = {
    name: formData.get("name") as string,
    email: formData.get("email") as string,
    password: formData.get("password") as string,
    restaurantName: formData.get("restaurantName") as string,
    phone: formData.get("phone") as string,
  };

  const parsed = registerSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message || "بيانات غير صحيحة" };
  }

  const existing = await db.user.findFirst({ where: { email: parsed.data.email } });
  if (existing) {
    return { error: "البريد الإلكتروني مستخدم بالفعل" };
  }

  const slug = slugify(parsed.data.restaurantName) + "-" + Date.now().toString().slice(-4);

  const freePlan = await db.plan.findFirst({ where: { isActive: true } });

  const org = await db.organization.create({
    data: {
      name: parsed.data.restaurantName,
      slug,
      email: parsed.data.email,
      phone: parsed.data.phone,
      subscription: freePlan
        ? {
            create: {
              planId: freePlan.id,
              status: "TRIALING",
              trialEnd: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
            },
          }
        : undefined,
    },
  });

  const branch = await db.branch.create({
    data: {
      organizationId: org.id,
      name: parsed.data.restaurantName,
    },
  });

  const hashedPassword = await hashPassword(parsed.data.password);

  const user = await db.user.create({
    data: {
      organizationId: org.id,
      branchId: branch.id,
      name: parsed.data.name,
      email: parsed.data.email,
      password: hashedPassword,
      phone: parsed.data.phone,
      role: "ADMIN",
    },
  });

  // Seed default categories
  await db.category.createMany({
    data: [
      { organizationId: org.id, name: "Hot Drinks", nameAr: "مشروبات ساخنة", color: "#ef4444", sortOrder: 1 },
      { organizationId: org.id, name: "Cold Drinks", nameAr: "مشروبات باردة", color: "#3b82f6", sortOrder: 2 },
      { organizationId: org.id, name: "Main Dishes", nameAr: "أطباق رئيسية", color: "#22c55e", sortOrder: 3 },
      { organizationId: org.id, name: "Sandwiches", nameAr: "سندويشات", color: "#f59e0b", sortOrder: 4 },
      { organizationId: org.id, name: "Desserts", nameAr: "حلويات", color: "#ec4899", sortOrder: 5 },
    ],
  });

  // Seed default tables
  await db.table.createMany({
    data: Array.from({ length: 10 }, (_, i) => ({
      branchId: branch.id,
      name: `T${i + 1}`,
      capacity: i < 4 ? 2 : i < 8 ? 4 : 6,
      section: i < 5 ? "Indoor" : "Outdoor",
      posX: (i % 5) * 120 + 40,
      posY: Math.floor(i / 5) * 120 + 40,
    })),
  });

  const token = await createSession({
    userId: user.id,
    organizationId: org.id,
    branchId: branch.id,
    role: user.role,
    email: user.email,
    name: user.name,
  });

  const cookieStore = await cookies();
  cookieStore.set("auth-token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 7 * 24 * 60 * 60,
    path: "/",
  });

  redirect("/dashboard");
}

export async function logout() {
  const cookieStore = await cookies();
  const token = cookieStore.get("auth-token")?.value;
  if (token) {
    await deleteSession(token);
    cookieStore.delete("auth-token");
  }
  redirect("/login");
}

export async function platformLogout() {
  const cookieStore = await cookies();
  cookieStore.delete("platform-token");
  redirect("/login");
}
