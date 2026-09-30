import type { Topic } from "./types";
import { TOPICS } from "./types";

export type Source = {
  id: string;
  name: string;
  homepage: string;
  kind: "rss" | "youtube";
  topics: Topic[];
  blurb: string;
  feedUrl?: string;
  channelId?: string;
  dynamic?: "local" | "weather";
};

export const TOPIC_LABELS: Record<Topic, string> = {
  tech: "Tech",
  cybersecurity: "Cybersecurity",
  politics: "Politics",
  weather: "Weather",
  entertainment: "Entertainment",
  international: "International",
  local: "Local",
};

export const SOURCES: Source[] = [
  {
    id: "the-hacker-news",
    name: "The Hacker News",
    homepage: "https://thehackernews.com",
    kind: "rss",
    topics: ["cybersecurity"],
    feedUrl: "https://thehackernews.com/feeds/posts/default",
    blurb: "Cybersecurity reporting on breaches, patches, and threat research.",
  },
  {
    id: "krebs",
    name: "Krebs on Security",
    homepage: "https://krebsonsecurity.com",
    kind: "rss",
    topics: ["cybersecurity"],
    feedUrl: "https://krebsonsecurity.com/feed/",
    blurb: "Brian Krebs' investigations into cybercrime and online fraud.",
  },
  {
    id: "bleepingcomputer",
    name: "BleepingComputer",
    homepage: "https://www.bleepingcomputer.com",
    kind: "rss",
    topics: ["cybersecurity", "tech"],
    feedUrl: "https://www.bleepingcomputer.com/feed/",
    blurb: "Malware, outages, and security news for technical readers.",
  },
  {
    id: "schneier",
    name: "Schneier on Security",
    homepage: "https://www.schneier.com",
    kind: "rss",
    topics: ["cybersecurity"],
    feedUrl: "https://www.schneier.com/feed/atom/",
    blurb: "Bruce Schneier's essays on security, privacy, and policy.",
  },
  {
    id: "hacker-news",
    name: "Hacker News",
    homepage: "https://news.ycombinator.com",
    kind: "rss",
    topics: ["tech"],
    feedUrl: "https://hnrss.org/frontpage",
    blurb: "Front page of Y Combinator's Hacker News, via hnrss.org.",
  },
  {
    id: "ars",
    name: "Ars Technica",
    homepage: "https://arstechnica.com",
    kind: "rss",
    topics: ["tech"],
    feedUrl: "https://feeds.arstechnica.com/arstechnica/index",
    blurb: "Science and technology reporting from Ars Technica.",
  },
  {
    id: "verge",
    name: "The Verge",
    homepage: "https://www.theverge.com",
    kind: "rss",
    topics: ["tech", "entertainment"],
    feedUrl: "https://www.theverge.com/rss/index.xml",
    blurb: "Technology, science, and culture from The Verge.",
  },
  {
    id: "cnet",
    name: "CNET",
    homepage: "https://www.cnet.com",
    kind: "rss",
    topics: ["tech"],
    feedUrl: "https://www.cnet.com/rss/news/",
    blurb: "Consumer technology and science news from CNET.",
  },
  {
    id: "bbc-tech",
    name: "BBC Technology",
    homepage: "https://www.bbc.com/news/technology",
    kind: "rss",
    topics: ["tech"],
    feedUrl: "https://feeds.bbci.co.uk/news/technology/rss.xml",
    blurb: "BBC News technology desk.",
  },
  {
    id: "bbc-science",
    name: "BBC Science",
    homepage: "https://www.bbc.com/news/science_and_environment",
    kind: "rss",
    topics: ["tech"],
    feedUrl: "https://feeds.bbci.co.uk/news/science_and_environment/rss.xml",
    blurb: "BBC science and environment coverage.",
  },
  {
    id: "guardian-tech",
    name: "The Guardian Technology",
    homepage: "https://www.theguardian.com/technology",
    kind: "rss",
    topics: ["tech"],
    feedUrl: "https://www.theguardian.com/technology/rss",
    blurb: "Technology news from The Guardian.",
  },
  {
    id: "nasa",
    name: "NASA",
    homepage: "https://www.nasa.gov",
    kind: "rss",
    topics: ["tech"],
    feedUrl: "https://www.nasa.gov/rss/dyn/breaking_news.rss",
    blurb: "NASA breaking news and mission updates.",
  },
  {
    id: "npr",
    name: "NPR News",
    homepage: "https://www.npr.org",
    kind: "rss",
    topics: ["politics", "international"],
    feedUrl: "https://feeds.npr.org/1001/rss.xml",
    blurb: "NPR's main news feed.",
  },
  {
    id: "npr-politics",
    name: "NPR Politics",
    homepage: "https://www.npr.org/sections/politics/",
    kind: "rss",
    topics: ["politics"],
    feedUrl: "https://feeds.npr.org/1014/rss.xml",
    blurb: "NPR politics desk.",
  },
  {
    id: "politico",
    name: "Politico",
    homepage: "https://www.politico.com",
    kind: "rss",
    topics: ["politics"],
    feedUrl: "https://rss.politico.com/politics-news.xml",
    blurb: "U.S. political reporting from Politico.",
  },
  {
    id: "bbc-news",
    name: "BBC News",
    homepage: "https://www.bbc.com/news",
    kind: "rss",
    topics: ["international", "politics"],
    feedUrl: "https://feeds.bbci.co.uk/news/rss.xml",
    blurb: "BBC News front page.",
  },
  {
    id: "bbc-world",
    name: "BBC World",
    homepage: "https://www.bbc.com/news/world",
    kind: "rss",
    topics: ["international"],
    feedUrl: "https://feeds.bbci.co.uk/news/world/rss.xml",
    blurb: "BBC world news.",
  },
  {
    id: "guardian-world",
    name: "The Guardian World",
    homepage: "https://www.theguardian.com/world",
    kind: "rss",
    topics: ["international"],
    feedUrl: "https://www.theguardian.com/world/rss",
    blurb: "International news from The Guardian.",
  },
  {
    id: "aljazeera",
    name: "Al Jazeera",
    homepage: "https://www.aljazeera.com",
    kind: "rss",
    topics: ["international"],
    feedUrl: "https://www.aljazeera.com/xml/rss/all.xml",
    blurb: "Al Jazeera English articles.",
  },
  {
    id: "variety",
    name: "Variety",
    homepage: "https://variety.com",
    kind: "rss",
    topics: ["entertainment"],
    feedUrl: "https://variety.com/feed/",
    blurb: "Film, television, and entertainment business news.",
  },
  {
    id: "abc-news",
    name: "ABC News",
    homepage: "https://abcnews.go.com",
    kind: "youtube",
    channelId: "UCBi2mrWuNuyYy4gbM6fU18Q",
    topics: ["politics", "international"],
    blurb: "ABC News video reports. Played through the official YouTube player.",
  },
  {
    id: "reuters",
    name: "Reuters",
    homepage: "https://www.reuters.com",
    kind: "youtube",
    channelId: "UChqUTb7kYRX8-EiaN3XFrSQ",
    topics: ["international", "politics"],
    blurb: "Reuters video reports on YouTube.",
  },
  {
    id: "bloomberg",
    name: "Bloomberg Television",
    homepage: "https://www.bloomberg.com",
    kind: "youtube",
    channelId: "UCIALMKvObZNtJ6AmdCLP7Lg",
    topics: ["politics", "international"],
    blurb: "Bloomberg Television clips on markets and world news.",
  },
  {
    id: "cbs-news",
    name: "CBS News",
    homepage: "https://www.cbsnews.com",
    kind: "youtube",
    channelId: "UC8p1vwvWtl6T73JiExfWs1g",
    topics: ["politics", "international"],
    blurb: "CBS News video reports.",
  },
  {
    id: "nbc-news",
    name: "NBC News",
    homepage: "https://www.nbcnews.com",
    kind: "youtube",
    channelId: "UCeY0bbntWzzVIaj2z3QigXg",
    topics: ["politics", "international"],
    blurb: "NBC News video reports.",
  },
  {
    id: "ap",
    name: "Associated Press",
    homepage: "https://apnews.com",
    kind: "youtube",
    channelId: "UC52X5wxOL_s5yw0dQk7NtgA",
    topics: ["international", "politics"],
    blurb: "Associated Press video.",
  },
  {
    id: "dw",
    name: "DW News",
    homepage: "https://www.dw.com",
    kind: "youtube",
    channelId: "UCknLrEdhRCp1aegoMqRaCZg",
    topics: ["international"],
    blurb: "Deutsche Welle English-language news video.",
  },
  {
    id: "aljazeera-video",
    name: "Al Jazeera English",
    homepage: "https://www.aljazeera.com",
    kind: "youtube",
    channelId: "UCNye-wNBqNL5ZzHSJj3l8Bg",
    topics: ["international"],
    blurb: "Al Jazeera English video.",
  },
  {
    id: "bbc-video",
    name: "BBC News Video",
    homepage: "https://www.bbc.com/news",
    kind: "youtube",
    channelId: "UC16niRr50-MSBwiO3YDb3RA",
    topics: ["international", "politics"],
    blurb: "BBC News YouTube channel.",
  },
  {
    id: "pbs",
    name: "PBS NewsHour",
    homepage: "https://www.pbs.org/newshour/",
    kind: "youtube",
    channelId: "UC6ZFN9Tx6xh-skXCuRHCDpQ",
    topics: ["politics", "international"],
    blurb: "PBS NewsHour segments.",
  },
  {
    id: "sky",
    name: "Sky News",
    homepage: "https://news.sky.com",
    kind: "youtube",
    channelId: "UCoMdktPbSTixAyNGwb-UYkQ",
    topics: ["international"],
    blurb: "Sky News video.",
  },
  {
    id: "france24",
    name: "France 24",
    homepage: "https://www.france24.com/en/",
    kind: "youtube",
    channelId: "UCQfwfsi5VrQ8yKZ-UWmAEFg",
    topics: ["international"],
    blurb: "France 24 English video.",
  },
  {
    id: "euronews",
    name: "Euronews",
    homepage: "https://www.euronews.com",
    kind: "youtube",
    channelId: "UCSrZ3UV4jOidv8ppoVuvW9Q",
    topics: ["international"],
    blurb: "Euronews English video.",
  },
  {
    id: "verge-video",
    name: "The Verge Video",
    homepage: "https://www.theverge.com",
    kind: "youtube",
    channelId: "UCddiUEpeqJcYeBxX1IVBKvQ",
    topics: ["tech"],
    blurb: "The Verge's YouTube channel.",
  },
  {
    id: "cnet-video",
    name: "CNET Video",
    homepage: "https://www.cnet.com",
    kind: "youtube",
    channelId: "UCOmcA3f_RrH6b9NmcNa4tdg",
    topics: ["tech"],
    blurb: "CNET's YouTube channel.",
  },
  {
    id: "nasa-video",
    name: "NASA Video",
    homepage: "https://www.nasa.gov",
    kind: "youtube",
    channelId: "UCLA_DiR1FfKNvjuUpBHmylQ",
    topics: ["tech"],
    blurb: "NASA's official YouTube channel.",
  },
  {
    id: "weather-channel",
    name: "The Weather Channel",
    homepage: "https://weather.com",
    kind: "youtube",
    channelId: "UCGTUbwceCMibvpbd2NaIP7A",
    topics: ["weather"],
    blurb: "Weather Channel video explainers. Continuous live streams are skipped.",
  },
  {
    id: "local-headlines",
    name: "Local headlines",
    homepage: "https://news.google.com",
    kind: "rss",
    topics: ["local"],
    dynamic: "local",
    blurb: "Google News RSS for your saved city. Each headline links out to the publisher.",
  },
  {
    id: "city-weather",
    name: "Weather headlines",
    homepage: "https://news.google.com",
    kind: "rss",
    topics: ["weather", "local"],
    dynamic: "weather",
    blurb: "Google News RSS weather query for your saved city, plus conditions from Open-Meteo.",
  },
];

export const SOURCE_IDS = SOURCES.map((source) => source.id);

export const DEFAULT_SOURCE_IDS = [
  "the-hacker-news",
  "krebs",
  "bleepingcomputer",
  "hacker-news",
  "ars",
  "verge",
  "cnet",
  "bbc-world",
  "npr",
  "politico",
  "abc-news",
  "reuters",
  "bloomberg",
  "bbc-video",
  "weather-channel",
  "local-headlines",
  "city-weather",
];

export function sourceById(id: string): Source | undefined {
  return SOURCES.find((source) => source.id === id);
}

export function isTopic(value: string): value is Topic {
  return (TOPICS as readonly string[]).includes(value);
}

export function googleNewsUrl(query: string): string {
  return `https://news.google.com/rss/search?q=${encodeURIComponent(query)}&hl=en-US&gl=US&ceid=US:en`;
}

export function feedUrlFor(source: Source, city: string | null): string | null {
  if (source.kind === "youtube" && source.channelId) {
    return `https://www.youtube.com/feeds/videos.xml?channel_id=${source.channelId}`;
  }
  if (source.dynamic === "local") {
    if (!city) return null;
    return googleNewsUrl(`${city} local news when:2d`);
  }
  if (source.dynamic === "weather") {
    const place = city ? `${city} ` : "";
    return googleNewsUrl(`${place}weather forecast when:1d`);
  }
  return source.feedUrl ?? null;
}

export function youtubeChannelUrl(source: Source): string {
  if (source.channelId) return `https://www.youtube.com/channel/${source.channelId}`;
  return source.homepage;
}
