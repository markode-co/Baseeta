import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { BranchesClient } from "./branches-client";

export default async function BranchesPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const branches = await db.branch.findMany({
    where: { organizationId: session.organizationId },
    include: {
      _count: { select: { users: true, tables: true, orders: true } },
    },
    orderBy: { createdAt: "asc" },
  });

  return <BranchesClient branches={branches} organizationId={session.organizationId} />;
}
