"use client";

import { motion } from "framer-motion";
import {
  LayoutDashboard,
  Clock,
  CheckCircle,
  Film,
  BarChart3,
  Bell,
} from "lucide-react";

const mockProjects = [
  {
    title: "Episode 47 — AI Side Hustles",
    status: "In Progress",
    statusColor: "text-warning bg-warning/10",
    progress: 65,
    assets: 8,
    due: "2h remaining",
  },
  {
    title: "Episode 46 — Passive Income",
    status: "Ready to Approve",
    statusColor: "text-neon-purple bg-neon-purple/10",
    progress: 100,
    assets: 12,
    due: "Awaiting review",
  },
  {
    title: "Episode 45 — Morning Routines",
    status: "Published",
    statusColor: "text-success bg-success/10",
    progress: 100,
    assets: 10,
    due: "3 days ago",
  },
];

export default function DashboardTeaser() {
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
            Your <span className="gradient-text">AI Studio Dashboard</span>
          </h2>
          <p className="text-cyber-muted max-w-2xl mx-auto">
            Track progress, approve assets, and publish — all from one command center.
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
                        : "text-cyber-muted hover:text-foreground"
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
                    { label: "Active Projects", value: "3", icon: Clock, color: "text-warning" },
                    { label: "Assets This Month", value: "47", icon: Film, color: "text-neon-purple" },
                    { label: "Published", value: "142", icon: CheckCircle, color: "text-success" },
                  ].map((stat) => (
                    <div
                      key={stat.label}
                      className="bg-cyber-dark rounded-xl p-4 border border-cyber-border"
                    >
                      <stat.icon className={`w-5 h-5 ${stat.color} mb-2`} />
                      <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                      <p className="text-xs text-cyber-muted">{stat.label}</p>
                    </div>
                  ))}
                </div>

                <div className="space-y-3">
                  {mockProjects.map((project) => (
                    <div
                      key={project.title}
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
                            {project.status}
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
                      {project.status === "Ready to Approve" && (
                        <button className="px-3 py-1.5 text-xs font-medium rounded-lg bg-gradient-to-r from-neon-purple to-electric-blue text-white hover:opacity-90 transition-opacity">
                          Approve
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
