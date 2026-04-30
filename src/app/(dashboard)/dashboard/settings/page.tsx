import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { SettingsClient } from "./settings-client";

export default async function SettingsPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const org = await db.organization.findUnique({
    where: { id: session.organizationId },
  });

  if (!org) redirect("/login");

  return <SettingsClient org={org} />;
}
