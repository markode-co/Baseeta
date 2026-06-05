import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { requireActiveSubscription } from "@/lib/subscription";

async function resolveBranchId(inputBranchId: unknown, sessionBranchId?: string) {
  if (sessionBranchId) return sessionBranchId;
  return typeof inputBranchId === "string" && inputBranchId.trim() ? inputBranchId : null;
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  const subscriptionError = await requireActiveSubscription(session);
  if (subscriptionError) return subscriptionError;
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const title = String(body.title || "").trim();
  const category = String(body.category || "").trim();
  const amount = Number(body.amount);
  const branchId = await resolveBranchId(body.branchId, session.branchId);

  if (!title || !category || !Number.isFinite(amount) || amount <= 0) {
    return NextResponse.json({ error: "Invalid expense data" }, { status: 400 });
  }

  if (branchId) {
    const branch = await db.branch.findUnique({
      where: { id: branchId, organizationId: session.organizationId },
      select: { id: true },
    });
    if (!branch) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const expense = await db.expense.create({
    data: {
      organizationId: session.organizationId,
      branchId,
      userId: session.userId,
      title,
      category,
      amount,
      paymentMethod: body.paymentMethod || "CASH",
      vendor: body.vendor || null,
      notes: body.notes || null,
      receiptUrl: body.receiptUrl || null,
      expenseDate: body.expenseDate ? new Date(body.expenseDate) : new Date(),
    },
    include: {
      branch: { select: { id: true, name: true, nameAr: true } },
      user: { select: { id: true, name: true } },
    },
  });

  return NextResponse.json(expense);
}
