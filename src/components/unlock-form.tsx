"use client";

import { useState } from "react";
import { Logo } from "./logo";

export function UnlockForm({ nextPath }: { nextPath: string }) {
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setPending(true);
    setError("");
    try {
      const response = await fetch("/api/access", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });
      const body = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(body.error || "That code does not match.");
      window.location.assign(nextPath.startsWith("/") ? nextPath : "/watch/mine");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not unlock.");
      setPending(false);
    }
  }

  return (
    <main className="grid min-h-dvh place-items-center p-6">
      <form onSubmit={submit} className="w-full max-w-md rounded-3xl border border-line bg-elev p-8 shadow-[var(--shadow)]">
        <Logo />
        <h1 className="mt-4 font-serif text-4xl">Friends only</h1>
        <p className="mt-2 text-sm leading-6 text-muted">
          This copy of Rundown is locked with an access code. It is a personal reader, not a public product.
        </p>
        <label className="mt-6 block text-sm">
          <span className="text-muted">Access code</span>
          <input
            type="password"
            autoComplete="current-password"
            value={code}
            onChange={(event) => setCode(event.target.value)}
            className="mt-1 w-full rounded-2xl border border-line bg-bg px-4 py-3"
          />
        </label>
        {error && <p className="mt-3 text-sm text-live">{error}</p>}
        <button
          type="submit"
          disabled={pending || !code}
          className="mt-5 w-full rounded-full bg-gold py-3 text-sm font-semibold text-[#1a1206] disabled:opacity-50"
        >
          {pending ? "Checking…" : "Unlock"}
        </button>
      </form>
    </main>
  );
}
