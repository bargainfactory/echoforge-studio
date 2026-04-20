"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useApp } from "@/lib/context";
import { useTranslation } from "@/lib/i18n";
import { Zap, Eye, EyeOff } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const { login } = useApp();
  const { t } = useTranslation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!email) return setError(t("auth.emailRequired"));
    if (!password) return setError(t("auth.passwordRequired"));
    if (password.length < 6) return setError(t("auth.passwordLength"));
    const ok = login(email, password);
    if (ok) router.push("/dashboard");
    else setError(t("auth.loginFailed"));
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-neon-purple/5 rounded-full blur-[128px]" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-electric-blue/5 rounded-full blur-[128px]" />

      <div className="relative w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-6">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-neon-purple to-electric-blue flex items-center justify-center">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold gradient-text">EchoForge</span>
          </Link>
          <h1 className="text-2xl font-bold text-foreground">{t("auth.welcomeBack")}</h1>
          <p className="text-sm text-cyber-muted mt-1">{t("auth.signInDesc")}</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-cyber-card border border-cyber-border rounded-2xl p-8 space-y-5">
          {error && (
            <div className="px-4 py-2.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">{t("auth.email")}</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full px-4 py-2.5 bg-cyber-dark border border-cyber-border rounded-xl text-sm text-foreground placeholder:text-cyber-muted focus:outline-none focus:border-neon-purple/50"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">{t("auth.password")}</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
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
            className="w-full py-3 rounded-xl bg-gradient-to-r from-neon-purple to-electric-blue text-white font-medium text-sm hover:opacity-90 transition-opacity"
          >
            {t("auth.signIn")}
          </button>

          <p className="text-center text-sm text-cyber-muted">
            {t("auth.noAccount")}{" "}
            <Link href="/signup" className="text-neon-purple hover:underline">
              {t("auth.signUp")}
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
