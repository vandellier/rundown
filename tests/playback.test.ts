import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { isBlockedBroadcast, isLiveTitle, isVideoId, isYouTubeShort } from "../src/lib/playback.ts";
import { plainText, safeHttpUrl } from "../src/lib/text.ts";

describe("playback filters", () => {
  it("accepts an 11-character video id", () => {
    assert.equal(isVideoId("dQw4w9WgxcQ"), true);
    assert.equal(isVideoId("short"), false);
    assert.equal(isVideoId("has space!!"), false);
  });

  it("drops shorts and obvious livestreams", () => {
    assert.equal(isYouTubeShort("https://www.youtube.com/shorts/abcdefghijk"), true);
    assert.equal(isYouTubeShort("https://www.youtube.com/watch?v=abcdefghijk"), false);
    assert.equal(isLiveTitle("LIVE: Senate vote underway"), true);
    assert.equal(isLiveTitle("24/7 News Stream"), true);
    assert.equal(isLiveTitle("ABC News Live Prime: Monday"), false);
    assert.equal(isBlockedBroadcast("upcoming"), true);
    assert.equal(isBlockedBroadcast("LIVE"), true);
    assert.equal(isBlockedBroadcast("none"), false);
  });
});

describe("text helpers", () => {
  it("strips markup and truncates", () => {
    assert.equal(plainText("<p>Hello <b>there</b></p>", 80), "Hello there");
    assert.equal(plainText("<script>alert(1)</script>Headline"), "Headline");
  });

  it("allows only http(s) links", () => {
    assert.equal(safeHttpUrl("https://example.com/a"), "https://example.com/a");
    assert.equal(safeHttpUrl("javascript:alert(1)"), null);
    assert.equal(safeHttpUrl("not a url"), null);
  });
});
