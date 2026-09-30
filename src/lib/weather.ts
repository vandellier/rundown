import { USER_AGENT } from "./http";
import type { WeatherNow } from "./types";

const LABELS: Record<number, string> = {
  0: "Clear",
  1: "Mostly clear",
  2: "Partly cloudy",
  3: "Overcast",
  45: "Fog",
  48: "Fog",
  51: "Drizzle",
  53: "Drizzle",
  55: "Drizzle",
  61: "Rain",
  63: "Rain",
  65: "Heavy rain",
  71: "Snow",
  73: "Snow",
  75: "Heavy snow",
  80: "Showers",
  81: "Showers",
  82: "Heavy showers",
  95: "Thunderstorm",
  96: "Thunderstorm",
  99: "Thunderstorm",
};

type CacheEntry = { at: number; weather: WeatherNow };
const cache = new Map<string, CacheEntry>();
const TTL = 15 * 60 * 1000;

export function weatherLabel(code: number): string {
  return LABELS[code] ?? "Weather";
}

export async function currentWeather(
  lat: number,
  lon: number,
  city: string,
): Promise<WeatherNow | null> {
  const key = `${lat.toFixed(2)},${lon.toFixed(2)}`;
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < TTL) return { ...hit.weather, city };
  const url = new URL("https://api.open-meteo.com/v1/forecast");
  url.searchParams.set("latitude", String(lat));
  url.searchParams.set("longitude", String(lon));
  url.searchParams.set("current", "temperature_2m,weather_code");
  url.searchParams.set("temperature_unit", "fahrenheit");
  try {
    const response = await fetch(url, {
      headers: { "User-Agent": USER_AGENT, Accept: "application/json" },
      signal: AbortSignal.timeout(6000),
      cache: "no-store",
    });
    if (!response.ok) return hit?.weather ?? null;
    const body = (await response.json()) as {
      current?: { temperature_2m?: number; weather_code?: number };
    };
    const temperature = body.current?.temperature_2m;
    const code = body.current?.weather_code;
    if (typeof temperature !== "number" || typeof code !== "number") return hit?.weather ?? null;
    const weather: WeatherNow = {
      temperatureF: Math.round(temperature),
      weatherCode: code,
      label: weatherLabel(code),
      city,
    };
    cache.set(key, { at: Date.now(), weather });
    return weather;
  } catch {
    return hit?.weather ?? null;
  }
}
