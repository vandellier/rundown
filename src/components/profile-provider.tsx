"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import type { Profile, ThemeName } from "@/lib/types";

type ProfileContextValue = {
  profile: Profile | null;
  ready: boolean;
  save: (patch: Partial<Profile>) => Promise<Profile>;
  setTheme: (theme: ThemeName) => void;
};

const ProfileContext = createContext<ProfileContextValue | null>(null);

export function ProfileProvider({ children }: { children: React.ReactNode }) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancel = false;
    fetch("/api/profile", { cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) throw new Error("profile");
        return (await response.json()) as Profile;
      })
      .then((next) => {
        if (!cancel) setProfile(next);
      })
      .catch(() => undefined)
      .finally(() => {
        if (!cancel) setReady(true);
      });
    return () => {
      cancel = true;
    };
  }, []);

  useEffect(() => {
    if (!profile) return;
    if (!localStorage.getItem("hs-theme")) {
      document.documentElement.dataset.theme = profile.theme;
      localStorage.setItem("hs-theme", profile.theme);
    }
  }, [profile]);

  const save = useCallback(async (patch: Partial<Profile>) => {
    const response = await fetch("/api/profile", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    const body = (await response.json()) as Profile & { error?: string };
    if (!response.ok) throw new Error(body.error || "Could not save preferences.");
    setProfile(body);
    return body;
  }, []);

  const setTheme = useCallback(
    (theme: ThemeName) => {
      document.documentElement.dataset.theme = theme;
      localStorage.setItem("hs-theme", theme);
      setProfile((current) => (current ? { ...current, theme } : current));
      void save({ theme });
    },
    [save],
  );

  return (
    <ProfileContext.Provider value={{ profile, ready, save, setTheme }}>{children}</ProfileContext.Provider>
  );
}

export function useProfile() {
  const value = useContext(ProfileContext);
  if (!value) throw new Error("useProfile must be used inside ProfileProvider");
  return value;
}
