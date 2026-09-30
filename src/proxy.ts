import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { accessToken, tokensMatch } from "./lib/access";

const PUBLIC_PATH = /^\/(?:about|terms|unlock|icon|api\/access|api\/health)\/?$/;

export async function proxy(request: NextRequest) {
  const code = process.env.ACCESS_CODE;
  if (!code) return NextResponse.next();
  const { pathname } = request.nextUrl;
  if (PUBLIC_PATH.test(pathname)) return NextResponse.next();
  const presented = request.cookies.get("hs_access")?.value ?? "";
  const expected = await accessToken(code);
  if (presented && tokensMatch(presented, expected)) return NextResponse.next();
  if (pathname.startsWith("/api/")) {
    return NextResponse.json(
      { error: "Friends-only. Enter the access code to continue." },
      { status: 401 },
    );
  }
  const unlock = request.nextUrl.clone();
  unlock.pathname = "/unlock";
  unlock.search = "";
  if (pathname !== "/") unlock.searchParams.set("next", pathname);
  return NextResponse.redirect(unlock);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|robots.txt|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)"],
};
