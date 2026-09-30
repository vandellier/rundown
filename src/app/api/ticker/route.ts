import { buildTicker } from "@/lib/aggregate";
import { enforceLimit, noStore } from "@/lib/http";
import { ensureProfile } from "@/lib/profile";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const limited = enforceLimit(request, "ticker", 20, 60_000);
  if (limited) return limited;
  const profile = await ensureProfile();
  return noStore(await buildTicker(profile));
}
