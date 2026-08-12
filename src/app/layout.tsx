import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { AppProvider } from "@/lib/context";
import { I18nProvider } from "@/lib/i18n";
import ToastContainer from "@/components/toast";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const TITLE = "Virafold — AI Content Repurposing for Faceless Creators";
const DESCRIPTION =
  "Turn one long-form video into 30+ short-form assets, carousels, newsletters, and TikToks. AI-powered, faceless-first content engine for creators, podcasters, and course sellers.";

export const metadata: Metadata = {
  metadataBase: new URL("https://virafold.ai"),
  title: TITLE,
  description: DESCRIPTION,
  keywords: [
    "AI content repurposing",
    "faceless YouTube",
    "content automation",
    "TikTok content",
    "podcast repurposing",
  ],
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    url: "https://virafold.ai",
    siteName: "Virafold",
    title: TITLE,
    description: DESCRIPTION,
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
  },
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
      <body className="min-h-full flex flex-col">
        <I18nProvider>
          <AppProvider>
            {children}
            <ToastContainer />
          </AppProvider>
        </I18nProvider>
      </body>
    </html>
  );
}
