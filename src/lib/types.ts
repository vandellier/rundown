export const TOPICS = [
  "tech",
  "cybersecurity",
  "politics",
  "weather",
  "entertainment",
  "international",
  "local",
] as const;

export type Topic = (typeof TOPICS)[number];

export type LocationMode = "geo" | "manual";
export type ThemeName = "dark" | "light";

export type Story = {
  id: string;
  kind: "video" | "article";
  title: string;
  url: string;
  sourceId: string;
  sourceName: string;
  sourceUrl: string;
  topic: Topic;
  publishedAt: string;
  summary?: string;
  videoId?: string;
};

export type WeatherNow = {
  temperatureF: number;
  weatherCode: number;
  label: string;
  city: string;
};

export type Profile = {
  id: string;
  city: string | null;
  region: string | null;
  country: string | null;
  lat: number | null;
  lon: number | null;
  locationMode: LocationMode;
  topics: Topic[];
  sources: string[];
  favorites: string[];
  theme: ThemeName;
  loop: boolean;
  alerts: boolean;
  createdAt: string;
  updatedAt: string;
};

export type FeedResponse = {
  channel: string;
  videos: Story[];
  articles: Story[];
  breaking: Story | null;
  weather: WeatherNow | null;
  warnings: string[];
  generatedAt: string;
  location: { city: string | null; region: string | null; country: string | null } | null;
};
