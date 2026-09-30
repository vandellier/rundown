const LIVE_TITLE =
  /(\b24\s*\/\s*7\b|\blivestream\b|\blive stream\b|^[\s🔴]*live\s*[:|-])/i;

export function isVideoId(value: string | undefined | null): value is string {
  return !!value && /^[A-Za-z0-9_-]{11}$/.test(value);
}

export function isYouTubeShort(url: string): boolean {
  return /\/shorts\//i.test(url);
}

export function isLiveTitle(title: string): boolean {
  return LIVE_TITLE.test(title.trim());
}

export function isBlockedBroadcast(value: string | undefined | null): boolean {
  const state = value?.trim().toLowerCase();
  return state === "live" || state === "upcoming";
}
