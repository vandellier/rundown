import { buildFeed } from "@/lib/aggregate";
import { enforceLimit, noStore } from "@/lib/http";
import { ensureProfile } from "@/lib/profile";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const limited = enforceLimit(request, "feed", 24, 60_000);
  if (limited) return limited;
  const channel = new URL(request.url).searchParams.get("channel") || "mine";
  const profile = await ensureProfile();
  const feed = await buildFeed(profile, channel);
  if ("error" in feed) return noStore(feed, 404);
  return noStore(feed);
}
