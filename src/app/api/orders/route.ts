import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { items, type, tableId, customerName, customerPhone, discount, discountType, tax, subtotal, total, paymentMethod, branchId } = body;

  if (!items?.length) return NextResponse.json({ error: "No items" }, { status: 400 });

  const resolvedBranchId = branchId || session.branchId;

  if (!resolvedBranchId) {
    return NextResponse.json({ error: "No branch selected" }, { status: 400 });
  }

  const dayStart = new Date();
  dayStart.setHours(0, 0, 0, 0);

  const todayCount = await db.order.count({
    where: {
      organizationId: session.organizationId,
      branchId: resolvedBranchId,
      createdAt: { gte: dayStart },
    },
  });

  const orderNumber = String(todayCount + 1);

  const order = await db.order.create({
    data: {
      orderNumber,
      organizationId: session.organizationId,
      branchId: resolvedBranchId,
      userId: session.userId,
      tableId: tableId || null,
      type,
      status: "PENDING",
      customerName,
      customerPhone,
      discount: discount || 0,
      discountType: discountType || null,
      tax: tax || 0,
      subtotal: subtotal || 0,
      total: total || 0,
      paymentMethod,
      paymentStatus: "PAID",
      paidAt: new Date(),
      items: {
        create: items.map((item: { menuItemId: string; name: string; nameAr?: string; price: number; quantity: number; notes?: string }) => ({
          menuItemId: item.menuItemId,
          name: item.name,
          nameAr: item.nameAr,
          price: item.price,
          quantity: item.quantity,
          total: item.price * item.quantity,
          notes: item.notes || null,
        })),
      },
      payments: {
        create: [{ method: paymentMethod, amount: total, status: "SUCCESS" }],
      },
    },
  });

  // Update table status if dine-in — scoped to org for safety
  if (type === "DINE_IN" && tableId) {
    await db.table.update({
      where: { id: tableId, branch: { organizationId: session.organizationId } },
      data: { status: "OCCUPIED" },
    });
  }

  return NextResponse.json({ id: order.id, orderNumber: order.orderNumber });
}

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "20");
  const skip = (page - 1) * limit;

  const where = {
    organizationId: session.organizationId,
    ...(session.branchId ? { branchId: session.branchId } : {}),
    ...(status && status !== "ALL" ? { status: status as never } : {}),
  };

  const [orders, total] = await Promise.all([
    db.order.findMany({
      where,
      include: { items: true, table: true, user: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    db.order.count({ where }),
  ]);

  return NextResponse.json({ orders, total, page, limit });
}

export async function PATCH(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { id, status } = body;

  const order = await db.order.update({
    where: { id, organizationId: session.organizationId },
    data: {
      status,
      ...(status === "COMPLETED" ? { completedAt: new Date() } : {}),
    },
  });

  if (status === "COMPLETED" && order.tableId) {
    await db.table.update({ where: { id: order.tableId }, data: { status: "AVAILABLE" } });
  }

  return NextResponse.json(order);
}
