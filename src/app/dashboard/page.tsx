"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useApp } from "@/lib/context";
import { useTranslation } from "@/lib/i18n";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  Film,
  BarChart3,
  Bell,
  Settings,
  Upload,
  Clock,
  CheckCircle,
  Eye,
  ThumbsUp,
  TrendingUp,
  Zap,
  LogOut,
  X,
  Trash2,
  FileVideo,
  Save,
  Check,
  Sparkles,
  Copy,
  FileText,
  Calendar,
  Send,
  Pencil,
  RefreshCw,
  Loader2,
  ShieldCheck,
  ShieldAlert,
  Fingerprint,
  Plus,
  ChevronLeft,
  ChevronRight,
  List,
} from "lucide-react";
import type { Project, Asset } from "@/lib/data";
import IntegrationsPanel from "@/components/integrations-panel";
import BrandVoicePanel from "@/components/brand-voice-panel";

type Tab = "Overview" | "Projects" | "Upload" | "Schedule" | "Analytics" | "Notifications" | "Settings";

const sidebarItems: { icon: typeof LayoutDashboard; label: Tab; tKey: string }[] = [
  { icon: LayoutDashboard, label: "Overview", tKey: "dash.overview" },
  { icon: Film, label: "Projects", tKey: "dash.projects" },
  { icon: Upload, label: "Upload", tKey: "dash.upload" },
  { icon: Calendar, label: "Schedule", tKey: "dash.schedule" },
  { icon: BarChart3, label: "Analytics", tKey: "dash.analytics" },
  { icon: Bell, label: "Notifications", tKey: "dash.notifications" },
  { icon: Settings, label: "Settings", tKey: "dash.settings" },
];

const statusColorMap: Record<string, string> = {
  uploading: "text-electric-blue bg-electric-blue/10",
  processing: "text-warning bg-warning/10",
  review: "text-neon-purple bg-neon-purple/10",
  published: "text-success bg-success/10",
  rejected: "text-red-400 bg-red-400/10",
};

export default function Dashboard() {
  const router = useRouter();
  const {
    user,
    ready,
    projects,
    assets,
    notifications,
    logout,
    uploadProject,
    approveProject,
    removeProject,
    toggleAssetLike,
    editAsset,
    regenerateAsset,
    markNotificationRead,
    markAllNotificationsRead,
    addToast,
  } = useApp();
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<Tab>("Overview");
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadTranscript, setUploadTranscript] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadPct, setUploadPct] = useState(0);
  const [viewingAsset, setViewingAsset] = useState<Asset | null>(null);
  const [editDraft, setEditDraft] = useState<string | null>(null);
  const [savingEdit, setSavingEdit] = useState(false);
  const [regenFeedback, setRegenFeedback] = useState("");
  const [regenerating, setRegenerating] = useState(false);
  const [lint, setLint] = useState<{
    risk: "high" | "medium" | "low" | "clean";
    findings: { severity: string; category: string; term: string; snippet: string }[];
  } | null>(null);
  const [prov, setProv] = useState<{ engine: string; actions: number; valid: boolean } | null>(null);
  const [schedulePlatform, setSchedulePlatform] = useState("TikTok");
  const [scheduleAt, setScheduleAt] = useState("");
  const [settingsForm, setSettingsForm] = useState({
    name: "",
    email: "",
    notifications: true,
    autoPublish: false,
  });
  const [settingsSaved, setSettingsSaved] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleLogout = useCallback(() => {
    logout();
    router.push("/");
  }, [logout, router]);

  const resetUpload = useCallback(() => {
    setUploadFile(null);
    setUploadTranscript("");
    setUploading(false);
    setUploadPct(0);
  }, []);

  // Leaving edit/regenerate state behind when switching assets would apply it
  // to the wrong asset — reset whenever the viewer target changes.
  useEffect(() => {
    setEditDraft(null);
    setRegenFeedback("");
  }, [viewingAsset?.id]);

  // Policy lint and provenance track the asset's current text, so re-run after
  // edits and regenerations too (content in the dependency list), not just on open.
  useEffect(() => {
    setLint(null);
    setProv(null);
    if (!viewingAsset?.id) return;
    let active = true;
    fetch(`/api/assets/${viewingAsset.id}/lint`, { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => active && d && setLint(d.lint))
      .catch(() => {});
    fetch(`/api/assets/${viewingAsset.id}/provenance`, { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (!active || !d?.provenance) return;
        const actions: { engine?: string }[] = d.provenance.manifest.actions ?? [];
        const lastEngine =
          [...actions].reverse().find((a) => a.engine)?.engine ?? "—";
        setProv({ engine: lastEngine, actions: actions.length, valid: d.provenance.valid });
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [viewingAsset?.id, viewingAsset?.content]);

  const handleSaveEdit = useCallback(async () => {
    if (!viewingAsset || editDraft === null) return;
    setSavingEdit(true);
    const updated = await editAsset(viewingAsset.id, { content: editDraft });
    setSavingEdit(false);
    if (updated) {
      setViewingAsset(updated);
      setEditDraft(null);
      addToast(t("asset.updated"));
    } else {
      addToast(t("asset.updateFailed"), "error");
    }
  }, [viewingAsset, editDraft, editAsset, addToast, t]);

  const handleRegenerate = useCallback(async () => {
    if (!viewingAsset || regenerating) return;
    setRegenerating(true);
    const updated = await regenerateAsset(viewingAsset.id, regenFeedback);
    setRegenerating(false);
    if (updated) {
      setViewingAsset(updated);
      setRegenFeedback("");
      setEditDraft(null);
      addToast(t("asset.regenDone"));
    } else {
      addToast(t("asset.regenFailed"), "error");
    }
  }, [viewingAsset, regenerating, regenFeedback, regenerateAsset, addToast, t]);

  const handleSchedule = useCallback(async () => {
    if (!viewingAsset || !scheduleAt) return;
    const res = await fetch("/api/schedule", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        assetId: viewingAsset.id,
        assetName: viewingAsset.name,
        platform: schedulePlatform,
        scheduledAt: scheduleAt,
      }),
    });
    if (res.ok) {
      addToast(`Scheduled to ${schedulePlatform}`);
      setViewingAsset(null);
      setScheduleAt("");
    } else {
      addToast("Could not schedule", "error");
    }
  }, [viewingAsset, scheduleAt, schedulePlatform, addToast]);

  const handleGenerate = useCallback(async () => {
    if (!uploadFile && !uploadTranscript.trim()) return;
    setUploading(true);
    setUploadPct(0);
    const project = await uploadProject(uploadFile, uploadTranscript, setUploadPct);
    setUploading(false);
    if (project) {
      setShowUploadModal(false);
      resetUpload();
      setActiveTab("Projects");
    }
  }, [uploadFile, uploadTranscript, uploadProject, resetUpload]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  if (!ready) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-cyber-border border-t-neon-purple animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-bold text-foreground mb-2">{t("dash.pleaseSignIn")}</h2>
          <p className="text-cyber-muted mb-6">{t("dash.signInRequired")}</p>
          <Link
            href="/login"
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-neon-purple to-electric-blue text-white font-medium text-sm"
          >
            {t("dash.goToLogin")}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <aside className="hidden lg:flex w-64 border-r border-cyber-border bg-cyber-dark flex-col">
        <div className="p-6 border-b border-cyber-border">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-neon-purple to-electric-blue flex items-center justify-center">
              <Zap className="w-4 h-4 text-white" />
            </div>
            <span className="text-lg font-bold gradient-text">EchoForge</span>
          </Link>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {sidebarItems.map((item) => (
            <button
              key={item.label}
              onClick={() => setActiveTab(item.label)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                activeTab === item.label
                  ? "bg-neon-purple/10 text-neon-purple"
                  : "text-cyber-muted hover:text-foreground hover:bg-cyber-card"
              }`}
            >
              <item.icon className="w-4 h-4" />
              {t(item.tKey)}
              {item.label === "Notifications" && unreadCount > 0 && (
                <span className="ml-auto w-5 h-5 rounded-full bg-neon-purple text-white text-xs flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-cyber-border">
          <div className="flex items-center gap-3 px-3 py-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-neon-purple to-electric-blue flex items-center justify-center text-white text-xs font-bold">
              {user.initials}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">{user.name}</p>
              <p className="text-xs text-cyber-muted">{user.plan}</p>
            </div>
            <button onClick={handleLogout} className="text-cyber-muted hover:text-red-400 transition-colors" title={t("dash.logOut")}>
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <header className="border-b border-cyber-border bg-cyber-dark/50 backdrop-blur-sm px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-foreground">
                {t(sidebarItems.find((i) => i.label === activeTab)?.tKey ?? activeTab)}
              </h1>
              <p className="text-sm text-cyber-muted">{t("dash.welcomeBack", { name: user.name })}</p>
            </div>
            <button
              onClick={() => setShowUploadModal(true)}
              className="px-4 py-2 rounded-lg bg-gradient-to-r from-neon-purple to-electric-blue text-white text-sm font-medium hover:opacity-90 transition-opacity flex items-center gap-2"
            >
              <Upload className="w-4 h-4" />
              {t("dash.newUpload")}
            </button>
          </div>

          {/* Mobile tabs */}
          <div className="lg:hidden flex gap-1 mt-4 overflow-x-auto pb-1">
            {sidebarItems.map((item) => (
              <button
                key={item.label}
                onClick={() => setActiveTab(item.label)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                  activeTab === item.label
                    ? "bg-neon-purple/10 text-neon-purple"
                    : "text-cyber-muted"
                }`}
              >
                {t(item.tKey)}
              </button>
            ))}
          </div>
        </header>

        <div className="p-6">
          {activeTab === "Overview" && (
            <OverviewTab
              projects={projects}
              assets={assets}
              onApprove={approveProject}
              onToggleLike={toggleAssetLike}
              onViewAll={() => setActiveTab("Projects")}
              onView={setViewingAsset}
            />
          )}
          {activeTab === "Projects" && (
            <ProjectsTab
              projects={projects}
              onApprove={approveProject}
              onRemove={removeProject}
            />
          )}
          {activeTab === "Upload" && (
            <UploadTab
              onPickFile={(f) => {
                setUploadFile(f);
                setShowUploadModal(true);
              }}
              onStart={() => setShowUploadModal(true)}
            />
          )}
          {activeTab === "Schedule" && <ScheduleTab />}
          {activeTab === "Analytics" && <AnalyticsTab />}
          {activeTab === "Notifications" && (
            <NotificationsTab
              notifications={notifications}
              onMarkRead={markNotificationRead}
              onMarkAllRead={markAllNotificationsRead}
            />
          )}
          {activeTab === "Settings" && (
            <SettingsTab
              user={user}
              form={settingsForm}
              setForm={setSettingsForm}
              saved={settingsSaved}
              onSave={() => {
                setSettingsSaved(true);
                addToast(t("dash.settingsSaved"));
                setTimeout(() => setSettingsSaved(false), 2000);
              }}
            />
          )}
        </div>
      </main>

      {/* Upload / Generate Modal */}
      <AnimatePresence>
        {showUploadModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => !uploading && setShowUploadModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-cyber-card border border-cyber-border rounded-2xl p-8 w-full max-w-lg max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-lg font-semibold text-foreground">{t("dash.uploadContent")}</h3>
                <button
                  onClick={() => !uploading && setShowUploadModal(false)}
                  className="text-cyber-muted hover:text-foreground disabled:opacity-40"
                  disabled={uploading}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Optional media file */}
              <div
                className="border-2 border-dashed border-cyber-border hover:border-neon-purple/50 rounded-xl p-6 text-center cursor-pointer transition-colors mb-4"
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  if (e.dataTransfer.files?.[0]) setUploadFile(e.dataTransfer.files[0]);
                }}
              >
                <FileVideo className="w-8 h-8 text-cyber-muted mx-auto mb-2" />
                {uploadFile ? (
                  <p className="text-sm text-foreground font-medium">{uploadFile.name}</p>
                ) : (
                  <>
                    <p className="text-sm text-foreground font-medium">{t("dash.dropFile")}</p>
                    <p className="text-xs text-cyber-muted">{t("dash.fileTypes")} · optional</p>
                  </>
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="video/*,audio/*"
                className="hidden"
                onChange={(e) => e.target.files?.[0] && setUploadFile(e.target.files[0])}
              />

              {/* Transcript / script — drives generation */}
              <label className="block text-sm font-medium text-foreground mb-1.5">
                {t("dash.transcriptLabel")}
              </label>
              <textarea
                value={uploadTranscript}
                onChange={(e) => setUploadTranscript(e.target.value)}
                placeholder={t("dash.transcriptPlaceholder")}
                rows={6}
                className="w-full px-3 py-2.5 bg-cyber-dark border border-cyber-border rounded-xl text-sm text-foreground placeholder:text-cyber-muted focus:outline-none focus:border-neon-purple/50 resize-y"
              />
              <p className="text-xs text-cyber-muted mt-1.5 mb-4">{t("dash.transcriptHint")}</p>

              {uploading && (
                <div className="mb-4">
                  <div className="flex justify-between text-xs text-cyber-muted mb-1">
                    <span>{uploadPct < 100 ? t("dash.uploadingLabel") : t("dash.generatingLabel")}</span>
                    <span>{uploadPct}%</span>
                  </div>
                  <div className="h-1.5 bg-cyber-border rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-neon-purple to-electric-blue transition-all"
                      style={{ width: `${uploadPct}%` }}
                    />
                  </div>
                </div>
              )}

              <button
                onClick={handleGenerate}
                disabled={uploading || (!uploadFile && !uploadTranscript.trim())}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-neon-purple to-electric-blue text-white font-medium text-sm hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <Sparkles className="w-4 h-4" />
                {uploading ? t("dash.generatingLabel") : t("dash.generateBtn")}
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Asset viewer */}
      <AnimatePresence>
        {viewingAsset && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setViewingAsset(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-cyber-card border border-cyber-border rounded-2xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden"
            >
              <div className="flex items-center justify-between px-6 py-4 border-b border-cyber-border">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-lg bg-cyber-dark border border-cyber-border flex items-center justify-center shrink-0">
                    <FileText className="w-4 h-4 text-neon-purple" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{viewingAsset.name}</p>
                    <p className="text-xs text-cyber-muted">{viewingAsset.type}</p>
                  </div>
                </div>
                <button onClick={() => setViewingAsset(null)} className="text-cyber-muted hover:text-foreground shrink-0">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-6 overflow-y-auto">
                {editDraft !== null ? (
                  <textarea
                    value={editDraft}
                    onChange={(e) => setEditDraft(e.target.value)}
                    rows={14}
                    className="w-full px-3 py-2.5 bg-cyber-dark border border-cyber-border rounded-xl text-sm text-foreground focus:outline-none focus:border-neon-purple/50 resize-y font-sans leading-relaxed"
                  />
                ) : (
                  <pre className="whitespace-pre-wrap font-sans text-sm text-foreground/90 leading-relaxed">
                    {viewingAsset.content || "No content generated for this asset."}
                  </pre>
                )}
              </div>
              <div className="px-6 py-4 border-t border-cyber-border space-y-3">
                {/* Policy check */}
                {lint && (
                  <div
                    className={`rounded-lg border px-3 py-2.5 ${
                      lint.risk === "high"
                        ? "border-red-400/40 bg-red-400/5"
                        : lint.risk === "medium"
                          ? "border-warning/40 bg-warning/5"
                          : lint.risk === "low"
                            ? "border-electric-blue/30 bg-electric-blue/5"
                            : "border-success/30 bg-success/5"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      {lint.risk === "clean" ? (
                        <ShieldCheck className="w-4 h-4 text-success shrink-0" />
                      ) : (
                        <ShieldAlert
                          className={`w-4 h-4 shrink-0 ${
                            lint.risk === "high"
                              ? "text-red-400"
                              : lint.risk === "medium"
                                ? "text-warning"
                                : "text-electric-blue"
                          }`}
                        />
                      )}
                      <span className="text-xs font-medium text-foreground">
                        {t("lint.title")}:{" "}
                        {lint.risk === "clean"
                          ? t("lint.clean")
                          : lint.risk === "high"
                            ? t("lint.riskHigh")
                            : lint.risk === "medium"
                              ? t("lint.riskMedium")
                              : t("lint.riskLow")}
                      </span>
                    </div>
                    {lint.findings.length > 0 && (
                      <ul className="mt-2 space-y-1">
                        {lint.findings.slice(0, 5).map((f, i) => (
                          <li key={`${f.term}-${i}`} className="text-[11px] text-cyber-muted leading-relaxed">
                            <span
                              className={`font-medium ${
                                f.severity === "high"
                                  ? "text-red-400"
                                  : f.severity === "medium"
                                    ? "text-warning"
                                    : "text-electric-blue"
                              }`}
                            >
                              {t(`lint.cat.${f.category}`)}
                            </span>{" "}
                            — “{f.term}”: {f.snippet}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}

                {/* Provenance */}
                {prov && (
                  <div className="flex items-center gap-2 text-[11px] text-cyber-muted">
                    <Fingerprint className="w-3.5 h-3.5 text-neon-purple shrink-0" />
                    <span>
                      {t("prov.title")}: {prov.engine} · {t("prov.actions", { count: prov.actions })} ·{" "}
                      <span className={prov.valid ? "text-success" : "text-red-400"}>
                        {prov.valid ? t("prov.sigValid") : t("prov.sigInvalid")}
                      </span>
                    </span>
                  </div>
                )}

                {/* Edit + regenerate */}
                <div className="flex flex-wrap items-center gap-2">
                  {editDraft === null ? (
                    <button
                      onClick={() => setEditDraft(viewingAsset.content || "")}
                      className="px-3 py-2 rounded-lg bg-cyber-dark border border-cyber-border text-xs font-medium text-foreground hover:border-neon-purple/50 transition-colors flex items-center gap-1.5"
                    >
                      <Pencil className="w-3.5 h-3.5" /> {t("asset.edit")}
                    </button>
                  ) : (
                    <>
                      <button
                        onClick={handleSaveEdit}
                        disabled={savingEdit}
                        className="px-3 py-2 rounded-lg bg-gradient-to-r from-neon-purple to-electric-blue text-white text-xs font-medium hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center gap-1.5"
                      >
                        {savingEdit ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Check className="w-3.5 h-3.5" />
                        )}
                        {t("asset.editSave")}
                      </button>
                      <button
                        onClick={() => setEditDraft(null)}
                        disabled={savingEdit}
                        className="px-3 py-2 rounded-lg bg-cyber-dark border border-cyber-border text-xs text-cyber-muted hover:text-foreground transition-colors"
                      >
                        {t("asset.editCancel")}
                      </button>
                    </>
                  )}
                  <input
                    type="text"
                    value={regenFeedback}
                    onChange={(e) => setRegenFeedback(e.target.value)}
                    placeholder={t("asset.regenPh")}
                    maxLength={500}
                    className="flex-1 min-w-[160px] px-3 py-2 bg-cyber-dark border border-cyber-border rounded-lg text-xs text-foreground placeholder:text-cyber-muted focus:outline-none focus:border-neon-purple/50"
                  />
                  <button
                    onClick={handleRegenerate}
                    disabled={regenerating}
                    className="px-3 py-2 rounded-lg bg-cyber-dark border border-neon-purple/40 text-xs font-medium text-neon-purple hover:bg-neon-purple/10 transition-colors disabled:opacity-50 flex items-center gap-1.5"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${regenerating ? "animate-spin" : ""}`} />
                    {regenerating ? t("asset.regenerating") : t("asset.regen")}
                  </button>
                </div>
                <div className="flex flex-wrap items-end gap-2">
                  <div className="flex-1 min-w-[120px]">
                    <label className="block text-[11px] text-cyber-muted mb-1">Platform</label>
                    <select
                      value={schedulePlatform}
                      onChange={(e) => setSchedulePlatform(e.target.value)}
                      className="w-full px-3 py-2 bg-cyber-dark border border-cyber-border rounded-lg text-sm text-foreground focus:outline-none focus:border-neon-purple/50"
                    >
                      {["TikTok", "YouTube", "Instagram", "LinkedIn", "X"].map((p) => (
                        <option key={p} value={p}>{p}</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex-1 min-w-[160px]">
                    <label className="block text-[11px] text-cyber-muted mb-1">Publish at</label>
                    <input
                      type="datetime-local"
                      value={scheduleAt}
                      onChange={(e) => setScheduleAt(e.target.value)}
                      className="w-full px-3 py-2 bg-cyber-dark border border-cyber-border rounded-lg text-sm text-foreground focus:outline-none focus:border-neon-purple/50"
                    />
                  </div>
                  <button
                    onClick={handleSchedule}
                    disabled={!scheduleAt}
                    className="px-4 py-2 rounded-lg bg-gradient-to-r from-neon-purple to-electric-blue text-white text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center gap-2"
                  >
                    <Calendar className="w-4 h-4" /> Schedule
                  </button>
                </div>
                <button
                  onClick={() => {
                    navigator.clipboard?.writeText(viewingAsset.content || "");
                    addToast("Copied to clipboard");
                  }}
                  className="text-xs text-cyber-muted hover:text-foreground transition-colors flex items-center gap-1.5"
                >
                  <Copy className="w-3.5 h-3.5" /> Copy content
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// --- Overview Tab ---
function OverviewTab({
  projects,
  assets,
  onApprove,
  onToggleLike,
  onViewAll,
  onView,
}: {
  projects: Project[];
  assets: Asset[];
  onApprove: (id: string) => void;
  onToggleLike: (id: string) => void;
  onViewAll: () => void;
  onView: (asset: Asset) => void;
}) {
  const { t } = useTranslation();
  const activeCount = projects.filter((p) => p.status === "processing" || p.status === "review").length;
  const publishedCount = projects.filter((p) => p.status === "published").length;

  const statusConfig: Record<string, { label: string; color: string }> = {
    uploading: { label: t("dash.uploading"), color: statusColorMap.uploading },
    processing: { label: t("dash.processing"), color: statusColorMap.processing },
    review: { label: t("dash.readyForReview"), color: statusColorMap.review },
    published: { label: t("dash.published"), color: statusColorMap.published },
    rejected: { label: t("dash.rejected"), color: statusColorMap.rejected },
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: t("dashTeaser.activeProjects"), value: String(activeCount), icon: Clock, color: "text-warning" },
          { label: t("dash.totalAssets"), value: String(assets.length), icon: Film, color: "text-neon-purple" },
          { label: t("dash.published"), value: String(publishedCount), icon: CheckCircle, color: "text-success" },
          { label: t("dash.totalProjects"), value: String(projects.length), icon: TrendingUp, color: "text-electric-blue" },
        ].map((stat) => (
          <div key={stat.label} className="bg-cyber-card border border-cyber-border rounded-xl p-4">
            <stat.icon className={`w-5 h-5 ${stat.color} mb-2`} />
            <p className="text-2xl font-bold text-foreground">{stat.value}</p>
            <p className="text-xs text-cyber-muted mt-1">{stat.label}</p>
          </div>
        ))}
      </div>

      <div className="bg-cyber-card border border-cyber-border rounded-xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-cyber-border">
          <h2 className="font-semibold text-foreground">{t("dash.recentProjects")}</h2>
          <button onClick={onViewAll} className="text-xs text-neon-purple hover:underline">{t("dash.viewAll")}</button>
        </div>
        <div className="divide-y divide-cyber-border">
          {projects.slice(0, 4).map((project) => {
            const config = statusConfig[project.status] || statusConfig.processing;
            return (
              <div key={project.id} className="flex items-center gap-4 px-6 py-4 hover:bg-cyber-dark/30 transition-colors">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{project.title}</p>
                  <div className="flex items-center gap-3 mt-1.5">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${config.color}`}>{config.label}</span>
                    <span className="text-xs text-cyber-muted">{project.assetsReady}/{project.assetsTotal} assets</span>
                  </div>
                </div>
                <div className="hidden sm:block w-40">
                  <div className="h-1.5 bg-cyber-border rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${project.status === "published" ? "bg-success" : "bg-gradient-to-r from-neon-purple to-electric-blue"}`}
                      style={{ width: `${project.progress}%` }}
                    />
                  </div>
                </div>
                {project.status === "review" && (
                  <button
                    onClick={() => onApprove(project.id)}
                    className="px-4 py-1.5 text-xs font-medium rounded-lg bg-gradient-to-r from-neon-purple to-electric-blue text-white hover:opacity-90"
                  >
                    {t("dash.approvePublish")}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="bg-cyber-card border border-cyber-border rounded-xl">
        <div className="px-6 py-4 border-b border-cyber-border">
          <h2 className="font-semibold text-foreground">{t("dash.recentAssets")}</h2>
        </div>
        <div className="divide-y divide-cyber-border">
          {assets.slice(0, 6).map((asset) => (
            <div key={asset.id} className="flex items-center gap-4 px-6 py-3 hover:bg-cyber-dark/30 transition-colors">
              <button
                onClick={() => onView(asset)}
                className="w-10 h-10 rounded-lg bg-cyber-dark border border-cyber-border flex items-center justify-center hover:border-neon-purple/50 transition-colors shrink-0"
                title="View asset"
              >
                <Eye className="w-4 h-4 text-cyber-muted" />
              </button>
              <button onClick={() => onView(asset)} className="flex-1 min-w-0 text-left">
                <p className="text-sm text-foreground truncate hover:text-neon-purple transition-colors">{asset.name}</p>
                <p className="text-xs text-cyber-muted">{asset.type}</p>
              </button>
              <span className="text-xs text-cyber-muted hidden sm:inline">{asset.views}</span>
              <span className={`text-xs px-2 py-0.5 rounded-full capitalize ${asset.status === "live" || asset.status === "sent" ? "text-success bg-success/10" : "text-cyber-muted bg-cyber-dark"}`}>
                {asset.status}
              </span>
              <button onClick={() => onToggleLike(asset.id)} className="transition-colors">
                <ThumbsUp className={`w-4 h-4 ${asset.liked ? "text-neon-purple fill-neon-purple" : "text-cyber-muted hover:text-neon-purple"}`} />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// --- Projects Tab ---
function ProjectsTab({
  projects,
  onApprove,
  onRemove,
}: {
  projects: Project[];
  onApprove: (id: string) => void;
  onRemove: (id: string) => void;
}) {
  const { t } = useTranslation();
  const [filter, setFilter] = useState<string>("all");
  const filtered = filter === "all" ? projects : projects.filter((p) => p.status === filter);

  const statusConfig: Record<string, { label: string; color: string }> = {
    uploading: { label: t("dash.uploading"), color: statusColorMap.uploading },
    processing: { label: t("dash.processing"), color: statusColorMap.processing },
    review: { label: t("dash.readyForReview"), color: statusColorMap.review },
    published: { label: t("dash.published"), color: statusColorMap.published },
    rejected: { label: t("dash.rejected"), color: statusColorMap.rejected },
  };

  const filterLabels: Record<string, string> = {
    all: t("blog.all"),
    processing: t("dash.processing"),
    review: t("dash.readyForReview"),
    published: t("dash.published"),
  };

  return (
    <div className="space-y-6">
      <div className="flex gap-2 flex-wrap">
        {["all", "processing", "review", "published"].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-colors ${
              filter === f ? "bg-neon-purple/20 text-neon-purple border border-neon-purple/30" : "bg-cyber-card border border-cyber-border text-cyber-muted"
            }`}
          >
            {filterLabels[f] ?? f}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16 text-cyber-muted">{t("dash.noProjects")}</div>
      ) : (
        <div className="space-y-3">
          {filtered.map((project) => {
            const config = statusConfig[project.status] || statusConfig.processing;
            return (
              <div key={project.id} className="bg-cyber-card border border-cyber-border rounded-xl p-5 flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-cyber-dark border border-cyber-border flex items-center justify-center shrink-0">
                  <FileVideo className="w-5 h-5 text-cyber-muted" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-foreground">{project.title}</p>
                  <div className="flex flex-wrap items-center gap-3 mt-1">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${config.color}`}>{config.label}</span>
                    {project.fileName && <span className="text-xs text-cyber-muted">{project.fileName}</span>}
                    {project.fileSize && <span className="text-xs text-cyber-muted">{project.fileSize}</span>}
                  </div>
                  <div className="mt-3">
                    <div className="flex items-center justify-between text-xs text-cyber-muted mb-1">
                      <span>{project.assetsReady}/{project.assetsTotal} assets</span>
                      <span>{project.eta}</span>
                    </div>
                    <div className="h-1.5 bg-cyber-border rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${project.status === "published" ? "bg-success" : "bg-gradient-to-r from-neon-purple to-electric-blue"}`}
                        style={{ width: `${project.progress}%` }}
                      />
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {project.status === "review" && (
                    <button
                      onClick={() => onApprove(project.id)}
                      className="px-3 py-1.5 text-xs font-medium rounded-lg bg-gradient-to-r from-neon-purple to-electric-blue text-white hover:opacity-90"
                    >
                      {t("dashTeaser.approve")}
                    </button>
                  )}
                  <button
                    onClick={() => onRemove(project.id)}
                    className="p-1.5 text-cyber-muted hover:text-red-400 transition-colors rounded-lg hover:bg-red-400/10"
                    title={t("dash.removeProject")}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// --- Upload Tab ---
function UploadTab({
  onPickFile,
  onStart,
}: {
  onPickFile: (file: File) => void;
  onStart: () => void;
}) {
  const { t } = useTranslation();
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="max-w-2xl mx-auto">
      <div
        className={`border-2 border-dashed rounded-2xl p-16 text-center cursor-pointer transition-colors ${
          dragOver ? "border-neon-purple bg-neon-purple/5" : "border-cyber-border hover:border-cyber-muted"
        }`}
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          if (e.dataTransfer.files?.[0]) onPickFile(e.dataTransfer.files[0]);
        }}
      >
        <Upload className="w-16 h-16 text-cyber-muted mx-auto mb-6" />
        <h3 className="text-xl font-semibold text-foreground mb-2">{t("dash.uploadYourContent")}</h3>
        <p className="text-cyber-muted mb-6">{t("dash.dragDrop")}</p>
        <button
          onClick={(e) => { e.stopPropagation(); onStart(); }}
          className="px-6 py-2.5 rounded-full bg-gradient-to-r from-neon-purple to-electric-blue text-white text-sm font-medium hover:opacity-90 transition-opacity inline-flex items-center gap-2"
        >
          <Sparkles className="w-4 h-4" /> {t("dash.generateBtn")}
        </button>
        <p className="text-xs text-cyber-muted mt-4">Supports: MP4, MOV, MP3, WAV — plus a pasted transcript/script</p>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="video/*,audio/*"
        className="hidden"
        onChange={(e) => e.target.files?.[0] && onPickFile(e.target.files[0])}
      />

      <div className="mt-8 bg-cyber-card border border-cyber-border rounded-xl p-6">
        <h4 className="font-medium text-foreground mb-4">{t("dash.whatHappens")}</h4>
        <div className="space-y-3">
          {[
            "Paste your transcript/script (or upload media for reference)",
            "The engine scores segments and extracts the strongest hooks",
            "Short-form clips are generated with hooks, captions & hashtags",
            "A LinkedIn carousel, newsletter, and X thread are drafted",
            "Everything lands in Projects for you to review",
            "Approve to publish — connect a key for AI-grade output",
          ].map((step, i) => (
            <div key={step} className="flex items-center gap-3">
              <div className="w-6 h-6 rounded-full bg-neon-purple/10 text-neon-purple text-xs flex items-center justify-center font-bold shrink-0">
                {i + 1}
              </div>
              <span className="text-sm text-cyber-muted">{step}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// --- Schedule Tab (calendar + list scheduling dashboard) ---
interface SchedPost {
  id: string;
  assetId: string;
  assetName: string;
  platform: string;
  scheduledAt: string;
  status: "scheduled" | "published" | "canceled";
}

const SCHED_PLATFORMS = ["TikTok", "YouTube", "Instagram", "LinkedIn", "X"];

const schedStatusColor: Record<string, string> = {
  scheduled: "text-warning bg-warning/10",
  published: "text-success bg-success/10",
  canceled: "text-cyber-muted bg-cyber-dark",
};

const schedChipColor: Record<string, string> = {
  scheduled: "bg-warning/15 text-warning border-warning/30",
  published: "bg-success/15 text-success border-success/30",
  canceled: "bg-cyber-dark text-cyber-muted border-cyber-border",
};

function toLocalInput(d: Date): string {
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
}

function schedDayKey(d: Date): string {
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

function ScheduleTab() {
  const { assets, addToast } = useApp();
  const { t, locale } = useTranslation();
  const [posts, setPosts] = useState<SchedPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<"calendar" | "list">("calendar");
  const [month, setMonth] = useState(() => {
    const n = new Date();
    return new Date(n.getFullYear(), n.getMonth(), 1);
  });
  const [composerOpen, setComposerOpen] = useState(false);
  const [selected, setSelected] = useState<SchedPost | null>(null);
  const [saving, setSaving] = useState(false);
  const [formAsset, setFormAsset] = useState("");
  const [formPlatform, setFormPlatform] = useState("TikTok");
  const [formAt, setFormAt] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    d.setHours(9, 0, 0, 0);
    return toLocalInput(d);
  });
  const [editAt, setEditAt] = useState("");
  const [editPlatform, setEditPlatform] = useState("TikTok");

  useEffect(() => {
    let active = true;
    fetch("/api/schedule", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => active && d && setPosts(d.posts))
      .catch(() => {})
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, []);

  const openDetail = useCallback((p: SchedPost) => {
    setSelected(p);
    setEditPlatform(p.platform);
    const d = new Date(p.scheduledAt);
    setEditAt(Number.isNaN(d.getTime()) ? "" : toLocalInput(d));
  }, []);

  const createPost = useCallback(async () => {
    const asset = assets.find((a) => a.id === formAsset);
    if (!asset || !formAt) return;
    setSaving(true);
    const res = await fetch("/api/schedule", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        assetId: asset.id,
        assetName: asset.name,
        platform: formPlatform,
        scheduledAt: formAt,
      }),
    });
    setSaving(false);
    if (res.ok) {
      const { post } = await res.json();
      setPosts((prev) => [post, ...prev]);
      setComposerOpen(false);
      addToast(t("sched.toastScheduled", { platform: formPlatform }));
    } else {
      addToast(t("sched.toastFailed"), "error");
    }
  }, [assets, formAsset, formPlatform, formAt, addToast, t]);

  const act = useCallback(
    async (id: string, action: "publish" | "cancel") => {
      const res = await fetch(
        `/api/schedule/${id}${action === "cancel" ? "?action=cancel" : ""}`,
        { method: "POST" }
      );
      if (res.ok) {
        const d = await res.json();
        setPosts(d.posts);
        setSelected(null);
        addToast(
          action === "cancel"
            ? t("sched.toastCanceled")
            : d.connected
              ? t("sched.toastPublished")
              : t("sched.toastPublishedDemo")
        );
      }
    },
    [addToast, t]
  );

  const reschedule = useCallback(async () => {
    if (!selected || !editAt) return;
    setSaving(true);
    const res = await fetch(`/api/schedule/${selected.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ platform: editPlatform, scheduledAt: editAt }),
    });
    setSaving(false);
    if (res.ok) {
      const d = await res.json();
      setPosts(d.posts);
      setSelected(null);
      addToast(t("sched.toastRescheduled"));
    } else {
      addToast(t("sched.toastFailed"), "error");
    }
  }, [selected, editAt, editPlatform, addToast, t]);

  // Month grid: 6 weeks starting on the Sunday on/before the 1st.
  const gridStart = new Date(month);
  gridStart.setDate(1 - month.getDay());
  const cells = Array.from({ length: 42 }, (_, i) => {
    const d = new Date(gridStart);
    d.setDate(gridStart.getDate() + i);
    return d;
  });
  const weekdays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(gridStart);
    d.setDate(gridStart.getDate() + i);
    return d.toLocaleDateString(locale, { weekday: "short" });
  });
  const byDay = new Map<string, SchedPost[]>();
  for (const p of posts) {
    const d = new Date(p.scheduledAt);
    if (Number.isNaN(d.getTime())) continue;
    const key = schedDayKey(d);
    byDay.set(key, [...(byDay.get(key) ?? []), p]);
  }
  const todayKey = schedDayKey(new Date());

  const upcoming = posts
    .filter((p) => p.status === "scheduled")
    .sort((a, b) => a.scheduledAt.localeCompare(b.scheduledAt));
  const past = posts
    .filter((p) => p.status !== "scheduled")
    .sort((a, b) => b.scheduledAt.localeCompare(a.scheduledAt));

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="w-8 h-8 rounded-full border-2 border-cyber-border border-t-neon-purple animate-spin" />
      </div>
    );
  }

  const listRow = (p: SchedPost) => (
    <div
      key={p.id}
      onClick={() => openDetail(p)}
      className="bg-cyber-card border border-cyber-border rounded-xl p-4 flex items-center gap-4 cursor-pointer hover:border-neon-purple/40 transition-colors"
    >
      <div className="w-10 h-10 rounded-lg bg-cyber-dark border border-cyber-border flex items-center justify-center shrink-0">
        <Send className="w-4 h-4 text-neon-purple" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground truncate">{p.assetName}</p>
        <div className="flex flex-wrap items-center gap-2 mt-1">
          <span className="text-xs text-cyber-muted">{p.platform}</span>
          <span className="text-xs text-cyber-muted">
            {new Date(p.scheduledAt).toLocaleString(locale)}
          </span>
          <span className={`text-xs px-2 py-0.5 rounded-full ${schedStatusColor[p.status]}`}>
            {t(`sched.status.${p.status}`)}
          </span>
        </div>
      </div>
      {p.status === "scheduled" && (
        <div className="flex items-center gap-2 shrink-0" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => act(p.id, "publish")}
            className="px-3 py-1.5 text-xs font-medium rounded-lg bg-gradient-to-r from-neon-purple to-electric-blue text-white hover:opacity-90"
          >
            {t("sched.publishNow")}
          </button>
          <button
            onClick={() => act(p.id, "cancel")}
            className="px-3 py-1.5 text-xs rounded-lg bg-cyber-dark border border-cyber-border text-cyber-muted hover:text-red-400"
          >
            {t("sched.cancelPost")}
          </button>
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-cyber-muted">{t("sched.intro")}</p>
        <div className="flex items-center gap-2">
          <div className="flex rounded-lg border border-cyber-border overflow-hidden">
            <button
              onClick={() => setView("calendar")}
              className={`px-3 py-1.5 text-xs font-medium flex items-center gap-1.5 transition-colors ${
                view === "calendar" ? "bg-neon-purple/15 text-neon-purple" : "text-cyber-muted hover:text-foreground"
              }`}
            >
              <Calendar className="w-3.5 h-3.5" /> {t("sched.calendar")}
            </button>
            <button
              onClick={() => setView("list")}
              className={`px-3 py-1.5 text-xs font-medium flex items-center gap-1.5 transition-colors ${
                view === "list" ? "bg-neon-purple/15 text-neon-purple" : "text-cyber-muted hover:text-foreground"
              }`}
            >
              <List className="w-3.5 h-3.5" /> {t("sched.list")}
            </button>
          </div>
          <button
            onClick={() => setComposerOpen(true)}
            className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-neon-purple to-electric-blue text-white text-xs font-medium hover:opacity-90 transition-opacity flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" /> {t("sched.new")}
          </button>
        </div>
      </div>

      {view === "calendar" ? (
        <div className="bg-cyber-card border border-cyber-border rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-cyber-border">
            <button
              onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))}
              className="p-1.5 rounded-lg text-cyber-muted hover:text-foreground hover:bg-cyber-dark transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-sm font-semibold text-foreground capitalize">
              {month.toLocaleDateString(locale, { month: "long", year: "numeric" })}
            </span>
            <button
              onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))}
              className="p-1.5 rounded-lg text-cyber-muted hover:text-foreground hover:bg-cyber-dark transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          <div className="grid grid-cols-7 border-b border-cyber-border">
            {weekdays.map((w) => (
              <div key={w} className="px-2 py-2 text-center text-[11px] font-medium text-cyber-muted capitalize">
                {w}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7">
            {cells.map((d, i) => {
              const key = schedDayKey(d);
              const inMonth = d.getMonth() === month.getMonth();
              const dayPosts = byDay.get(key) ?? [];
              return (
                <div
                  key={i}
                  className={`min-h-[92px] p-1.5 border-b border-r border-cyber-border/60 ${
                    inMonth ? "" : "opacity-40"
                  }`}
                >
                  <span
                    className={`inline-flex items-center justify-center w-6 h-6 text-[11px] rounded-full mb-1 ${
                      key === todayKey
                        ? "bg-neon-purple text-white font-bold"
                        : "text-cyber-muted"
                    }`}
                  >
                    {d.getDate()}
                  </span>
                  <div className="space-y-1">
                    {dayPosts.slice(0, 3).map((p) => (
                      <button
                        key={p.id}
                        onClick={() => openDetail(p)}
                        title={`${p.assetName} — ${p.platform}`}
                        className={`w-full text-left px-1.5 py-0.5 rounded border text-[10px] leading-tight truncate ${schedChipColor[p.status]}`}
                      >
                        {p.platform} · {p.assetName}
                      </button>
                    ))}
                    {dayPosts.length > 3 && (
                      <span className="block text-[10px] text-cyber-muted px-1.5">
                        +{dayPosts.length - 3}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : posts.length === 0 ? (
        <div className="text-center py-16 text-cyber-muted">{t("sched.empty")}</div>
      ) : (
        <div className="space-y-5">
          {upcoming.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-cyber-muted">
                {t("sched.upcoming")}
              </h3>
              {upcoming.map(listRow)}
            </div>
          )}
          {past.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-cyber-muted">
                {t("sched.past")}
              </h3>
              {past.map(listRow)}
            </div>
          )}
        </div>
      )}

      {/* Composer */}
      <AnimatePresence>
        {composerOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setComposerOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-cyber-card border border-cyber-border rounded-2xl p-6 w-full max-w-md"
            >
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-lg font-semibold text-foreground">{t("sched.new")}</h3>
                <button onClick={() => setComposerOpen(false)} className="text-cyber-muted hover:text-foreground">
                  <X className="w-5 h-5" />
                </button>
              </div>
              {assets.length === 0 ? (
                <p className="text-sm text-cyber-muted py-6 text-center">{t("sched.noAssets")}</p>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm text-cyber-muted mb-1.5">{t("sched.asset")}</label>
                    <select
                      value={formAsset}
                      onChange={(e) => setFormAsset(e.target.value)}
                      className="w-full px-3 py-2.5 bg-cyber-dark border border-cyber-border rounded-xl text-sm text-foreground focus:outline-none focus:border-neon-purple/50"
                    >
                      <option value="">{t("sched.chooseAsset")}</option>
                      {assets.map((a) => (
                        <option key={a.id} value={a.id}>
                          {a.type} — {a.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm text-cyber-muted mb-1.5">Platform</label>
                      <select
                        value={formPlatform}
                        onChange={(e) => setFormPlatform(e.target.value)}
                        className="w-full px-3 py-2.5 bg-cyber-dark border border-cyber-border rounded-xl text-sm text-foreground focus:outline-none focus:border-neon-purple/50"
                      >
                        {SCHED_PLATFORMS.map((p) => (
                          <option key={p} value={p}>{p}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm text-cyber-muted mb-1.5">{t("sched.when")}</label>
                      <input
                        type="datetime-local"
                        value={formAt}
                        onChange={(e) => setFormAt(e.target.value)}
                        className="w-full px-3 py-2.5 bg-cyber-dark border border-cyber-border rounded-xl text-sm text-foreground focus:outline-none focus:border-neon-purple/50"
                      />
                    </div>
                  </div>
                  <button
                    onClick={createPost}
                    disabled={saving || !formAsset || !formAt}
                    className="w-full py-2.5 rounded-xl bg-gradient-to-r from-neon-purple to-electric-blue text-white font-medium text-sm hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Calendar className="w-4 h-4" />}
                    {t("sched.confirm")}
                  </button>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Detail / reschedule */}
      <AnimatePresence>
        {selected && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setSelected(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-cyber-card border border-cyber-border rounded-2xl p-6 w-full max-w-md"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-foreground truncate">{selected.assetName}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-cyber-muted">{selected.platform}</span>
                    <span className="text-xs text-cyber-muted">
                      {new Date(selected.scheduledAt).toLocaleString(locale)}
                    </span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${schedStatusColor[selected.status]}`}>
                      {t(`sched.status.${selected.status}`)}
                    </span>
                  </div>
                </div>
                <button onClick={() => setSelected(null)} className="text-cyber-muted hover:text-foreground shrink-0">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {selected.status === "scheduled" && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-cyber-muted mb-1.5">Platform</label>
                      <select
                        value={editPlatform}
                        onChange={(e) => setEditPlatform(e.target.value)}
                        className="w-full px-3 py-2 bg-cyber-dark border border-cyber-border rounded-xl text-sm text-foreground focus:outline-none focus:border-neon-purple/50"
                      >
                        {SCHED_PLATFORMS.map((p) => (
                          <option key={p} value={p}>{p}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs text-cyber-muted mb-1.5">{t("sched.when")}</label>
                      <input
                        type="datetime-local"
                        value={editAt}
                        onChange={(e) => setEditAt(e.target.value)}
                        className="w-full px-3 py-2 bg-cyber-dark border border-cyber-border rounded-xl text-sm text-foreground focus:outline-none focus:border-neon-purple/50"
                      />
                    </div>
                  </div>
                  <button
                    onClick={reschedule}
                    disabled={saving || !editAt}
                    className="w-full py-2.5 rounded-xl bg-cyber-dark border border-neon-purple/40 text-neon-purple font-medium text-sm hover:bg-neon-purple/10 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Clock className="w-4 h-4" />}
                    {t("sched.reschedule")}
                  </button>
                  <div className="flex gap-2">
                    <button
                      onClick={() => act(selected.id, "publish")}
                      className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-neon-purple to-electric-blue text-white text-sm font-medium hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
                    >
                      <Send className="w-4 h-4" /> {t("sched.publishNow")}
                    </button>
                    <button
                      onClick={() => act(selected.id, "cancel")}
                      className="flex-1 py-2.5 rounded-xl bg-cyber-dark border border-cyber-border text-cyber-muted text-sm hover:text-red-400 transition-colors"
                    >
                      {t("sched.cancelPost")}
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// --- Analytics Tab (real aggregates from this workspace's own data) ---
interface AnalyticsData {
  totals: {
    assets: number;
    liveAssets: number;
    projects: number;
    publishedProjects: number;
    scheduled: number;
    published: number;
    likes: number;
  };
  platforms: { platform: string; scheduled: number; published: number }[];
  types: { type: string; count: number }[];
  recentPublished: { assetName: string; platform: string; scheduledAt: string }[];
}

function AnalyticsTab() {
  const { t } = useTranslation();
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    fetch("/api/analytics", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => active && d && setData(d))
      .catch(() => {})
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="w-8 h-8 rounded-full border-2 border-cyber-border border-t-neon-purple animate-spin" />
      </div>
    );
  }

  if (!data || data.totals.assets === 0) {
    return (
      <div className="text-center py-24 text-cyber-muted max-w-md mx-auto">
        <BarChart3 className="w-10 h-10 mx-auto mb-4 opacity-50" />
        {t("dash.noAnalytics")}
      </div>
    );
  }

  const metrics = [
    { label: t("dash.totalAssets"), value: data.totals.assets, icon: Film, color: "text-neon-purple" },
    { label: t("dash.publishedPosts"), value: data.totals.published, icon: CheckCircle, color: "text-success" },
    { label: t("dash.scheduledPosts"), value: data.totals.scheduled, icon: Clock, color: "text-warning" },
    { label: t("dash.likedAssets"), value: data.totals.likes, icon: ThumbsUp, color: "text-electric-blue" },
  ];
  const maxPlatform = Math.max(1, ...data.platforms.map((p) => p.scheduled + p.published));
  const maxType = Math.max(1, ...data.types.map((ty) => ty.count));

  return (
    <div className="space-y-6">
      <p className="text-sm text-cyber-muted">{t("dash.analyticsLive")}</p>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((m) => (
          <div key={m.label} className="bg-cyber-card border border-cyber-border rounded-xl p-4">
            <m.icon className={`w-5 h-5 ${m.color} mb-2`} />
            <p className="text-2xl font-bold text-foreground">{m.value}</p>
            <p className="text-xs text-cyber-muted mt-1">{m.label}</p>
          </div>
        ))}
      </div>

      {data.platforms.length > 0 && (
        <div className="bg-cyber-card border border-cyber-border rounded-xl p-6">
          <h3 className="font-semibold text-foreground mb-4">{t("dash.platformPerformance")}</h3>
          <div className="space-y-4">
            {data.platforms.map((p) => (
              <div key={p.platform} className="flex items-center gap-4">
                <span className="text-sm text-foreground w-24 shrink-0">{p.platform}</span>
                <div className="flex-1 h-2 bg-cyber-border rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-neon-purple to-electric-blue rounded-full"
                    style={{ width: `${((p.scheduled + p.published) / maxPlatform) * 100}%` }}
                  />
                </div>
                <span className="text-xs text-success w-24 text-right">
                  {p.published} {t("dash.published").toLowerCase()}
                </span>
                <span className="text-xs text-warning w-24 text-right">
                  {p.scheduled} {t("dash.scheduledLower")}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="bg-cyber-card border border-cyber-border rounded-xl p-6">
        <h3 className="font-semibold text-foreground mb-4">{t("dash.assetMix")}</h3>
        <div className="space-y-3">
          {data.types.map((ty) => (
            <div key={ty.type} className="flex items-center gap-4">
              <span className="text-sm text-foreground w-40 shrink-0 truncate">{ty.type}</span>
              <div className="flex-1 h-2 bg-cyber-border rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-electric-blue to-cyan-500 rounded-full"
                  style={{ width: `${(ty.count / maxType) * 100}%` }}
                />
              </div>
              <span className="text-xs text-cyber-muted w-8 text-right">{ty.count}</span>
            </div>
          ))}
        </div>
      </div>

      {data.recentPublished.length > 0 && (
        <div className="bg-cyber-card border border-cyber-border rounded-xl p-6">
          <h3 className="font-semibold text-foreground mb-4">{t("dash.recentPublishes")}</h3>
          <div className="space-y-3">
            {data.recentPublished.map((r, i) => (
              <div key={`${r.assetName}-${i}`} className="flex items-center gap-4 p-3 rounded-lg bg-cyber-dark">
                <Send className="w-4 h-4 text-neon-purple shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{r.assetName}</p>
                  <p className="text-xs text-cyber-muted">{r.platform}</p>
                </div>
                <span className="text-xs text-cyber-muted shrink-0">
                  {new Date(r.scheduledAt).toLocaleDateString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// --- Notifications Tab ---
function NotificationsTab({
  notifications,
  onMarkRead,
  onMarkAllRead,
}: {
  notifications: { id: string; title: string; message: string; time: string; read: boolean; type: string }[];
  onMarkRead: (id: string) => void;
  onMarkAllRead: () => void;
}) {
  const { t } = useTranslation();
  const typeIcons: Record<string, typeof CheckCircle> = { success: CheckCircle, info: Bell, warning: Clock };
  const typeColors: Record<string, string> = { success: "text-success", info: "text-electric-blue", warning: "text-warning" };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-cyber-muted">
          {t("dash.unread", { count: notifications.filter((n) => !n.read).length })}
        </p>
        <button onClick={onMarkAllRead} className="text-xs text-neon-purple hover:underline">
          {t("dash.markAllRead")}
        </button>
      </div>

      {notifications.length === 0 ? (
        <div className="text-center py-16 text-cyber-muted">{t("dash.noNotifications")}</div>
      ) : (
        notifications.map((n) => {
          const Icon = typeIcons[n.type] || Bell;
          const color = typeColors[n.type] || "text-cyber-muted";
          return (
            <div
              key={n.id}
              onClick={() => onMarkRead(n.id)}
              className={`flex items-start gap-4 p-4 rounded-xl border cursor-pointer transition-colors ${
                n.read
                  ? "bg-cyber-card border-cyber-border opacity-60"
                  : "bg-cyber-card border-neon-purple/20 hover:border-neon-purple/40"
              }`}
            >
              <Icon className={`w-5 h-5 mt-0.5 ${color}`} />
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-foreground">{n.title}</p>
                  {!n.read && <div className="w-2 h-2 rounded-full bg-neon-purple" />}
                </div>
                <p className="text-sm text-cyber-muted mt-0.5">{n.message}</p>
                <p className="text-xs text-cyber-muted mt-1">{n.time}</p>
              </div>
              {!n.read && (
                <button className="text-xs text-neon-purple hover:underline shrink-0">
                  {t("dash.markRead")}
                </button>
              )}
            </div>
          );
        })
      )}
    </div>
  );
}

// --- Settings Tab ---
function SettingsTab({
  user,
  form,
  setForm,
  saved,
  onSave,
}: {
  user: { name: string; email: string };
  form: { name: string; email: string; notifications: boolean; autoPublish: boolean };
  setForm: React.Dispatch<React.SetStateAction<{ name: string; email: string; notifications: boolean; autoPublish: boolean }>>;
  saved: boolean;
  onSave: () => void;
}) {
  const { t } = useTranslation();
  return (
    <div className="max-w-2xl space-y-6">
      <div className="bg-cyber-card border border-cyber-border rounded-xl p-6">
        <h3 className="font-semibold text-foreground mb-4">{t("dash.profile")}</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-cyber-muted mb-1.5">{t("dash.displayName")}</label>
            <input
              type="text"
              value={form.name || user.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full px-4 py-2.5 bg-cyber-dark border border-cyber-border rounded-xl text-sm text-foreground focus:outline-none focus:border-neon-purple/50"
            />
          </div>
          <div>
            <label className="block text-sm text-cyber-muted mb-1.5">{t("auth.email")}</label>
            <input
              type="email"
              value={form.email || user.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="w-full px-4 py-2.5 bg-cyber-dark border border-cyber-border rounded-xl text-sm text-foreground focus:outline-none focus:border-neon-purple/50"
            />
          </div>
        </div>
      </div>

      <div className="bg-cyber-card border border-cyber-border rounded-xl p-6">
        <h3 className="font-semibold text-foreground mb-4">{t("dash.preferences")}</h3>
        <div className="space-y-4">
          <label className="flex items-center justify-between cursor-pointer">
            <div>
              <p className="text-sm text-foreground">{t("dash.emailNotifications")}</p>
              <p className="text-xs text-cyber-muted">{t("dash.emailNotificationsDesc")}</p>
            </div>
            <button
              onClick={() => setForm({ ...form, notifications: !form.notifications })}
              className={`w-11 h-6 rounded-full transition-colors relative ${form.notifications ? "bg-neon-purple" : "bg-cyber-border"}`}
            >
              <div className={`w-5 h-5 rounded-full bg-white absolute top-0.5 transition-transform ${form.notifications ? "translate-x-5.5 left-0.5" : "left-0.5"}`} style={{ transform: form.notifications ? "translateX(22px)" : "translateX(0)" }} />
            </button>
          </label>
          <label className="flex items-center justify-between cursor-pointer">
            <div>
              <p className="text-sm text-foreground">{t("dash.autoPublish")}</p>
              <p className="text-xs text-cyber-muted">{t("dash.autoPublishDesc")}</p>
            </div>
            <button
              onClick={() => setForm({ ...form, autoPublish: !form.autoPublish })}
              className={`w-11 h-6 rounded-full transition-colors relative ${form.autoPublish ? "bg-neon-purple" : "bg-cyber-border"}`}
            >
              <div className={`w-5 h-5 rounded-full bg-white absolute top-0.5 transition-transform`} style={{ transform: form.autoPublish ? "translateX(22px)" : "translateX(0)", left: "2px" }} />
            </button>
          </label>
        </div>
      </div>

      <BrandVoicePanel />

      <IntegrationsPanel />

      <button
        onClick={onSave}
        className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-neon-purple to-electric-blue text-white font-medium text-sm hover:opacity-90 transition-opacity flex items-center gap-2"
      >
        {saved ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
        {saved ? t("dash.saved") : t("dash.saveSettings")}
      </button>
    </div>
  );
}
