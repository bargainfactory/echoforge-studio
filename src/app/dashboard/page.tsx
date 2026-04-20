"use client";

import { useState, useCallback, useRef } from "react";
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
  ChevronRight,
  Play,
  X,
  Trash2,
  FileVideo,
  Save,
  Check,
} from "lucide-react";
import type { Project } from "@/lib/data";

type Tab = "Overview" | "Projects" | "Upload" | "Analytics" | "Notifications" | "Settings";

const sidebarItems: { icon: typeof LayoutDashboard; label: Tab; tKey: string }[] = [
  { icon: LayoutDashboard, label: "Overview", tKey: "dash.overview" },
  { icon: Film, label: "Projects", tKey: "dash.projects" },
  { icon: Upload, label: "Upload", tKey: "dash.upload" },
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
    projects,
    assets,
    notifications,
    logout,
    addProject,
    approveProject,
    removeProject,
    toggleAssetLike,
    markNotificationRead,
    markAllNotificationsRead,
    addToast,
  } = useApp();
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<Tab>("Overview");
  const [showUploadModal, setShowUploadModal] = useState(false);
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

  const handleFileUpload = useCallback(
    (files: FileList | null) => {
      if (!files || files.length === 0) return;
      const file = files[0];
      const project: Project = {
        id: `proj-${Date.now()}`,
        title: file.name.replace(/\.[^.]+$/, "").replace(/[-_]/g, " "),
        status: "processing",
        progress: 0,
        assetsReady: 0,
        assetsTotal: Math.floor(Math.random() * 8) + 8,
        eta: "Processing...",
        createdAt: new Date().toISOString(),
        fileName: file.name,
        fileSize: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
      };
      addProject(project);
      setShowUploadModal(false);
      setActiveTab("Projects");

      let progress = 0;
      const interval = setInterval(() => {
        progress += Math.floor(Math.random() * 15) + 5;
        if (progress >= 100) {
          progress = 100;
          clearInterval(interval);
          // We don't have direct access to update in interval, use a workaround
        }
      }, 2000);

      setTimeout(() => {
        clearInterval(interval);
      }, 20000);
    },
    [addProject]
  );

  const unreadCount = notifications.filter((n) => !n.read).length;

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
            <UploadTab onUpload={handleFileUpload} fileInputRef={fileInputRef} />
          )}
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

      {/* Upload Modal */}
      <AnimatePresence>
        {showUploadModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setShowUploadModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-cyber-card border border-cyber-border rounded-2xl p-8 w-full max-w-md"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-foreground">{t("dash.uploadContent")}</h3>
                <button onClick={() => setShowUploadModal(false)} className="text-cyber-muted hover:text-foreground">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div
                className="border-2 border-dashed border-cyber-border hover:border-neon-purple/50 rounded-xl p-12 text-center cursor-pointer transition-colors"
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  handleFileUpload(e.dataTransfer.files);
                }}
              >
                <FileVideo className="w-12 h-12 text-cyber-muted mx-auto mb-4" />
                <p className="text-foreground font-medium mb-1">{t("dash.dropFile")}</p>
                <p className="text-sm text-cyber-muted">{t("dash.fileTypes")}</p>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="video/*,audio/*"
                className="hidden"
                onChange={(e) => handleFileUpload(e.target.files)}
              />
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
}: {
  projects: Project[];
  assets: { id: string; name: string; type: string; views: string; status: string; liked: boolean }[];
  onApprove: (id: string) => void;
  onToggleLike: (id: string) => void;
  onViewAll: () => void;
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
          {assets.slice(0, 4).map((asset) => (
            <div key={asset.id} className="flex items-center gap-4 px-6 py-3 hover:bg-cyber-dark/30 transition-colors">
              <div className="w-10 h-10 rounded-lg bg-cyber-dark border border-cyber-border flex items-center justify-center">
                <Play className="w-4 h-4 text-cyber-muted" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-foreground truncate">{asset.name}</p>
                <p className="text-xs text-cyber-muted">{asset.type}</p>
              </div>
              <div className="flex items-center gap-2">
                <Eye className="w-3.5 h-3.5 text-cyber-muted" />
                <span className="text-xs text-cyber-muted">{asset.views}</span>
              </div>
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
  onUpload,
  fileInputRef,
}: {
  onUpload: (files: FileList | null) => void;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
}) {
  const { t } = useTranslation();
  const [dragOver, setDragOver] = useState(false);

  return (
    <div className="max-w-2xl mx-auto">
      <div
        className={`border-2 border-dashed rounded-2xl p-16 text-center cursor-pointer transition-colors ${
          dragOver ? "border-neon-purple bg-neon-purple/5" : "border-cyber-border hover:border-cyber-muted"
        }`}
        onClick={() => fileInputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => { e.preventDefault(); setDragOver(false); onUpload(e.dataTransfer.files); }}
      >
        <Upload className="w-16 h-16 text-cyber-muted mx-auto mb-6" />
        <h3 className="text-xl font-semibold text-foreground mb-2">{t("dash.uploadYourContent")}</h3>
        <p className="text-cyber-muted mb-6">{t("dash.dragDrop")}</p>
        <p className="text-xs text-cyber-muted">Supports: MP4, MOV, AVI, MKV, MP3, WAV, M4A — up to 4GB</p>
      </div>
      <input
        ref={fileInputRef}
        type="file"
        accept="video/*,audio/*"
        className="hidden"
        onChange={(e) => onUpload(e.target.files)}
      />

      <div className="mt-8 bg-cyber-card border border-cyber-border rounded-xl p-6">
        <h4 className="font-medium text-foreground mb-4">{t("dash.whatHappens")}</h4>
        <div className="space-y-3">
          {[
            "AI transcribes and analyzes your content",
            "Key moments and viral hooks are identified",
            "Short-form clips are auto-generated",
            "Captions, B-roll, and graphics are applied",
            "Assets appear in your Projects tab for review",
            "Approve and publish to all platforms with one click",
          ].map((step, i) => (
            <div key={step} className="flex items-center gap-3">
              <div className="w-6 h-6 rounded-full bg-neon-purple/10 text-neon-purple text-xs flex items-center justify-center font-bold">
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

// --- Analytics Tab ---
function AnalyticsTab() {
  const { t } = useTranslation();
  const metrics = [
    { label: t("dash.totalViews"), value: "2.4M", change: "+18.3%", positive: true },
    { label: t("dash.engagementRate"), value: "8.7%", change: "+1.2%", positive: true },
    { label: t("dash.newFollowers"), value: "12.4K", change: "+24.1%", positive: true },
    { label: t("dash.revenue"), value: "$4,280", change: "+9.7%", positive: true },
  ];

  const platformData = [
    { platform: "YouTube", views: "890K", engagement: "6.2%", growth: "+12%", bar: 89 },
    { platform: "TikTok", views: "1.1M", engagement: "11.4%", growth: "+31%", bar: 100 },
    { platform: "LinkedIn", views: "245K", engagement: "4.8%", growth: "+8%", bar: 24 },
    { platform: "Instagram", views: "180K", engagement: "7.1%", growth: "+15%", bar: 18 },
    { platform: "Twitter", views: "85K", engagement: "3.2%", growth: "+5%", bar: 8 },
  ];

  const topContent = [
    { title: "5 AI Side Hustles in 2025", views: "342K", likes: "28K", platform: "TikTok" },
    { title: "Morning Routine for Success", views: "218K", likes: "19K", platform: "YouTube" },
    { title: "Passive Income Blueprint", views: "156K", likes: "12K", platform: "YouTube" },
    { title: "Productivity Stack Carousel", views: "89K", saves: "6.2K", platform: "LinkedIn" },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((m) => (
          <div key={m.label} className="bg-cyber-card border border-cyber-border rounded-xl p-4">
            <p className="text-xs text-cyber-muted mb-1">{m.label}</p>
            <p className="text-2xl font-bold text-foreground">{m.value}</p>
            <span className={`text-xs ${m.positive ? "text-success" : "text-red-400"}`}>{m.change} {t("dash.vsLastMonth")}</span>
          </div>
        ))}
      </div>

      <div className="bg-cyber-card border border-cyber-border rounded-xl p-6">
        <h3 className="font-semibold text-foreground mb-4">{t("dash.platformPerformance")}</h3>
        <div className="space-y-4">
          {platformData.map((p) => (
            <div key={p.platform} className="flex items-center gap-4">
              <span className="text-sm text-foreground w-20">{p.platform}</span>
              <div className="flex-1 h-2 bg-cyber-border rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-neon-purple to-electric-blue rounded-full"
                  style={{ width: `${p.bar}%` }}
                />
              </div>
              <span className="text-xs text-cyber-muted w-16 text-right">{p.views}</span>
              <span className="text-xs text-cyber-muted w-12 text-right">{p.engagement}</span>
              <span className="text-xs text-success w-12 text-right">{p.growth}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-cyber-card border border-cyber-border rounded-xl p-6">
        <h3 className="font-semibold text-foreground mb-4">{t("dash.topContent")}</h3>
        <div className="space-y-3">
          {topContent.map((c, i) => (
            <div key={c.title} className="flex items-center gap-4 p-3 rounded-lg bg-cyber-dark">
              <span className="text-lg font-bold text-neon-purple w-8">#{i + 1}</span>
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground">{c.title}</p>
                <p className="text-xs text-cyber-muted">{c.platform}</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium text-foreground">{c.views} views</p>
                <p className="text-xs text-cyber-muted">{c.likes || c.saves} {c.likes ? "likes" : "saves"}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
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
