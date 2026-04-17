"use client";

import { useState } from "react";
import Link from "next/link";
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
} from "lucide-react";

const sidebarItems = [
  { icon: LayoutDashboard, label: "Overview", active: true },
  { icon: Film, label: "Projects" },
  { icon: Upload, label: "Upload" },
  { icon: BarChart3, label: "Analytics" },
  { icon: Bell, label: "Notifications", badge: 3 },
  { icon: Settings, label: "Settings" },
];

const projects = [
  {
    id: 1,
    title: "Episode 52 — The Future of AI Agents",
    status: "processing",
    progress: 42,
    assetsReady: 3,
    assetsTotal: 12,
    eta: "~45 min",
  },
  {
    id: 2,
    title: "Episode 51 — Building in Public",
    status: "review",
    progress: 100,
    assetsReady: 10,
    assetsTotal: 10,
    eta: "Awaiting approval",
  },
  {
    id: 3,
    title: "Episode 50 — Monetize Your Podcast",
    status: "published",
    progress: 100,
    assetsReady: 14,
    assetsTotal: 14,
    eta: "Published Apr 12",
  },
  {
    id: 4,
    title: "Episode 49 — Audience Growth Hacks",
    status: "published",
    progress: 100,
    assetsReady: 11,
    assetsTotal: 11,
    eta: "Published Apr 8",
  },
];

const recentAssets = [
  { name: "AI Agents Short #1", type: "YouTube Short", views: "24.3K", status: "live" },
  { name: "Building in Public Carousel", type: "LinkedIn", views: "8.7K", status: "live" },
  { name: "Podcast Highlight Reel", type: "TikTok", views: "142K", status: "live" },
  { name: "Weekly Newsletter #50", type: "Email", views: "3.2K opens", status: "sent" },
];

const statusConfig: Record<string, { label: string; color: string }> = {
  processing: { label: "Processing", color: "text-warning bg-warning/10" },
  review: { label: "Ready for Review", color: "text-neon-purple bg-neon-purple/10" },
  published: { label: "Published", color: "text-success bg-success/10" },
};

export default function Dashboard() {
  const [activeTab] = useState("Overview");

  return (
    <div className="min-h-screen bg-background flex">
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
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                item.active
                  ? "bg-neon-purple/10 text-neon-purple"
                  : "text-cyber-muted hover:text-foreground hover:bg-cyber-card"
              }`}
            >
              <item.icon className="w-4 h-4" />
              {item.label}
              {item.badge && (
                <span className="ml-auto w-5 h-5 rounded-full bg-neon-purple text-white text-xs flex items-center justify-center">
                  {item.badge}
                </span>
              )}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-cyber-border">
          <div className="flex items-center gap-3 px-3 py-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-neon-purple to-electric-blue flex items-center justify-center text-white text-xs font-bold">
              JD
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">John Doe</p>
              <p className="text-xs text-cyber-muted">Creator Pro</p>
            </div>
            <LogOut className="w-4 h-4 text-cyber-muted" />
          </div>
        </div>
      </aside>

      <main className="flex-1 overflow-auto">
        <header className="border-b border-cyber-border bg-cyber-dark/50 backdrop-blur-sm px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-foreground">{activeTab}</h1>
              <p className="text-sm text-cyber-muted">Welcome back, John</p>
            </div>
            <button className="px-4 py-2 rounded-lg bg-gradient-to-r from-neon-purple to-electric-blue text-white text-sm font-medium hover:opacity-90 transition-opacity flex items-center gap-2">
              <Upload className="w-4 h-4" />
              New Upload
            </button>
          </div>
        </header>

        <div className="p-6 space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: "Active Projects", value: "2", icon: Clock, color: "text-warning", change: "+1 this week" },
              { label: "Total Assets", value: "247", icon: Film, color: "text-neon-purple", change: "+14 this month" },
              { label: "Total Views", value: "2.4M", icon: Eye, color: "text-electric-blue", change: "+340K this month" },
              { label: "Engagement Rate", value: "8.7%", icon: TrendingUp, color: "text-success", change: "+1.2% vs last month" },
            ].map((stat) => (
              <div
                key={stat.label}
                className="bg-cyber-card border border-cyber-border rounded-xl p-4"
              >
                <div className="flex items-center justify-between mb-3">
                  <stat.icon className={`w-5 h-5 ${stat.color}`} />
                  <span className="text-xs text-success">{stat.change}</span>
                </div>
                <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                <p className="text-xs text-cyber-muted mt-1">{stat.label}</p>
              </div>
            ))}
          </div>

          <div className="bg-cyber-card border border-cyber-border rounded-xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-cyber-border">
              <h2 className="font-semibold text-foreground">Projects</h2>
              <button className="text-xs text-neon-purple hover:underline">View All</button>
            </div>
            <div className="divide-y divide-cyber-border">
              {projects.map((project) => {
                const config = statusConfig[project.status];
                return (
                  <div
                    key={project.id}
                    className="flex items-center gap-4 px-6 py-4 hover:bg-cyber-dark/30 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">
                        {project.title}
                      </p>
                      <div className="flex items-center gap-3 mt-1.5">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${config.color}`}>
                          {config.label}
                        </span>
                        <span className="text-xs text-cyber-muted">
                          {project.assetsReady}/{project.assetsTotal} assets
                        </span>
                      </div>
                    </div>

                    <div className="hidden sm:block w-40">
                      <div className="flex items-center justify-between text-xs text-cyber-muted mb-1">
                        <span>{project.progress}%</span>
                        <span>{project.eta}</span>
                      </div>
                      <div className="h-1.5 bg-cyber-border rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${
                            project.status === "published"
                              ? "bg-success"
                              : "bg-gradient-to-r from-neon-purple to-electric-blue"
                          }`}
                          style={{ width: `${project.progress}%` }}
                        />
                      </div>
                    </div>

                    {project.status === "review" && (
                      <button className="px-4 py-1.5 text-xs font-medium rounded-lg bg-gradient-to-r from-neon-purple to-electric-blue text-white hover:opacity-90">
                        Approve & Publish
                      </button>
                    )}

                    <ChevronRight className="w-4 h-4 text-cyber-muted" />
                  </div>
                );
              })}
            </div>
          </div>

          <div className="bg-cyber-card border border-cyber-border rounded-xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-cyber-border">
              <h2 className="font-semibold text-foreground">Recent Assets</h2>
            </div>
            <div className="divide-y divide-cyber-border">
              {recentAssets.map((asset) => (
                <div
                  key={asset.name}
                  className="flex items-center gap-4 px-6 py-3 hover:bg-cyber-dark/30 transition-colors"
                >
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
                  <span className="text-xs px-2 py-0.5 rounded-full text-success bg-success/10 capitalize">
                    {asset.status}
                  </span>
                  <ThumbsUp className="w-4 h-4 text-cyber-muted hover:text-neon-purple cursor-pointer transition-colors" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
