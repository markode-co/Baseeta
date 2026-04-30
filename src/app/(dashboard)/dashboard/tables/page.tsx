import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { TablesClient } from "./tables-client";

export default async function TablesPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const tables = await db.table.findMany({
    where: { branchId: session.branchId ?? "" },
    include: {
      orders: {
        where: { status: { in: ["PENDING", "CONFIRMED", "PREPARING", "READY", "SERVED"] } },
        include: { items: true },
        orderBy: { createdAt: "desc" },
        take: 1,
      },
    },
    orderBy: { name: "asc" },
  });

  return <TablesClient tables={tables} branchId={session.branchId || ""} />;
}
