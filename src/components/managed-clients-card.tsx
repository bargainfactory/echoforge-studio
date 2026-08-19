"use client";

/**
 * Settings panel for delegated access, both directions: the clients you
 * manage (invite, act as, unlink) and the agencies with access to you
 * (approve, decline, revoke).
 */

import { useCallback, useEffect, useState } from "react";
import { Briefcase, Check, Loader2, Plus, Trash2, X } from "lucide-react";
import { useApp } from "@/lib/context";
import { useTranslation } from "@/lib/i18n";

interface LinkRow {
  managerEmail: string;
  clientEmail: string;
  status: "invited" | "active";
  name: string;
  plan: string;
}

export default function ManagedClientsCard() {
  const { addToast } = useApp();
  const { t } = useTranslation();
  const [clients, setClients] = useState<LinkRow[]>([]);
  const [managers, setManagers] = useState<LinkRow[]>([]);
  const [limit, setLimit] = useState(0);
  const [invite, setInvite] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(() => {
    fetch("/api/clients", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (!d) return;
        setClients(d.clients ?? []);
        setManagers(d.managers ?? []);
        setLimit(d.limit ?? 0);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const sendInvite = useCallback(async () => {
    if (!invite.trim() || busy) return;
    setBusy(true);
    try {
      const res = await fetch("/api/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: invite.trim() }),
      });
      const d = await res.json().catch(() => null);
      if (res.ok) {
        setInvite("");
        addToast(d?.created ? t("clients.createdToast") : t("clients.invitedToast"));
        load();
      } else {
        addToast(d?.error ?? t("clients.inviteFailed"), "error");
      }
    } finally {
      setBusy(false);
    }
  }, [invite, busy, addToast, t, load]);

  const unlink = useCallback(
    async (email: string) => {
      await fetch("/api/clients", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      }).catch(() => {});
      addToast(t("clients.unlinked"), "info");
      load();
    },
    [addToast, t, load]
  );

  const approve = useCallback(
    async (manager: string) => {
      const res = await fetch("/api/clients/accept", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ manager }),
      }).catch(() => null);
      if (res?.ok) addToast(t("clients.approved"));
      load();
    },
    [addToast, t, load]
  );

  const actAs = useCallback(async (email: string) => {
    const res = await fetch("/api/clients/act", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    }).catch(() => null);
    if (res?.ok) window.location.reload();
  }, []);

  return (
    <div className="bg-cyber-card border border-cyber-border rounded-xl p-6">
      <div className="flex items-center gap-2 mb-1">
        <Briefcase className="w-4 h-4 text-neon-purple" />
        <h3 className="font-semibold text-foreground">{t("clients.title")}</h3>
      </div>
      <p className="text-xs text-cyber-muted mb-5">{t("clients.desc")}</p>

      {/* Clients you manage */}
      <div className="flex gap-2 mb-3">
        <input
          type="email"
          value={invite}
          onChange={(e) => setInvite(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && sendInvite()}
          placeholder={t("clients.invitePh")}
          className="flex-1 px-3 py-2 bg-cyber-dark border border-cyber-border rounded-lg text-sm text-foreground placeholder:text-cyber-muted focus:outline-none focus:border-neon-purple/50"
        />
        <button
          onClick={sendInvite}
          disabled={busy || !invite.trim()}
          className="px-4 py-2 rounded-lg bg-gradient-to-r from-neon-purple to-electric-blue text-white text-xs font-medium hover:opacity-90 disabled:opacity-50 flex items-center gap-1.5"
        >
          {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
          {t("clients.invite")}
        </button>
      </div>
      {limit > 0 && (
        <p className="text-[11px] text-cyber-muted mb-3">
          {t("clients.limitNote").replace("{used}", String(clients.length)).replace("{limit}", String(limit))}
        </p>
      )}
      {clients.length > 0 && (
        <div className="space-y-2 mb-6">
          {clients.map((c) => (
            <div
              key={c.clientEmail}
              className="flex items-center gap-3 bg-cyber-dark border border-cyber-border rounded-lg px-3 py-2.5"
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm text-foreground font-medium line-clamp-1">{c.name}</p>
                <p className="text-[11px] text-cyber-muted">{c.clientEmail}</p>
              </div>
              {c.status === "invited" ? (
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-warning/10 border border-warning/40 text-warning shrink-0">
                  {t("clients.pending")}
                </span>
              ) : (
                <button
                  onClick={() => actAs(c.clientEmail)}
                  className="text-xs text-neon-purple hover:underline shrink-0"
                >
                  {t("clients.actAs")}
                </button>
              )}
              <button
                onClick={() => unlink(c.clientEmail)}
                className="text-cyber-muted hover:text-red-400 transition-colors shrink-0"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Agencies with access to you */}
      {managers.length > 0 && (
        <div>
          <p className="text-xs font-medium text-cyber-muted mb-2">{t("clients.managersTitle")}</p>
          <div className="space-y-2">
            {managers.map((m) => (
              <div
                key={m.managerEmail}
                className="flex items-center gap-3 bg-cyber-dark border border-cyber-border rounded-lg px-3 py-2.5"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-foreground font-medium line-clamp-1">{m.name}</p>
                  <p className="text-[11px] text-cyber-muted">{m.managerEmail}</p>
                </div>
                {m.status === "invited" ? (
                  <>
                    <button
                      onClick={() => approve(m.managerEmail)}
                      className="px-3 py-1.5 rounded-lg bg-success/10 border border-success/40 text-success text-xs font-medium hover:bg-success/20 flex items-center gap-1"
                    >
                      <Check className="w-3 h-3" /> {t("clients.approve")}
                    </button>
                    <button
                      onClick={() => unlink(m.managerEmail)}
                      className="px-3 py-1.5 rounded-lg bg-cyber-card border border-cyber-border text-cyber-muted text-xs hover:text-foreground flex items-center gap-1"
                    >
                      <X className="w-3 h-3" /> {t("clients.decline")}
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => unlink(m.managerEmail)}
                    className="text-xs text-red-400 hover:underline shrink-0"
                  >
                    {t("clients.revoke")}
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
