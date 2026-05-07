import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { StaffClient } from "./staff-client";

export default async function StaffPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const staff = await db.user.findMany({
    where: { organizationId: session.organizationId },
    include: { branch: { select: { name: true } } },
    orderBy: [{ role: "asc" }, { name: "asc" }],
  });

  const branches = await db.branch.findMany({
    where: { organizationId: session.organizationId },
    select: { id: true, name: true },
  });

  return <StaffClient staff={staff} branches={branches} organizationId={session.organizationId} currentEmail={session.email} />;
}
