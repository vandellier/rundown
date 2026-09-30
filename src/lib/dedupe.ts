import type { Story } from "./types";

const STOP = new Set([
  "the", "a", "an", "of", "to", "and", "in", "on", "for", "with", "as", "at",
  "by", "from", "after", "over", "into", "its", "it", "is", "are", "was",
  "were", "be", "this", "that", "how", "why", "what", "new", "says", "say",
]);

export function normalizeTitle(title: string): string {
  return title
    .toLowerCase()
    .replace(/&amp;/g, " and ")
    .replace(/['’‘]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function titleTokens(title: string): Set<string> {
  return new Set(
    normalizeTitle(title)
      .split(" ")
      .filter((word) => word.length > 2 && !STOP.has(word)),
  );
}

export function titlesSimilar(a: string, b: string): boolean {
  const left = normalizeTitle(a);
  const right = normalizeTitle(b);
  if (!left || !right) return false;
  if (left === right) return true;
  const shorter = left.length < right.length ? left : right;
  const longer = left.length < right.length ? right : left;
  if (shorter.length >= 24 && longer.includes(shorter)) return true;

  const leftTokens = titleTokens(a);
  const rightTokens = titleTokens(b);
  if (leftTokens.size < 3 || rightTokens.size < 3) return false;
  let intersection = 0;
  for (const token of leftTokens) {
    if (rightTokens.has(token)) intersection += 1;
  }
  const union = leftTokens.size + rightTokens.size - intersection;
  const jaccard = union === 0 ? 0 : intersection / union;
  const coverage = intersection / Math.min(leftTokens.size, rightTokens.size);
  return jaccard >= 0.55 || coverage >= 0.82;
}

function recency(story: Story): number {
  const time = new Date(story.publishedAt).getTime();
  return Number.isNaN(time) ? 0 : time;
}

export function dedupeStories(stories: Story[]): Story[] {
  const sorted = [...stories].sort((a, b) => recency(b) - recency(a));
  const kept: Story[] = [];
  for (const story of sorted) {
    const index = kept.findIndex(
      (existing) =>
        (story.videoId && existing.videoId === story.videoId) ||
        titlesSimilar(existing.title, story.title),
    );
    if (index === -1) {
      kept.push(story);
      continue;
    }
    const existing = kept[index];
    const withinWindow = Math.abs(recency(existing) - recency(story)) < 1000 * 60 * 60 * 36;
    if (existing.kind === "article" && story.kind === "video" && withinWindow) {
      kept[index] = story;
    }
  }
  return kept;
}
