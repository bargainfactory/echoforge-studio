/**
 * Deterministic platform-policy / demonetization lint for generated assets.
 *
 * Advisory, not gating: creators see what an ad-suitability or platform-policy
 * reviewer would likely flag BEFORE they publish, next to the asset itself.
 * Term lists are intentionally English-centric v1 — content in other languages
 * simply yields fewer findings. Severity drives the roll-up:
 *   any high → "high", else any medium → "medium", else any low → "low".
 */

export interface LintFinding {
  severity: "high" | "medium" | "low";
  category: "sensitive" | "medical" | "financial" | "violence" | "clickbait" | "platform";
  term: string;
  snippet: string;
}

export interface LintResult {
  risk: "high" | "medium" | "low" | "clean";
  findings: LintFinding[];
}

interface Rule {
  severity: LintFinding["severity"];
  category: LintFinding["category"];
  terms: string[];
}

const RULES: Rule[] = [
  {
    // Ad-unfriendly / age-restricted subject matter.
    severity: "high",
    category: "sensitive",
    terms: [
      "suicide",
      "self-harm",
      "porn",
      "onlyfans",
      "cocaine",
      "heroin",
      "meth",
      "gambling site",
      "casino bonus",
    ],
  },
  {
    // Health claims that trip misinformation / medical-advice policies.
    severity: "high",
    category: "medical",
    terms: [
      "miracle cure",
      "cures cancer",
      "guaranteed weight loss",
      "lose weight fast",
      "no side effects",
      "doctors hate",
      "detox your body",
    ],
  },
  {
    // Financial promises that trip scam / get-rich-quick policies.
    severity: "high",
    category: "financial",
    terms: [
      "guaranteed returns",
      "guaranteed profit",
      "risk-free investment",
      "get rich quick",
      "double your money",
      "financial freedom overnight",
      "passive income guaranteed",
      "crypto pump",
    ],
  },
  {
    severity: "medium",
    category: "violence",
    terms: ["graphic violence", "gore", "shooting", "terror attack", "assault"],
  },
  {
    // Engagement-bait phrasing platforms downrank.
    severity: "low",
    category: "clickbait",
    terms: [
      "you won't believe",
      "gone wrong",
      "they don't want you to know",
      "shocking truth",
      "exposed",
      "banned video",
    ],
  },
  {
    // Distribution patterns that trigger spam / deception review.
    severity: "medium",
    category: "platform",
    terms: [
      "free money",
      "dm me to invest",
      "click the link in bio to claim",
      "giveaway scam",
      "18+ only",
    ],
  },
];

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function snippetAround(text: string, index: number, length: number): string {
  const start = Math.max(0, index - 30);
  const end = Math.min(text.length, index + length + 30);
  return `${start > 0 ? "…" : ""}${text.slice(start, end).replace(/\s+/g, " ").trim()}${end < text.length ? "…" : ""}`;
}

export function lintContent(text: string): LintResult {
  const findings: LintFinding[] = [];
  for (const rule of RULES) {
    for (const term of rule.terms) {
      const re = new RegExp(`\\b${escapeRegex(term)}\\b`, "gi");
      let m: RegExpExecArray | null;
      while ((m = re.exec(text)) !== null) {
        findings.push({
          severity: rule.severity,
          category: rule.category,
          term,
          snippet: snippetAround(text, m.index, m[0].length),
        });
        // One finding per term is enough signal; move to the next term.
        break;
      }
    }
  }

  const risk = findings.some((f) => f.severity === "high")
    ? "high"
    : findings.some((f) => f.severity === "medium")
      ? "medium"
      : findings.length > 0
        ? "low"
        : "clean";
  return { risk, findings };
}
