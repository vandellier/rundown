import { reverseGeocode } from "@/lib/geo";
import { enforceLimit, noStore } from "@/lib/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const limited = enforceLimit(request, "geo", 20, 60_000);
  if (limited) return limited;
  const body = (await request.json().catch(() => null)) as { lat?: unknown; lon?: unknown } | null;
  if (!body || typeof body.lat !== "number" || typeof body.lon !== "number") {
    return noStore({ error: "Latitude and longitude are required." }, 400);
  }
  let place;
  try {
    place = await reverseGeocode(body.lat, body.lon);
  } catch {
    return noStore({ error: "The geocoder did not respond." }, 502);
  }
  if (!place) return noStore({ error: "No city matched those coordinates." }, 404);
  return noStore({ place });
}
