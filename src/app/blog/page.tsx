"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft, Clock, Tag, Search, ArrowRight } from "lucide-react";

const categories = ["All", "Growth", "AI Tools", "Strategy", "Monetization", "Case Studies"];

const allPosts = [
  {
    title: "How to Build a $10K/mo Faceless YouTube Channel in 2025",
    excerpt:
      "The complete blueprint for launching a faceless channel — from niche selection to monetization strategies that actually work.",
    category: "Growth",
    readTime: "8 min read",
    date: "Apr 14, 2025",
    gradient: "from-neon-purple to-electric-blue",
    featured: true,
  },
  {
    title: "AI Content Repurposing: The Ultimate Guide",
    excerpt:
      "Turn one piece of content into 30+ assets automatically. Here's exactly how the AI pipeline works behind the scenes.",
    category: "AI Tools",
    readTime: "12 min read",
    date: "Apr 10, 2025",
    gradient: "from-electric-blue to-cyan-500",
    featured: true,
  },
  {
    title: "Why Faceless Content Outperforms Personal Brands",
    excerpt:
      "Data-backed analysis showing why faceless channels grow faster and monetize better than personality-driven content.",
    category: "Strategy",
    readTime: "6 min read",
    date: "Apr 7, 2025",
    gradient: "from-cyan-500 to-emerald-500",
    featured: false,
  },
  {
    title: "The Creator's Guide to Passive Income",
    excerpt:
      "How to build multiple revenue streams from a single content source using AI repurposing and automation.",
    category: "Monetization",
    readTime: "10 min read",
    date: "Apr 3, 2025",
    gradient: "from-amber-500 to-orange-500",
    featured: false,
  },
  {
    title: "Case Study: 0 to 500K Followers in 90 Days",
    excerpt:
      "How wellness coach Priya Patel used EchoForge to build a massive TikTok following without showing her face.",
    category: "Case Studies",
    readTime: "7 min read",
    date: "Mar 28, 2025",
    gradient: "from-pink-500 to-rose-500",
    featured: false,
  },
  {
    title: "7 AI Tools Every Faceless Creator Needs",
    excerpt:
      "From ElevenLabs voice cloning to automated thumbnail generators — the essential AI toolkit for content creators.",
    category: "AI Tools",
    readTime: "9 min read",
    date: "Mar 22, 2025",
    gradient: "from-violet-500 to-purple-500",
    featured: false,
  },
  {
    title: "LinkedIn Carousel Strategy That Gets 10x Saves",
    excerpt:
      "The exact formula for creating carousel posts that go viral and drive leads — extracted from 500+ top-performing posts.",
    category: "Strategy",
    readTime: "5 min read",
    date: "Mar 18, 2025",
    gradient: "from-blue-500 to-indigo-500",
    featured: false,
  },
  {
    title: "How to Price Your Digital Products for Maximum Revenue",
    excerpt:
      "Pricing psychology and data-driven strategies for courses, memberships, and digital downloads.",
    category: "Monetization",
    readTime: "8 min read",
    date: "Mar 12, 2025",
    gradient: "from-emerald-500 to-teal-500",
    featured: false,
  },
];

export default function BlogPage() {
  const [activeCategory, setActiveCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");

  const filtered = allPosts.filter((post) => {
    const matchesCategory = activeCategory === "All" || post.category === activeCategory;
    const matchesSearch =
      !searchQuery ||
      post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.excerpt.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-cyber-muted hover:text-foreground transition-colors mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </Link>

        <div className="mb-12">
          <h1 className="text-3xl sm:text-4xl font-bold mb-4">
            Resource <span className="gradient-text">Hub</span>
          </h1>
          <p className="text-cyber-muted max-w-2xl">
            Guides, strategies, and deep dives for faceless content creators who want to grow with AI.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-cyber-muted" />
            <input
              type="text"
              placeholder="Search articles..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-cyber-card border border-cyber-border rounded-xl text-sm text-foreground placeholder:text-cyber-muted focus:outline-none focus:border-neon-purple/50"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  activeCategory === cat
                    ? "bg-neon-purple/20 text-neon-purple border border-neon-purple/30"
                    : "bg-cyber-card border border-cyber-border text-cyber-muted hover:text-foreground"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((post, i) => (
            <motion.article
              key={post.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className={`group bg-cyber-card border border-cyber-border rounded-2xl overflow-hidden card-hover ${
                post.featured && activeCategory === "All" ? "md:col-span-2 lg:col-span-1" : ""
              }`}
            >
              <div className={`h-40 bg-gradient-to-br ${post.gradient} relative`}>
                <div className="absolute inset-0 bg-black/20" />
                {post.featured && (
                  <div className="absolute top-3 left-3 px-2 py-1 rounded-md bg-neon-purple/80 text-xs text-white font-medium">
                    Featured
                  </div>
                )}
              </div>
              <div className="p-6">
                <div className="flex items-center gap-3 mb-3">
                  <span className="flex items-center gap-1 text-xs text-neon-purple">
                    <Tag className="w-3 h-3" /> {post.category}
                  </span>
                  <span className="flex items-center gap-1 text-xs text-cyber-muted">
                    <Clock className="w-3 h-3" /> {post.readTime}
                  </span>
                </div>
                <h3 className="font-semibold text-foreground mb-2 group-hover:text-neon-purple transition-colors">
                  {post.title}
                </h3>
                <p className="text-sm text-cyber-muted mb-4">{post.excerpt}</p>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-cyber-muted">{post.date}</span>
                  <span className="text-xs text-neon-purple flex items-center gap-1 group-hover:underline">
                    Read More <ArrowRight className="w-3 h-3" />
                  </span>
                </div>
              </div>
            </motion.article>
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-16">
            <p className="text-cyber-muted">No articles found matching your criteria.</p>
          </div>
        )}
      </div>
    </div>
  );
}
