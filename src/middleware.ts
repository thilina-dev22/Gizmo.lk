import { NextResponse, type NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const expectedToken =
    process.env.ADMIN_SESSION_TOKEN || "gizmotek_authenticated_admin_session_token_2026";

  // Protect /admin pages (allow /admin/login)
  if (pathname.startsWith("/admin") && pathname !== "/admin/login") {
    const adminSession = request.cookies.get("gizmotek_admin_session")?.value;

    if (!adminSession || adminSession !== expectedToken) {
      const loginUrl = new URL("/admin/login", request.url);
      return NextResponse.redirect(loginUrl);
    }
  }

  // Protect /api/admin API routes (allow /api/admin/login)
  if (pathname.startsWith("/api/admin") && !pathname.startsWith("/api/admin/login")) {
    const adminSession = request.cookies.get("gizmotek_admin_session")?.value;

    if (!adminSession || adminSession !== expectedToken) {
      return NextResponse.json(
        { error: "Unauthorized access. Admin authentication required." },
        { status: 401 }
      );
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"],
};
