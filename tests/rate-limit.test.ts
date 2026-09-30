import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { rateLimit, resetRateLimits } from "../src/lib/rate-limit.ts";

describe("rateLimit", () => {
  it("blocks once the window is full", () => {
    resetRateLimits();
    const now = 1_000_000;
    assert.equal(rateLimit("feed:test", 2, 60_000, now).ok, true);
    assert.equal(rateLimit("feed:test", 2, 60_000, now + 10).ok, true);
    const blocked = rateLimit("feed:test", 2, 60_000, now + 20);
    assert.equal(blocked.ok, false);
    assert.ok(blocked.retryAfter > 0);
  });

  it("opens a new window after expiry", () => {
    resetRateLimits();
    assert.equal(rateLimit("geo:test", 1, 1000, 0).ok, true);
    assert.equal(rateLimit("geo:test", 1, 1000, 500).ok, false);
    assert.equal(rateLimit("geo:test", 1, 1000, 1000).ok, true);
  });
});
