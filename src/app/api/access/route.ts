import { NextResponse } from "next/server";
import { accessToken, tokensMatch } from "@/lib/access";
import { enforceLimit, noStore } from "@/lib/http";

export const dynamic = "force-dynamic";

export async function GET() {
  return noStore({ required: Boolean(process.env.ACCESS_CODE) });
}

export async function POST(request: Request) {
  const limited = enforceLimit(request, "access", 8, 10 * 60_000);
  if (limited) return limited;
  const configured = process.env.ACCESS_CODE;
  if (!configured) return noStore({ error: "This server does not have an access code." }, 400);
  const body = (await request.json().catch(() => null)) as { code?: unknown } | null;
  const code = typeof body?.code === "string" ? body.code : "";
  const expected = await accessToken(configured);
  const presented = await accessToken(code);
  if (!code || !tokensMatch(presented, expected)) {
    return noStore({ error: "That code does not match." }, 401);
  }
  const response = NextResponse.json(
    { ok: true },
    { headers: { "Cache-Control": "no-store" } },
  );
  response.cookies.set("hs_access", expected, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
  return response;
}
