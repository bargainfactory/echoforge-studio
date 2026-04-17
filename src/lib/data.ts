export interface BlogPost {
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  readTime: string;
  date: string;
  gradient: string;
  featured: boolean;
  content: string[];
}

export interface Project {
  id: string;
  title: string;
  status: "uploading" | "processing" | "review" | "published" | "rejected";
  progress: number;
  assetsReady: number;
  assetsTotal: number;
  eta: string;
  createdAt: string;
  fileName?: string;
  fileSize?: string;
}

export interface Asset {
  id: string;
  projectId: string;
  name: string;
  type: string;
  views: string;
  status: "live" | "sent" | "draft" | "scheduled";
  liked: boolean;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  time: string;
  read: boolean;
  type: "info" | "success" | "warning";
}

export const blogPosts: BlogPost[] = [
  {
    slug: "build-10k-faceless-youtube-channel",
    title: "How to Build a $10K/mo Faceless YouTube Channel in 2025",
    excerpt:
      "The complete blueprint for launching a faceless channel — from niche selection to monetization strategies that actually work.",
    category: "Growth",
    readTime: "8 min read",
    date: "Apr 14, 2025",
    gradient: "from-neon-purple to-electric-blue",
    featured: true,
    content: [
      "Faceless YouTube channels are one of the most lucrative opportunities in the creator economy right now. With AI tools making content creation faster and cheaper than ever, you can build a channel that generates $10K or more per month — without ever showing your face.",
      "The first step is niche selection. The best niches for faceless content combine high CPM (cost per thousand impressions) with evergreen topics. Finance, technology, health, and self-improvement consistently outperform entertainment and lifestyle niches in terms of revenue per view.",
      "Once you've picked your niche, you need a content engine. This is where AI repurposing comes in. Instead of creating every piece of content from scratch, you start with one long-form piece — a podcast episode, a deep-dive video, or a course module — and let AI break it down into dozens of short-form assets.",
      "Your content stack should include: YouTube Shorts (for discovery), long-form videos (for watch time and ad revenue), community posts (for engagement), and an email list (for ownership). Each piece of content feeds into the next, creating a flywheel effect.",
      "For monetization, don't rely solely on AdSense. Layer in affiliate marketing (especially for software and tools), digital products (templates, guides, courses), and sponsorships. A faceless channel with 50K subscribers can easily generate $10K/mo from these combined sources.",
      "The key to scaling is systems. Use tools like EchoForge to automate your content pipeline. Upload once, get 30+ assets. Schedule them across platforms. Track what works. Double down on winners. This is how faceless creators are building six-figure businesses in 2025.",
    ],
  },
  {
    slug: "ai-content-repurposing-guide",
    title: "AI Content Repurposing: The Ultimate Guide",
    excerpt:
      "Turn one piece of content into 30+ assets automatically. Here's exactly how the AI pipeline works behind the scenes.",
    category: "AI Tools",
    readTime: "12 min read",
    date: "Apr 10, 2025",
    gradient: "from-electric-blue to-cyan-500",
    featured: true,
    content: [
      "Content repurposing is the strategy of taking one piece of content and transforming it into multiple formats for different platforms. With AI, this process that used to take hours can now happen in minutes.",
      "The AI repurposing pipeline starts with transcription. Advanced speech-to-text models like Whisper can transcribe hours of audio with near-perfect accuracy, complete with speaker diarization and timestamp alignment.",
      "Next comes content analysis. AI models score each segment of your content for viral potential, identifying hooks, quotable moments, emotional peaks, and knowledge bombs. These segments become the foundation for your short-form clips.",
      "The clipping engine then cuts your content at optimal points. Unlike manual editing where you might create 3-5 clips from an hour of content, AI can identify 15-20 viable clip opportunities, each with strong opening hooks and satisfying conclusions.",
      "Visual enhancement is where the magic happens. AI adds dynamic captions (not just subtitles — animated, highlighted keyword captions), relevant B-roll footage, motion graphics, and branded templates. The result looks professionally produced.",
      "Finally, the distribution layer handles platform-specific formatting. A YouTube Short has different specs than a TikTok or Instagram Reel. The AI adjusts aspect ratios, caption placement, and even pacing to match each platform's algorithm preferences.",
      "The result? One 45-minute podcast episode becomes: 8-12 short-form clips, 2-3 carousel posts, 1 newsletter edition, 5-8 social media posts, and 1 blog article. That's 30+ pieces of content from a single recording session.",
    ],
  },
  {
    slug: "faceless-content-vs-personal-brands",
    title: "Why Faceless Content Outperforms Personal Brands",
    excerpt:
      "Data-backed analysis showing why faceless channels grow faster and monetize better than personality-driven content.",
    category: "Strategy",
    readTime: "6 min read",
    date: "Apr 7, 2025",
    gradient: "from-cyan-500 to-emerald-500",
    featured: false,
    content: [
      "There's a growing body of evidence that faceless content channels outperform personality-driven channels in several key metrics. Let's look at the data.",
      "First, production speed. A faceless creator can publish 5-10x more content than a face-on-camera creator in the same time period. No makeup, no lighting setup, no multiple takes. Just script, produce, publish.",
      "Second, scalability. Personal brands hit a ceiling — you can only be in so many videos. Faceless channels can scale to multiple sub-channels, each targeting different niches, all running simultaneously.",
      "Third, sellability. A faceless channel is a true business asset. It can be sold, licensed, or operated by a team without depending on one person's likeness. This makes it significantly more valuable as an exit opportunity.",
      "The data shows that the top 100 faceless YouTube channels grew an average of 340% faster than personality-driven channels in the same niches over the past 12 months. Their CPMs are 23% higher on average because they tend to operate in high-value niches.",
      "The bottom line: faceless content isn't just a trend — it's a more scalable, more profitable, and more sustainable business model for creators who want to build real wealth.",
    ],
  },
  {
    slug: "creators-guide-passive-income",
    title: "The Creator's Guide to Passive Income",
    excerpt:
      "How to build multiple revenue streams from a single content source using AI repurposing and automation.",
    category: "Monetization",
    readTime: "10 min read",
    date: "Apr 3, 2025",
    gradient: "from-amber-500 to-orange-500",
    featured: false,
    content: [
      "Passive income for creators isn't truly passive — but it can be incredibly leveraged. The key is building systems where one hour of work generates returns for months or years.",
      "The foundation is content that compounds. Evergreen videos on YouTube continue generating ad revenue indefinitely. A video about 'how to invest your first $1000' uploaded today will still get views in 2027.",
      "Layer in digital products. Take your best-performing content and package it into a course, ebook, or template pack. If your faceless finance shorts are getting millions of views, a comprehensive budgeting template pack at $27 will sell consistently.",
      "Affiliate marketing is the multiplier. Every piece of content is an opportunity to recommend tools and services. A single well-placed affiliate link in a viral video description can generate hundreds of dollars per day.",
      "Email is the ownership layer. Social platforms can change algorithms overnight. An email list is yours. Build it from day one, nurture it with repurposed content, and monetize it with product launches and affiliate offers.",
      "The automation stack ties it all together. Use AI repurposing to keep content flowing, email automation to nurture subscribers, and analytics to identify your highest-ROI content. This is how creators build $10K-$50K/mo in semi-passive income.",
    ],
  },
  {
    slug: "case-study-500k-followers-90-days",
    title: "Case Study: 0 to 500K Followers in 90 Days",
    excerpt:
      "How wellness coach Priya Patel used EchoForge to build a massive TikTok following without showing her face.",
    category: "Case Studies",
    readTime: "7 min read",
    date: "Mar 28, 2025",
    gradient: "from-pink-500 to-rose-500",
    featured: false,
    content: [
      "When Priya Patel came to EchoForge, she had a small wellness coaching practice with 47 Instagram followers. She was camera-shy and had tried posting face-to-camera reels — none broke 200 views.",
      "We started by repurposing her existing 20-hour meditation and wellness course. The AI identified 156 clip-worthy moments covering topics from morning routines to stress management techniques.",
      "Each clip was enhanced with calming B-roll footage, animated text overlays, and ambient background music. The faceless format actually enhanced the meditative quality of the content — viewers could focus on the message rather than the messenger.",
      "The posting strategy was aggressive: 4-5 TikToks per day, each targeting different wellness sub-topics. Within the first week, a clip about '3 breathing techniques for anxiety' hit 2.3 million views.",
      "By day 30, Priya had 120K followers. By day 60, 340K. By day 90, she crossed 500K followers with a combined view count exceeding 80 million across all posts.",
      "The business impact was transformative. Her coaching waitlist grew to 200+ people. She launched a digital course that generated $47K in the first week. And she did it all without ever showing her face on camera.",
    ],
  },
  {
    slug: "7-ai-tools-faceless-creators",
    title: "7 AI Tools Every Faceless Creator Needs",
    excerpt:
      "From ElevenLabs voice cloning to automated thumbnail generators — the essential AI toolkit for content creators.",
    category: "AI Tools",
    readTime: "9 min read",
    date: "Mar 22, 2025",
    gradient: "from-violet-500 to-purple-500",
    featured: false,
    content: [
      "The faceless creator toolkit has evolved dramatically in 2025. Here are the 7 AI tools that every serious faceless creator should have in their stack.",
      "1. EchoForge Studio — for content repurposing. Turn one long-form video into 30+ assets automatically. This is the backbone of any faceless content operation.",
      "2. ElevenLabs — for AI voice generation. Create natural-sounding voiceovers in any style without recording yourself. Their voice cloning feature means you can create a consistent brand voice.",
      "3. Midjourney/DALL-E — for thumbnail and visual generation. Create eye-catching thumbnails and visual assets that drive clicks without needing photography skills.",
      "4. Descript — for script writing and editing. Write scripts with AI assistance and edit audio/video by editing text. Perfect for creators who think in words rather than timelines.",
      "5. Canva AI — for carousel and graphic design. Automated layout suggestions, brand kit management, and batch creation make it easy to produce professional graphics at scale.",
      "6. Opus Clip — for identifying viral moments. AI analyzes your long-form content and scores segments by viral potential, helping you prioritize which clips to publish first.",
      "7. Buffer/Hootsuite — for scheduling and analytics. Automated posting across platforms with AI-powered optimal timing suggestions. Track what works and scale your winners.",
    ],
  },
  {
    slug: "linkedin-carousel-strategy",
    title: "LinkedIn Carousel Strategy That Gets 10x Saves",
    excerpt:
      "The exact formula for creating carousel posts that go viral and drive leads — extracted from 500+ top-performing posts.",
    category: "Strategy",
    readTime: "5 min read",
    date: "Mar 18, 2025",
    gradient: "from-blue-500 to-indigo-500",
    featured: false,
    content: [
      "LinkedIn carousels are the highest-engagement format on the platform, generating 3-5x more saves and shares than text posts. Here's the formula we've extracted from analyzing 500+ top-performing carousels.",
      "Slide 1: The Hook. Your first slide must create curiosity or promise value. The best-performing hooks follow the pattern: '[Number] [Things] that [Desirable Outcome].' Example: '7 pricing mistakes that cost SaaS founders $1M+.'",
      "Slides 2-8: The Value. Each slide should deliver one atomic insight. Use large text (minimum 24pt), minimal words (under 30 per slide), and consistent branding. Include data points, frameworks, or counterintuitive takes.",
      "Slide 9: The Summary. Recap all points in a single slide. This becomes the most-saved slide because it's a reference card. Make it visually clean and screenshot-worthy.",
      "Slide 10: The CTA. Tell people what to do next. The highest-converting CTAs are: 'Save this for later' (drives saves), 'Tag someone who needs this' (drives reach), and 'Follow for more' (drives followers).",
      "Design tips: Use dark backgrounds (they stand out in the feed), gradient accents (they catch the eye during scroll), and consistent typography. Your carousel should be instantly recognizable as yours.",
    ],
  },
  {
    slug: "pricing-digital-products",
    title: "How to Price Your Digital Products for Maximum Revenue",
    excerpt:
      "Pricing psychology and data-driven strategies for courses, memberships, and digital downloads.",
    category: "Monetization",
    readTime: "8 min read",
    date: "Mar 12, 2025",
    gradient: "from-emerald-500 to-teal-500",
    featured: false,
    content: [
      "Pricing is the single biggest lever for revenue growth in digital products. A 10% price increase often translates to a 25-50% profit increase because your costs stay the same.",
      "The anchoring principle is your best friend. Always show a higher-priced option first. If you sell a $97 course, show a $297 premium bundle above it. The $97 suddenly feels like a bargain.",
      "Use the Rule of 3: offer three tiers. Basic ($X), Standard ($3X), and Premium ($5X). Most buyers choose the middle option, which is exactly where you want them. This is called the compromise effect.",
      "End prices in 7. Studies consistently show that prices ending in 7 outperform those ending in 9 or 0. $47 converts better than $49. $197 converts better than $199. It's subtle but significant at scale.",
      "Bundle aggressively. A course + template pack + community access at $197 converts better than the course alone at $97. You're not raising the price — you're increasing the perceived value faster than you're increasing the cost.",
      "Test seasonally. Black Friday, New Year, and September (back-to-school for adult learners) are peak buying seasons. Plan your highest-priced launches around these windows when buying intent is naturally elevated.",
    ],
  },
];

export const defaultProjects: Project[] = [
  {
    id: "proj-1",
    title: "Episode 52 — The Future of AI Agents",
    status: "processing",
    progress: 42,
    assetsReady: 3,
    assetsTotal: 12,
    eta: "~45 min",
    createdAt: "2025-04-16T10:30:00Z",
    fileName: "ep52-ai-agents.mp4",
    fileSize: "1.2 GB",
  },
  {
    id: "proj-2",
    title: "Episode 51 — Building in Public",
    status: "review",
    progress: 100,
    assetsReady: 10,
    assetsTotal: 10,
    eta: "Awaiting approval",
    createdAt: "2025-04-14T09:15:00Z",
    fileName: "ep51-building-public.mp4",
    fileSize: "890 MB",
  },
  {
    id: "proj-3",
    title: "Episode 50 — Monetize Your Podcast",
    status: "published",
    progress: 100,
    assetsReady: 14,
    assetsTotal: 14,
    eta: "Published Apr 12",
    createdAt: "2025-04-10T14:00:00Z",
    fileName: "ep50-monetize.mp4",
    fileSize: "1.4 GB",
  },
  {
    id: "proj-4",
    title: "Episode 49 — Audience Growth Hacks",
    status: "published",
    progress: 100,
    assetsReady: 11,
    assetsTotal: 11,
    eta: "Published Apr 8",
    createdAt: "2025-04-06T11:45:00Z",
    fileName: "ep49-growth.mp4",
    fileSize: "1.1 GB",
  },
];

export const defaultAssets: Asset[] = [
  { id: "a-1", projectId: "proj-3", name: "AI Agents Short #1", type: "YouTube Short", views: "24.3K", status: "live", liked: false },
  { id: "a-2", projectId: "proj-3", name: "Building in Public Carousel", type: "LinkedIn", views: "8.7K", status: "live", liked: false },
  { id: "a-3", projectId: "proj-3", name: "Podcast Highlight Reel", type: "TikTok", views: "142K", status: "live", liked: true },
  { id: "a-4", projectId: "proj-3", name: "Weekly Newsletter #50", type: "Email", views: "3.2K opens", status: "sent", liked: false },
  { id: "a-5", projectId: "proj-2", name: "Building in Public Short #1", type: "YouTube Short", views: "—", status: "draft", liked: false },
  { id: "a-6", projectId: "proj-2", name: "BIP LinkedIn Carousel", type: "LinkedIn", views: "—", status: "draft", liked: false },
];

export const defaultNotifications: Notification[] = [
  {
    id: "n-1",
    title: "Processing Complete",
    message: "Episode 51 — Building in Public is ready for review.",
    time: "2 hours ago",
    read: false,
    type: "success",
  },
  {
    id: "n-2",
    title: "New Assets Available",
    message: "3 new short-form clips generated for Episode 52.",
    time: "5 hours ago",
    read: false,
    type: "info",
  },
  {
    id: "n-3",
    title: "Publishing Scheduled",
    message: "Episode 50 assets scheduled for auto-publish via Zapier.",
    time: "1 day ago",
    read: true,
    type: "info",
  },
];
