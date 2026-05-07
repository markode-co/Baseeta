import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { OrdersClient } from "./orders-client";

export default async function OrdersPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const org = await db.organization.findUnique({
    where: { id: session.organizationId },
    select: { name: true, website: true, receiptFooter: true, receiptHeader: true },
  });

  const orders = await db.order.findMany({
    where: {
      organizationId: session.organizationId,
      ...(session.branchId ? { branchId: session.branchId } : {}),
    },
    include: {
      items: { include: { menuItem: { select: { name: true, nameAr: true } } } },
      table: true,
      user: { select: { name: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return (
    <OrdersClient
      initialOrders={orders}
      orgName={org?.name || "بسيطة"}
      orgWebsite={org?.website || undefined}
      orgReceiptFooter={org?.receiptFooter || undefined}
      orgReceiptHeader={org?.receiptHeader || undefined}
    />
  );
}
