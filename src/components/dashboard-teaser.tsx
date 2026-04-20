"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  LayoutDashboard,
  Clock,
  CheckCircle,
  Film,
  BarChart3,
  Bell,
} from "lucide-react";
import { useTranslation } from "@/lib/i18n";

const initialProjects = [
  {
    id: "t-1",
    title: "Episode 47 — AI Side Hustles",
    status: "processing",
    statusKey: "dashTeaser.inProgress",
    statusColor: "text-warning bg-warning/10",
    progress: 65,
    assets: 8,
    due: "2h remaining",
  },
  {
    id: "t-2",
    title: "Episode 46 — Passive Income",
    status: "review",
    statusKey: "dashTeaser.readyToApprove",
    statusColor: "text-neon-purple bg-neon-purple/10",
    progress: 100,
    assets: 12,
    due: "Awaiting review",
  },
  {
    id: "t-3",
    title: "Episode 45 — Morning Routines",
    status: "published",
    statusKey: "dashTeaser.published",
    statusColor: "text-success bg-success/10",
    progress: 100,
    assets: 10,
    due: "3 days ago",
  },
];

export default function DashboardTeaser() {
  const { t } = useTranslation();
  const [projects, setProjects] = useState(initialProjects);

  function handleApprove(id: string) {
    setProjects((prev) =>
      prev.map((p) =>
        p.id === id
          ? { ...p, status: "published", statusKey: "dashTeaser.published", statusColor: "text-success bg-success/10", due: "Just now" }
          : p
      )
    );
  }

  const activeCount = projects.filter((p) => p.status !== "published").length;
  const assetsCount = projects.reduce((sum, p) => sum + p.assets, 0);
  const publishedCount = projects.filter((p) => p.status === "published").length;

  return (
    <section className="py-24 bg-cyber-dark relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            {t("dashTeaser.title1")} <span className="gradient-text">{t("dashTeaser.title2")}</span>
          </h2>
          <p className="text-cyber-muted max-w-2xl mx-auto">
            {t("dashTeaser.description")}
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="relative"
        >
          <div className="absolute -inset-2 bg-gradient-to-r from-neon-purple/10 to-electric-blue/10 rounded-3xl blur-2xl" />
          <div className="relative bg-cyber-card border border-cyber-border rounded-2xl overflow-hidden">
            <div className="flex items-center gap-2 px-6 py-3 border-b border-cyber-border bg-cyber-dark">
              <div className="w-3 h-3 rounded-full bg-red-500/70" />
              <div className="w-3 h-3 rounded-full bg-yellow-500/70" />
              <div className="w-3 h-3 rounded-full bg-green-500/70" />
              <span className="ml-3 text-xs text-cyber-muted font-mono">
                dashboard.echoforge.ai
              </span>
            </div>

            <div className="flex">
              <div className="hidden md:block w-56 border-r border-cyber-border p-4 space-y-1">
                {[
                  { icon: LayoutDashboard, label: "Dashboard", active: true },
                  { icon: Film, label: "Projects" },
                  { icon: BarChart3, label: "Analytics" },
                  { icon: Bell, label: "Notifications" },
                ].map((item) => (
                  <div
                    key={item.label}
                    className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm ${
                      item.active
                        ? "bg-neon-purple/10 text-neon-purple"
                        : "text-cyber-muted"
                    }`}
                  >
                    <item.icon className="w-4 h-4" />
                    {item.label}
                  </div>
                ))}
              </div>

              <div className="flex-1 p-6">
                <div className="grid grid-cols-3 gap-4 mb-6">
                  {[
                    { labelKey: "dashTeaser.activeProjects", value: String(activeCount), icon: Clock, color: "text-warning" },
                    { labelKey: "dashTeaser.assetsThisMonth", value: String(assetsCount), icon: Film, color: "text-neon-purple" },
                    { labelKey: "dashTeaser.published", value: String(publishedCount), icon: CheckCircle, color: "text-success" },
                  ].map((stat) => (
                    <div
                      key={stat.labelKey}
                      className="bg-cyber-dark rounded-xl p-4 border border-cyber-border"
                    >
                      <stat.icon className={`w-5 h-5 ${stat.color} mb-2`} />
                      <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                      <p className="text-xs text-cyber-muted">{t(stat.labelKey)}</p>
                    </div>
                  ))}
                </div>

                <div className="space-y-3">
                  {projects.map((project) => (
                    <div
                      key={project.id}
                      className="flex items-center gap-4 p-4 bg-cyber-dark rounded-xl border border-cyber-border"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">
                          {project.title}
                        </p>
                        <div className="flex items-center gap-3 mt-1">
                          <span
                            className={`text-xs px-2 py-0.5 rounded-full ${project.statusColor}`}
                          >
                            {t(project.statusKey)}
                          </span>
                          <span className="text-xs text-cyber-muted">
                            {project.assets} assets
                          </span>
                        </div>
                      </div>
                      <div className="hidden sm:block w-32">
                        <div className="h-1.5 bg-cyber-border rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-neon-purple to-electric-blue rounded-full transition-all"
                            style={{ width: `${project.progress}%` }}
                          />
                        </div>
                      </div>
                      <span className="text-xs text-cyber-muted whitespace-nowrap">
                        {project.due}
                      </span>
                      {project.status === "review" && (
                        <button
                          onClick={() => handleApprove(project.id)}
                          className="px-3 py-1.5 text-xs font-medium rounded-lg bg-gradient-to-r from-neon-purple to-electric-blue text-white hover:opacity-90 transition-opacity"
                        >
                          {t("dashTeaser.approve")}
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                <Link
                  href="/login"
                  className="mt-4 w-full py-2.5 rounded-lg border border-cyber-border text-sm text-foreground hover:border-neon-purple/50 transition-colors flex items-center justify-center"
                >
                  {t("dashTeaser.signIn")}
                </Link>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
