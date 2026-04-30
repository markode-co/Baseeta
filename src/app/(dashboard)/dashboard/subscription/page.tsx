import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { SubscriptionClient } from "./subscription-client";
import { PLANS } from "@/lib/stripe";

export default async function SubscriptionPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const subscription = await db.subscription.findUnique({
    where: { organizationId: session.organizationId },
    include: { plan: true },
  });

  const org = await db.organization.findUnique({
    where: { id: session.organizationId },
    include: {
      _count: { select: { branches: true, users: true } },
    },
  });

  const menuItemCount = await db.menuItem.count({
    where: { organizationId: session.organizationId },
  });

  return (
    <SubscriptionClient
      subscription={subscription}
      plans={PLANS}
      orgStats={{
        branches: org?._count.branches || 0,
        users: org?._count.users || 0,
        menuItems: menuItemCount,
      }}
    />
  );
}
