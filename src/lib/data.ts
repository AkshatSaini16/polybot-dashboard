import type { Portfolio, Trade, Analytics, Meta } from "./types";

const BASE = "/data";

async function fetchJson<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}/${path}`, { cache: "no-store" });
  if (!res.ok) throw new Error(`Failed to fetch ${path}`);
  return res.json();
}

export async function getPortfolio(): Promise<Portfolio> {
  return fetchJson<Portfolio>("portfolio.json");
}

export async function getTrades(): Promise<{ trades: Trade[] }> {
  return fetchJson<{ trades: Trade[] }>("trades.json");
}

export async function getAnalytics(): Promise<Analytics> {
  return fetchJson<Analytics>("analytics.json");
}

export async function getMeta(): Promise<Meta> {
  return fetchJson<Meta>("meta.json");
}
