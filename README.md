# Rundown

A personal, ad-free news channel. Pick topics and sources, press play, and the next video starts when the current one ends. Headlines link out to the original publishers. Video plays only in YouTube's official player. Nothing here is sold, and there is no ad network.

This is an unofficial portfolio project. It is not affiliated with Haystack News or haystack.tv.

## Setup

Node.js 22 or newer.

```sh
npm install
npm run dev
```

Open http://localhost:3000. The first visit creates an anonymous profile in `data/rundown.db` and a cookie that points at it. No API keys are required.

```sh
npm test
npm run lint
npm run build
npm start
```

### Friends-only gate

Copy `.env.example` to `.env.local` and set a shared code before exposing the app:

```dotenv
ACCESS_CODE=choose-a-long-code
DATA_DIR=./data
```

With `ACCESS_CODE` set, every page except About, Terms, and the unlock screen asks for that code. Leave it empty on your own machine.

### Docker

```sh
docker compose up --build
```

The SQLite file is stored in the `rundown-data` volume.

### Vercel

The app is a standard Next.js App Router project. Import this repository as the project root.

Preferences are stored in SQLite and mirrored into an httpOnly cookie. Vercel's filesystem is ephemeral, so the cookie is what follows the browser between instances; the database file lives in `/tmp` there unless you set `DATA_DIR` on a host with a disk. For a durable single-server copy, use Docker, a VPS, or any Node host with a persistent volume.

Set `ACCESS_CODE` in the project environment before sharing the deployment.

## What you can do

- **My Headlines** autoplays the newest videos from the topics and sources you saved. When a video ends, the next id in the queue loads in the same YouTube player. Loop is on by default and can be turned off.
- **Channel guide** opens SciTech, Cybersecurity, Politics, Weather, Entertainment, International, and Local as their own playlists.
- **Newsline** scrolls top headlines. A video headline jumps into that channel. An article headline opens the publisher.
- **Location** uses the browser Geolocation API once, or a city search. Local headlines and the temperature follow the saved city. "Use my location" and "Pick a city" are both on the settings page.
- **Favorites, theme, share, breaking alerts.** Star a channel, toggle dark and light, copy a `/watch/channel?v=` link, and turn on an in-app breaking banner. Browser notifications fire only while the tab is open, and only if you allow them.

Keyboard on a channel: `N` next, `P` previous, `Space` play or pause, `M` mute, `L` loop.

## Feed list

Text sources are public RSS or Atom feeds. Video sources are public YouTube channel feeds (`https://www.youtube.com/feeds/videos.xml?channel_id=…`). The player never fetches the media file. Shorts and obvious 24/7 livestreams are left out so the queue can advance when a video ends. Headlines that look like the same story are collapsed by title similarity, keeping the newest item and preferring a video over an article.

| Source | Kind | Topics |
| --- | --- | --- |
| The Hacker News | RSS | Cybersecurity |
| Krebs on Security | RSS | Cybersecurity |
| BleepingComputer | RSS | Cybersecurity, Tech |
| Schneier on Security | RSS | Cybersecurity |
| Hacker News (Y Combinator, via hnrss.org) | RSS | Tech |
| Ars Technica | RSS | Tech |
| The Verge | RSS | Tech, Entertainment |
| CNET | RSS | Tech |
| BBC Technology | RSS | Tech |
| BBC Science | RSS | Tech |
| The Guardian Technology | RSS | Tech |
| NASA | RSS | Tech |
| NPR News | RSS | Politics, International |
| NPR Politics | RSS | Politics |
| Politico | RSS | Politics |
| BBC News | RSS | International, Politics |
| BBC World | RSS | International |
| The Guardian World | RSS | International |
| Al Jazeera | RSS | International |
| Variety | RSS | Entertainment |
| ABC News | YouTube | Politics, International |
| Reuters | YouTube | International, Politics |
| Bloomberg Television | YouTube | Politics, International |
| CBS News | YouTube | Politics, International |
| NBC News | YouTube | Politics, International |
| Associated Press | YouTube | International, Politics |
| DW News | YouTube | International |
| Al Jazeera English | YouTube | International |
| BBC News Video | YouTube | International, Politics |
| PBS NewsHour | YouTube | Politics, International |
| Sky News | YouTube | International |
| France 24 | YouTube | International |
| Euronews | YouTube | International |
| The Verge Video | YouTube | Tech |
| CNET Video | YouTube | Tech |
| NASA Video | YouTube | Tech |
| The Weather Channel | YouTube | Weather |
| Local headlines | Google News RSS | Local, for the saved city |
| Weather headlines | Google News RSS | Weather, for the saved city |

My Headlines starts with a smaller default set (the outlets named above that cover tech, security, world news, and a few video channels, plus local and weather once a city is set). Turn the rest on in Settings. Topic channels always use every catalog source for that topic, so the guide stays full even if you narrow My Headlines.

A request waits at most about eight seconds and plays whatever has already arrived. Successful feeds are cached in memory for five minutes. The API allows a few dozen feed reads per minute per IP and answers `429` after that.

## Add a source

Edit `src/lib/sources.ts` and append an object.

RSS or Atom:

```ts
{
  id: "my-source",
  name: "My Source",
  homepage: "https://example.com",
  kind: "rss",
  topics: ["tech"],
  feedUrl: "https://example.com/feed.xml",
  blurb: "One sentence for the about page.",
}
```

YouTube channel (the id is the `UC…` value, not the @handle):

```ts
{
  id: "my-channel",
  name: "My Channel",
  homepage: "https://example.com",
  kind: "youtube",
  channelId: "UCxxxxxxxxxxxxxxxxxxxxxx",
  topics: ["international"],
  blurb: "Played through the official YouTube player.",
}
```

`topics` must be one or more of `tech`, `cybersecurity`, `politics`, `weather`, `entertainment`, `international`, `local`. Restart the dev server. The new source appears in Settings and on the about page. Add its id to `DEFAULT_SOURCE_IDS` only if new profiles should include it. Put the real name and homepage on the about page by keeping `blurb` accurate. The terms page already tells guests that stories belong to the publishers.

`dynamic: "local"` or `dynamic: "weather"` builds a Google News RSS search from the saved city. Use that only for location-specific headlines, and keep linking out.

## Legal and safety

- [Terms of use](src/app/terms/page.tsx) are served at `/terms`.
- Credits and the live source list are at `/about`.
- `public/robots.txt` blocks `/api/`.
- Rate limiting lives in `src/lib/rate-limit.ts` and is applied in the route handlers.
- Do not rehost articles or video files. The queue stores ids and links only.

## Project map

```text
src/app/watch/[channel]   autoplay channel
src/app/guide             channel guide
src/app/settings          topics, sources, city
src/app/api/feed          playlist JSON
src/lib/sources.ts        the catalog
src/lib/aggregate.ts      fetch, dedupe, rank
src/lib/profile.ts        SQLite + cookie profile
src/components/player.tsx YouTube IFrame player
```
