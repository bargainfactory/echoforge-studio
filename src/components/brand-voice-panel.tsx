"use client";

import { useEffect, useState } from "react";
import { Check, Loader2, Mic2, Save } from "lucide-react";
import { useApp } from "@/lib/context";
import { useTranslation } from "@/lib/i18n";
import { DEFAULT_VOICE, type BrandVoice } from "@/lib/data";

/**
 * Brand-voice profile editor shown in Settings. Every generation (project
 * uploads and single-asset regenerations) is steered by this profile.
 */
export default function BrandVoicePanel() {
  const { addToast } = useApp();
  const { t } = useTranslation();
  const [voice, setVoice] = useState<BrandVoice>({ ...DEFAULT_VOICE });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    let active = true;
    fetch("/api/voice", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => active && d?.voice && setVoice(d.voice))
      .catch(() => {})
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, []);

  const save = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/voice", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(voice),
      });
      if (res.ok) {
        const { voice: v } = await res.json();
        setVoice(v);
        setSaved(true);
        addToast(t("voice.saved"));
        setTimeout(() => setSaved(false), 2000);
      } else {
        addToast(t("voice.saveFailed"), "error");
      }
    } finally {
      setSaving(false);
    }
  };

  const field = (
    key: keyof Omit<BrandVoice, "emojis">,
    label: string,
    placeholder: string
  ) => (
    <div>
      <label className="block text-sm text-cyber-muted mb-1.5">{label}</label>
      <input
        type="text"
        value={voice[key]}
        onChange={(e) => setVoice({ ...voice, [key]: e.target.value })}
        placeholder={placeholder}
        disabled={loading}
        className="w-full px-4 py-2.5 bg-cyber-dark border border-cyber-border rounded-xl text-sm text-foreground placeholder:text-cyber-muted focus:outline-none focus:border-neon-purple/50 disabled:opacity-50"
      />
    </div>
  );

  return (
    <div className="bg-cyber-card border border-cyber-border rounded-xl p-6">
      <div className="flex items-center gap-2 mb-1">
        <Mic2 className="w-4 h-4 text-neon-purple" />
        <h3 className="font-semibold text-foreground">{t("voice.title")}</h3>
      </div>
      <p className="text-xs text-cyber-muted mb-5">{t("voice.desc")}</p>

      <div className="grid sm:grid-cols-2 gap-4">
        {field("tone", t("voice.tone"), t("voice.tonePh"))}
        {field("audience", t("voice.audience"), t("voice.audiencePh"))}
        {field("cta", t("voice.cta"), t("voice.ctaPh"))}
        {field("hashtags", t("voice.hashtags"), t("voice.hashtagsPh"))}
        {field("bannedWords", t("voice.banned"), t("voice.bannedPh"))}
        {field("signature", t("voice.signature"), t("voice.signaturePh"))}
      </div>

      <label className="flex items-center justify-between cursor-pointer mt-4">
        <div>
          <p className="text-sm text-foreground">{t("voice.emojis")}</p>
          <p className="text-xs text-cyber-muted">{t("voice.emojisDesc")}</p>
        </div>
        <button
          type="button"
          onClick={() => setVoice({ ...voice, emojis: !voice.emojis })}
          className={`w-11 h-6 rounded-full transition-colors relative shrink-0 ${voice.emojis ? "bg-neon-purple" : "bg-cyber-border"}`}
        >
          <div
            className="w-5 h-5 rounded-full bg-white absolute top-0.5 transition-transform"
            style={{ transform: voice.emojis ? "translateX(22px)" : "translateX(0)", left: "2px" }}
          />
        </button>
      </label>

      <button
        onClick={save}
        disabled={saving || loading}
        className="mt-5 px-5 py-2 rounded-xl bg-gradient-to-r from-neon-purple to-electric-blue text-white font-medium text-sm hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center gap-2"
      >
        {saving ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : saved ? (
          <Check className="w-4 h-4" />
        ) : (
          <Save className="w-4 h-4" />
        )}
        {saved ? t("dash.saved") : t("voice.save")}
      </button>
    </div>
  );
}
