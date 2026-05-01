import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { SidebarLayout } from "@/components/layout/sidebar-layout";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) redirect("/login");

  const [org, pendingOrders] = await Promise.all([
    db.organization.findUnique({
      where: { id: session.organizationId },
      select: { name: true },
    }),
    db.order.count({
      where: { organizationId: session.organizationId, status: "PENDING" },
    }),
  ]);

  return (
    <SidebarLayout
      orgName={org?.name}
      userRole={session.role}
      userName={session.name}
      notificationCount={pendingOrders}
    >
      {children}
    </SidebarLayout>
  );
}
