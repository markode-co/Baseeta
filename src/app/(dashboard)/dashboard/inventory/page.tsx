import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { InventoryClient } from "./inventory-client";

export default async function InventoryPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const items = await db.inventoryItem.findMany({
    where: { branchId: session.branchId ?? "" },
    include: {
      transactions: { orderBy: { createdAt: "desc" }, take: 5 },
    },
    orderBy: { name: "asc" },
  });

  return <InventoryClient items={items} branchId={session.branchId || ""} />;
}
