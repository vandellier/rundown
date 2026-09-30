import { getChannel } from "./channels";
import { dedupeStories } from "./dedupe";
import { fetchSourceStories } from "./rss";
import { feedUrlFor, SOURCES, type Source } from "./sources";
import type { FeedResponse, Profile, Story, Topic } from "./types";
import { currentWeather } from "./weather";

const CACHE_TTL = 5 * 60 * 1000;
const cache = new Map<string, { at: number; stories: Story[] }>();

const WIRE_SOURCES = new Set(["reuters", "ap", "abc-news", "bbc-video", "bbc-news"]);
const BREAKING_TITLE = /\bbreaking\b|\bjust in\b|\bweather alert\b/i;

function topicFor(source: Source, requested: Topic[]): Topic {
  return source.topics.find((topic) => requested.includes(topic)) ?? source.topics[0];
}

async function loadSource(source: Source, city: string | null, topic: Topic): Promise<Story[]> {
  const url = feedUrlFor(source, city);
  if (!url) return [];
  const hit = cache.get(url);
  if (hit && Date.now() - hit.at < CACHE_TTL) {
    return hit.stories.map((story) => ({ ...story, topic }));
  }
  try {
    const stories = await fetchSourceStories(source, url, topic);
    cache.set(url, { at: Date.now(), stories });
    return stories;
  } catch (error) {
    if (hit) return hit.stories.map((story) => ({ ...story, topic }));
    const message = error instanceof Error ? error.message : "unavailable";
    throw new Error(`${source.name}: ${message}`);
  }
}

async function gather(sources: Source[], city: string | null, topics: Topic[], budgetMs = 8000) {
  const stories: Story[] = [];
  const warnings: string[] = [];
  const queue = [...sources];
  let running = 0;
  let closed = false;

  await new Promise<void>((resolve) => {
    const timer = setTimeout(() => {
      if (queue.length > 0) {
        warnings.push("Some sources were still responding, so this rotation used what had already arrived.");
      }
      queue.length = 0;
      if (!closed) {
        closed = true;
        resolve();
      }
    }, budgetMs);
    const finish = () => {
      if (closed) return;
      closed = true;
      clearTimeout(timer);
      resolve();
    };

    const pump = () => {
      if (closed) return;
      while (running < 8 && queue.length > 0) {
        const source = queue.shift();
        if (!source) break;
        running += 1;
        loadSource(source, city, topicFor(source, topics))
          .then((items) => {
            if (!closed) stories.push(...items);
          })
          .catch((error: unknown) => {
            if (!closed) {
              warnings.push(error instanceof Error ? error.message : `${source.name} is unavailable`);
            }
          })
          .finally(() => {
            running -= 1;
            if (closed) return;
            if (queue.length === 0 && running === 0) finish();
            else pump();
          });
      }
      if (!closed && queue.length === 0 && running === 0) finish();
    };
    pump();
  });

  return { stories, warnings };
}

function pickBreaking(stories: Story[]): Story | null {
  const now = Date.now();
  const fresh = stories.filter((story) => now - new Date(story.publishedAt).getTime() < 1000 * 60 * 120);
  const flagged = fresh.find((story) => BREAKING_TITLE.test(story.title));
  if (flagged) return flagged;
  return (
    fresh.find((story) => {
      const age = now - new Date(story.publishedAt).getTime();
      return age < 1000 * 60 * 20 && WIRE_SOURCES.has(story.sourceId);
    }) ?? null
  );
}

export async function buildFeed(profile: Profile, slug: string): Promise<FeedResponse | { error: string }> {
  const channel = getChannel(slug);
  if (!channel) return { error: "Unknown channel." };
  const topics: Topic[] = channel.topics === "profile" ? profile.topics : channel.topics;
  const allowed = new Set(channel.topics === "profile" ? profile.sources : SOURCES.map((source) => source.id));
  const selected = SOURCES.filter(
    (source) => allowed.has(source.id) && source.topics.some((topic) => topics.includes(topic)),
  );
  const warnings: string[] = [];
  if ((topics.includes("local") || topics.includes("weather")) && !profile.city) {
    warnings.push("Pick a city to fill local headlines and the local forecast.");
  }

  const gathered = await gather(selected, profile.city, topics);
  warnings.push(...gathered.warnings);
  const stories = dedupeStories(gathered.stories);
  const videos = stories.filter((story) => story.kind === "video").slice(0, 12);
  const articles = stories.filter((story) => story.kind === "article").slice(0, 18);
  const weather =
    profile.lat !== null && profile.lon !== null && profile.city
      ? await currentWeather(profile.lat, profile.lon, profile.city)
      : null;

  return {
    channel: channel.slug,
    videos,
    articles,
    breaking: pickBreaking(stories),
    weather,
    warnings: warnings.slice(0, 6),
    generatedAt: new Date().toISOString(),
    location: profile.city
      ? { city: profile.city, region: profile.region, country: profile.country }
      : null,
  };
}

export async function buildTicker(profile: Profile): Promise<{
  items: Story[];
  breaking: Story | null;
  weather: FeedResponse["weather"];
  location: FeedResponse["location"];
}> {
  const feed = await buildFeed(
    {
      ...profile,
      topics: profile.topics.length ? profile.topics : ["tech", "cybersecurity", "politics", "international"],
    },
    "mine",
  );
  if ("error" in feed) return { items: [], breaking: null, weather: null, location: null };
  return {
    items: dedupeStories([...feed.videos, ...feed.articles]).slice(0, 18),
    breaking: feed.breaking,
    weather: feed.weather,
    location: feed.location,
  };
}
