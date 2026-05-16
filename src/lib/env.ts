// ---- Server-side ----

let _serverEnv: {
  AMAP_WEB_KEY: string;
  AUTH_SECRET: string;
  DATABASE_URL: string;
} | null = null;

/** Validate and return server-side env vars. Cached after first call. */
export function getServerEnv() {
  if (_serverEnv) return _serverEnv;

  const missing: string[] = [];
  const AMAP_WEB_KEY = process.env.AMAP_WEB_KEY;
  const AUTH_SECRET = process.env.AUTH_SECRET;
  const DATABASE_URL = process.env.DATABASE_URL;

  if (!AMAP_WEB_KEY) missing.push("AMAP_WEB_KEY");
  if (!AUTH_SECRET) missing.push("AUTH_SECRET");
  if (!DATABASE_URL) missing.push("DATABASE_URL");

  if (missing.length > 0) {
    throw new Error(`Missing server environment variables: ${missing.join(", ")}`);
  }

  _serverEnv = { AMAP_WEB_KEY: AMAP_WEB_KEY!, AUTH_SECRET: AUTH_SECRET!, DATABASE_URL: DATABASE_URL! };
  return _serverEnv;
}

/** Return the AMap Web Service key, or null if not configured. */
export function getAmapWebKey(): string | null {
  const key = process.env.AMAP_WEB_KEY;
  return key || null;
}

// ---- Client-side ----

export interface ClientAmapConfig {
  key: string;
  secret: string;
}

/** Return client-side AMap config, or null if env vars are missing. */
export function getClientAmapConfig(): ClientAmapConfig | null {
  const key = process.env.NEXT_PUBLIC_AMAP_KEY;
  const secret = process.env.NEXT_PUBLIC_AMAP_SECRET;
  if (!key || !secret) return null;
  return { key, secret };
}
