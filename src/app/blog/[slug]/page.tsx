import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { blogPosts } from "@/lib/data";
import ArticleClient from "./article-client";

/**
 * Server wrapper for blog articles: per-article metadata (title, description,
 * canonical, OG) and BlogPosting structured data land in the first-pass HTML
 * for crawlers; the interactive article body renders in the client component.
 */

export function generateStaticParams() {
  return blogPosts.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = blogPosts.find((p) => p.slug === slug);
  if (!post) return {};
  return {
    title: `${post.title} | Virafold Blog`,
    description: post.excerpt,
    alternates: { canonical: `/blog/${slug}` },
    openGraph: {
      type: "article",
      url: `https://virafold.ai/blog/${slug}`,
      siteName: "Virafold",
      title: post.title,
      description: post.excerpt,
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.excerpt,
    },
  };
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = blogPosts.find((p) => p.slug === slug);
  if (!post) notFound();

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.excerpt,
    url: `https://virafold.ai/blog/${slug}`,
    articleSection: post.category,
    author: { "@type": "Organization", name: "Virafold" },
    publisher: { "@type": "Organization", name: "Virafold", url: "https://virafold.ai" },
    mainEntityOfPage: `https://virafold.ai/blog/${slug}`,
    articleBody: post.content.join("\n\n"),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <ArticleClient slug={slug} />
    </>
  );
}
