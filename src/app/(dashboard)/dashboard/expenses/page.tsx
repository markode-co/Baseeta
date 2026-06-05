import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { ExpensesClient } from "./expenses-client";

export default async function ExpensesPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const branchFilter = session.branchId ? { id: session.branchId } : {};

  const [expenses, branches] = await Promise.all([
    db.expense.findMany({
      where: {
        organizationId: session.organizationId,
        ...(session.branchId ? { branchId: session.branchId } : {}),
      },
      include: {
        branch: { select: { id: true, name: true, nameAr: true } },
        user: { select: { id: true, name: true } },
      },
      orderBy: { expenseDate: "desc" },
      take: 300,
    }),
    db.branch.findMany({
      where: {
        organizationId: session.organizationId,
        isActive: true,
        ...branchFilter,
      },
      select: { id: true, name: true, nameAr: true },
      orderBy: { name: "asc" },
    }),
  ]);

  return (
    <ExpensesClient
      expenses={expenses}
      branches={branches}
      defaultBranchId={session.branchId || ""}
      canChooseBranch={!session.branchId}
    />
  );
}
