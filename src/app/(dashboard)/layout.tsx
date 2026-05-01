import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { Sidebar } from "@/components/layout/sidebar";

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
    <div className="flex min-h-screen bg-slate-50" dir="rtl">
      <Sidebar
        orgName={org?.name}
        userRole={session.role}
        userName={session.name}
        notificationCount={pendingOrders}
      />
      <div className="flex-1 mr-64 flex flex-col min-h-screen">
        {children}
      </div>
    </div>
  );
}
