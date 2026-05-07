import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { requireActiveSubscription } from "@/lib/subscription";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  const subscriptionError = await requireActiveSubscription(session);
  if (subscriptionError) return subscriptionError;

  const { id } = await params;
  const { type, quantity, notes } = await req.json();

  // Fetch with branch to verify org ownership
  const item = await db.inventoryItem.findUnique({
    where: { id },
    include: { branch: { select: { organizationId: true } } },
  });

  if (!item || item.branch.organizationId !== session.organizationId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  let newQuantity = item.quantity;
  if (type === "ADD") newQuantity += quantity;
  else if (type === "REMOVE") newQuantity = Math.max(0, newQuantity - quantity);
  else if (type === "SET") newQuantity = quantity;

  const updated = await db.inventoryItem.update({
    where: { id },
    data: {
      quantity: newQuantity,
      transactions: {
        create: { type, quantity, notes: notes || null },
      },
    },
  });

  return NextResponse.json(updated);
}
