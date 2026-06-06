import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { ReportsClient } from "./reports-client";
import { getReportsData } from "./reports-data";

export default async function ReportsPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const org = await db.organization.findUnique({
    where: { id: session.organizationId },
    select: { name: true },
  });
  const data = await getReportsData(session.organizationId, session.branchId);

  return <ReportsClient data={data} orgName={org?.name || "بسيطة"} />;
}
