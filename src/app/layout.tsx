import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "EchoForge Studio — AI Content Repurposing for Faceless Creators",
  description:
    "Turn one long-form video into 30+ short-form assets, carousels, newsletters, and TikToks. AI-powered, faceless-first content engine for creators, podcasters, and course sellers.",
  keywords: [
    "AI content repurposing",
    "faceless YouTube",
    "content automation",
    "TikTok content",
    "podcast repurposing",
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
