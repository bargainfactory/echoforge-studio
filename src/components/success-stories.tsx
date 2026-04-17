"use client";

import { motion } from "framer-motion";
import { Star, TrendingUp, Users, DollarSign } from "lucide-react";

const stories = [
  {
    name: "Alex Rivera",
    avatar: "AR",
    role: "Finance YouTuber",
    quote:
      "I went from 2K to 180K subscribers in 6 months — all faceless shorts generated from my podcast. EchoForge literally changed my life.",
    metric: "180K subs",
    metricLabel: "in 6 months",
    color: "from-emerald-500 to-emerald-600",
  },
  {
    name: "Sarah Chen",
    avatar: "SC",
    role: "Online Course Creator",
    quote:
      "They repurposed my 40-hour course into 300+ pieces of content. My course sales tripled from the organic traffic alone.",
    metric: "3x sales",
    metricLabel: "from repurposed content",
    color: "from-neon-purple to-neon-purple-light",
  },
  {
    name: "Marcus Johnson",
    avatar: "MJ",
    role: "Tech Podcaster",
    quote:
      "The AI pipeline is insane. I record once, and EchoForge handles everything — shorts, newsletters, carousels. I just approve and publish.",
    metric: "$12K/mo",
    metricLabel: "passive income",
    color: "from-electric-blue to-electric-blue-light",
  },
  {
    name: "Priya Patel",
    avatar: "PP",
    role: "Wellness Coach",
    quote:
      "As an introvert, faceless content was a game-changer. My TikTok hit 500K followers without me ever showing my face on camera.",
    metric: "500K",
    metricLabel: "TikTok followers",
    color: "from-pink-500 to-pink-600",
  },
];

const stats = [
  { icon: Users, value: "2,400+", label: "Creators Served" },
  { icon: TrendingUp, value: "50M+", label: "Views Generated" },
  { icon: DollarSign, value: "$8M+", label: "Revenue for Clients" },
  { icon: Star, value: "4.9/5", label: "Client Rating" },
];

export default function SuccessStories() {
  return (
    <section id="success-stories" className="py-24 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            Creator <span className="gradient-text">Success Stories</span>
          </h2>
          <p className="text-cyber-muted max-w-2xl mx-auto">
            Real creators, real numbers, real growth — all powered by AI content repurposing.
          </p>
        </motion.div>

        <div className="grid sm:grid-cols-2 gap-6 mb-16">
          {stories.map((story, i) => (
            <motion.div
              key={story.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="bg-cyber-card border border-cyber-border rounded-2xl p-6 card-hover"
            >
              <div className="flex items-start gap-4 mb-4">
                <div
                  className={`w-12 h-12 rounded-full bg-gradient-to-br ${story.color} flex items-center justify-center text-white font-bold text-sm shrink-0`}
                >
                  {story.avatar}
                </div>
                <div>
                  <p className="font-semibold text-foreground">{story.name}</p>
                  <p className="text-sm text-cyber-muted">{story.role}</p>
                </div>
                <div className="ml-auto flex gap-0.5">
                  {[...Array(5)].map((_, j) => (
                    <Star
                      key={j}
                      className="w-3.5 h-3.5 fill-amber-400 text-amber-400"
                    />
                  ))}
                </div>
              </div>
              <p className="text-sm text-cyber-muted mb-4 italic">
                &ldquo;{story.quote}&rdquo;
              </p>
              <div className="flex items-center gap-2 pt-4 border-t border-cyber-border">
                <span className="text-xl font-bold gradient-text">{story.metric}</span>
                <span className="text-xs text-cyber-muted">{story.metricLabel}</span>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="bg-cyber-card border border-cyber-border rounded-xl p-6 text-center"
            >
              <stat.icon className="w-6 h-6 text-neon-purple mx-auto mb-2" />
              <p className="text-2xl font-bold text-foreground">{stat.value}</p>
              <p className="text-xs text-cyber-muted">{stat.label}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
