"use client";

import Link from "next/link";
import { CHANNELS } from "@/lib/channels";
import { useProfile } from "./profile-provider";

export function GuideBoard() {
  const { profile, save } = useProfile();
  const favorites = new Set(profile?.favorites ?? []);

  return (
    <div className="mx-auto max-w-5xl p-4 md:p-8">
      <p className="text-[10px] font-semibold tracking-[0.18em] text-gold uppercase">Channel guide</p>
      <h1 className="mt-2 font-serif text-4xl md:text-5xl">Pick a channel and let it run.</h1>
      <p className="mt-3 max-w-2xl text-muted">
        Each channel is its own autoplay playlist, newest stories first. Stars stay on this browser&apos;s profile.
      </p>
      <ul className="mt-8 grid gap-4 sm:grid-cols-2">
        {CHANNELS.map((channel) => {
          const saved = favorites.has(channel.slug);
          return (
            <li key={channel.slug} className="overflow-hidden rounded-3xl border border-line bg-elev">
              <div className="h-1.5" style={{ background: channel.accent }} />
              <div className="p-5">
                <div className="flex items-start justify-between gap-3">
                  <p className="text-[10px] font-semibold tracking-[0.18em] text-faint uppercase">{channel.kicker}</p>
                  <button
                    type="button"
                    aria-pressed={saved}
                    disabled={!profile}
                    aria-label={saved ? `Remove ${channel.name} from favorites` : `Save ${channel.name}`}
                    className={`text-lg ${saved ? "text-gold" : "text-faint"}`}
                    onClick={() => {
                      if (!profile) return;
                      const next = saved
                        ? profile.favorites.filter((slug) => slug !== channel.slug)
                        : [...profile.favorites, channel.slug];
                      void save({ favorites: next }).catch(() => undefined);
                    }}
                  >
                    {saved ? "★" : "☆"}
                  </button>
                </div>
                <h2 className="mt-2 font-serif text-3xl">{channel.name}</h2>
                <p className="mt-2 text-sm leading-6 text-muted">{channel.description}</p>
                <Link
                  href={`/watch/${channel.slug}`}
                  className="mt-4 inline-flex rounded-full bg-gold px-4 py-2 text-sm font-semibold text-[#1a1206]"
                >
                  Play channel
                </Link>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
