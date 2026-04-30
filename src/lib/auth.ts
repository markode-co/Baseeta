import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { db } from "./db";
import bcrypt from "bcryptjs";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "baseeta-jwt-secret"
);

export interface SessionPayload {
  userId: string;
  organizationId: string;
  branchId?: string;
  role: string;
  email: string;
  name: string;
}

export async function createSession(payload: SessionPayload): Promise<string> {
  const token = await new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(JWT_SECRET);

  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  await db.session.create({
    data: {
      userId: payload.userId,
      token,
      expiresAt,
    },
  });

  return token;
}

export async function verifySession(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);

    const session = await db.session.findUnique({
      where: { token },
    });

    if (!session || session.expiresAt < new Date()) {
      return null;
    }

    return payload as unknown as SessionPayload;
  } catch {
    return null;
  }
}

export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get("auth-token")?.value;
  if (!token) return null;
  return verifySession(token);
}

export async function deleteSession(token: string) {
  await db.session.deleteMany({ where: { token } });
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function hasPermission(role: string, required: string[]): boolean {
  const hierarchy: Record<string, number> = {
    SUPER_ADMIN: 100,
    ADMIN: 80,
    MANAGER: 60,
    CASHIER: 40,
    WAITER: 30,
    KITCHEN: 20,
  };

  const userLevel = hierarchy[role] || 0;
  return required.some((r) => (hierarchy[r] || 0) <= userLevel);
}
