import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { MenuClient } from "./menu-client";

export default async function MenuPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const [categories, menuItems] = await Promise.all([
    db.category.findMany({
      where: { organizationId: session.organizationId },
      include: { _count: { select: { menuItems: true } } },
      orderBy: { sortOrder: "asc" },
    }),
    db.menuItem.findMany({
      where: { organizationId: session.organizationId },
      include: { category: true },
      orderBy: [{ categoryId: "asc" }, { sortOrder: "asc" }],
    }),
  ]);

  return (
    <MenuClient
      categories={categories}
      menuItems={menuItems}
      organizationId={session.organizationId}
    />
  );
}
