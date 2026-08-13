/**
 * Audit data sources: YouTube Data API (any public channel, operator key) and
 * a paste-anything analytics-export parser (X/TikTok/YouTube Studio CSVs).
 */

import { resolveField } from "./integrations";
import type { AuditPost } from "./audit";

const YT = "https://www.googleapis.com/youtube/v3";

function extractHandleOrId(input: string): { handle?: string; id?: string } {
  const trimmed = input.trim();
  const urlMatch = trimmed.match(/youtube\.com\/(@[\w.-]+|channel\/(UC[\w-]+))/i);
  if (urlMatch) {
    if (urlMatch[2]) return { id: urlMatch[2] };
    return { handle: urlMatch[1].replace(/^@/, "") };
  }
  if (/^UC[\w-]{20,}$/.test(trimmed)) return { id: trimmed };
  return { handle: trimmed.replace(/^@/, "") };
}

export async function fetchYouTube(
  input: string
): Promise<{ label: string; posts: AuditPost[] } | { error: "no_key" | "not_found" | "fetch_failed" }> {
  const key = resolveField("audit", "youtubeApiKey");
  if (!key) return { error: "no_key" };

  try {
    const ref = extractHandleOrId(input);
    const chanParams = new URLSearchParams({
      part: "snippet,contentDetails",
      key,
      ...(ref.id ? { id: ref.id } : { forHandle: ref.handle ?? "" }),
    });
    const chanResp = await fetch(`${YT}/channels?${chanParams}`);
    if (!chanResp.ok) return { error: "fetch_failed" };
    const chan = await chanResp.json();
    const channel = chan?.items?.[0];
    if (!channel) return { error: "not_found" };
    const label = channel.snippet?.title ?? input;
    const uploads = channel.contentDetails?.relatedPlaylists?.uploads;
    if (!uploads) return { error: "not_found" };

    const itemsResp = await fetch(
      `${YT}/playlistItems?${new URLSearchParams({
        part: "contentDetails",
        playlistId: uploads,
        maxResults: "50",
        key,
      })}`
    );
    if (!itemsResp.ok) return { error: "fetch_failed" };
    const items = await itemsResp.json();
    const ids: string[] = (items?.items ?? [])
      .map((i: { contentDetails?: { videoId?: string } }) => i.contentDetails?.videoId)
      .filter(Boolean);
    if (ids.length === 0) return { error: "not_found" };

    const vidsResp = await fetch(
      `${YT}/videos?${new URLSearchParams({
        part: "snippet,statistics",
        id: ids.join(","),
        key,
      })}`
    );
    if (!vidsResp.ok) return { error: "fetch_failed" };
    const vids = await vidsResp.json();
    const posts: AuditPost[] = (vids?.items ?? []).map(
      (v: {
        snippet?: { title?: string; publishedAt?: string };
        statistics?: { viewCount?: string; likeCount?: string; commentCount?: string };
      }) => ({
        title: v.snippet?.title ?? "",
        publishedAt: v.snippet?.publishedAt ?? "",
        views: Number(v.statistics?.viewCount ?? 0),
        likes: Number(v.statistics?.likeCount ?? 0),
        comments: Number(v.statistics?.commentCount ?? 0),
      })
    );
    return { label, posts };
  } catch {
    return { error: "fetch_failed" };
  }
}

/**
 * Header-sniffing CSV/TSV parser: finds title/views/likes/comments/date
 * columns by keyword, tolerates quoted fields and either delimiter.
 */
export function parseAnalyticsCsv(
  text: string
): { posts: AuditPost[] } | { error: "unparseable" | "too_few" } {
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  if (lines.length < 3) return { error: "too_few" };

  const delim = (lines[0].match(/\t/g)?.length ?? 0) >= 2 ? "\t" : ",";
  const split = (line: string): string[] => {
    const out: string[] = [];
    let cur = "";
    let inQ = false;
    for (const ch of line) {
      if (ch === '"') inQ = !inQ;
      else if (ch === delim && !inQ) {
        out.push(cur.trim());
        cur = "";
      } else cur += ch;
    }
    out.push(cur.trim());
    return out;
  };

  const header = split(lines[0]).map((h) => h.toLowerCase());
  const findCol = (patterns: RegExp[]) =>
    header.findIndex((h) => patterns.some((p) => p.test(h)));
  const titleCol = findCol([/title/, /^(video|post|tweet|content)( text| name)?$/, /caption/, /name/]);
  const viewsCol = findCol([/view/, /impression/, /play/, /reach/]);
  const likesCol = findCol([/like/, /reaction/, /favou?rite/, /heart/]);
  const commentsCol = findCol([/comment/, /repl/]);
  const dateCol = findCol([/date/, /publish/, /time/, /created/]);
  if (titleCol === -1 || viewsCol === -1) return { error: "unparseable" };

  const num = (s: string | undefined) =>
    Number(String(s ?? "0").replace(/[,\s]/g, "").replace(/[Kk]$/, "000")) || 0;

  const posts: AuditPost[] = [];
  for (const line of lines.slice(1)) {
    const cells = split(line);
    const title = cells[titleCol];
    if (!title) continue;
    posts.push({
      title: title.slice(0, 200),
      publishedAt: dateCol !== -1 ? (cells[dateCol] ?? "") : "",
      views: num(cells[viewsCol]),
      likes: likesCol !== -1 ? num(cells[likesCol]) : 0,
      comments: commentsCol !== -1 ? num(cells[commentsCol]) : 0,
    });
    if (posts.length >= 200) break;
  }
  if (posts.length < 5) return { error: "too_few" };
  return { posts };
}
