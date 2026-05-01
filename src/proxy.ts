import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "baseeta-jwt-secret"
);

const PUBLIC_PATHS = ["/", "/login", "/register", "/pricing", "/api/auth", "/api/webhook"];

const PUBLIC_FILES = ["/manifest.json", "/sw.js", "/icon", "/icon2", "/apple-icon", "/robots.txt", "/favicon.ico"];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isPublicFile = PUBLIC_FILES.some(
    (p) => pathname === p || pathname.startsWith(p)
  );
  if (isPublicFile) return NextResponse.next();

  // Platform admin routes
  if (pathname.startsWith("/platform")) {
    const platformToken = request.cookies.get("platform-token")?.value;
    if (!platformToken) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
    try {
      await jwtVerify(platformToken, JWT_SECRET);
      const requestHeaders = new Headers(request.headers);
      requestHeaders.set("x-pathname", pathname);
      return NextResponse.next({ request: { headers: requestHeaders } });
    } catch {
      return NextResponse.redirect(new URL("/login", request.url));
    }
  }

  const isPublic = PUBLIC_PATHS.some(
    (p) => pathname === p || pathname.startsWith(p + "/")
  );

  if (isPublic) return NextResponse.next();

  const token = request.cookies.get("auth-token")?.value;

  if (!token) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set("x-pathname", pathname);
    requestHeaders.set("x-user-id", payload.userId as string);
    requestHeaders.set("x-org-id", payload.organizationId as string);
    requestHeaders.set("x-user-role", payload.role as string);

    return NextResponse.next({ request: { headers: requestHeaders } });
  } catch {
    return NextResponse.redirect(new URL("/login", request.url));
  }
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon\\.ico|manifest\\.json|sw\\.js|.*\\.png$|.*\\.jpg$|.*\\.svg$|.*\\.ico$|.*\\.webp$|.*\\.woff2?$).*)"
  ],
};
