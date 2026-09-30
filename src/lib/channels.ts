import type { Topic } from "./types";

export type Channel = {
  slug: string;
  name: string;
  kicker: string;
  description: string;
  topics: Topic[] | "profile";
  accent: string;
};

export const CHANNELS: Channel[] = [
  {
    slug: "mine",
    name: "My Headlines",
    kicker: "Personal",
    description: "The topics and sources you picked, newest first, playing straight through.",
    topics: "profile",
    accent: "#e4b15a",
  },
  {
    slug: "scitech",
    name: "SciTech",
    kicker: "Technology",
    description: "Technology, science, and the tools reshaping how the world works.",
    topics: ["tech"],
    accent: "#8eb7ff",
  },
  {
    slug: "cyber",
    name: "Cybersecurity",
    kicker: "Security",
    description: "Breaches, patches, and the people who chase them. Mostly written reporting.",
    topics: ["cybersecurity"],
    accent: "#5ee0b5",
  },
  {
    slug: "politics",
    name: "Politics",
    kicker: "Power",
    description: "Campaigns, policy, and the institutions making the day's decisions.",
    topics: ["politics"],
    accent: "#ff8b7b",
  },
  {
    slug: "weather",
    name: "Weather",
    kicker: "Sky",
    description: "Forecast video and weather headlines for the city saved in your profile.",
    topics: ["weather"],
    accent: "#8fd4ff",
  },
  {
    slug: "entertainment",
    name: "Entertainment",
    kicker: "Culture",
    description: "Film, television, and the business around them.",
    topics: ["entertainment"],
    accent: "#e7a0ff",
  },
  {
    slug: "world",
    name: "International",
    kicker: "World",
    description: "Reporting from outside a single country's news cycle.",
    topics: ["international"],
    accent: "#f0d38a",
  },
  {
    slug: "local",
    name: "Local",
    kicker: "Nearby",
    description: "Headlines for the city you detected or picked. Links go to the original publishers.",
    topics: ["local"],
    accent: "#ffc17a",
  },
];

const TOPIC_CHANNEL: Record<Topic, string> = {
  tech: "scitech",
  cybersecurity: "cyber",
  politics: "politics",
  weather: "weather",
  entertainment: "entertainment",
  international: "world",
  local: "local",
};

export function getChannel(slug: string): Channel | undefined {
  return CHANNELS.find((channel) => channel.slug === slug);
}

export function channelForTopic(topic: Topic): string {
  return TOPIC_CHANNEL[topic];
}

export const CHANNEL_SLUGS = CHANNELS.map((channel) => channel.slug);
