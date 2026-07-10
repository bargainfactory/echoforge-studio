"use client";

import { useCallback, useEffect, useState } from "react";
import { Check, Plug, Loader2 } from "lucide-react";
import { useApp } from "@/lib/context";

interface FieldStatus {
  key: string;
  label: string;
  secret: boolean;
  required: boolean;
  placeholder?: string;
  present: boolean;
  fromEnv: boolean;
}
interface IntegrationStatus {
  name: string;
  label: string;
  description: string;
  docsHint?: string;
  configured: boolean;
  fields: FieldStatus[];
}

export default function IntegrationsPanel() {
  const { addToast } = useApp();
  const [items, setItems] = useState<IntegrationStatus[] | null>(null);
  const [drafts, setDrafts] = useState<Record<string, Record<string, string>>>({});
  const [saving, setSaving] = useState<string | null>(null);

  const load = useCallback(async () => {
    const res = await fetch("/api/integrations", { cache: "no-store" });
    if (res.ok) {
      const data = await res.json();
      setItems(data.integrations);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const setField = (name: string, key: string, value: string) =>
    setDrafts((d) => ({ ...d, [name]: { ...(d[name] ?? {}), [key]: value } }));

  const save = useCallback(
    async (name: string) => {
      const payload = drafts[name] ?? {};
      // Only send fields the user actually typed into.
      const filtered = Object.fromEntries(
        Object.entries(payload).filter(([, v]) => v.trim() !== "")
      );
      if (Object.keys(filtered).length === 0) {
        addToast("Enter a value to save", "info");
        return;
      }
      setSaving(name);
      try {
        const res = await fetch(`/api/integrations/${name}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(filtered),
        });
        if (res.ok) {
          addToast("Integration saved");
          setDrafts((d) => ({ ...d, [name]: {} }));
          await load();
        } else {
          addToast("Could not save integration", "error");
        }
      } finally {
        setSaving(null);
      }
    },
    [drafts, addToast, load]
  );

  return (
    <div className="bg-cyber-card border border-cyber-border rounded-xl p-6">
      <div className="flex items-center gap-2 mb-1">
        <Plug className="w-4 h-4 text-neon-purple" />
        <h3 className="font-semibold text-foreground">Integrations</h3>
      </div>
      <p className="text-xs text-cyber-muted mb-5">
        Connect keys to activate real features. Everything works without them — this is where you turn on the real thing when ready.
      </p>

      {!items ? (
        <div className="flex justify-center py-8">
          <Loader2 className="w-5 h-5 text-cyber-muted animate-spin" />
        </div>
      ) : (
        <div className="space-y-4">
          {items.map((it) => (
            <div key={it.name} className="border border-cyber-border rounded-xl p-4">
              <div className="flex items-start justify-between gap-3 mb-1">
                <p className="text-sm font-medium text-foreground">{it.label}</p>
                <span
                  className={`text-xs px-2 py-0.5 rounded-full whitespace-nowrap ${
                    it.configured ? "text-success bg-success/10" : "text-cyber-muted bg-cyber-dark"
                  }`}
                >
                  {it.configured ? (
                    <span className="inline-flex items-center gap-1">
                      <Check className="w-3 h-3" /> Connected
                    </span>
                  ) : (
                    "Not connected"
                  )}
                </span>
              </div>
              <p className="text-xs text-cyber-muted mb-3">{it.description}</p>

              <div className="space-y-2.5">
                {it.fields.map((f) => (
                  <div key={f.key}>
                    <label className="block text-[11px] text-cyber-muted mb-1">
                      {f.label}
                      {f.required && <span className="text-red-400/70"> *</span>}
                      {f.fromEnv && <span className="ml-2 text-neon-purple">set via environment</span>}
                      {!f.fromEnv && f.present && <span className="ml-2 text-success">saved</span>}
                    </label>
                    <input
                      type={f.secret ? "password" : "text"}
                      disabled={f.fromEnv}
                      value={drafts[it.name]?.[f.key] ?? ""}
                      onChange={(e) => setField(it.name, f.key, e.target.value)}
                      placeholder={f.fromEnv ? "Provided by environment variable" : f.present ? "•••••••• (saved — enter to replace)" : f.placeholder}
                      className="w-full px-3 py-2 bg-cyber-dark border border-cyber-border rounded-lg text-xs text-foreground placeholder:text-cyber-muted focus:outline-none focus:border-neon-purple/50 disabled:opacity-50"
                    />
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-between mt-3">
                {it.docsHint && <p className="text-[11px] text-cyber-muted">{it.docsHint}</p>}
                <button
                  onClick={() => save(it.name)}
                  disabled={saving === it.name}
                  className="ml-auto px-3 py-1.5 rounded-lg bg-gradient-to-r from-neon-purple to-electric-blue text-white text-xs font-medium hover:opacity-90 transition-opacity disabled:opacity-60"
                >
                  {saving === it.name ? "Saving…" : "Save"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
