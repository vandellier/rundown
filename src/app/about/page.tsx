import type { Metadata } from "next";
import { CHANNELS } from "@/lib/channels";
import { SOURCES, TOPIC_LABELS, feedUrlFor, youtubeChannelUrl } from "@/lib/sources";
import { TOPICS } from "@/lib/types";

export const metadata: Metadata = { title: "About" };

export default function AboutPage() {
  return (
    <article className="mx-auto max-w-3xl px-4 py-8 md:px-8 md:py-12">
      <p className="text-[10px] font-semibold tracking-[0.18em] text-gold uppercase">Credits</p>
      <h1 className="mt-2 font-serif text-5xl">Rundown</h1>
      <p className="mt-4 text-lg leading-8 text-muted">
        A personal, ad-free news channel for one household or a few friends. It is an unofficial portfolio project
        and is not affiliated with, endorsed by, or a product of Haystack News or haystack.tv. The screen is modeled
        on that kind of television playlist: stories you asked for, played straight through.
      </p>

      <h2 className="mt-10 font-serif text-3xl">How playback works</h2>
      <p className="mt-3 leading-7 text-muted">
        Videos play inside YouTube&apos;s official IFrame Player. This app never downloads, rehosts, or hotlinks the
        media file. When a video ends, the next id in the queue is handed to that same player. Articles are
        headlines plus a short excerpt from the public feed, and the title is a link to the publisher. Nothing is
        scraped out of a paywall and nothing is stored except your preferences.
      </p>

      <h2 className="mt-10 font-serif text-3xl">What we keep</h2>
      <p className="mt-3 leading-7 text-muted">
        A single anonymous profile lives in SQLite and in a cookie on your browser: city, topic and source
        choices, favorite channels, theme, and whether the queue loops. There is no account, no ad network, and no
        analytics pixel. Location is optional. If you allow it, the browser sends coordinates to this app, which
        asks BigDataCloud to name the city and Open-Meteo for the temperature. City search uses Open-Meteo&apos;s
        geocoder.
      </p>

      <h2 className="mt-10 font-serif text-3xl">Channels</h2>
      <ul className="mt-3 space-y-2 text-muted">
        {CHANNELS.map((channel) => (
          <li key={channel.slug}>
            <span className="text-ink">{channel.name}.</span> {channel.description}
          </li>
        ))}
      </ul>

      <h2 className="mt-10 font-serif text-3xl">Sources</h2>
      <p className="mt-3 leading-7 text-muted">
        Feeds are read server-side, cached in memory for about five minutes, and rate-limited so this app does not
        hammer publishers. A source that fails is skipped. Add another by editing <code>src/lib/sources.ts</code>.
      </p>
      {TOPICS.map((topic) => {
        const sources = SOURCES.filter((source) => source.topics[0] === topic);
        if (!sources.length) return null;
        return (
          <section key={topic} className="mt-6">
            <h3 className="text-sm font-semibold tracking-[0.16em] text-gold uppercase">{TOPIC_LABELS[topic]}</h3>
            <ul className="mt-2 divide-y divide-line border-y border-line">
              {sources.map((source) => {
                const feed = source.dynamic ? null : feedUrlFor(source, null);
                const home = source.kind === "youtube" ? youtubeChannelUrl(source) : source.homepage;
                return (
                  <li key={source.id} className="py-3">
                    <a href={home} target="_blank" rel="noreferrer" className="font-medium text-ink hover:text-gold">
                      {source.name}
                    </a>
                    <p className="text-sm text-muted">{source.blurb}</p>
                    {feed && (
                      <a href={feed} target="_blank" rel="noreferrer" className="text-xs text-faint hover:text-gold">
                        Public feed
                      </a>
                    )}
                    {source.dynamic && (
                      <p className="text-xs text-faint">
                        Discovered through Google News RSS for your saved city, then linked out to the publisher.
                      </p>
                    )}
                  </li>
                );
              })}
            </ul>
          </section>
        );
      })}

      <h2 className="mt-10 font-serif text-3xl">Tools</h2>
      <ul className="mt-3 list-disc space-y-2 pl-5 text-muted">
        <li>
          <a className="text-ink hover:text-gold" href="https://nextjs.org">Next.js</a> and Tailwind CSS for the app.
        </li>
        <li>
          <a className="text-ink hover:text-gold" href="https://github.com/rbren/rss-parser">rss-parser</a> for RSS and
          Atom feeds, including YouTube channel feeds.
        </li>
        <li>
          <a className="text-ink hover:text-gold" href="https://developers.google.com/youtube/iframe_api_reference">
            YouTube IFrame Player API
          </a>{" "}
          for playback and the ended event.
        </li>
        <li>
          <a className="text-ink hover:text-gold" href="https://open-meteo.com">Open-Meteo</a> for forecasts and city search.
        </li>
        <li>
          <a className="text-ink hover:text-gold" href="https://www.bigdatacloud.com">BigDataCloud</a> to turn coordinates into a city name.
        </li>
        <li>Node.js built-in SQLite for the preference file. Fonts are self-hosted by Next.js.</li>
      </ul>
    </article>
  );
}
