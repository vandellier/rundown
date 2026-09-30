"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { getChannel } from "@/lib/channels";
import { isVideoId } from "@/lib/playback";
import { timeAgo } from "@/lib/text";
import type { FeedResponse, Story } from "@/lib/types";
import { Equalizer } from "./logo";
import { Player, type PlayerHandle } from "./player";
import { useProfile } from "./profile-provider";

function sharedStory(videoId: string, title: string, author: string): Story {
  return {
    id: `yt:${videoId}`,
    kind: "video",
    title,
    url: `https://www.youtube.com/watch?v=${videoId}`,
    sourceId: "shared",
    sourceName: author || "YouTube",
    sourceUrl: "https://www.youtube.com",
    topic: "international",
    publishedAt: new Date().toISOString(),
    videoId,
  };
}

export function WatchScreen({ slug }: { slug: string }) {
  const channel = getChannel(slug);
  const params = useSearchParams();
  const requested = params.get("v");
  const { profile, ready, save } = useProfile();
  const [feed, setFeed] = useState<FeedResponse | null>(null);
  const [videos, setVideos] = useState<Story[]>([]);
  const [index, setIndex] = useState(0);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [ended, setEnded] = useState(false);
  const [needsGesture, setNeedsGesture] = useState(false);
  const [soundOff, setSoundOff] = useState(false);
  const [copied, setCopied] = useState(false);
  const [loopOverride, setLoopOverride] = useState<boolean | null>(null);
  const [nonce, setNonce] = useState(0);
  const [seenSlug, setSeenSlug] = useState(slug);
  const [pinned, setPinned] = useState<string | null>(requested);
  const playerRef = useRef<PlayerHandle>(null);
  const skips = useRef(0);
  const fetchedShare = useRef<string | null>(null);
  const loop = loopOverride ?? profile?.loop ?? true;

  if (seenSlug !== slug) {
    setSeenSlug(slug);
    setStatus("loading");
    setVideos([]);
    setFeed(null);
    setIndex(0);
    setEnded(false);
    setNotice("");
    setError("");
    setNeedsGesture(false);
    setLoopOverride(null);
    setPinned(requested);
  } else if (requested !== pinned) {
    setPinned(requested);
    if (requested && isVideoId(requested)) {
      const nextIndex = videos.findIndex((video) => video.videoId === requested);
      if (nextIndex >= 0) {
        setIndex(nextIndex);
        setEnded(false);
      }
    }
  }

  useEffect(() => {
    if (!ready) return;
    let cancel = false;
    fetch(`/api/feed?channel=${encodeURIComponent(slug)}`, { cache: "no-store" })
      .then(async (response) => {
        const body = (await response.json()) as FeedResponse & { error?: string };
        if (!response.ok) throw new Error(body.error || "The feed did not load.");
        return body;
      })
      .then((body) => {
        if (cancel) return;
        const start =
          requested && isVideoId(requested)
            ? body.videos.findIndex((video) => video.videoId === requested)
            : 0;
        setFeed(body);
        setVideos(body.videos);
        setIndex(start >= 0 ? start : 0);
        setEnded(false);
        setNotice("");
        skips.current = 0;
        setStatus("ready");
      })
      .catch((reason: unknown) => {
        if (cancel) return;
        setStatus("error");
        setError(reason instanceof Error ? reason.message : "The feed did not load.");
      });
    return () => {
      cancel = true;
    };
  }, [ready, slug, nonce, requested]);

  useEffect(() => {
    if (status !== "ready" || !requested || !isVideoId(requested)) return;
    if (videos.some((video) => video.videoId === requested)) return;
    if (fetchedShare.current === requested) return;
    fetchedShare.current = requested;
    let cancel = false;
    fetch(`/api/oembed?v=${requested}`)
      .then(async (response) => (response.ok ? ((await response.json()) as { title: string; author: string }) : null))
      .then((meta) => {
        if (cancel || !meta) return;
        setVideos((current) =>
          current.some((video) => video.videoId === requested)
            ? current
            : [sharedStory(requested, meta.title, meta.author), ...current],
        );
      })
      .catch(() => undefined);
    return () => {
      cancel = true;
    };
  }, [requested, status, videos]);

  function goNext(options?: { keepNotice?: boolean }) {
    if (!options?.keepNotice) setNotice("");
    setNeedsGesture(false);
    if (!videos.length) return;
    if (index + 1 >= videos.length) {
      if (loop) {
        setEnded(false);
        setIndex(0);
      } else {
        setEnded(true);
      }
      return;
    }
    setEnded(false);
    setIndex(index + 1);
  }

  function goPrev() {
    setNotice("");
    setNeedsGesture(false);
    setEnded(false);
    setIndex((current) => Math.max(0, current - 1));
  }

  const actions = useRef({ goNext, goPrev, soundOff, loop, save });
  useEffect(() => {
    actions.current = { goNext, goPrev, soundOff, loop, save };
  });

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null;
      if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable)) return;
      const current = actions.current;
      if (event.key === " " || event.key === "ArrowRight" || event.key.toLowerCase() === "n") event.preventDefault();
      if (event.key === "ArrowRight" || event.key.toLowerCase() === "n") current.goNext();
      if (event.key === "ArrowLeft" || event.key.toLowerCase() === "p") current.goPrev();
      if (event.key === " ") {
        const state = playerRef.current?.getState();
        if (state === 1) playerRef.current?.pause();
        else playerRef.current?.play();
      }
      if (event.key.toLowerCase() === "m") {
        if (current.soundOff) {
          playerRef.current?.unmute();
          setSoundOff(false);
        } else {
          playerRef.current?.mute();
          setSoundOff(true);
        }
      }
      if (event.key.toLowerCase() === "l") {
        const next = !current.loop;
        setLoopOverride(next);
        void current.save({ loop: next }).catch(() => undefined);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const current = videos[index];

  async function share() {
    if (!current?.videoId) return;
    const url = `${window.location.origin}/watch/${slug}?v=${current.videoId}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: current.title, url });
        return;
      }
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      /* The share sheet was dismissed. */
    }
  }

  function toggleFavorite() {
    if (!profile || !channel) return;
    const has = profile.favorites.includes(channel.slug);
    const favorites = has
      ? profile.favorites.filter((item) => item !== channel.slug)
      : [...profile.favorites, channel.slug];
    void save({ favorites }).catch(() => undefined);
  }

  if (!channel) return null;

  return (
    <div className="flex flex-col gap-4 p-3 md:p-5 xl:h-full xl:min-h-0 xl:flex-row xl:overflow-hidden">
      <section className="flex min-w-0 flex-1 flex-col gap-3 xl:min-h-0 xl:overflow-y-auto">
        <div className="relative aspect-video w-full shrink-0 overflow-hidden rounded-2xl bg-black shadow-[var(--shadow)] xl:sticky xl:top-0 xl:z-10">
          {status === "loading" && (
            <div className="absolute inset-0 grid place-items-center bg-[#07080c] text-sm text-white/70">
              <div className="text-center">
                <Equalizer />
                <p className="mt-3">Gathering the latest from your sources…</p>
              </div>
            </div>
          )}
          {status === "error" && (
            <div className="absolute inset-0 grid place-items-center bg-[#07080c] p-6 text-center text-white">
              <div>
                <p className="font-serif text-2xl">The channel didn&apos;t load.</p>
                <p className="mt-2 text-sm text-white/70">{error}</p>
                <button
                  type="button"
                  className="mt-4 rounded-full bg-gold px-4 py-2 text-sm font-semibold text-[#1a1206]"
                  onClick={() => setNonce((value) => value + 1)}
                >
                  Try again
                </button>
              </div>
            </div>
          )}
          {status === "ready" && current && (
            <Player
              ref={playerRef}
              videoId={current.videoId || ""}
              onEnded={goNext}
              onPlaying={() => {
                skips.current = 0;
                setNeedsGesture(false);
                setNotice("");
              }}
              onNeedsGesture={() => setNeedsGesture(true)}
              onMutedAutoplay={() => setSoundOff(true)}
              onError={(code) => {
                skips.current += 1;
                const embedBlocked = code === 101 || code === 150;
                if (embedBlocked && skips.current >= 3) {
                  setNotice("YouTube blocked the embedded player. Watch on YouTube opens the original, or press Next.");
                  return;
                }
                if (skips.current > videos.length) {
                  setNotice("None of these videos can be embedded right now.");
                  return;
                }
                setNotice(embedBlocked ? "This video can't be embedded. Skipping to the next one." : "Skipping a video that can't play.");
                goNext({ keepNotice: true });
              }}
            />
          )}
          {status === "ready" && !current && (
            <div className="absolute inset-0 grid place-items-center bg-[#100e0b] p-8 text-center text-white">
              <div className="max-w-lg">
                <p className="text-[10px] font-semibold tracking-[0.2em] text-[#e4b15a] uppercase">Text channel</p>
                <h1 className="mt-3 font-serif text-3xl text-balance">
                  {feed?.articles[0]?.title || "No playable videos in this rotation."}
                </h1>
                <p className="mt-3 text-sm text-white/70">
                  {feed?.articles[0]?.summary ||
                    "The sources on this channel published articles. Open one below, or pick a channel with video."}
                </p>
                {feed?.articles[0] && (
                  <a
                    href={feed.articles[0].url}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-5 inline-flex rounded-full bg-[#e4b15a] px-4 py-2 text-sm font-semibold text-[#1a1206]"
                  >
                    Read at {feed.articles[0].sourceName}
                  </a>
                )}
              </div>
            </div>
          )}
          {ended && current && (
            <div className="absolute inset-0 z-10 grid place-items-center bg-black/80 p-6 text-center text-white">
              <div>
                <p className="font-serif text-3xl">That&apos;s the end of the queue.</p>
                <div className="mt-4 flex justify-center gap-2">
                  <button
                    type="button"
                    className="rounded-full bg-gold px-4 py-2 text-sm font-semibold text-[#1a1206]"
                    onClick={() => {
                      setEnded(false);
                      setIndex(0);
                    }}
                  >
                    Replay channel
                  </button>
                  <Link href="/guide" className="rounded-full border border-white/30 px-4 py-2 text-sm">
                    Channel guide
                  </Link>
                </div>
              </div>
            </div>
          )}
          {needsGesture && current && !ended && (
            <button
              type="button"
              className="absolute inset-0 z-10 grid place-items-center bg-black/55 text-white"
              onClick={() => {
                setNeedsGesture(false);
                setSoundOff(false);
                playerRef.current?.unmute();
                playerRef.current?.play();
              }}
            >
              <span className="rounded-full bg-gold px-5 py-3 text-sm font-semibold text-[#1a1206]">
                Play channel
              </span>
            </button>
          )}
        </div>

        {current && (
          <div className="rounded-2xl border border-line bg-elev p-4">
            <div className="flex flex-wrap items-center gap-2 text-[11px] font-semibold tracking-[0.16em] uppercase">
              <span className="inline-flex items-center gap-2 text-gold">
                <span className="live-dot h-1.5 w-1.5 rounded-full bg-live" />
                Now playing
                <Equalizer />
              </span>
              <span className="text-muted">{current.sourceName}</span>
              <span className="text-faint">{timeAgo(current.publishedAt)}</span>
            </div>
            <h1 className="mt-2 font-serif text-2xl text-balance md:text-3xl">{current.title}</h1>
            {current.summary && <p className="mt-2 max-w-3xl text-sm leading-6 text-muted">{current.summary}</p>}
            <div className="mt-4 flex flex-wrap gap-2">
              <button type="button" className="rounded-full border border-line px-3 py-1.5 text-sm" onClick={goPrev}>
                Previous
              </button>
              <button type="button" className="rounded-full border border-line px-3 py-1.5 text-sm" onClick={() => goNext()}>
                Next
              </button>
              <button
                type="button"
                className="rounded-full border border-line px-3 py-1.5 text-sm"
                onClick={() => {
                  const state = playerRef.current?.getState();
                  if (state === 1) playerRef.current?.pause();
                  else playerRef.current?.play();
                }}
              >
                Play / pause
              </button>
              <button
                type="button"
                className={`rounded-full border px-3 py-1.5 text-sm ${loop ? "border-gold text-gold" : "border-line"}`}
                onClick={() => {
                  const next = !loop;
                  setLoopOverride(next);
                  void save({ loop: next }).catch(() => undefined);
                }}
                aria-pressed={loop}
              >
                {loop ? "Loop on" : "Loop off"}
              </button>
              <button type="button" className="rounded-full border border-line px-3 py-1.5 text-sm" onClick={() => void share()}>
                {copied ? "Link copied" : "Share"}
              </button>
              <button
                type="button"
                className="rounded-full border border-line px-3 py-1.5 text-sm"
                onClick={() => {
                  if (soundOff) {
                    playerRef.current?.unmute();
                    setSoundOff(false);
                  } else {
                    playerRef.current?.mute();
                    setSoundOff(true);
                  }
                }}
              >
                {soundOff ? "Unmute" : "Mute"}
              </button>
              <a
                href={current.url}
                target="_blank"
                rel="noreferrer"
                className="rounded-full border border-line px-3 py-1.5 text-sm"
              >
                Watch on YouTube
              </a>
              <button type="button" className="rounded-full border border-line px-3 py-1.5 text-sm" onClick={toggleFavorite}>
                {profile?.favorites.includes(channel.slug) ? "Saved channel" : "Save channel"}
              </button>
              <button
                type="button"
                className="rounded-full border border-line px-3 py-1.5 text-sm"
                onClick={() => setNonce((value) => value + 1)}
              >
                Refresh
              </button>
            </div>
            <p className="mt-3 text-xs text-faint">N next · P previous · Space play/pause · M mute · L loop</p>
            {notice && <p className="mt-2 text-sm text-gold">{notice}</p>}
          </div>
        )}

        {!!feed?.warnings.length && (
          <ul className="space-y-1 text-sm text-muted">
            {feed.warnings.map((warning) => (
              <li key={warning}>{warning}</li>
            ))}
          </ul>
        )}

        {!!feed?.articles.length && (
          <div className="min-h-0 xl:overflow-y-auto">
            <h2 className="mb-2 text-[10px] font-semibold tracking-[0.18em] text-faint uppercase">From the wires</h2>
            <ul className="divide-y divide-line rounded-2xl border border-line bg-elev">
              {feed.articles.map((article) => (
                <li key={article.id}>
                  <a href={article.url} target="_blank" rel="noreferrer" className="block px-4 py-3 hover:bg-elev2">
                    <span className="text-[11px] font-semibold tracking-wide text-gold uppercase">
                      {article.sourceName}
                      <span className="text-faint"> · {timeAgo(article.publishedAt)}</span>
                    </span>
                    <span className="mt-1 block font-serif text-lg leading-snug">{article.title}</span>
                    {article.summary && <span className="mt-1 block text-sm text-muted">{article.summary}</span>}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>

      <aside className="xl:flex xl:w-80 xl:shrink-0 xl:flex-col xl:overflow-hidden" aria-label="Up next">
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-[10px] font-semibold tracking-[0.18em] text-faint uppercase">Up next</h2>
          <span className="text-xs text-muted">{videos.length} videos</span>
        </div>
        {videos.length === 0 && status === "ready" && (
          <p className="rounded-2xl border border-dashed border-line p-4 text-sm text-muted">
            No videos queued. Articles on this channel still link out to the original publishers.
          </p>
        )}
        <ol className="flex gap-3 overflow-x-auto pb-1 xl:min-h-0 xl:flex-1 xl:flex-col xl:overflow-y-auto xl:overflow-x-hidden">
          {videos.map((video, videoIndex) => {
            const playing = videoIndex === index;
            return (
              <li key={video.id} className="w-64 shrink-0 xl:w-auto">
                <button
                  type="button"
                  onClick={() => {
                    setNotice("");
                    setEnded(false);
                    setIndex(videoIndex);
                  }}
                  className={`flex w-full gap-3 rounded-2xl border p-3 text-left ${
                    playing ? "border-gold bg-elev2" : "border-line bg-elev hover:border-gold/40"
                  }`}
                  aria-current={playing ? "true" : undefined}
                >
                  <span className="w-5 shrink-0 pt-0.5 text-xs text-faint tabular-nums">{videoIndex + 1}</span>
                  <span className="min-w-0">
                    <span className="flex items-center gap-2 text-[11px] font-semibold tracking-wide text-gold uppercase">
                      {playing ? "Now" : video.sourceName}
                      {playing && <Equalizer />}
                    </span>
                    <span className="mt-1 block text-sm leading-snug">{video.title}</span>
                    <span className="mt-1 block text-xs text-faint">{timeAgo(video.publishedAt)}</span>
                  </span>
                </button>
              </li>
            );
          })}
        </ol>
      </aside>
    </div>
  );
}

export function WatchFallback() {
  return (
    <div className="grid h-full place-items-center p-8 text-sm text-muted">Opening the channel…</div>
  );
}
