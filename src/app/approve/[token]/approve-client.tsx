"use client";

import { useState } from "react";
import { Check, MessageSquare, Zap } from "lucide-react";

interface ReviewAsset {
  name: string;
  type: string;
  content: string;
}

/** Per-asset approve / request-changes controls for the client link. */
export default function ApproveClient({
  token,
  projectTitle,
  assets,
}: {
  token: string;
  projectTitle: string;
  assets: ReviewAsset[];
}) {
  const [done, setDone] = useState<Record<string, string>>({});
  const [noteFor, setNoteFor] = useState<string | null>(null);
  const [note, setNote] = useState("");

  const send = async (assetName: string, action: "approve" | "changes", noteText = "") => {
    const res = await fetch(`/api/approve/${token}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ assetName, action, note: noteText }),
    }).catch(() => null);
    if (res?.ok) {
      setDone((prev) => ({ ...prev, [assetName]: action }));
      setNoteFor(null);
      setNote("");
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-cyber-border bg-cyber-dark/50 px-6 py-4">
        <div className="max-w-3xl mx-auto flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-neon-purple to-electric-blue flex items-center justify-center">
            <Zap className="w-4 h-4 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-foreground">{projectTitle}</h1>
            <p className="text-xs text-cyber-muted">
              Content review — approve each piece or request changes. No account needed.
            </p>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto p-6 space-y-4">
        {assets.length === 0 ? (
          <p className="text-center text-cyber-muted py-16">Nothing to review yet.</p>
        ) : (
          assets.map((a) => (
            <div key={a.name} className="bg-cyber-card border border-cyber-border rounded-xl p-5">
              <div className="flex items-start justify-between gap-3 mb-2">
                <div className="min-w-0">
                  <span className="text-[11px] font-medium text-neon-purple">{a.type}</span>
                  <p className="text-sm font-semibold text-foreground">{a.name}</p>
                </div>
                {done[a.name] ? (
                  <span
                    className={`shrink-0 text-xs px-3 py-1 rounded-full ${
                      done[a.name] === "approve"
                        ? "bg-success/10 border border-success/40 text-success"
                        : "bg-warning/10 border border-warning/40 text-warning"
                    }`}
                  >
                    {done[a.name] === "approve" ? "Approved" : "Changes requested"}
                  </span>
                ) : (
                  <div className="flex gap-2 shrink-0">
                    <button
                      onClick={() => send(a.name, "approve")}
                      className="px-3 py-1.5 rounded-lg bg-success/10 border border-success/40 text-success text-xs font-medium hover:bg-success/20 transition-colors flex items-center gap-1.5"
                    >
                      <Check className="w-3.5 h-3.5" /> Approve
                    </button>
                    <button
                      onClick={() => setNoteFor(noteFor === a.name ? null : a.name)}
                      className="px-3 py-1.5 rounded-lg bg-cyber-dark border border-cyber-border text-cyber-muted text-xs font-medium hover:text-foreground transition-colors flex items-center gap-1.5"
                    >
                      <MessageSquare className="w-3.5 h-3.5" /> Request changes
                    </button>
                  </div>
                )}
              </div>
              <pre className="text-xs text-cyber-muted whitespace-pre-wrap font-sans leading-relaxed max-h-48 overflow-y-auto">
                {a.content}
              </pre>
              {noteFor === a.name && (
                <div className="mt-3 flex gap-2">
                  <input
                    type="text"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="What should change?"
                    maxLength={1000}
                    className="flex-1 px-3 py-2 bg-cyber-dark border border-cyber-border rounded-lg text-xs text-foreground placeholder:text-cyber-muted focus:outline-none focus:border-neon-purple/50"
                  />
                  <button
                    onClick={() => send(a.name, "changes", note)}
                    disabled={!note.trim()}
                    className="px-4 py-2 rounded-lg bg-gradient-to-r from-neon-purple to-electric-blue text-white text-xs font-medium hover:opacity-90 disabled:opacity-50"
                  >
                    Send
                  </button>
                </div>
              )}
            </div>
          ))
        )}
        <p className="text-center text-[11px] text-cyber-muted pt-4">
          Powered by Virafold — one idea, folded into everything.
        </p>
      </main>
    </div>
  );
}
