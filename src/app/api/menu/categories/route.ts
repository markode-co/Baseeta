import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();

  const category = await db.category.create({
    data: {
      organizationId: session.organizationId,
      name: body.name,
      nameAr: body.nameAr || null,
      color: body.color || null,
    },
  });

  return NextResponse.json(category);
}
