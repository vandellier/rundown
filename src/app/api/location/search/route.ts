import { searchCities } from "@/lib/geo";
import { enforceLimit, noStore } from "@/lib/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const limited = enforceLimit(request, "geo", 30, 60_000);
  if (limited) return limited;
  const query = new URL(request.url).searchParams.get("q") ?? "";
  try {
    return noStore({ places: await searchCities(query) });
  } catch {
    return noStore({ error: "City search is unavailable right now." }, 502);
  }
}
