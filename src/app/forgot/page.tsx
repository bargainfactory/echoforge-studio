"use client";

import { useState } from "react";
import Link from "next/link";
import { Zap } from "lucide-react";

export default function ForgotPage() {
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const [devLink, setDevLink] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch("/api/auth/forgot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json().catch(() => ({}));
      setDevLink(data?.devResetUrl ?? null);
      setSent(true);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="relative w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-6">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-neon-purple to-electric-blue flex items-center justify-center">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold gradient-text">EchoForge</span>
          </Link>
          <h1 className="text-2xl font-bold text-foreground">Reset your password</h1>
          <p className="text-sm text-cyber-muted mt-1">
            Enter your email and we&apos;ll send you a reset link.
          </p>
        </div>

        {sent ? (
          <div className="bg-cyber-card border border-cyber-border rounded-2xl p-8 text-center space-y-4">
            <p className="text-sm text-foreground">
              If an account exists for that email, a reset link is on its way.
            </p>
            {devLink && (
              <div className="text-left text-xs text-cyber-muted bg-cyber-dark border border-cyber-border rounded-lg p-3">
                <p className="mb-1 text-neon-purple">Email isn&apos;t connected yet — use this link:</p>
                <Link href={devLink.replace(/^https?:\/\/[^/]+/, "")} className="text-electric-blue break-all hover:underline">
                  {devLink}
                </Link>
              </div>
            )}
            <Link href="/login" className="text-sm text-neon-purple hover:underline inline-block">
              Back to sign in
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="bg-cyber-card border border-cyber-border rounded-2xl p-8 space-y-5">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                className="w-full px-4 py-2.5 bg-cyber-dark border border-cyber-border rounded-xl text-sm text-foreground placeholder:text-cyber-muted focus:outline-none focus:border-neon-purple/50"
              />
            </div>
            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-neon-purple to-electric-blue text-white font-medium text-sm hover:opacity-90 transition-opacity disabled:opacity-60"
            >
              Send reset link
            </button>
            <p className="text-center text-sm text-cyber-muted">
              <Link href="/login" className="text-neon-purple hover:underline">Back to sign in</Link>
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
