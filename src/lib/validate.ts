import type { LocationMode, Profile, ThemeName, Topic } from "./types";
import { TOPICS } from "./types";

export type ProfilePatch = Partial<
  Pick<
    Profile,
    | "city"
    | "region"
    | "country"
    | "lat"
    | "lon"
    | "locationMode"
    | "topics"
    | "sources"
    | "favorites"
    | "theme"
    | "loop"
    | "alerts"
  >
>;

const MODES = new Set<LocationMode>(["geo", "manual"]);
const THEMES = new Set<ThemeName>(["dark", "light"]);

function cleanString(value: unknown, max: number): string | null | undefined {
  if (value === null) return null;
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim().slice(0, max);
  return trimmed.length ? trimmed : null;
}

function cleanCoord(value: unknown, min: number, max: number): number | null | undefined {
  if (value === null) return null;
  if (typeof value !== "number" || !Number.isFinite(value)) return undefined;
  if (value < min || value > max) return undefined;
  return Math.round(value * 10000) / 10000;
}

export function sanitizeProfilePatch(
  input: unknown,
  knownSources: readonly string[],
  knownChannels: readonly string[],
): { ok: true; patch: ProfilePatch } | { ok: false; error: string } {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    return { ok: false, error: "Expected a JSON object." };
  }
  const body = input as Record<string, unknown>;
  const patch: ProfilePatch = {};
  const allowed = new Set([
    "city",
    "region",
    "country",
    "lat",
    "lon",
    "locationMode",
    "topics",
    "sources",
    "favorites",
    "theme",
    "loop",
    "alerts",
  ]);
  for (const key of Object.keys(body)) {
    if (!allowed.has(key)) return { ok: false, error: `Unknown field: ${key}` };
  }

  if ("city" in body) {
    const city = cleanString(body.city, 80);
    if (city === undefined) return { ok: false, error: "City must be text." };
    patch.city = city;
  }
  if ("region" in body) {
    const region = cleanString(body.region, 80);
    if (region === undefined) return { ok: false, error: "Region must be text." };
    patch.region = region;
  }
  if ("country" in body) {
    const country = cleanString(body.country, 80);
    if (country === undefined) return { ok: false, error: "Country must be text." };
    patch.country = country;
  }
  if ("lat" in body) {
    const lat = cleanCoord(body.lat, -90, 90);
    if (lat === undefined) return { ok: false, error: "Latitude is out of range." };
    patch.lat = lat;
  }
  if ("lon" in body) {
    const lon = cleanCoord(body.lon, -180, 180);
    if (lon === undefined) return { ok: false, error: "Longitude is out of range." };
    patch.lon = lon;
  }
  if ("locationMode" in body) {
    if (typeof body.locationMode !== "string" || !MODES.has(body.locationMode as LocationMode)) {
      return { ok: false, error: "Location mode must be geo or manual." };
    }
    patch.locationMode = body.locationMode as LocationMode;
  }
  if ("theme" in body) {
    if (typeof body.theme !== "string" || !THEMES.has(body.theme as ThemeName)) {
      return { ok: false, error: "Theme must be dark or light." };
    }
    patch.theme = body.theme as ThemeName;
  }
  if ("loop" in body) {
    if (typeof body.loop !== "boolean") return { ok: false, error: "Loop must be true or false." };
    patch.loop = body.loop;
  }
  if ("alerts" in body) {
    if (typeof body.alerts !== "boolean") return { ok: false, error: "Alerts must be true or false." };
    patch.alerts = body.alerts;
  }
  if ("topics" in body) {
    if (!Array.isArray(body.topics) || body.topics.some((topic) => typeof topic !== "string")) {
      return { ok: false, error: "Topics must be a list." };
    }
    const topics = [...new Set(body.topics)] as string[];
    if (topics.some((topic) => !(TOPICS as readonly string[]).includes(topic))) {
      return { ok: false, error: "Unknown topic." };
    }
    patch.topics = topics as Topic[];
  }
  if ("sources" in body) {
    if (!Array.isArray(body.sources) || body.sources.some((id) => typeof id !== "string")) {
      return { ok: false, error: "Sources must be a list." };
    }
    const sources = [...new Set(body.sources as string[])];
    if (sources.some((id) => !knownSources.includes(id))) {
      return { ok: false, error: "Unknown source." };
    }
    patch.sources = sources;
  }
  if ("favorites" in body) {
    if (!Array.isArray(body.favorites) || body.favorites.some((id) => typeof id !== "string")) {
      return { ok: false, error: "Favorites must be a list." };
    }
    const favorites = [...new Set(body.favorites as string[])];
    if (favorites.some((id) => !knownChannels.includes(id))) {
      return { ok: false, error: "Unknown channel." };
    }
    patch.favorites = favorites;
  }
  if (Object.keys(patch).length === 0) return { ok: false, error: "Nothing to update." };
  return { ok: true, patch };
}
