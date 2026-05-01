import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { SidebarLayout } from "@/components/layout/sidebar-layout";

function isExpired(sub: { status: string; trialEnd: Date | null; currentPeriodEnd: Date | null } | null): boolean {
  if (!sub) return true;
  const now = new Date();
  if (sub.status === "TRIALING") return sub.trialEnd ? sub.trialEnd < now : true;
  if (sub.status === "ACTIVE") return sub.currentPeriodEnd ? sub.currentPeriodEnd < now : false;
  if (sub.status === "CANCELED" || sub.status === "PAUSED") return true;
  return false;
}

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) redirect("/login");

  const headersList = await headers();
  const pathname = headersList.get("x-pathname") || "";
  const onSubscriptionPage = pathname === "/dashboard/subscription" || pathname.startsWith("/dashboard/subscription");

  const [org, pendingOrders, subscription] = await Promise.all([
    db.organization.findUnique({
      where: { id: session.organizationId },
      select: { name: true },
    }),
    db.order.count({
      where: { organizationId: session.organizationId, status: "PENDING" },
    }),
    db.subscription.findUnique({
      where: { organizationId: session.organizationId },
      select: { status: true, trialEnd: true, currentPeriodEnd: true },
    }),
  ]);

  if (isExpired(subscription) && !onSubscriptionPage) {
    redirect("/dashboard/subscription?expired=1");
  }

  return (
    <SidebarLayout
      orgName={org?.name}
      userRole={session.role}
      userName={session.name}
      notificationCount={pendingOrders}
      isPlatformAdmin={session.email === process.env.PLATFORM_ADMIN_EMAIL}
    >
      {children}
    </SidebarLayout>
  );
}
