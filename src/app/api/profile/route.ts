import { enforceLimit, noStore } from "@/lib/http";
import { ensureProfile, updateProfile } from "@/lib/profile";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const limited = enforceLimit(request, "profile", 60, 60_000);
  if (limited) return limited;
  return noStore(await ensureProfile());
}

export async function PUT(request: Request) {
  const limited = enforceLimit(request, "profile", 60, 60_000);
  if (limited) return limited;
  const body = await request.json().catch(() => null);
  const result = await updateProfile(body);
  if ("error" in result) return noStore(result, 400);
  return noStore(result);
}
