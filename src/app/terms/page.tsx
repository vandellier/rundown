import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Terms of use" };

export default function TermsPage() {
  return (
    <article className="mx-auto max-w-3xl px-4 py-8 md:px-8 md:py-12">
      <p className="text-[10px] font-semibold tracking-[0.18em] text-gold uppercase">Personal use</p>
      <h1 className="mt-2 font-serif text-5xl">Terms of use</h1>
      <p className="mt-4 text-muted">Last updated September 29, 2026.</p>

      <h2 className="mt-8 font-serif text-2xl">This is a private reader</h2>
      <p className="mt-3 leading-7 text-muted">
        Rundown is a personal, non-commercial news reader. It is not for sale, not a subscription, and not an
        advertising product. If you were handed a link, you are a guest of whoever runs this copy. Do not open it to
        the public internet without the optional access code described in the README.
      </p>

      <h2 className="mt-8 font-serif text-2xl">Not Haystack News</h2>
      <p className="mt-3 leading-7 text-muted">
        This project is unofficial. It is not affiliated with Haystack News, haystack.tv, or any publisher whose
        headlines appear here. Names of news organizations are used to identify their public feeds and to link you
        to their sites.
      </p>

      <h2 className="mt-8 font-serif text-2xl">Their stories stay theirs</h2>
      <p className="mt-3 leading-7 text-muted">
        Headlines, excerpts, and video belong to the outlets and to YouTube. This app shows a title, the source
        name, the time, and at most a short feed excerpt, then links to the original article. Video plays only
        through YouTube&apos;s embedded player. Do not use this app to copy, rehost, or republish that material.
        YouTube&apos;s terms apply to anything you watch in the player.
      </p>

      <h2 className="mt-8 font-serif text-2xl">Location</h2>
      <p className="mt-3 leading-7 text-muted">
        City detection is optional. If you allow it, coordinates are sent to this server and then to a geocoder so
        the app can store a city name and fetch local headlines and a temperature. You can type a city instead, or
        clear it by choosing another. There is no location history beyond the single city saved in your profile.
      </p>

      <h2 className="mt-8 font-serif text-2xl">No ads, no extra tracking</h2>
      <p className="mt-3 leading-7 text-muted">
        This app does not run an ad network or a third-party analytics tracker. The profile cookie exists so the
        server can remember your topics, sources, and city. YouTube may set its own cookies when the player loads,
        under YouTube&apos;s policies, because the embed is their player.
      </p>

      <h2 className="mt-8 font-serif text-2xl">Be decent to the sources</h2>
      <p className="mt-3 leading-7 text-muted">
        The server caches feeds and rate-limits its own API. Do not scrape this app, bypass the limiter, or point a
        bot at it. <code>robots.txt</code> asks crawlers to stay out of the API.
      </p>

      <h2 className="mt-8 font-serif text-2xl">No warranty</h2>
      <p className="mt-3 leading-7 text-muted">
        Stories can be wrong, late, duplicated, or unavailable. Embeds fail when a channel disables them. The app
        is provided as-is, without a promise that it will keep working or that any headline is accurate. Check the
        original publisher before you rely on something.
      </p>

      <p className="mt-8 text-sm text-muted">
        Source list and credits live on the <Link href="/about" className="text-gold">about page</Link>.
      </p>
    </article>
  );
}
