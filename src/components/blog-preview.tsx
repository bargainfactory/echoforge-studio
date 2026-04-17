"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowRight, Clock, Tag } from "lucide-react";

const posts = [
  {
    title: "How to Build a $10K/mo Faceless YouTube Channel in 2025",
    excerpt:
      "The complete blueprint for launching a faceless channel — from niche selection to monetization.",
    category: "Growth",
    readTime: "8 min read",
    gradient: "from-neon-purple to-electric-blue",
  },
  {
    title: "AI Content Repurposing: The Ultimate Guide",
    excerpt:
      "Turn one piece of content into 30+ assets automatically. Here's exactly how the pipeline works.",
    category: "AI Tools",
    readTime: "12 min read",
    gradient: "from-electric-blue to-cyan-500",
  },
  {
    title: "Why Faceless Content Outperforms Personal Brands",
    excerpt:
      "Data-backed analysis of why faceless channels grow faster and monetize better than personality-driven content.",
    category: "Strategy",
    readTime: "6 min read",
    gradient: "from-cyan-500 to-emerald-500",
  },
];

export default function BlogPreview() {
  return (
    <section className="py-24 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="flex items-end justify-between mb-12"
        >
          <div>
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              Resource <span className="gradient-text">Hub</span>
            </h2>
            <p className="text-cyber-muted max-w-lg">
              Guides, strategies, and insights for faceless content creators.
            </p>
          </div>
          <Link
            href="/blog"
            className="hidden sm:flex items-center gap-2 text-sm text-neon-purple hover:underline"
          >
            View All <ArrowRight className="w-4 h-4" />
          </Link>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-6">
          {posts.map((post, i) => (
            <motion.article
              key={post.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="group bg-cyber-card border border-cyber-border rounded-2xl overflow-hidden card-hover"
            >
              <div className={`h-40 bg-gradient-to-br ${post.gradient} relative`}>
                <div className="absolute inset-0 bg-black/20" />
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
                <p className="text-sm text-cyber-muted">{post.excerpt}</p>
              </div>
            </motion.article>
          ))}
        </div>

        <Link
          href="/blog"
          className="sm:hidden flex items-center justify-center gap-2 mt-8 text-sm text-neon-purple"
        >
          View All Posts <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </section>
  );
}
