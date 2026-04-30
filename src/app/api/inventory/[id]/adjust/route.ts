import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const { type, quantity, notes } = await req.json();

  const item = await db.inventoryItem.findUnique({ where: { id } });
  if (!item) return NextResponse.json({ error: "Not found" }, { status: 404 });

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
