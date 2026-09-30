import { cookies } from "next/headers";
import { getDb } from "./db";
import { CHANNEL_SLUGS } from "./channels";
import { DEFAULT_SOURCE_IDS, SOURCE_IDS } from "./sources";
import { TOPICS, type Profile, type Topic } from "./types";
import { sanitizeProfilePatch, type ProfilePatch } from "./validate";

const ID_COOKIE = "hs_pid";
const BLOB_COOKIE = "hs_blob";
const YEAR = 60 * 60 * 24 * 365;

type ProfileRow = {
  id: string;
  city: string | null;
  region: string | null;
  country: string | null;
  lat: number | null;
  lon: number | null;
  location_mode: string;
  topics: string;
  sources: string;
  favorites: string;
  theme: string;
  loop_playlist: number;
  alerts: number;
  created_at: string;
  updated_at: string;
};

function cookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: YEAR,
  };
}

export function defaultProfile(id: string): Profile {
  const now = new Date().toISOString();
  return {
    id,
    city: null,
    region: null,
    country: null,
    lat: null,
    lon: null,
    locationMode: "geo",
    topics: [...TOPICS],
    sources: [...DEFAULT_SOURCE_IDS],
    favorites: ["mine", "scitech", "cyber", "world"],
    theme: "dark",
    loop: true,
    alerts: false,
    createdAt: now,
    updatedAt: now,
  };
}

function parseJson<T>(value: string, fallback: T): T {
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

function fromRow(row: ProfileRow): Profile {
  const base = defaultProfile(row.id);
  return {
    ...base,
    city: row.city,
    region: row.region,
    country: row.country,
    lat: row.lat,
    lon: row.lon,
    locationMode: row.location_mode === "manual" ? "manual" : "geo",
    topics: parseJson<Topic[]>(row.topics, base.topics).filter((topic) =>
      (TOPICS as readonly string[]).includes(topic),
    ),
    sources: parseJson<string[]>(row.sources, base.sources).filter((id) => SOURCE_IDS.includes(id)),
    favorites: parseJson<string[]>(row.favorites, base.favorites).filter((id) =>
      CHANNEL_SLUGS.includes(id),
    ),
    theme: row.theme === "light" ? "light" : "dark",
    loop: row.loop_playlist !== 0,
    alerts: row.alerts === 1,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function readRow(id: string): Profile | null {
  const row = getDb().prepare("SELECT * FROM profiles WHERE id = ?").get(id) as ProfileRow | undefined;
  return row ? fromRow(row) : null;
}

function writeRow(profile: Profile): void {
  getDb()
    .prepare(
      `INSERT INTO profiles (
        id, city, region, country, lat, lon, location_mode, topics, sources, favorites,
        theme, loop_playlist, alerts, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        city = excluded.city,
        region = excluded.region,
        country = excluded.country,
        lat = excluded.lat,
        lon = excluded.lon,
        location_mode = excluded.location_mode,
        topics = excluded.topics,
        sources = excluded.sources,
        favorites = excluded.favorites,
        theme = excluded.theme,
        loop_playlist = excluded.loop_playlist,
        alerts = excluded.alerts,
        updated_at = excluded.updated_at`,
    )
    .run(
      profile.id,
      profile.city,
      profile.region,
      profile.country,
      profile.lat,
      profile.lon,
      profile.locationMode,
      JSON.stringify(profile.topics),
      JSON.stringify(profile.sources),
      JSON.stringify(profile.favorites),
      profile.theme,
      profile.loop ? 1 : 0,
      profile.alerts ? 1 : 0,
      profile.createdAt,
      profile.updatedAt,
    );
}

function encodeBlob(profile: Profile): string | null {
  const encoded = Buffer.from(JSON.stringify(profile), "utf8").toString("base64url");
  return encoded.length < 3800 ? encoded : null;
}

function decodeBlob(value: string | undefined): Profile | null {
  if (!value) return null;
  try {
    const parsed = JSON.parse(Buffer.from(value, "base64url").toString("utf8")) as Profile;
    if (!parsed || typeof parsed.id !== "string") return null;
    return { ...defaultProfile(parsed.id), ...parsed, id: parsed.id };
  } catch {
    return null;
  }
}

async function remember(profile: Profile): Promise<void> {
  const jar = await cookies();
  const options = cookieOptions();
  jar.set(ID_COOKIE, profile.id, options);
  const blob = encodeBlob(profile);
  if (blob) jar.set(BLOB_COOKIE, blob, options);
}

export async function ensureProfile(): Promise<Profile> {
  const jar = await cookies();
  const id = jar.get(ID_COOKIE)?.value;
  const blob = decodeBlob(jar.get(BLOB_COOKIE)?.value);

  if (id && /^[0-9a-f-]{36}$/i.test(id)) {
    const row = readRow(id);
    if (row && blob && blob.updatedAt > row.updatedAt) {
      const merged = { ...row, ...blob, id };
      writeRow(merged);
      return merged;
    }
    if (row) return row;
    if (blob) {
      const restored = { ...defaultProfile(id), ...blob, id };
      writeRow(restored);
      await remember(restored);
      return restored;
    }
  }

  const profile = blob
    ? { ...defaultProfile(blob.id), ...blob, id: blob.id || crypto.randomUUID() }
    : defaultProfile(crypto.randomUUID());
  writeRow(profile);
  await remember(profile);
  return profile;
}

export async function updateProfile(input: unknown): Promise<Profile | { error: string }> {
  const parsed = sanitizeProfilePatch(input, SOURCE_IDS, CHANNEL_SLUGS);
  if (!parsed.ok) return { error: parsed.error };
  const current = await ensureProfile();
  const patch: ProfilePatch = parsed.patch;
  const next: Profile = {
    ...current,
    ...patch,
    updatedAt: new Date().toISOString(),
  };
  if (next.topics.length === 0) next.topics = [...TOPICS];
  writeRow(next);
  await remember(next);
  return next;
}
