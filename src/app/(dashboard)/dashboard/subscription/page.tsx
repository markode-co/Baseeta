import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { SubscriptionClient } from "./subscription-client";

export default async function SubscriptionPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const [subscription, org, menuItemCount, pendingRequest] = await Promise.all([
    db.subscription.findUnique({
      where: { organizationId: session.organizationId },
      include: { plan: true },
    }),
    db.organization.findUnique({
      where: { id: session.organizationId },
      include: { _count: { select: { branches: true, users: true } } },
    }),
    db.menuItem.count({ where: { organizationId: session.organizationId } }),
    db.paymentRequest.findFirst({
      where: { organizationId: session.organizationId, status: "PENDING" },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  return (
    <SubscriptionClient
      subscription={subscription}
      orgStats={{
        branches: org?._count.branches || 0,
        users: org?._count.users || 0,
        menuItems: menuItemCount,
      }}
      pendingRequest={pendingRequest}
    />
  );
}
