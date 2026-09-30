"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, useSyncExternalStore } from "react";
import { CHANNELS, channelForTopic } from "@/lib/channels";
import type { Story, WeatherNow } from "@/lib/types";
import { Equalizer, Logo } from "./logo";
import { ProfileProvider, useProfile } from "./profile-provider";

type TickerPayload = {
  items: Story[];
  breaking: Story | null;
  weather: WeatherNow | null;
  location: { city: string | null; region: string | null; country: string | null } | null;
};

function Clock() {
  const [label, setLabel] = useState("");
  useEffect(() => {
    const id = window.setInterval(() => {
      setLabel(new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }));
    }, 1000);
    return () => window.clearInterval(id);
  }, []);
  return <span className="hidden tabular-nums text-sm text-muted sm:inline">{label}</span>;
}

function BreakingBanner({ story }: { story: Story }) {
  const [hidden, setHidden] = useState(false);
  const stored = useSyncExternalStore(
    () => () => {},
    () => sessionStorage.getItem(`hs-dismiss-${story.id}`) === "1",
    () => false,
  );
  if (hidden || stored) return null;
  const href =
    story.kind === "video" && story.videoId
      ? `/watch/${channelForTopic(story.topic)}?v=${story.videoId}`
      : story.url;
  const external = story.kind === "article";
  return (
    <div className="flex items-center gap-3 border-b border-live/30 bg-live/15 px-4 py-2 text-sm" role="alert">
      <span className="rounded-full bg-live px-2 py-0.5 text-[10px] font-bold tracking-[0.16em] text-white">
        BREAKING
      </span>
      <a
        href={href}
        target={external ? "_blank" : undefined}
        rel={external ? "noreferrer" : undefined}
        className="min-w-0 flex-1 truncate font-medium hover:underline"
      >
        {story.title}
      </a>
      <button
        type="button"
        className="rounded-full px-2 text-lg leading-none text-muted hover:text-ink"
        aria-label="Dismiss breaking alert"
        onClick={() => {
          sessionStorage.setItem(`hs-dismiss-${story.id}`, "1");
          setHidden(true);
        }}
      >
        ×
      </button>
    </div>
  );
}

function Ticker({ items }: { items: Story[] }) {
  if (!items.length) {
    return (
      <div className="flex h-10 items-center px-4 text-xs tracking-[0.14em] text-faint uppercase">
        Headlines will scroll here once sources respond
      </div>
    );
  }
  const row = items.map((story) => {
    const href =
      story.kind === "video" && story.videoId
        ? `/watch/${channelForTopic(story.topic)}?v=${story.videoId}`
        : story.url;
    const external = story.kind === "article";
    return (
      <a
        key={story.id}
        href={href}
        target={external ? "_blank" : undefined}
        rel={external ? "noreferrer" : undefined}
        className="inline-flex items-center gap-3 hover:text-gold"
      >
        <span className="text-[10px] font-semibold tracking-[0.16em] text-gold uppercase">{story.sourceName}</span>
        <span>{story.title}</span>
        <span aria-hidden="true" className="text-faint">
          ◆
        </span>
      </a>
    );
  });
  return (
    <div className="ticker-viewport overflow-hidden">
      <div className="ticker-track flex w-max gap-8 py-2.5 pr-8 text-sm whitespace-nowrap">
        <div className="flex gap-8">{row}</div>
        <div className="flex gap-8" aria-hidden="true">
          {row}
        </div>
      </div>
    </div>
  );
}

function AppFrame({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { profile, ready, setTheme } = useProfile();
  const [ticker, setTicker] = useState<TickerPayload | null>(null);
  const bare = pathname === "/unlock";

  useEffect(() => {
    if (!ready || bare) return;
    let cancel = false;
    fetch("/api/ticker", { cache: "no-store" })
      .then(async (response) => (response.ok ? ((await response.json()) as TickerPayload) : null))
      .then((payload) => {
        if (!cancel && payload) setTicker(payload);
      })
      .catch(() => undefined);
    return () => {
      cancel = true;
    };
  }, [ready, bare, profile?.updatedAt]);

  useEffect(() => {
    const story = ticker?.breaking;
    if (!story || !profile?.alerts) return;
    if (typeof Notification === "undefined" || Notification.permission !== "granted") return;
    if (sessionStorage.getItem("hs-notified") === story.id) return;
    sessionStorage.setItem("hs-notified", story.id);
    new Notification(`Breaking · ${story.sourceName}`, { body: story.title });
  }, [ticker?.breaking, profile?.alerts]);

  if (bare) return <div className="h-dvh">{children}</div>;

  const favorites = new Set(profile?.favorites ?? ["mine"]);
  const channels = [...CHANNELS].sort((a, b) => Number(favorites.has(b.slug)) - Number(favorites.has(a.slug)));
  const place = profile?.city;
  const weather = ticker?.weather;

  return (
    <div className="flex h-dvh flex-col">
      <header className="flex h-14 shrink-0 items-center gap-3 border-b border-line px-3 md:px-5">
        <Link href="/watch/mine" className="flex items-center gap-2">
          <Logo />
          <span className="font-serif text-xl tracking-tight">Rundown</span>
        </Link>
        <div className="ml-auto flex items-center gap-3 text-sm">
          {(place || weather) && (
            <span className="hidden max-w-56 truncate text-muted md:inline">
              {place}
              {weather ? ` · ${weather.temperatureF}° ${weather.label}` : ""}
            </span>
          )}
          <Link href="/guide" className="hidden text-muted hover:text-ink sm:inline">
            Guide
          </Link>
          <Link href="/settings" className="hidden text-muted hover:text-ink sm:inline">
            Settings
          </Link>
          <button
            type="button"
            className="rounded-full border border-line px-3 py-1 text-xs tracking-wide text-muted uppercase hover:text-ink"
            onClick={() => setTheme(profile?.theme === "light" ? "dark" : "light")}
            aria-label="Toggle color theme"
          >
            {profile?.theme === "light" ? "Dark" : "Light"}
          </button>
          <Clock />
        </div>
      </header>
      {ticker?.breaking && <BreakingBanner story={ticker.breaking} />}
      <div className="flex min-h-0 flex-1">
        <nav className="hidden w-56 shrink-0 flex-col border-r border-line lg:flex" aria-label="Channels">
          <p className="px-4 pt-4 pb-2 text-[10px] font-semibold tracking-[0.18em] text-faint uppercase">
            Channels
          </p>
          <ul className="min-h-0 flex-1 space-y-1 overflow-y-auto px-2">
            {channels.map((channel) => {
              const active = pathname === `/watch/${channel.slug}`;
              return (
                <li key={channel.slug}>
                  <Link
                    href={`/watch/${channel.slug}`}
                    className={`flex items-center gap-2 rounded-xl px-3 py-2 text-sm ${
                      active ? "bg-elev2 text-ink" : "text-muted hover:bg-elev hover:text-ink"
                    }`}
                    aria-current={active ? "page" : undefined}
                  >
                    <span className="h-2 w-2 rounded-full" style={{ background: channel.accent }} />
                    <span className="truncate">{channel.name}</span>
                    {active && <Equalizer />}
                    {favorites.has(channel.slug) && !active && (
                      <span className="ml-auto text-[10px] text-gold" aria-label="Saved channel">
                        ★
                      </span>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
          <div className="border-t border-line px-4 py-3 text-xs text-faint">
            <p>No ads. No paywall.</p>
            <p className="mt-1">
              <Link href="/about" className="hover:text-ink">
                About
              </Link>
              <span aria-hidden="true"> · </span>
              <Link href="/terms" className="hover:text-ink">
                Terms
              </Link>
            </p>
          </div>
        </nav>
        <main className="min-w-0 flex-1 overflow-y-auto">{children}</main>
      </div>
      <footer className="shrink-0 border-t border-line bg-elev/80">
        <div className="flex items-center gap-3 px-3">
          <span className="hidden shrink-0 text-[10px] font-semibold tracking-[0.18em] text-gold uppercase sm:inline">
            Newsline
          </span>
          <div className="min-w-0 flex-1" aria-label="Top headlines">
            <Ticker items={ticker?.items ?? []} />
          </div>
        </div>
        <nav className="grid grid-cols-3 border-t border-line text-center text-xs tracking-wide lg:hidden" aria-label="Primary">
          <Link href="/watch/mine" className="py-3 text-muted hover:text-ink">
            My Headlines
          </Link>
          <Link href="/guide" className="py-3 text-muted hover:text-ink">
            Guide
          </Link>
          <Link href="/settings" className="py-3 text-muted hover:text-ink">
            Settings
          </Link>
        </nav>
      </footer>
    </div>
  );
}

export function Shell({ children }: { children: React.ReactNode }) {
  return (
    <ProfileProvider>
      <AppFrame>{children}</AppFrame>
    </ProfileProvider>
  );
}
