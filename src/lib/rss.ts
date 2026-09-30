import { createHash } from "node:crypto";
import Parser from "rss-parser";
import { USER_AGENT } from "./http";
import { isBlockedBroadcast, isLiveTitle, isVideoId, isYouTubeShort } from "./playback";
import type { Source } from "./sources";
import { plainText, safeHttpUrl, stripTrailingSource } from "./text";
import type { Story, Topic } from "./types";

type Item = {
  title?: string;
  link?: string;
  isoDate?: string;
  pubDate?: string;
  contentSnippet?: string;
  content?: string;
  summary?: string;
  ytVideoId?: string;
  liveBroadcast?: string;
  id?: string;
  source?: unknown;
};

const parser = new Parser<unknown, Item>({
  timeout: 5000,
  headers: {
    "User-Agent": USER_AGENT,
    Accept: "application/rss+xml, application/atom+xml, application/xml, text/xml;q=0.9, */*;q=0.8",
  },
  customFields: {
    item: [
      ["yt:videoId", "ytVideoId"],
      ["yt:liveBroadcastContent", "liveBroadcast"],
      ["source", "source"],
    ],
  },
});

function storyId(url: string, videoId?: string): string {
  if (videoId) return `yt:${videoId}`;
  return `u:${createHash("sha256").update(url).digest("hex").slice(0, 16)}`;
}

function published(item: Item): string | null {
  const raw = item.isoDate || item.pubDate;
  if (!raw) return null;
  const time = new Date(raw).getTime();
  if (Number.isNaN(time)) return null;
  return new Date(time).toISOString();
}

function publisher(item: Item): { name?: string; url?: string } {
  const source = item.source;
  if (!source) return {};
  if (typeof source === "string") return { name: plainText(source, 80) };
  if (typeof source === "object") {
    const record = source as { _?: unknown; $?: { url?: string }; name?: unknown; url?: unknown };
    if (typeof record._ === "string") {
      return { name: plainText(record._, 80), url: safeHttpUrl(record.$?.url) ?? undefined };
    }
    if (typeof record.name === "string") {
      return {
        name: plainText(record.name, 80),
        url: typeof record.url === "string" ? safeHttpUrl(record.url) ?? undefined : undefined,
      };
    }
  }
  return {};
}

function broadcastState(value: unknown): string {
  if (typeof value === "string") return value;
  if (value && typeof value === "object" && "_" in value) {
    const text = (value as { _: unknown })._;
    if (typeof text === "string") return text;
  }
  return "";
}

function videoIdOf(item: Item): string | null {
  if (isVideoId(item.ytVideoId)) return item.ytVideoId;
  const fromId = String(item.id ?? "").match(/yt:video:([A-Za-z0-9_-]{11})/);
  if (fromId && isVideoId(fromId[1])) return fromId[1];
  const fromLink = String(item.link ?? "").match(/[?&]v=([A-Za-z0-9_-]{11})/);
  if (fromLink && isVideoId(fromLink[1])) return fromLink[1];
  return null;
}

export function mapFeedItem(source: Source, item: Item, topic: Topic): Story | null {
  const when = published(item);
  const rawTitle = plainText(item.title, 240);
  if (!when || !rawTitle) return null;
  const extra = publisher(item);
  const sourceName = extra.name || source.name;
  const title = stripTrailingSource(rawTitle, extra.name);
  const summary = plainText(item.contentSnippet || item.summary || item.content, 280);
  const link = safeHttpUrl(item.link);

  if (source.kind === "youtube") {
    const videoId = videoIdOf(item);
    if (!videoId) return null;
    const watchUrl = `https://www.youtube.com/watch?v=${videoId}`;
    if ((link && isYouTubeShort(link)) || isYouTubeShort(watchUrl)) return null;
    if (isLiveTitle(title) || isBlockedBroadcast(broadcastState(item.liveBroadcast))) return null;
    return {
      id: storyId(watchUrl, videoId),
      kind: "video",
      title,
      url: watchUrl,
      sourceId: source.id,
      sourceName,
      sourceUrl: safeHttpUrl(extra.url) ?? source.homepage,
      topic,
      publishedAt: when,
      summary,
      videoId,
    };
  }

  if (!link) return null;
  return {
    id: storyId(link),
    kind: "article",
    title,
    url: link,
    sourceId: source.id,
    sourceName,
    sourceUrl: safeHttpUrl(extra.url) ?? source.homepage,
    topic,
    publishedAt: when,
    summary,
  };
}

async function parseFeed(feedUrl: string) {
  try {
    return await parser.parseURL(feedUrl);
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    if (!/Status code (404|408|429|500|502|503)/.test(message)) throw error;
    await new Promise((resolve) => setTimeout(resolve, 350));
    return parser.parseURL(feedUrl);
  }
}

export async function fetchSourceStories(source: Source, feedUrl: string, topic: Topic): Promise<Story[]> {
  const feed = await parseFeed(feedUrl);
  const stories: Story[] = [];
  for (const item of feed.items.slice(0, 8)) {
    const story = mapFeedItem(source, item, topic);
    if (story) stories.push(story);
  }
  return stories;
}
