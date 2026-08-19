"use client";

/**
 * Agency account switcher: acts as a managed client (the whole dashboard —
 * projects, voice, connections, metrics — becomes theirs), with a persistent
 * banner while delegated so there is never doubt whose account is live.
 */

import { useCallback, useEffect, useState } from "react";
import { ArrowLeftRight, Users } from "lucide-react";
import { useTranslation } from "@/lib/i18n";

interface ClientRow {
  clientEmail: string;
  name: string;
  status: "invited" | "active";
}

export default function ClientSwitcher() {
  const { t } = useTranslation();
  const [clients, setClients] = useState<ClientRow[]>([]);
  const [acting, setActing] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    fetch("/api/clients", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (!d) return;
        setClients((d.clients ?? []).filter((c: ClientRow) => c.status === "active"));
        setActing(d.acting ?? null);
      })
      .catch(() => {});
  }, []);

  const switchTo = useCallback(async (email: string) => {
    setBusy(true);
    const res = await fetch("/api/clients/act", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    }).catch(() => null);
    if (res?.ok) window.location.reload();
    else setBusy(false);
  }, []);

  if (clients.length === 0 && !acting) return null;
  const actingClient = clients.find((c) => c.clientEmail === acting);

  return (
    <>
      <select
        value={acting ?? ""}
        onChange={(e) => switchTo(e.target.value)}
        disabled={busy}
        title={t("clientsw.hint")}
        className="px-3 py-2 bg-cyber-dark border border-cyber-border rounded-lg text-xs text-foreground focus:outline-none focus:border-neon-purple/50 disabled:opacity-50 max-w-[180px]"
      >
        <option value="">{t("clientsw.me")}</option>
        {clients.map((c) => (
          <option key={c.clientEmail} value={c.clientEmail}>
            {c.name}
          </option>
        ))}
      </select>

      {acting && (
        <div className="fixed top-0 inset-x-0 z-[60] bg-warning/15 border-b border-warning/40 backdrop-blur-sm px-4 py-1.5 flex items-center justify-center gap-3 text-xs text-warning">
          <Users className="w-3.5 h-3.5 shrink-0" />
          <span>
            {t("clientsw.banner").replace("{name}", actingClient?.name ?? acting)}
          </span>
          <button
            onClick={() => switchTo("")}
            disabled={busy}
            className="underline font-medium hover:text-foreground transition-colors flex items-center gap-1 disabled:opacity-50"
          >
            <ArrowLeftRight className="w-3 h-3" /> {t("clientsw.back")}
          </button>
        </div>
      )}
    </>
  );
}
