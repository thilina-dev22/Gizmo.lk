import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { username, password } = await req.json();

    const expectedUser = process.env.ADMIN_USERNAME || "admin";
    const expectedPass = process.env.ADMIN_PASSWORD || "gizmo2026admin";
    const expectedToken =
      process.env.ADMIN_SESSION_TOKEN || "gizmo_authenticated_admin_session_token_2026";

    if (
      username.trim().toLowerCase() === expectedUser.trim().toLowerCase() &&
      password === expectedPass
    ) {
      const response = NextResponse.json({ success: true });

      response.cookies.set({
        name: "gizmo_admin_session",
        value: expectedToken,
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24 * 7, // 7 days session
      });

      return response;
    }

    return NextResponse.json(
      { error: "Invalid admin username or password" },
      { status: 401 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: "Authentication failed" },
      { status: 500 }
    );
  }
}
