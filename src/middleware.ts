import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  const authCookie = request.cookies.get("auth");
  const response = NextResponse.next();

  if (
    request.nextUrl.pathname.startsWith("/admin/dashboard") &&
    authCookie?.value !== "true"
  ) {
    response.cookies.set({
      name: "noAuthRequested",
      value: "true",
      maxAge: 10, // expire quickly
      path: "/",
    });

    const url = request.nextUrl.clone();
    url.pathname = "/admin";
    url.searchParams.set("authFailed", "true");

    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/dashboard"],
};