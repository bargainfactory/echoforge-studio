"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, Zap } from "lucide-react";
import { useTranslation } from "@/lib/i18n";
import LanguageSwitcher from "@/components/language-switcher";

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const { t } = useTranslation();

  const links = [
    { href: "/#services", label: t("nav.services") },
    { href: "/#portfolio", label: t("nav.portfolio") },
    { href: "/#how-it-works", label: t("nav.howItWorks") },
    { href: "/pricing", label: t("nav.pricing") },
    { href: "/#success-stories", label: t("nav.stories") },
    { href: "/blog", label: t("nav.blog") },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-xl border-b border-cyber-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-neon-purple to-electric-blue flex items-center justify-center">
              <Zap className="w-4 h-4 text-white" />
            </div>
            <span className="text-lg font-bold gradient-text">EchoForge</span>
          </Link>

          <div className="hidden md:flex items-center gap-8">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`text-sm transition-colors ${
                  pathname === link.href ? "text-foreground" : "text-cyber-muted hover:text-foreground"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>

          <div className="hidden md:flex items-center gap-3">
            <LanguageSwitcher />
            <Link
              href="/login"
              className="text-sm text-cyber-muted hover:text-foreground transition-colors px-4 py-2"
            >
              {t("nav.login")}
            </Link>
            <Link
              href="/signup"
              className="text-sm font-medium px-5 py-2 rounded-full bg-gradient-to-r from-neon-purple to-electric-blue text-white hover:opacity-90 transition-opacity"
            >
              {t("nav.getStarted")}
            </Link>
          </div>

          <button
            onClick={() => setOpen(!open)}
            className="md:hidden p-2 text-cyber-muted"
          >
            {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden border-t border-cyber-border bg-background/95 backdrop-blur-xl"
          >
            <div className="px-4 py-4 space-y-3">
              {links.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className="block text-sm text-cyber-muted hover:text-foreground transition-colors py-2"
                >
                  {link.label}
                </Link>
              ))}
              <div className="pt-3 border-t border-cyber-border space-y-2">
                <Link href="/login" onClick={() => setOpen(false)} className="block text-sm text-cyber-muted py-2">
                  {t("nav.login")}
                </Link>
                <Link
                  href="/signup"
                  onClick={() => setOpen(false)}
                  className="block text-center text-sm font-medium px-5 py-2.5 rounded-full bg-gradient-to-r from-neon-purple to-electric-blue text-white"
                >
                  {t("nav.getStarted")}
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
