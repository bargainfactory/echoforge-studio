"use client";

import Link from "next/link";
import { ArrowLeft, Zap, Users, Globe, Award } from "lucide-react";
import { useTranslation } from "@/lib/i18n";
import Navbar from "@/components/navbar";
import Footer from "@/components/footer";

// stat labels are rendered via t() inside the component
const statsData = [
  { tKey: "stories.creatorsServed", value: "2,400+", icon: Users },
  { tKey: "about.countries", value: "47", icon: Globe },
  { tKey: "about.assetsCreated", value: "500K+", icon: Zap },
  { tKey: "about.clientSatisfaction", value: "4.9/5", icon: Award },
];

const team = [
  { name: "Alex Morgan", role: "CEO & Founder", initials: "AM", color: "from-neon-purple to-electric-blue" },
  { name: "Jordan Lee", role: "CTO", initials: "JL", color: "from-electric-blue to-cyan-500" },
  { name: "Sarah Kim", role: "Head of AI", initials: "SK", color: "from-cyan-500 to-emerald-500" },
  { name: "Marcus Johnson", role: "Head of Growth", initials: "MJ", color: "from-amber-500 to-orange-500" },
];

export default function AboutPage() {
  const { t } = useTranslation();
  return (
    <>
      <Navbar />
      <main className="pt-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-cyber-muted hover:text-foreground transition-colors mb-8"
          >
            <ArrowLeft className="w-4 h-4" />
            {t("nav.backHome")}
          </Link>

          <h1 className="text-3xl sm:text-4xl font-bold mb-4">
            {t("about.title1")} <span className="gradient-text">{t("about.title2")}</span>
          </h1>
          <p className="text-lg text-cyber-muted mb-12 max-w-2xl">
            {t("about.description")}
          </p>

          <div className="space-y-8 text-foreground/80 leading-relaxed mb-16">
            <p>
              EchoForge Studio was founded in 2024 with a simple belief: the best content creators shouldn&apos;t be limited by their willingness to be on camera. In a world where faceless content regularly outperforms personality-driven channels, we built the AI infrastructure to make this accessible to everyone.
            </p>
            <p>
              Our AI-powered pipeline takes a single long-form recording — a podcast, video, or course — and transforms it into 30+ optimized assets for every major platform. YouTube Shorts, TikToks, LinkedIn carousels, email newsletters, Twitter threads — all formatted, captioned, and ready to publish.
            </p>
            <p>
              We&apos;ve served over 2,400 creators across 47 countries, generating more than 500,000 content assets and helping our clients reach a combined audience of over 50 million viewers. Our technology combines state-of-the-art speech recognition, natural language processing, and video generation to deliver studio-quality output at scale.
            </p>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-16">
            {statsData.map((stat) => (
              <div key={stat.tKey} className="bg-cyber-card border border-cyber-border rounded-xl p-6 text-center">
                <stat.icon className="w-6 h-6 text-neon-purple mx-auto mb-3" />
                <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                <p className="text-xs text-cyber-muted mt-1">{t(stat.tKey)}</p>
              </div>
            ))}
          </div>

          <h2 className="text-2xl font-bold text-foreground mb-8">{t("about.ourTeam")}</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {team.map((member) => (
              <div key={member.name} className="bg-cyber-card border border-cyber-border rounded-xl p-6 text-center">
                <div className={`w-16 h-16 rounded-full bg-gradient-to-br ${member.color} flex items-center justify-center text-white font-bold text-lg mx-auto mb-3`}>
                  {member.initials}
                </div>
                <p className="font-medium text-foreground">{member.name}</p>
                <p className="text-sm text-cyber-muted">{member.role}</p>
              </div>
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
