import { USER_AGENT } from "./http";

export type Place = {
  city: string;
  region: string | null;
  country: string | null;
  lat: number;
  lon: number;
  label: string;
};

type SearchCache = { at: number; places: Place[] };
const searchCache = new Map<string, SearchCache>();
const reverseCache = new Map<string, { at: number; place: Place }>();

export async function searchCities(query: string): Promise<Place[]> {
  const name = query.trim().slice(0, 80);
  if (name.length < 2) return [];
  const key = name.toLowerCase();
  const hit = searchCache.get(key);
  if (hit && Date.now() - hit.at < 60 * 60 * 1000) return hit.places;
  const url = new URL("https://geocoding-api.open-meteo.com/v1/search");
  url.searchParams.set("name", name);
  url.searchParams.set("count", "6");
  url.searchParams.set("language", "en");
  url.searchParams.set("format", "json");
  const response = await fetch(url, {
    headers: { "User-Agent": USER_AGENT, Accept: "application/json" },
    signal: AbortSignal.timeout(6000),
    cache: "no-store",
  });
  if (!response.ok) return [];
  const body = (await response.json()) as {
    results?: Array<{
      name?: string;
      admin1?: string;
      country?: string;
      latitude?: number;
      longitude?: number;
    }>;
  };
  const places = (body.results ?? [])
    .filter((row) => row.name && typeof row.latitude === "number" && typeof row.longitude === "number")
    .map((row) => ({
      city: row.name as string,
      region: row.admin1 ?? null,
      country: row.country ?? null,
      lat: row.latitude as number,
      lon: row.longitude as number,
      label: [row.name, row.admin1, row.country].filter(Boolean).join(", "),
    }));
  searchCache.set(key, { at: Date.now(), places });
  return places;
}

export async function reverseGeocode(lat: number, lon: number): Promise<Place | null> {
  if (lat < -90 || lat > 90 || lon < -180 || lon > 180) return null;
  const key = `${lat.toFixed(2)},${lon.toFixed(2)}`;
  const hit = reverseCache.get(key);
  if (hit && Date.now() - hit.at < 24 * 60 * 60 * 1000) return hit.place;
  const url = new URL("https://api.bigdatacloud.net/data/reverse-geocode-client");
  url.searchParams.set("latitude", String(lat));
  url.searchParams.set("longitude", String(lon));
  url.searchParams.set("localityLanguage", "en");
  const response = await fetch(url, {
    headers: { "User-Agent": USER_AGENT, Accept: "application/json" },
    signal: AbortSignal.timeout(6000),
    cache: "no-store",
  });
  if (!response.ok) return null;
  const body = (await response.json()) as {
    city?: string;
    locality?: string;
    principalSubdivision?: string;
    countryName?: string;
  };
  const city = body.city || body.locality;
  if (!city) return null;
  const place: Place = {
    city,
    region: body.principalSubdivision ?? null,
    country: body.countryName ?? null,
    lat,
    lon,
    label: [city, body.principalSubdivision, body.countryName].filter(Boolean).join(", "),
  };
  reverseCache.set(key, { at: Date.now(), place });
  return place;
}
