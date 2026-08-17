"use client";

import { useEffect, useState } from "react";

export interface ConnRow {
  platform: string;
  configured: boolean;
  connected: boolean;
  handle: string | null;
}

/** Scheduler platform labels → connectable platform keys. Instagram has no
 *  connector yet, so it maps to null (always demo mode). */
export const PLATFORM_KEYS: Record<string, string | null> = {
  X: "x",
  LinkedIn: "linkedin",
  YouTube: "youtube",
  TikTok: "tiktok",
  Instagram: null,
};

/** One fetch of the creator's platform-connection status per mount — powers
 *  the "will publish in demo mode" hints at the moment of scheduling. */
export function useConnections(): ConnRow[] | null {
  const [rows, setRows] = useState<ConnRow[] | null>(null);
  useEffect(() => {
    let alive = true;
    fetch("/api/connect", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (alive && d?.platforms) setRows(d.platforms);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);
  return rows;
}

/** True when scheduling to this platform label would really deliver. */
export function isConnected(rows: ConnRow[] | null, platformLabel: string): boolean {
  const key = PLATFORM_KEYS[platformLabel];
  if (!key || !rows) return false;
  return rows.some((r) => r.platform === key && r.connected);
}

/** Next 09:00 local, as a datetime-local input value — the sane default slot. */
export function nextMorning(): string {
  const d = new Date();
  if (d.getHours() >= 9) d.setDate(d.getDate() + 1);
  d.setHours(9, 0, 0, 0);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
}

const LAST_PLATFORM_KEY = "vf_last_platform";

export function lastPlatform(fallback: string): string {
  if (typeof window === "undefined") return fallback;
  return localStorage.getItem(LAST_PLATFORM_KEY) || fallback;
}

export function rememberPlatform(p: string): void {
  try {
    localStorage.setItem(LAST_PLATFORM_KEY, p);
  } catch {
    /* private mode */
  }
}
