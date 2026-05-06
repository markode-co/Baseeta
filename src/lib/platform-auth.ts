import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

export const PLATFORM_ADMIN_EMAIL = "ca.markode@gmail.com";
const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "baseeta-jwt-secret"
);

export interface PlatformSession {
  isPlatformAdmin: true;
  email: string;
}

export async function createPlatformSession(): Promise<string> {
  return new SignJWT({ isPlatformAdmin: true, email: PLATFORM_ADMIN_EMAIL })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("24h")
    .sign(JWT_SECRET);
}

export async function getPlatformSession(): Promise<PlatformSession | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get("platform-token")?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    if (!payload.isPlatformAdmin) return null;
    return payload as unknown as PlatformSession;
  } catch {
    return null;
  }
}
