import { USER_AGENT, enforceLimit, noStore } from "@/lib/http";
import { isVideoId } from "@/lib/playback";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const limited = enforceLimit(request, "oembed", 30, 60_000);
  if (limited) return limited;
  const id = new URL(request.url).searchParams.get("v") ?? "";
  if (!isVideoId(id)) return noStore({ error: "Invalid video id." }, 400);
  const endpoint = `https://www.youtube.com/oembed?format=json&url=${encodeURIComponent(
    `https://www.youtube.com/watch?v=${id}`,
  )}`;
  try {
    const response = await fetch(endpoint, {
      headers: { "User-Agent": USER_AGENT, Accept: "application/json" },
      signal: AbortSignal.timeout(6000),
      cache: "no-store",
    });
    if (!response.ok) return noStore({ error: "This video is not available to embed." }, 404);
    const data = (await response.json()) as { title?: string; author_name?: string };
    return noStore({
      videoId: id,
      title: String(data.title || "Shared video").slice(0, 200),
      author: String(data.author_name || "YouTube").slice(0, 120),
    });
  } catch {
    return noStore({ error: "YouTube did not respond." }, 502);
  }
}
