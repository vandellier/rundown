import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { dedupeStories, titlesSimilar } from "../src/lib/dedupe.ts";
import type { Story } from "../src/lib/types.ts";

function story(partial: Partial<Story> & Pick<Story, "id" | "title" | "kind">): Story {
  return {
    url: "https://example.com/" + partial.id,
    sourceId: "example",
    sourceName: "Example",
    sourceUrl: "https://example.com",
    topic: "tech",
    publishedAt: "2026-09-29T12:00:00.000Z",
    ...partial,
  };
}

describe("titlesSimilar", () => {
  it("matches punctuation and case variants", () => {
    assert.equal(
      titlesSimilar("US announces new chip export rules", "us announces new chip export rules!"),
      true,
    );
  });

  it("matches a headline contained in a longer one", () => {
    assert.equal(
      titlesSimilar(
        "NASA delays the Artemis launch again",
        "NASA delays the Artemis launch again after a fuel leak",
      ),
      true,
    );
  });

  it("leaves unrelated headlines alone", () => {
    assert.equal(titlesSimilar("Markets close higher on bank earnings", "Hurricane watch posted for Hawaii"), false);
  });
});

describe("dedupeStories", () => {
  it("keeps the newest copy of the same headline", () => {
    const kept = dedupeStories([
      story({ id: "old", title: "Chip export rules expand", publishedAt: "2026-09-28T12:00:00.000Z" }),
      story({ id: "new", title: "Chip export rules expand", publishedAt: "2026-09-29T12:00:00.000Z" }),
    ]);
    assert.deepEqual(kept.map((item) => item.id), ["new"]);
  });

  it("prefers a video when an article repeats the headline", () => {
    const kept = dedupeStories([
      story({
        id: "article",
        kind: "article",
        title: "Reuters: central bank holds rates steady today",
        publishedAt: "2026-09-29T15:00:00.000Z",
      }),
      story({
        id: "video",
        kind: "video",
        title: "Central bank holds rates steady today",
        videoId: "abcdefghijk",
        publishedAt: "2026-09-29T14:00:00.000Z",
      }),
    ]);
    assert.equal(kept.length, 1);
    assert.equal(kept[0].kind, "video");
  });

  it("keeps distinct stories", () => {
    const kept = dedupeStories([
      story({ id: "a", title: "Senate passes a spending bill" }),
      story({ id: "b", title: "Wildfire grows outside Boulder" }),
    ]);
    assert.equal(kept.length, 2);
  });
});
