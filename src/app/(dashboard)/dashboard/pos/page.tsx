import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { POSClient } from "./pos-client";

export default async function POSPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const [categories, menuItems, tables, branch, org] = await Promise.all([
    db.category.findMany({
      where: { organizationId: session.organizationId, isActive: true },
      orderBy: { sortOrder: "asc" },
    }),
    db.menuItem.findMany({
      where: {
        organizationId: session.organizationId,
        isAvailable: true,
        ...(session.branchId ? { OR: [{ branchId: session.branchId }, { branchId: null }] } : {}),
      },
      include: { category: true },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    }),
    db.table.findMany({
      where: { branchId: session.branchId ?? "" },
      orderBy: { name: "asc" },
    }),
    session.branchId ? db.branch.findUnique({ where: { id: session.branchId } }) : null,
    db.organization.findUnique({ where: { id: session.organizationId }, select: { name: true, website: true, receiptFooter: true, receiptHeader: true } }),
  ]);

  return (
    <POSClient
      categories={categories}
      menuItems={menuItems}
      tables={tables}
      branch={branch}
      session={session}
      orgName={org?.name || "بسيطة"}
      orgWebsite={org?.website || undefined}
      orgReceiptFooter={org?.receiptFooter || undefined}
      orgReceiptHeader={org?.receiptHeader || undefined}
    />
  );
}
