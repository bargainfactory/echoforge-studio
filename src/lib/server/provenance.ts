/**
 * Per-asset provenance manifests, C2PA-shaped.
 *
 * Every generated asset carries a signed record of where it came from: a hash
 * of the source input, a hash of the current content, which engine produced
 * it, and an append-only action trail (generated → edited → regenerated…).
 *
 * Signing is HMAC-SHA256 with a server-held key — self-declared provenance,
 * not a C2PA Trust List signature. The manifest fields deliberately mirror a
 * C2PA claim (claim generator, assertions, hard bindings) so upgrading to
 * conformant claim-signing certificates later is a signer swap, not a
 * rearchitecture.
 */

import { createHash, createHmac, timingSafeEqual } from "node:crypto";

const CLAIM_GENERATOR = "Virafold/0.1.0";

function provenanceKey(): string {
  const key = process.env.PROVENANCE_KEY || process.env.SESSION_SECRET;
  if (key) return key;
  if (process.env.NODE_ENV === "production") {
    console.warn(
      "[provenance] PROVENANCE_KEY is not set — using an insecure development key. Set PROVENANCE_KEY (or SESSION_SECRET) before deploying."
    );
  }
  return "virafold-dev-insecure-provenance-key";
}

export function sha256(text: string): string {
  return createHash("sha256").update(text, "utf8").digest("hex");
}

export interface ProvenanceAction {
  action: "generated" | "edited" | "regenerated";
  at: string; // ISO timestamp
  engine?: string; // e.g. "deterministic", "anthropic:claude-opus-4-8"
  feedback?: string; // user revision feedback, when a regeneration had one
}

export interface ProvenanceManifest {
  claimGenerator: string;
  assetId: string;
  projectId: string;
  createdAt: string;
  sourceHash: string; // sha256 of the project title + transcript
  contentHash: string; // sha256 of the asset's current content
  locale?: string;
  voiceApplied: boolean;
  actions: ProvenanceAction[];
}

export function createManifest(args: {
  assetId: string;
  projectId: string;
  content: string;
  sourceText: string;
  locale?: string;
  voiceApplied: boolean;
  firstAction: ProvenanceAction;
}): ProvenanceManifest {
  return {
    claimGenerator: CLAIM_GENERATOR,
    assetId: args.assetId,
    projectId: args.projectId,
    createdAt: args.firstAction.at,
    sourceHash: sha256(args.sourceText),
    contentHash: sha256(args.content),
    locale: args.locale,
    voiceApplied: args.voiceApplied,
    actions: [args.firstAction],
  };
}

/** Appends to the action trail and rebinds the content hash to the new text. */
export function appendAction(
  manifest: ProvenanceManifest,
  content: string,
  action: ProvenanceAction
): ProvenanceManifest {
  return {
    ...manifest,
    contentHash: sha256(content),
    actions: [...manifest.actions, action],
  };
}

export function signManifest(manifest: ProvenanceManifest): string {
  return createHmac("sha256", provenanceKey())
    .update(JSON.stringify(manifest))
    .digest("hex");
}

export function verifyManifest(
  manifest: ProvenanceManifest,
  signature: string
): boolean {
  try {
    return timingSafeEqual(
      Buffer.from(signManifest(manifest), "hex"),
      Buffer.from(signature, "hex")
    );
  } catch {
    return false;
  }
}
