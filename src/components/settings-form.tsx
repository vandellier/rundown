"use client";

import { useEffect, useState } from "react";
import { SOURCES, TOPIC_LABELS } from "@/lib/sources";
import { TOPICS, type Profile, type Topic } from "@/lib/types";
import { useProfile } from "./profile-provider";

type Place = {
  city: string;
  region: string | null;
  country: string | null;
  lat: number;
  lon: number;
  label: string;
};

function groupSources() {
  return TOPICS.map((topic) => ({
    topic,
    sources: SOURCES.filter((source) => source.topics[0] === topic),
  })).filter((group) => group.sources.length > 0);
}

export function SettingsForm() {
  const { profile, ready, save } = useProfile();
  const [message, setMessage] = useState("");
  const [query, setQuery] = useState("");
  const [places, setPlaces] = useState<Place[]>([]);
  const [locating, setLocating] = useState(false);
  const groups = groupSources();
  const visiblePlaces = query.trim().length < 2 ? [] : places;

  useEffect(() => {
    if (query.trim().length < 2) return;
    const handle = window.setTimeout(() => {
      fetch(`/api/location/search?q=${encodeURIComponent(query.trim())}`)
        .then(async (response) => (response.ok ? ((await response.json()) as { places: Place[] }) : { places: [] }))
        .then((body) => setPlaces(body.places))
        .catch(() => setPlaces([]));
    }, 250);
    return () => window.clearTimeout(handle);
  }, [query]);

  async function commit(patch: Partial<Profile>, note: string) {
    try {
      await save(patch);
      setMessage(note);
    } catch (reason) {
      setMessage(reason instanceof Error ? reason.message : "Could not save.");
    }
  }

  async function detectLocation() {
    if (!navigator.geolocation) {
      setMessage("This browser cannot detect a location. Search for a city instead.");
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const response = await fetch("/api/location/reverse", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              lat: position.coords.latitude,
              lon: position.coords.longitude,
            }),
          });
          const body = (await response.json()) as { place?: Place; error?: string };
          if (!response.ok || !body.place) throw new Error(body.error || "No city found.");
          await commit(
            {
              city: body.place.city,
              region: body.place.region,
              country: body.place.country,
              lat: body.place.lat,
              lon: body.place.lon,
              locationMode: "geo",
            },
            `Using your location: ${body.place.label}.`,
          );
        } catch (reason) {
          setMessage(reason instanceof Error ? reason.message : "Location lookup failed.");
        } finally {
          setLocating(false);
        }
      },
      () => {
        setLocating(false);
        setMessage("Location permission was denied. Pick a city instead.");
      },
      { enableHighAccuracy: false, timeout: 12000, maximumAge: 30 * 60 * 1000 },
    );
  }

  async function enableAlerts() {
    if (typeof Notification === "undefined") {
      setMessage("This browser does not show desktop notifications. In-app alerts still work.");
      await commit({ alerts: true }, "In-app breaking alerts are on.");
      return;
    }
    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
      setMessage("The browser blocked notifications. In-app alerts can still show while this tab is open.");
      return;
    }
    await commit({ alerts: true }, "Breaking alerts are on for this browser.");
  }

  if (!ready) return <p className="p-6 text-sm text-muted">Loading your preferences…</p>;
  if (!profile) return <p className="p-6 text-sm text-muted">Preferences are unavailable right now.</p>;

  const place = [profile.city, profile.region, profile.country].filter(Boolean).join(", ");

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-8 p-4 md:p-8">
      <header>
        <p className="text-[10px] font-semibold tracking-[0.18em] text-gold uppercase">Your edition</p>
        <h1 className="mt-2 font-serif text-4xl">Make it your feed</h1>
        <p className="mt-2 max-w-xl text-muted">
          Topics and sources shape My Headlines. Topic channels in the guide always use their full source list.
          Nothing here is sold, and there is no ad profile.
        </p>
        {message && <p className="mt-3 text-sm text-gold">{message}</p>}
      </header>

      <section className="rounded-3xl border border-line bg-elev p-5">
        <h2 className="font-serif text-2xl">Location</h2>
        <p className="mt-1 text-sm text-muted">
          {place ? `Saved city: ${place}.` : "No city saved yet."} Coordinates are used only to name that city and
          to ask Open-Meteo for the current conditions.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            className={`rounded-full px-4 py-2 text-sm ${
              profile.locationMode === "geo" ? "bg-gold font-semibold text-[#1a1206]" : "border border-line"
            }`}
            onClick={() => void detectLocation()}
          >
            {locating ? "Locating…" : "Use my location"}
          </button>
          <button
            type="button"
            className={`rounded-full px-4 py-2 text-sm ${
              profile.locationMode === "manual" ? "bg-gold font-semibold text-[#1a1206]" : "border border-line"
            }`}
            onClick={() => void commit({ locationMode: "manual" }, "Pick a city below.")}
          >
            Pick a city
          </button>
        </div>
        <label className="mt-4 block text-sm">
          <span className="text-muted">Search cities</span>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Austin, Lisbon, Nairobi…"
            className="mt-1 w-full rounded-2xl border border-line bg-bg px-4 py-3 outline-none"
          />
        </label>
        {!!visiblePlaces.length && (
          <ul className="mt-2 overflow-hidden rounded-2xl border border-line">
            {visiblePlaces.map((placeOption) => (
              <li key={`${placeOption.lat},${placeOption.lon}`}>
                <button
                  type="button"
                  className="block w-full px-4 py-3 text-left text-sm hover:bg-elev2"
                  onClick={() => {
                    setQuery("");
                    setPlaces([]);
                    void commit(
                      {
                        city: placeOption.city,
                        region: placeOption.region,
                        country: placeOption.country,
                        lat: placeOption.lat,
                        lon: placeOption.lon,
                        locationMode: "manual",
                      },
                      `Local news will use ${placeOption.label}.`,
                    );
                  }}
                >
                  {placeOption.label}
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2 className="font-serif text-2xl">Topics</h2>
        <div className="mt-3 flex flex-wrap gap-2">
          {TOPICS.map((topic) => {
            const on = profile.topics.includes(topic);
            return (
              <button
                key={topic}
                type="button"
                aria-pressed={on}
                className={`rounded-full px-4 py-2 text-sm ${on ? "bg-gold font-semibold text-[#1a1206]" : "border border-line text-muted"}`}
                onClick={() => {
                  const topics: Topic[] = on
                    ? profile.topics.filter((item) => item !== topic)
                    : [...profile.topics, topic];
                  void commit(
                    { topics: topics.length ? topics : profile.topics },
                    topics.length ? "Topics saved." : "Keep at least one topic.",
                  );
                }}
              >
                {TOPIC_LABELS[topic]}
              </button>
            );
          })}
        </div>
      </section>

      <section className="space-y-6">
        <h2 className="font-serif text-2xl">Sources</h2>
        {groups.map((group) => (
          <div key={group.topic}>
            <div className="mb-2 flex items-center justify-between">
              <h3 className="text-sm font-semibold tracking-wide text-gold uppercase">{TOPIC_LABELS[group.topic]}</h3>
              <button
                type="button"
                className="text-xs text-muted hover:text-ink"
                onClick={() => {
                  const ids = group.sources.map((source) => source.id);
                  const allOn = ids.every((id) => profile.sources.includes(id));
                  const sources = allOn
                    ? profile.sources.filter((id) => !ids.includes(id))
                    : [...new Set([...profile.sources, ...ids])];
                  void commit({ sources }, allOn ? "Group turned off." : "Group turned on.");
                }}
              >
                Toggle group
              </button>
            </div>
            <ul className="divide-y divide-line overflow-hidden rounded-2xl border border-line bg-elev">
              {group.sources.map((source) => {
                const on = profile.sources.includes(source.id);
                return (
                  <li key={source.id} className="flex items-start gap-3 px-4 py-3">
                    <input
                      id={source.id}
                      type="checkbox"
                      checked={on}
                      className="mt-1"
                      onChange={() => {
                        const sources = on
                          ? profile.sources.filter((id) => id !== source.id)
                          : [...profile.sources, source.id];
                        void commit({ sources }, "Sources saved.");
                      }}
                    />
                    <label htmlFor={source.id} className="min-w-0 flex-1">
                      <span className="block text-sm font-medium">
                        {source.name}
                        <span className="ml-2 text-[10px] tracking-wide text-faint uppercase">
                          {source.kind === "youtube" ? "YouTube" : "RSS"}
                        </span>
                      </span>
                      <span className="mt-0.5 block text-sm text-muted">{source.blurb}</span>
                    </label>
                    <a href={source.homepage} target="_blank" rel="noreferrer" className="shrink-0 text-xs text-gold">
                      Site
                    </a>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </section>

      <section className="rounded-3xl border border-line bg-elev p-5">
        <h2 className="font-serif text-2xl">Playback and alerts</h2>
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            className="rounded-full border border-line px-4 py-2 text-sm"
            onClick={() => void commit({ loop: !profile.loop }, profile.loop ? "The queue will stop at the end." : "The queue will loop.")}
          >
            {profile.loop ? "Loop is on" : "Loop is off"}
          </button>
          <button
            type="button"
            className="rounded-full border border-line px-4 py-2 text-sm"
            onClick={() => {
              if (profile.alerts) void commit({ alerts: false }, "Breaking alerts are off.");
              else void enableAlerts();
            }}
          >
            {profile.alerts ? "Breaking alerts on" : "Enable breaking alerts"}
          </button>
        </div>
        <p className="mt-3 text-sm text-muted">
          Alerts stay inside the app. If you allow browser notifications, they fire only while this site is open.
          There is no push service and no third-party tracker.
        </p>
      </section>
    </div>
  );
}
