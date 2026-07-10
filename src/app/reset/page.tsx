"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Zap, Eye, EyeOff, Check } from "lucide-react";

export default function ResetPage() {
  const router = useRouter();
  // Read the token once on client init (window is undefined during SSR).
  const [token] = useState(() =>
    typeof window !== "undefined"
      ? new URLSearchParams(window.location.search).get("token") ?? ""
      : ""
  );
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (password.length < 8) return setError("Password must be at least 8 characters");
    setSubmitting(true);
    try {
      const res = await fetch("/api/auth/reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      if (res.ok) {
        setDone(true);
        setTimeout(() => router.push("/login"), 1600);
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data?.error ?? "Could not reset password");
      }
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
          <h1 className="text-2xl font-bold text-foreground">Set a new password</h1>
        </div>

        {done ? (
          <div className="bg-cyber-card border border-cyber-border rounded-2xl p-8 text-center space-y-3">
            <div className="w-10 h-10 mx-auto rounded-full bg-success/20 flex items-center justify-center">
              <Check className="w-5 h-5 text-success" />
            </div>
            <p className="text-sm text-foreground">Password updated. Redirecting to sign in…</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="bg-cyber-card border border-cyber-border rounded-2xl p-8 space-y-5">
            {error && (
              <div className="px-4 py-2.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                {error}
              </div>
            )}
            {!token && (
              <div className="px-4 py-2.5 rounded-lg bg-warning/10 border border-warning/20 text-warning text-sm">
                Missing reset token — open the link from your email.
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">New password</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 8 characters"
                  className="w-full px-4 py-2.5 pr-10 bg-cyber-dark border border-cyber-border rounded-xl text-sm text-foreground placeholder:text-cyber-muted focus:outline-none focus:border-neon-purple/50"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-cyber-muted hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <button
              type="submit"
              disabled={submitting || !token}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-neon-purple to-electric-blue text-white font-medium text-sm hover:opacity-90 transition-opacity disabled:opacity-60"
            >
              Update password
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
