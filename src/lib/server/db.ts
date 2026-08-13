import { DatabaseSync } from "node:sqlite";
import path from "node:path";
import fs from "node:fs";
import type { Project, Asset, Notification, BrandVoice } from "@/lib/data";
import {
  defaultProjects,
  defaultAssets,
  defaultNotifications,
  DEFAULT_VOICE,
} from "@/lib/data";
import { DEFAULT_PRICING, type PricingConfig } from "./pricing";

/**
 * Durable backend store, backed by SQLite via Node's built-in `node:sqlite`
 * module (zero external dependencies). The database file lives in `./data`.
 *
 * A single process-wide connection is reused across requests. This works for a
 * self-hosted / long-lived Node server (`next start`). On ephemeral serverless
 * platforms the file is per-instance; swap the connection for a hosted Postgres
 * without changing any of the query helpers below.
 */

let db: DatabaseSync | null = null;

function getDb(): DatabaseSync {
  if (db) return db;

  const dataDir = path.join(process.cwd(), "data");
  fs.mkdirSync(dataDir, { recursive: true });
  const conn = new DatabaseSync(path.join(dataDir, "echoforge.db"));

  conn.exec("PRAGMA journal_mode = WAL");
  conn.exec("PRAGMA foreign_keys = ON");
  conn.exec(`
    CREATE TABLE IF NOT EXISTS users (
      email         TEXT PRIMARY KEY,
      name          TEXT NOT NULL,
      password_hash TEXT NOT NULL,
      plan          TEXT NOT NULL,
      created_at    TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS projects (
      id           TEXT PRIMARY KEY,
      user_email   TEXT NOT NULL REFERENCES users(email) ON DELETE CASCADE,
      title        TEXT NOT NULL,
      status       TEXT NOT NULL,
      progress     INTEGER NOT NULL,
      assets_ready INTEGER NOT NULL,
      assets_total INTEGER NOT NULL,
      eta          TEXT NOT NULL,
      created_at   TEXT NOT NULL,
      file_name    TEXT,
      file_size    TEXT,
      transcript   TEXT,
      storage_path TEXT,
      sort         INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS assets (
      id         TEXT PRIMARY KEY,
      user_email TEXT NOT NULL REFERENCES users(email) ON DELETE CASCADE,
      project_id TEXT NOT NULL,
      name       TEXT NOT NULL,
      type       TEXT NOT NULL,
      views      TEXT NOT NULL,
      status     TEXT NOT NULL,
      liked      INTEGER NOT NULL,
      content    TEXT,
      sort       INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS notifications (
      id         TEXT PRIMARY KEY,
      user_email TEXT NOT NULL REFERENCES users(email) ON DELETE CASCADE,
      title      TEXT NOT NULL,
      message    TEXT NOT NULL,
      time       TEXT NOT NULL,
      read       INTEGER NOT NULL,
      type       TEXT NOT NULL,
      sort       INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS pricing_config (
      key   TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS integrations (
      name   TEXT PRIMARY KEY,
      config TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS reset_tokens (
      token      TEXT PRIMARY KEY,
      user_email TEXT NOT NULL,
      expires_at INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS analytics_events (
      id    INTEGER PRIMARY KEY AUTOINCREMENT,
      event TEXT NOT NULL,
      path  TEXT,
      ts    INTEGER NOT NULL,
      meta  TEXT
    );
    CREATE TABLE IF NOT EXISTS brand_voice (
      user_email TEXT PRIMARY KEY REFERENCES users(email) ON DELETE CASCADE,
      config     TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS ideas (
      id         TEXT PRIMARY KEY,
      user_email TEXT NOT NULL REFERENCES users(email) ON DELETE CASCADE,
      title      TEXT NOT NULL,
      notes      TEXT,
      script     TEXT,
      score      INTEGER NOT NULL,
      status     TEXT NOT NULL,
      created_at TEXT NOT NULL,
      sort       INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS subscribers (
      id          TEXT PRIMARY KEY,
      owner_email TEXT NOT NULL REFERENCES users(email) ON DELETE CASCADE,
      email       TEXT NOT NULL,
      source      TEXT,
      created_at  TEXT NOT NULL,
      UNIQUE(owner_email, email)
    );
    CREATE TABLE IF NOT EXISTS creator_pages (
      user_email   TEXT PRIMARY KEY REFERENCES users(email) ON DELETE CASCADE,
      slug         TEXT NOT NULL UNIQUE,
      display_name TEXT NOT NULL,
      bio          TEXT,
      links        TEXT,
      rates        TEXT,
      enabled      INTEGER NOT NULL DEFAULT 1
    );
    CREATE TABLE IF NOT EXISTS platform_accounts (
      user_email    TEXT NOT NULL REFERENCES users(email) ON DELETE CASCADE,
      platform      TEXT NOT NULL,
      access_token  TEXT NOT NULL,
      refresh_token TEXT,
      expires_at    INTEGER,
      external_id   TEXT,
      handle        TEXT,
      created_at    TEXT NOT NULL,
      PRIMARY KEY (user_email, platform)
    );
    CREATE TABLE IF NOT EXISTS post_metrics (
      post_id    TEXT PRIMARY KEY,
      user_email TEXT NOT NULL REFERENCES users(email) ON DELETE CASCADE,
      views      INTEGER NOT NULL DEFAULT 0,
      likes      INTEGER NOT NULL DEFAULT 0,
      comments   INTEGER NOT NULL DEFAULT 0,
      source     TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS revenue_entries (
      id         TEXT PRIMARY KEY,
      user_email TEXT NOT NULL REFERENCES users(email) ON DELETE CASCADE,
      month      TEXT NOT NULL,
      stream     TEXT NOT NULL,
      amount     REAL NOT NULL,
      note       TEXT,
      created_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS deals (
      id         TEXT PRIMARY KEY,
      user_email TEXT NOT NULL REFERENCES users(email) ON DELETE CASCADE,
      brand      TEXT NOT NULL,
      contact    TEXT,
      value      REAL NOT NULL DEFAULT 0,
      stage      TEXT NOT NULL,
      platform   TEXT,
      notes      TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS pending_plans (
      email      TEXT PRIMARY KEY,
      plan       TEXT NOT NULL,
      created_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS provenance (
      asset_id  TEXT PRIMARY KEY,
      manifest  TEXT NOT NULL,
      signature TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS app_flags (
      key   TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS audit_log (
      id     INTEGER PRIMARY KEY AUTOINCREMENT,
      actor  TEXT NOT NULL,
      action TEXT NOT NULL,
      detail TEXT,
      ts     INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS scheduled_posts (
      id           TEXT PRIMARY KEY,
      user_email   TEXT NOT NULL REFERENCES users(email) ON DELETE CASCADE,
      asset_id     TEXT NOT NULL,
      asset_name   TEXT NOT NULL,
      platform     TEXT NOT NULL,
      scheduled_at TEXT NOT NULL,
      status       TEXT NOT NULL,
      created_at   TEXT NOT NULL,
      sort         INTEGER NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_projects_user ON projects(user_email);
    CREATE INDEX IF NOT EXISTS idx_assets_user ON assets(user_email);
    CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_email);
  `);

  // Additive migrations for databases created before these columns existed.
  for (const stmt of [
    "ALTER TABLE projects ADD COLUMN transcript TEXT",
    "ALTER TABLE projects ADD COLUMN storage_path TEXT",
    "ALTER TABLE assets ADD COLUMN content TEXT",
    "ALTER TABLE assets ADD COLUMN evergreen INTEGER NOT NULL DEFAULT 0",
    "ALTER TABLE users ADD COLUMN referral_code TEXT",
    "ALTER TABLE users ADD COLUMN referred_by TEXT",
  ]) {
    try {
      conn.exec(stmt);
    } catch {
      /* column already exists */
    }
  }

  db = conn;
  return conn;
}

// --- Users ---

export interface DbUser {
  email: string;
  name: string;
  passwordHash: string;
  plan: string;
  createdAt: string;
}

export function findUser(email: string): DbUser | null {
  const row = getDb()
    .prepare("SELECT * FROM users WHERE email = ?")
    .get(email.toLowerCase()) as Record<string, string> | undefined;
  if (!row) return null;
  return {
    email: row.email,
    name: row.name,
    passwordHash: row.password_hash,
    plan: row.plan,
    createdAt: row.created_at,
  };
}

export function createUser(user: DbUser): void {
  getDb()
    .prepare(
      "INSERT INTO users (email, name, password_hash, plan, created_at) VALUES (?, ?, ?, ?, ?)"
    )
    .run(
      user.email.toLowerCase(),
      user.name,
      user.passwordHash,
      user.plan,
      user.createdAt
    );
}

// --- Ideas (content backlog: idea → script → generated assets) ---

export interface Idea {
  id: string;
  title: string;
  notes: string;
  script: string;
  score: number;
  status: "idea" | "scripted" | "generated";
  createdAt: string;
}

function mapIdea(row: Record<string, unknown>): Idea {
  return {
    id: row.id as string,
    title: row.title as string,
    notes: (row.notes as string) ?? "",
    script: (row.script as string) ?? "",
    score: row.score as number,
    status: row.status as Idea["status"],
    createdAt: row.created_at as string,
  };
}

export function listIdeas(email: string): Idea[] {
  return (
    getDb()
      .prepare("SELECT * FROM ideas WHERE user_email = ? ORDER BY sort DESC")
      .all(email.toLowerCase()) as Record<string, unknown>[]
  ).map(mapIdea);
}

export function getIdea(email: string, id: string): Idea | null {
  const row = getDb()
    .prepare("SELECT * FROM ideas WHERE id = ? AND user_email = ?")
    .get(id, email.toLowerCase()) as Record<string, unknown> | undefined;
  return row ? mapIdea(row) : null;
}

export function insertIdea(
  email: string,
  idea: Omit<Idea, "createdAt">
): Idea {
  const now = new Date().toISOString();
  getDb()
    .prepare(
      `INSERT INTO ideas (id, user_email, title, notes, script, score, status, created_at, sort)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .run(
      idea.id,
      email.toLowerCase(),
      idea.title,
      idea.notes || null,
      idea.script || null,
      idea.score,
      idea.status,
      now,
      Date.now()
    );
  return { ...idea, createdAt: now };
}

export function updateIdea(
  email: string,
  id: string,
  updates: Partial<Pick<Idea, "title" | "notes" | "script" | "status" | "score">>
): Idea | null {
  const cols: Record<string, string> = {
    title: "title",
    notes: "notes",
    script: "script",
    status: "status",
    score: "score",
  };
  const sets: string[] = [];
  const values: (string | number)[] = [];
  for (const [key, col] of Object.entries(cols)) {
    const v = updates[key as keyof typeof updates];
    if (v !== undefined) {
      sets.push(`${col} = ?`);
      values.push(v as string | number);
    }
  }
  if (sets.length > 0) {
    values.push(id, email.toLowerCase());
    getDb()
      .prepare(`UPDATE ideas SET ${sets.join(", ")} WHERE id = ? AND user_email = ?`)
      .run(...values);
  }
  return getIdea(email, id);
}

export function deleteIdea(email: string, id: string): void {
  getDb()
    .prepare("DELETE FROM ideas WHERE id = ? AND user_email = ?")
    .run(id, email.toLowerCase());
}

// --- Subscribers + creator pages (owned audience) ---

export interface Subscriber {
  id: string;
  email: string;
  source: string;
  createdAt: string;
}

export function listSubscribers(email: string): Subscriber[] {
  return getDb()
    .prepare(
      `SELECT id, email, source, created_at AS createdAt
       FROM subscribers WHERE owner_email = ? ORDER BY created_at DESC`
    )
    .all(email.toLowerCase()) as unknown as Subscriber[];
}

/** Returns true when the subscriber is new (INSERT OR IGNORE dedupes). */
export function addSubscriber(
  ownerEmail: string,
  subscriberEmail: string,
  source: string
): boolean {
  const res = getDb()
    .prepare(
      `INSERT OR IGNORE INTO subscribers (id, owner_email, email, source, created_at)
       VALUES (?, ?, ?, ?, ?)`
    )
    .run(
      `sub-${crypto.randomUUID()}`,
      ownerEmail.toLowerCase(),
      subscriberEmail.toLowerCase(),
      source,
      new Date().toISOString()
    );
  return Number(res.changes) > 0;
}

export interface CreatorPage {
  slug: string;
  displayName: string;
  bio: string;
  links: { label: string; url: string }[];
  rates: { platform: string; price: number }[];
  enabled: boolean;
}

function mapCreatorPage(row: Record<string, unknown>): CreatorPage {
  const parse = <T,>(v: unknown, fallback: T): T => {
    try {
      return v ? (JSON.parse(v as string) as T) : fallback;
    } catch {
      return fallback;
    }
  };
  return {
    slug: row.slug as string,
    displayName: row.display_name as string,
    bio: (row.bio as string) ?? "",
    links: parse(row.links, []),
    rates: parse(row.rates, []),
    enabled: Boolean(row.enabled),
  };
}

export function getCreatorPageByEmail(email: string): CreatorPage | null {
  const row = getDb()
    .prepare("SELECT * FROM creator_pages WHERE user_email = ?")
    .get(email.toLowerCase()) as Record<string, unknown> | undefined;
  return row ? mapCreatorPage(row) : null;
}

export function getCreatorPageOwner(slug: string): { email: string; page: CreatorPage } | null {
  const row = getDb()
    .prepare("SELECT * FROM creator_pages WHERE slug = ? AND enabled = 1")
    .get(slug.toLowerCase()) as Record<string, unknown> | undefined;
  return row ? { email: row.user_email as string, page: mapCreatorPage(row) } : null;
}

/** Returns false when the slug is already taken by another user. */
export function upsertCreatorPage(email: string, page: CreatorPage): boolean {
  const conn = getDb();
  const taken = conn
    .prepare("SELECT user_email FROM creator_pages WHERE slug = ?")
    .get(page.slug) as { user_email: string } | undefined;
  if (taken && taken.user_email !== email.toLowerCase()) return false;
  conn
    .prepare(
      `INSERT OR REPLACE INTO creator_pages (user_email, slug, display_name, bio, links, rates, enabled)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    )
    .run(
      email.toLowerCase(),
      page.slug,
      page.displayName,
      page.bio || null,
      JSON.stringify(page.links),
      JSON.stringify(page.rates),
      page.enabled ? 1 : 0
    );
  return true;
}

// --- Connected platform accounts (creator OAuth tokens) ---

export interface PlatformAccount {
  platform: string;
  accessToken: string;
  refreshToken: string | null;
  expiresAt: number | null;
  externalId: string | null;
  handle: string | null;
  createdAt: string;
}

export function getPlatformAccount(
  email: string,
  platform: string
): PlatformAccount | null {
  const row = getDb()
    .prepare(
      "SELECT * FROM platform_accounts WHERE user_email = ? AND platform = ?"
    )
    .get(email.toLowerCase(), platform) as Record<string, unknown> | undefined;
  if (!row) return null;
  return {
    platform: row.platform as string,
    accessToken: row.access_token as string,
    refreshToken: (row.refresh_token as string) ?? null,
    expiresAt: (row.expires_at as number) ?? null,
    externalId: (row.external_id as string) ?? null,
    handle: (row.handle as string) ?? null,
    createdAt: row.created_at as string,
  };
}

export function listPlatformAccounts(
  email: string
): { platform: string; handle: string | null; createdAt: string }[] {
  return getDb()
    .prepare(
      `SELECT platform, handle, created_at AS createdAt
       FROM platform_accounts WHERE user_email = ? ORDER BY platform`
    )
    .all(email.toLowerCase()) as unknown as {
    platform: string;
    handle: string | null;
    createdAt: string;
  }[];
}

export function upsertPlatformAccount(
  email: string,
  acct: Omit<PlatformAccount, "createdAt">
): void {
  getDb()
    .prepare(
      `INSERT OR REPLACE INTO platform_accounts
       (user_email, platform, access_token, refresh_token, expires_at, external_id, handle, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .run(
      email.toLowerCase(),
      acct.platform,
      acct.accessToken,
      acct.refreshToken,
      acct.expiresAt,
      acct.externalId,
      acct.handle,
      new Date().toISOString()
    );
}

export function deletePlatformAccount(email: string, platform: string): void {
  getDb()
    .prepare(
      "DELETE FROM platform_accounts WHERE user_email = ? AND platform = ?"
    )
    .run(email.toLowerCase(), platform);
}

// --- Post metrics (the performance flywheel's raw material) ---
// Written by manual results entry today and by platform-API ingestion later —
// both land in the same table, so everything downstream is source-agnostic.

export interface PostMetrics {
  postId: string;
  views: number;
  likes: number;
  comments: number;
  source: string;
  updatedAt: string;
}

export function upsertPostMetrics(
  email: string,
  postId: string,
  m: { views: number; likes: number; comments: number; source: string }
): void {
  getDb()
    .prepare(
      `INSERT OR REPLACE INTO post_metrics (post_id, user_email, views, likes, comments, source, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    )
    .run(
      postId,
      email.toLowerCase(),
      m.views,
      m.likes,
      m.comments,
      m.source,
      new Date().toISOString()
    );
}

export function listPostMetrics(email: string): PostMetrics[] {
  return getDb()
    .prepare(
      `SELECT post_id AS postId, views, likes, comments, source, updated_at AS updatedAt
       FROM post_metrics WHERE user_email = ?`
    )
    .all(email.toLowerCase()) as unknown as PostMetrics[];
}

export interface TopPerformer {
  assetId: string;
  assetName: string;
  platform: string;
  views: number;
  likes: number;
  comments: number;
}

/** Measured published posts ranked by views — the creator's proven winners. */
export function topPerformers(email: string, limit = 5): TopPerformer[] {
  return getDb()
    .prepare(
      `SELECT sp.asset_id AS assetId, sp.asset_name AS assetName, sp.platform,
              pm.views, pm.likes, pm.comments
       FROM post_metrics pm
       JOIN scheduled_posts sp ON sp.id = pm.post_id AND sp.user_email = pm.user_email
       WHERE pm.user_email = ? AND sp.status = 'published'
       ORDER BY pm.views DESC, pm.likes DESC
       LIMIT ?`
    )
    .all(email.toLowerCase(), limit) as unknown as TopPerformer[];
}

export function getScheduledPost(email: string, id: string): ScheduledPost | null {
  const row = getDb()
    .prepare("SELECT * FROM scheduled_posts WHERE id = ? AND user_email = ?")
    .get(id, email.toLowerCase()) as Record<string, unknown> | undefined;
  return row ? mapScheduled(row) : null;
}

// --- Referrals (viral loop) ---

export function getReferralInfo(email: string): { code: string; count: number } {
  const conn = getDb();
  const lower = email.toLowerCase();
  const row = conn
    .prepare("SELECT referral_code FROM users WHERE email = ?")
    .get(lower) as { referral_code: string | null } | undefined;
  let code = row?.referral_code ?? null;
  if (!code) {
    // Lazily mint codes for accounts created before referrals existed.
    code = `ef-${crypto.randomUUID().slice(0, 8)}`;
    conn.prepare("UPDATE users SET referral_code = ? WHERE email = ?").run(code, lower);
  }
  const count = (
    conn
      .prepare("SELECT COUNT(*) AS c FROM users WHERE referred_by = ?")
      .get(code) as { c: number }
  ).c;
  return { code, count };
}

export function setReferredBy(email: string, refCode: string): void {
  getDb()
    .prepare(
      "UPDATE users SET referred_by = ? WHERE email = ? AND referred_by IS NULL"
    )
    .run(refCode.slice(0, 40), email.toLowerCase());
}

// --- Revenue ledger (the creator's income, not the platform's) ---

export interface RevenueEntry {
  id: string;
  month: string; // "2026-08"
  stream: string;
  amount: number;
  note: string;
  createdAt: string;
}

export function listRevenue(email: string): RevenueEntry[] {
  return getDb()
    .prepare(
      `SELECT id, month, stream, amount, COALESCE(note, '') AS note, created_at AS createdAt
       FROM revenue_entries WHERE user_email = ? ORDER BY month DESC, created_at DESC`
    )
    .all(email.toLowerCase()) as unknown as RevenueEntry[];
}

export function insertRevenue(
  email: string,
  entry: Omit<RevenueEntry, "createdAt">
): RevenueEntry {
  const now = new Date().toISOString();
  getDb()
    .prepare(
      `INSERT INTO revenue_entries (id, user_email, month, stream, amount, note, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    )
    .run(
      entry.id,
      email.toLowerCase(),
      entry.month,
      entry.stream,
      entry.amount,
      entry.note || null,
      now
    );
  return { ...entry, createdAt: now };
}

export function deleteRevenue(email: string, id: string): void {
  getDb()
    .prepare("DELETE FROM revenue_entries WHERE id = ? AND user_email = ?")
    .run(id, email.toLowerCase());
}

// --- Brand deals (sponsorship pipeline) ---

export interface Deal {
  id: string;
  brand: string;
  contact: string;
  value: number;
  stage: "lead" | "negotiating" | "booked" | "delivered" | "paid";
  platform: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

function mapDeal(row: Record<string, unknown>): Deal {
  return {
    id: row.id as string,
    brand: row.brand as string,
    contact: (row.contact as string) ?? "",
    value: row.value as number,
    stage: row.stage as Deal["stage"],
    platform: (row.platform as string) ?? "",
    notes: (row.notes as string) ?? "",
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

export function listDeals(email: string): Deal[] {
  return (
    getDb()
      .prepare("SELECT * FROM deals WHERE user_email = ? ORDER BY updated_at DESC")
      .all(email.toLowerCase()) as Record<string, unknown>[]
  ).map(mapDeal);
}

export function getDeal(email: string, id: string): Deal | null {
  const row = getDb()
    .prepare("SELECT * FROM deals WHERE id = ? AND user_email = ?")
    .get(id, email.toLowerCase()) as Record<string, unknown> | undefined;
  return row ? mapDeal(row) : null;
}

export function insertDeal(
  email: string,
  deal: Omit<Deal, "createdAt" | "updatedAt">
): Deal {
  const now = new Date().toISOString();
  getDb()
    .prepare(
      `INSERT INTO deals (id, user_email, brand, contact, value, stage, platform, notes, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .run(
      deal.id,
      email.toLowerCase(),
      deal.brand,
      deal.contact || null,
      deal.value,
      deal.stage,
      deal.platform || null,
      deal.notes || null,
      now,
      now
    );
  return { ...deal, createdAt: now, updatedAt: now };
}

export function updateDeal(
  email: string,
  id: string,
  updates: Partial<Pick<Deal, "brand" | "contact" | "value" | "stage" | "platform" | "notes">>
): Deal | null {
  const cols: Record<string, string> = {
    brand: "brand",
    contact: "contact",
    value: "value",
    stage: "stage",
    platform: "platform",
    notes: "notes",
  };
  const sets: string[] = [];
  const values: (string | number)[] = [];
  for (const [key, col] of Object.entries(cols)) {
    const v = updates[key as keyof typeof updates];
    if (v !== undefined) {
      sets.push(`${col} = ?`);
      values.push(v as string | number);
    }
  }
  if (sets.length > 0) {
    sets.push("updated_at = ?");
    values.push(new Date().toISOString());
    values.push(id, email.toLowerCase());
    getDb()
      .prepare(`UPDATE deals SET ${sets.join(", ")} WHERE id = ? AND user_email = ?`)
      .run(...values);
  }
  return getDeal(email, id);
}

export function deleteDeal(email: string, id: string): void {
  getDb()
    .prepare("DELETE FROM deals WHERE id = ? AND user_email = ?")
    .run(id, email.toLowerCase());
}

// --- Pending plans (paid via Stripe before an account existed) ---

export function setPendingPlan(email: string, plan: string): void {
  getDb()
    .prepare(
      "INSERT OR REPLACE INTO pending_plans (email, plan, created_at) VALUES (?, ?, ?)"
    )
    .run(email.toLowerCase(), plan, new Date().toISOString());
}

/** Returns and clears the plan a checkout reserved for this email, if any. */
export function consumePendingPlan(email: string): string | null {
  const conn = getDb();
  const row = conn
    .prepare("SELECT plan FROM pending_plans WHERE email = ?")
    .get(email.toLowerCase()) as { plan: string } | undefined;
  if (!row) return null;
  conn.prepare("DELETE FROM pending_plans WHERE email = ?").run(email.toLowerCase());
  return row.plan;
}

// --- Projects ---

function mapProject(row: Record<string, unknown>): Project {
  return {
    id: row.id as string,
    title: row.title as string,
    status: row.status as Project["status"],
    progress: row.progress as number,
    assetsReady: row.assets_ready as number,
    assetsTotal: row.assets_total as number,
    eta: row.eta as string,
    createdAt: row.created_at as string,
    fileName: (row.file_name as string) ?? undefined,
    fileSize: (row.file_size as string) ?? undefined,
  };
}

export function listProjects(email: string): Project[] {
  return (
    getDb()
      .prepare("SELECT * FROM projects WHERE user_email = ? ORDER BY sort DESC")
      .all(email.toLowerCase()) as Record<string, unknown>[]
  ).map(mapProject);
}

/** Projects created since an ISO timestamp — used for monthly plan quotas. */
export function countProjectsSince(email: string, sinceIso: string): number {
  return (
    getDb()
      .prepare(
        "SELECT COUNT(*) AS c FROM projects WHERE user_email = ? AND created_at >= ?"
      )
      .get(email.toLowerCase(), sinceIso) as { c: number }
  ).c;
}

export function insertProject(email: string, p: Project): void {
  const sort = Date.now();
  getDb()
    .prepare(
      `INSERT INTO projects
       (id, user_email, title, status, progress, assets_ready, assets_total, eta, created_at, file_name, file_size, sort)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .run(
      p.id,
      email.toLowerCase(),
      p.title,
      p.status,
      p.progress,
      p.assetsReady,
      p.assetsTotal,
      p.eta,
      p.createdAt,
      p.fileName ?? null,
      p.fileSize ?? null,
      sort
    );
}

/**
 * Creates a project already populated with its generated assets, landing
 * directly in "review". Generation is synchronous, so there is no fake
 * processing phase — the assets are real and ready to inspect immediately.
 */
export function createProjectWithAssets(
  email: string,
  meta: {
    id: string;
    title: string;
    fileName?: string;
    fileSize?: string;
    transcript?: string;
    storagePath?: string;
  },
  generated: { name: string; type: string; content: string }[]
): { project: Project; assets: Asset[] } {
  const lower = email.toLowerCase();
  const now = new Date().toISOString();
  const conn = getDb();
  const total = generated.length;

  conn
    .prepare(
      `INSERT INTO projects
       (id, user_email, title, status, progress, assets_ready, assets_total, eta, created_at, file_name, file_size, transcript, storage_path, sort)
       VALUES (?, ?, ?, 'review', 100, ?, ?, 'Awaiting approval', ?, ?, ?, ?, ?, ?)`
    )
    .run(
      meta.id,
      lower,
      meta.title,
      total,
      total,
      now,
      meta.fileName ?? null,
      meta.fileSize ?? null,
      meta.transcript ?? null,
      meta.storagePath ?? null,
      Date.now()
    );

  const assets: Asset[] = generated.map((a, i) => {
    const id = `a-${crypto.randomUUID()}`;
    conn
      .prepare(
        `INSERT INTO assets (id, user_email, project_id, name, type, views, status, liked, content, sort)
         VALUES (?, ?, ?, ?, ?, '—', 'draft', 0, ?, ?)`
      )
      .run(id, lower, meta.id, a.name, a.type, a.content, i);
    return {
      id,
      projectId: meta.id,
      name: a.name,
      type: a.type,
      views: "—",
      status: "draft",
      liked: false,
      content: a.content,
    };
  });

  const project: Project = {
    id: meta.id,
    title: meta.title,
    status: "review",
    progress: 100,
    assetsReady: total,
    assetsTotal: total,
    eta: "Awaiting approval",
    createdAt: now,
    fileName: meta.fileName,
    fileSize: meta.fileSize,
  };
  return { project, assets };
}

const PROJECT_COLUMNS: Record<string, string> = {
  title: "title",
  status: "status",
  progress: "progress",
  assetsReady: "assets_ready",
  assetsTotal: "assets_total",
  eta: "eta",
};

export function updateProject(
  email: string,
  id: string,
  updates: Partial<Project>
): Project | null {
  const sets: string[] = [];
  const values: unknown[] = [];
  for (const [key, col] of Object.entries(PROJECT_COLUMNS)) {
    if (key in updates && updates[key as keyof Project] !== undefined) {
      sets.push(`${col} = ?`);
      values.push(updates[key as keyof Project]);
    }
  }
  if (sets.length > 0) {
    values.push(id, email.toLowerCase());
    getDb()
      .prepare(
        `UPDATE projects SET ${sets.join(", ")} WHERE id = ? AND user_email = ?`
      )
      .run(...(values as (string | number)[]));
  }
  const row = getDb()
    .prepare("SELECT * FROM projects WHERE id = ? AND user_email = ?")
    .get(id, email.toLowerCase()) as Record<string, unknown> | undefined;
  return row ? mapProject(row) : null;
}

export function deleteProject(email: string, id: string): void {
  const conn = getDb();
  conn
    .prepare("DELETE FROM assets WHERE project_id = ? AND user_email = ?")
    .run(id, email.toLowerCase());
  conn
    .prepare("DELETE FROM projects WHERE id = ? AND user_email = ?")
    .run(id, email.toLowerCase());
}

// --- Assets ---

function mapAsset(row: Record<string, unknown>): Asset {
  return {
    id: row.id as string,
    projectId: row.project_id as string,
    name: row.name as string,
    type: row.type as string,
    views: row.views as string,
    status: row.status as Asset["status"],
    liked: Boolean(row.liked),
    content: (row.content as string) ?? undefined,
    evergreen: Boolean(row.evergreen),
  };
}

export function setAssetEvergreen(
  email: string,
  id: string,
  evergreen: boolean
): Asset | null {
  getDb()
    .prepare("UPDATE assets SET evergreen = ? WHERE id = ? AND user_email = ?")
    .run(evergreen ? 1 : 0, id, email.toLowerCase());
  return getAsset(email, id);
}

export function listAssets(email: string): Asset[] {
  return (
    getDb()
      .prepare("SELECT * FROM assets WHERE user_email = ? ORDER BY sort ASC")
      .all(email.toLowerCase()) as Record<string, unknown>[]
  ).map(mapAsset);
}

export function setProjectAssetsStatus(
  email: string,
  projectId: string,
  status: Asset["status"]
): void {
  getDb()
    .prepare(
      "UPDATE assets SET status = ? WHERE project_id = ? AND user_email = ?"
    )
    .run(status, projectId, email.toLowerCase());
}

export function getAsset(email: string, id: string): Asset | null {
  const row = getDb()
    .prepare("SELECT * FROM assets WHERE id = ? AND user_email = ?")
    .get(id, email.toLowerCase()) as Record<string, unknown> | undefined;
  return row ? mapAsset(row) : null;
}

export function updateAsset(
  email: string,
  id: string,
  updates: { name?: string; content?: string }
): Asset | null {
  const conn = getDb();
  const sets: string[] = [];
  const values: string[] = [];
  if (updates.name !== undefined) {
    sets.push("name = ?");
    values.push(updates.name);
  }
  if (updates.content !== undefined) {
    sets.push("content = ?");
    values.push(updates.content);
  }
  if (sets.length > 0) {
    values.push(id, email.toLowerCase());
    conn
      .prepare(`UPDATE assets SET ${sets.join(", ")} WHERE id = ? AND user_email = ?`)
      .run(...values);
  }
  return getAsset(email, id);
}

/** Title + stored transcript of the project an asset belongs to. */
export function getProjectSource(
  email: string,
  projectId: string
): { title: string; transcript: string } | null {
  const row = getDb()
    .prepare("SELECT title, transcript FROM projects WHERE id = ? AND user_email = ?")
    .get(projectId, email.toLowerCase()) as
    | { title: string; transcript: string | null }
    | undefined;
  if (!row) return null;
  return { title: row.title, transcript: row.transcript ?? "" };
}

export function toggleAssetLike(email: string, id: string): Asset | null {
  const conn = getDb();
  conn
    .prepare(
      "UPDATE assets SET liked = 1 - liked WHERE id = ? AND user_email = ?"
    )
    .run(id, email.toLowerCase());
  const row = conn
    .prepare("SELECT * FROM assets WHERE id = ? AND user_email = ?")
    .get(id, email.toLowerCase()) as Record<string, unknown> | undefined;
  return row ? mapAsset(row) : null;
}

// --- Notifications ---

function mapNotification(row: Record<string, unknown>): Notification {
  return {
    id: row.id as string,
    title: row.title as string,
    message: row.message as string,
    time: row.time as string,
    read: Boolean(row.read),
    type: row.type as Notification["type"],
  };
}

export function listNotifications(email: string): Notification[] {
  return (
    getDb()
      .prepare(
        "SELECT * FROM notifications WHERE user_email = ? ORDER BY sort DESC"
      )
      .all(email.toLowerCase()) as Record<string, unknown>[]
  ).map(mapNotification);
}

export function insertNotification(
  email: string,
  n: Notification
): void {
  getDb()
    .prepare(
      `INSERT INTO notifications (id, user_email, title, message, time, read, type, sort)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .run(
      n.id,
      email.toLowerCase(),
      n.title,
      n.message,
      n.time,
      n.read ? 1 : 0,
      n.type,
      Date.now()
    );
}

export function markNotificationRead(email: string, id: string): void {
  getDb()
    .prepare(
      "UPDATE notifications SET read = 1 WHERE id = ? AND user_email = ?"
    )
    .run(id, email.toLowerCase());
}

export function markAllNotificationsRead(email: string): void {
  getDb()
    .prepare("UPDATE notifications SET read = 1 WHERE user_email = ?")
    .run(email.toLowerCase());
}

// --- Pricing ---

/**
 * Returns the pricing config from the DB, seeding it from DEFAULT_PRICING on
 * first access. Prices/allotments can then be edited in the DB (or via
 * setPricingConfig) and take effect without a redeploy.
 */
export function getPricingConfig(): PricingConfig {
  const conn = getDb();
  const row = conn
    .prepare("SELECT value FROM pricing_config WHERE key = 'config'")
    .get() as { value: string } | undefined;
  if (row) {
    try {
      return JSON.parse(row.value) as PricingConfig;
    } catch {
      /* fall through to reseed on corrupt JSON */
    }
  }
  conn
    .prepare(
      "INSERT OR REPLACE INTO pricing_config (key, value) VALUES ('config', ?)"
    )
    .run(JSON.stringify(DEFAULT_PRICING));
  return DEFAULT_PRICING;
}

export function setPricingConfig(config: PricingConfig): void {
  getDb()
    .prepare(
      "INSERT OR REPLACE INTO pricing_config (key, value) VALUES ('config', ?)"
    )
    .run(JSON.stringify(config));
}

// --- Integrations (API keys / connections stored server-side) ---

export function getIntegrationRaw(name: string): Record<string, string> {
  const row = getDb()
    .prepare("SELECT config FROM integrations WHERE name = ?")
    .get(name) as { config: string } | undefined;
  if (!row) return {};
  try {
    return JSON.parse(row.config) as Record<string, string>;
  } catch {
    return {};
  }
}

export function setIntegrationRaw(
  name: string,
  config: Record<string, string>
): void {
  getDb()
    .prepare(
      "INSERT OR REPLACE INTO integrations (name, config) VALUES (?, ?)"
    )
    .run(name, JSON.stringify(config));
}

// --- Provenance (signed per-asset manifests) ---

export function setProvenance(
  assetId: string,
  manifest: string,
  signature: string
): void {
  getDb()
    .prepare(
      "INSERT OR REPLACE INTO provenance (asset_id, manifest, signature) VALUES (?, ?, ?)"
    )
    .run(assetId, manifest, signature);
}

export function getProvenanceRaw(
  assetId: string
): { manifest: string; signature: string } | null {
  const row = getDb()
    .prepare("SELECT manifest, signature FROM provenance WHERE asset_id = ?")
    .get(assetId) as { manifest: string; signature: string } | undefined;
  return row ?? null;
}

// --- App flags (operator kill switches / toggles) ---

export interface AppFlags {
  generationEnabled: boolean;
}

const DEFAULT_FLAGS: AppFlags = { generationEnabled: true };

export function getFlags(): AppFlags {
  const row = getDb()
    .prepare("SELECT value FROM app_flags WHERE key = 'config'")
    .get() as { value: string } | undefined;
  if (!row) return { ...DEFAULT_FLAGS };
  try {
    return { ...DEFAULT_FLAGS, ...(JSON.parse(row.value) as Partial<AppFlags>) };
  } catch {
    return { ...DEFAULT_FLAGS };
  }
}

export function setFlags(flags: AppFlags): void {
  getDb()
    .prepare("INSERT OR REPLACE INTO app_flags (key, value) VALUES ('config', ?)")
    .run(JSON.stringify(flags));
}

// --- Audit log (admin actions) ---

export interface AuditEntry {
  id: number;
  actor: string;
  action: string;
  detail: string;
  ts: number;
}

export function insertAudit(actor: string, action: string, detail: string): void {
  getDb()
    .prepare("INSERT INTO audit_log (actor, action, detail, ts) VALUES (?, ?, ?, ?)")
    .run(actor.slice(0, 128), action.slice(0, 64), detail.slice(0, 512), Date.now());
}

export function listAudit(limit = 100): AuditEntry[] {
  return getDb()
    .prepare("SELECT * FROM audit_log ORDER BY id DESC LIMIT ?")
    .all(limit) as unknown as AuditEntry[];
}

// --- Admin: user management + platform totals ---

export interface AdminUserRow {
  email: string;
  name: string;
  plan: string;
  createdAt: string;
  projects: number;
  assets: number;
}

export function listUsers(): AdminUserRow[] {
  return (
    getDb()
      .prepare(
        `SELECT u.email, u.name, u.plan, u.created_at AS createdAt,
           (SELECT COUNT(*) FROM projects p WHERE p.user_email = u.email) AS projects,
           (SELECT COUNT(*) FROM assets a WHERE a.user_email = u.email) AS assets
         FROM users u ORDER BY u.created_at DESC`
      )
      .all() as unknown as AdminUserRow[]
  );
}

export function setUserPlan(email: string, plan: string): boolean {
  const res = getDb()
    .prepare("UPDATE users SET plan = ? WHERE email = ?")
    .run(plan, email.toLowerCase());
  return Number(res.changes) > 0;
}

export function adminTotals(): {
  users: number;
  projects: number;
  assets: number;
  scheduled: number;
  published: number;
} {
  const conn = getDb();
  const count = (sql: string) => (conn.prepare(sql).get() as { c: number }).c;
  return {
    users: count("SELECT COUNT(*) AS c FROM users"),
    projects: count("SELECT COUNT(*) AS c FROM projects"),
    assets: count("SELECT COUNT(*) AS c FROM assets"),
    scheduled: count("SELECT COUNT(*) AS c FROM scheduled_posts WHERE status = 'scheduled'"),
    published: count("SELECT COUNT(*) AS c FROM scheduled_posts WHERE status = 'published'"),
  };
}

// --- Per-user analytics (real workspace aggregates, no vanity metrics) ---

export interface UserAnalytics {
  totals: {
    assets: number;
    liveAssets: number;
    projects: number;
    publishedProjects: number;
    scheduled: number;
    published: number;
    likes: number;
  };
  platforms: { platform: string; scheduled: number; published: number }[];
  types: { type: string; count: number }[];
  recentPublished: { assetName: string; platform: string; scheduledAt: string }[];
  measured: { posts: number; views: number; likes: number; comments: number };
  topPerformers: TopPerformer[];
}

export function userAnalytics(email: string): UserAnalytics {
  const conn = getDb();
  const lower = email.toLowerCase();
  const one = (sql: string, ...args: string[]) =>
    (conn.prepare(sql).get(...args) as { c: number }).c;

  return {
    totals: {
      assets: one("SELECT COUNT(*) AS c FROM assets WHERE user_email = ?", lower),
      liveAssets: one(
        "SELECT COUNT(*) AS c FROM assets WHERE user_email = ? AND status IN ('live','sent')",
        lower
      ),
      projects: one("SELECT COUNT(*) AS c FROM projects WHERE user_email = ?", lower),
      publishedProjects: one(
        "SELECT COUNT(*) AS c FROM projects WHERE user_email = ? AND status = 'published'",
        lower
      ),
      scheduled: one(
        "SELECT COUNT(*) AS c FROM scheduled_posts WHERE user_email = ? AND status = 'scheduled'",
        lower
      ),
      published: one(
        "SELECT COUNT(*) AS c FROM scheduled_posts WHERE user_email = ? AND status = 'published'",
        lower
      ),
      likes: one(
        "SELECT COUNT(*) AS c FROM assets WHERE user_email = ? AND liked = 1",
        lower
      ),
    },
    platforms: conn
      .prepare(
        `SELECT platform,
           SUM(CASE WHEN status = 'scheduled' THEN 1 ELSE 0 END) AS scheduled,
           SUM(CASE WHEN status = 'published' THEN 1 ELSE 0 END) AS published
         FROM scheduled_posts WHERE user_email = ?
         GROUP BY platform ORDER BY published DESC, scheduled DESC`
      )
      .all(lower) as unknown as UserAnalytics["platforms"],
    types: conn
      .prepare(
        `SELECT type, COUNT(*) AS count FROM assets WHERE user_email = ?
         GROUP BY type ORDER BY count DESC`
      )
      .all(lower) as unknown as UserAnalytics["types"],
    recentPublished: conn
      .prepare(
        `SELECT asset_name AS assetName, platform, scheduled_at AS scheduledAt
         FROM scheduled_posts WHERE user_email = ? AND status = 'published'
         ORDER BY sort DESC LIMIT 8`
      )
      .all(lower) as unknown as UserAnalytics["recentPublished"],
    measured: conn
      .prepare(
        `SELECT COUNT(*) AS posts,
                COALESCE(SUM(views), 0) AS views,
                COALESCE(SUM(likes), 0) AS likes,
                COALESCE(SUM(comments), 0) AS comments
         FROM post_metrics WHERE user_email = ?`
      )
      .get(lower) as UserAnalytics["measured"],
    topPerformers: topPerformers(lower, 5),
  };
}

// --- Brand voice ---

export function getBrandVoice(email: string): BrandVoice {
  const row = getDb()
    .prepare("SELECT config FROM brand_voice WHERE user_email = ?")
    .get(email.toLowerCase()) as { config: string } | undefined;
  if (!row) return { ...DEFAULT_VOICE };
  try {
    return { ...DEFAULT_VOICE, ...(JSON.parse(row.config) as Partial<BrandVoice>) };
  } catch {
    return { ...DEFAULT_VOICE };
  }
}

export function setBrandVoice(email: string, voice: BrandVoice): void {
  getDb()
    .prepare(
      "INSERT OR REPLACE INTO brand_voice (user_email, config) VALUES (?, ?)"
    )
    .run(email.toLowerCase(), JSON.stringify(voice));
}

// --- Password reset tokens ---

export function createResetToken(
  token: string,
  email: string,
  expiresAt: number
): void {
  getDb()
    .prepare(
      "INSERT OR REPLACE INTO reset_tokens (token, user_email, expires_at) VALUES (?, ?, ?)"
    )
    .run(token, email.toLowerCase(), expiresAt);
}

export function consumeResetToken(token: string): string | null {
  const conn = getDb();
  const row = conn
    .prepare("SELECT user_email, expires_at FROM reset_tokens WHERE token = ?")
    .get(token) as { user_email: string; expires_at: number } | undefined;
  if (!row) return null;
  conn.prepare("DELETE FROM reset_tokens WHERE token = ?").run(token);
  if (row.expires_at < Date.now()) return null;
  return row.user_email;
}

export function updateUserPassword(email: string, passwordHash: string): void {
  getDb()
    .prepare("UPDATE users SET password_hash = ? WHERE email = ?")
    .run(passwordHash, email.toLowerCase());
}

// --- Analytics (self-hosted funnel events) ---

export function insertEvent(event: string, path: string, meta: string | null): void {
  getDb()
    .prepare("INSERT INTO analytics_events (event, path, ts, meta) VALUES (?, ?, ?, ?)")
    .run(event.slice(0, 64), path.slice(0, 256), Date.now(), meta ? meta.slice(0, 512) : null);
}

export function eventCounts(): { event: string; count: number }[] {
  return getDb()
    .prepare("SELECT event, COUNT(*) as count FROM analytics_events GROUP BY event ORDER BY count DESC")
    .all() as { event: string; count: number }[];
}

// --- Scheduled posts (publish / schedule) ---

export interface ScheduledPost {
  id: string;
  assetId: string;
  assetName: string;
  platform: string;
  scheduledAt: string;
  status: "scheduled" | "published" | "canceled";
  createdAt: string;
}

function mapScheduled(row: Record<string, unknown>): ScheduledPost {
  return {
    id: row.id as string,
    assetId: row.asset_id as string,
    assetName: row.asset_name as string,
    platform: row.platform as string,
    scheduledAt: row.scheduled_at as string,
    status: row.status as ScheduledPost["status"],
    createdAt: row.created_at as string,
  };
}

export function listScheduledPosts(email: string): ScheduledPost[] {
  return (
    getDb()
      .prepare("SELECT * FROM scheduled_posts WHERE user_email = ? ORDER BY sort DESC")
      .all(email.toLowerCase()) as Record<string, unknown>[]
  ).map(mapScheduled);
}

export function createScheduledPost(
  email: string,
  post: Omit<ScheduledPost, "createdAt">
): ScheduledPost {
  const now = new Date().toISOString();
  getDb()
    .prepare(
      `INSERT INTO scheduled_posts (id, user_email, asset_id, asset_name, platform, scheduled_at, status, created_at, sort)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .run(
      post.id,
      email.toLowerCase(),
      post.assetId,
      post.assetName,
      post.platform,
      post.scheduledAt,
      post.status,
      now,
      Date.now()
    );
  return { ...post, createdAt: now };
}

/** Every still-scheduled post across all users — the scheduler tick's worklist. */
export function listAllScheduledPending(): (ScheduledPost & { userEmail: string })[] {
  return (
    getDb()
      .prepare("SELECT * FROM scheduled_posts WHERE status = 'scheduled'")
      .all() as Record<string, unknown>[]
  ).map((row) => ({ ...mapScheduled(row), userEmail: row.user_email as string }));
}

/** Reschedule a still-pending post (time and/or platform). Published and
 *  canceled posts are immutable history — the WHERE clause enforces it. */
export function updateScheduledPost(
  email: string,
  id: string,
  updates: { platform?: string; scheduledAt?: string }
): ScheduledPost | null {
  const conn = getDb();
  const sets: string[] = [];
  const values: string[] = [];
  if (updates.platform !== undefined) {
    sets.push("platform = ?");
    values.push(updates.platform);
  }
  if (updates.scheduledAt !== undefined) {
    sets.push("scheduled_at = ?");
    values.push(updates.scheduledAt);
  }
  if (sets.length > 0) {
    values.push(id, email.toLowerCase());
    conn
      .prepare(
        `UPDATE scheduled_posts SET ${sets.join(", ")}
         WHERE id = ? AND user_email = ? AND status = 'scheduled'`
      )
      .run(...values);
  }
  const row = conn
    .prepare("SELECT * FROM scheduled_posts WHERE id = ? AND user_email = ?")
    .get(id, email.toLowerCase()) as Record<string, unknown> | undefined;
  return row ? mapScheduled(row) : null;
}

export function setScheduledStatus(
  email: string,
  id: string,
  status: ScheduledPost["status"]
): ScheduledPost | null {
  const conn = getDb();
  conn
    .prepare("UPDATE scheduled_posts SET status = ? WHERE id = ? AND user_email = ?")
    .run(status, id, email.toLowerCase());
  const row = conn
    .prepare("SELECT * FROM scheduled_posts WHERE id = ? AND user_email = ?")
    .get(id, email.toLowerCase()) as Record<string, unknown> | undefined;
  return row ? mapScheduled(row) : null;
}

// --- Seeding ---

/**
 * Populates a brand-new account with the sample projects/assets/notifications
 * so the dashboard is not empty on first login. IDs are regenerated per user so
 * accounts never collide, and asset→project links are preserved.
 */
export function seedUser(email: string): void {
  const lower = email.toLowerCase();
  const idMap = new Map<string, string>();

  defaultProjects.forEach((p) => {
    const newId = `proj-${crypto.randomUUID()}`;
    idMap.set(p.id, newId);
    insertProject(lower, { ...p, id: newId });
  });

  const conn = getDb();
  defaultAssets.forEach((a, i) => {
    const projectId = idMap.get(a.projectId) ?? a.projectId;
    conn
      .prepare(
        `INSERT INTO assets (id, user_email, project_id, name, type, views, status, liked, sort)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .run(
        `a-${crypto.randomUUID()}`,
        lower,
        projectId,
        a.name,
        a.type,
        a.views,
        a.status,
        a.liked ? 1 : 0,
        i
      );
  });

  defaultNotifications.forEach((n, i) => {
    conn
      .prepare(
        `INSERT INTO notifications (id, user_email, title, message, time, read, type, sort)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .run(
        `n-${crypto.randomUUID()}`,
        lower,
        n.title,
        n.message,
        n.time,
        n.read ? 1 : 0,
        n.type,
        defaultNotifications.length - i
      );
  });
}
