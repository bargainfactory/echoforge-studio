/**
 * Wider input mouth: turn a blog post / article URL into source text for
 * generation. Deliberately simple extraction — scripts, styles, and tags
 * stripped — because the generator only needs the words, not the layout.
 */

const MAX_HTML_BYTES = 1_500_000;
const MAX_TEXT_CHARS = 60_000;

/** Hosts that must never be fetched server-side (SSRF guard). */
function isBlockedHost(hostname: string): boolean {
  const h = hostname.toLowerCase();
  return (
    h === "localhost" ||
    h.endsWith(".local") ||
    h.endsWith(".internal") ||
    /^127\./.test(h) ||
    /^10\./.test(h) ||
    /^192\.168\./.test(h) ||
    /^172\.(1[6-9]|2\d|3[01])\./.test(h) ||
    /^169\.254\./.test(h) ||
    h === "0.0.0.0" ||
    h === "[::1]"
  );
}

export async function fetchArticleText(
  url: string
): Promise<{ title: string; text: string } | null> {
  let u: URL;
  try {
    u = new URL(url);
  } catch {
    return null;
  }
  if (!/^https?:$/.test(u.protocol) || isBlockedHost(u.hostname)) return null;

  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 8000);
    const resp = await fetch(u, {
      signal: ctrl.signal,
      redirect: "follow",
      headers: { "User-Agent": "VirafoldBot/1.0 (+https://virafold.ai)" },
    });
    clearTimeout(timer);
    if (!resp.ok) return null;
    const ct = resp.headers.get("content-type") ?? "";
    if (!ct.includes("text/html") && !ct.includes("text/plain")) return null;

    let html = await resp.text();
    if (html.length > MAX_HTML_BYTES) html = html.slice(0, MAX_HTML_BYTES);

    const titleMatch = /<title[^>]*>([^<]{1,200})<\/title>/i.exec(html);
    const text = html
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<nav[\s\S]*?<\/nav>/gi, " ")
      .replace(/<footer[\s\S]*?<\/footer>/gi, " ")
      .replace(/<[^>]+>/g, " ")
      .replace(/&nbsp;/gi, " ")
      .replace(/&amp;/gi, "&")
      .replace(/&#\d+;|&\w+;/g, " ")
      .replace(/\s+/g, " ")
      .trim();

    if (text.length < 200) return null;
    return {
      title: (titleMatch?.[1] ?? u.hostname).trim(),
      text: text.slice(0, MAX_TEXT_CHARS),
    };
  } catch {
    return null;
  }
}
