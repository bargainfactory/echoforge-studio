"use client";

import { motion } from "framer-motion";
import { Eye, Heart, MessageCircle, Play } from "lucide-react";

const portfolioItems = [
  {
    title: "AI Productivity Hacks",
    platform: "YouTube Shorts",
    views: "2.4M",
    likes: "89K",
    comments: "3.2K",
    thumbnail: "from-violet-600 via-purple-600 to-indigo-600",
    category: "Tech",
  },
  {
    title: "5 Money Rules Nobody Teaches",
    platform: "TikTok",
    views: "1.8M",
    likes: "124K",
    comments: "5.6K",
    thumbnail: "from-emerald-600 via-green-600 to-teal-600",
    category: "Finance",
  },
  {
    title: "The Stoic Morning Routine",
    platform: "Instagram Reels",
    views: "890K",
    likes: "67K",
    comments: "2.1K",
    thumbnail: "from-amber-600 via-orange-600 to-red-600",
    category: "Lifestyle",
  },
  {
    title: "How Markets Really Work",
    platform: "YouTube Shorts",
    views: "3.1M",
    likes: "156K",
    comments: "8.4K",
    thumbnail: "from-blue-600 via-cyan-600 to-teal-600",
    category: "Finance",
  },
  {
    title: "Python in 60 Seconds",
    platform: "TikTok",
    views: "1.2M",
    likes: "93K",
    comments: "4.7K",
    thumbnail: "from-yellow-500 via-amber-500 to-orange-500",
    category: "Tech",
  },
  {
    title: "Sleep Science Explained",
    platform: "Instagram Reels",
    views: "670K",
    likes: "45K",
    comments: "1.8K",
    thumbnail: "from-indigo-600 via-blue-600 to-cyan-600",
    category: "Health",
  },
];

export default function Portfolio() {
  return (
    <section id="portfolio" className="py-24 bg-cyber-dark relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            Faceless Content That <span className="gradient-text">Goes Viral</span>
          </h2>
          <p className="text-cyber-muted max-w-2xl mx-auto">
            Real results from real creators — all produced without showing a single face.
          </p>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {portfolioItems.map((item, i) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="group bg-cyber-card border border-cyber-border rounded-2xl overflow-hidden card-hover"
            >
              <div
                className={`relative aspect-[9/16] max-h-64 bg-gradient-to-br ${item.thumbnail} flex items-center justify-center`}
              >
                <div className="absolute inset-0 bg-black/30 group-hover:bg-black/10 transition-colors" />
                <div className="relative w-14 h-14 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Play className="w-6 h-6 text-white ml-1" />
                </div>
                <div className="absolute top-3 left-3 px-2 py-1 rounded-md bg-black/50 backdrop-blur-sm text-xs text-white font-medium">
                  {item.category}
                </div>
                <div className="absolute top-3 right-3 px-2 py-1 rounded-md bg-black/50 backdrop-blur-sm text-xs text-white">
                  {item.platform}
                </div>
              </div>
              <div className="p-4">
                <h3 className="font-medium text-foreground mb-3">{item.title}</h3>
                <div className="flex items-center gap-4 text-xs text-cyber-muted">
                  <span className="flex items-center gap-1">
                    <Eye className="w-3.5 h-3.5" /> {item.views}
                  </span>
                  <span className="flex items-center gap-1">
                    <Heart className="w-3.5 h-3.5" /> {item.likes}
                  </span>
                  <span className="flex items-center gap-1">
                    <MessageCircle className="w-3.5 h-3.5" /> {item.comments}
                  </span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
