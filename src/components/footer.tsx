import Link from "next/link";
import { Zap, Globe, Video, Camera, Briefcase } from "lucide-react";

const footerLinks = {
  Services: [
    { label: "YouTube Shorts", href: "#services" },
    { label: "TikTok Content", href: "#services" },
    { label: "LinkedIn Posts", href: "#services" },
    { label: "Email Newsletters", href: "#services" },
    { label: "Carousel Design", href: "#services" },
  ],
  Company: [
    { label: "About", href: "#" },
    { label: "Blog", href: "/blog" },
    { label: "Careers", href: "#" },
    { label: "Contact", href: "#" },
  ],
  Resources: [
    { label: "How It Works", href: "#how-it-works" },
    { label: "Pricing", href: "/pricing" },
    { label: "Success Stories", href: "#success-stories" },
    { label: "Client Dashboard", href: "/dashboard" },
  ],
  Legal: [
    { label: "Privacy Policy", href: "#" },
    { label: "Terms of Service", href: "#" },
    { label: "Cookie Policy", href: "#" },
  ],
};

const socials = [
  { icon: Globe, href: "#", label: "Twitter" },
  { icon: Video, href: "#", label: "YouTube" },
  { icon: Camera, href: "#", label: "Instagram" },
  { icon: Briefcase, href: "#", label: "LinkedIn" },
];

export default function Footer() {
  return (
    <footer className="border-t border-cyber-border bg-cyber-dark">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8">
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-neon-purple to-electric-blue flex items-center justify-center">
                <Zap className="w-4 h-4 text-white" />
              </div>
              <span className="text-lg font-bold gradient-text">EchoForge</span>
            </Link>
            <p className="text-sm text-cyber-muted mb-6 max-w-xs">
              AI-powered content repurposing. Turn one long-form piece into 30+ assets automatically.
            </p>
            <div className="flex gap-3">
              {socials.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  className="w-9 h-9 rounded-lg bg-cyber-card border border-cyber-border flex items-center justify-center text-cyber-muted hover:text-neon-purple hover:border-neon-purple transition-all"
                >
                  <social.icon className="w-4 h-4" />
                </a>
              ))}
            </div>
          </div>

          {Object.entries(footerLinks).map(([title, links]) => (
            <div key={title}>
              <h4 className="text-sm font-semibold text-foreground mb-4">{title}</h4>
              <ul className="space-y-2.5">
                {links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-sm text-cyber-muted hover:text-foreground transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 pt-8 border-t border-cyber-border flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-cyber-muted">
            &copy; {new Date().getFullYear()} EchoForge Studio. All rights reserved.
          </p>
          <p className="text-sm text-cyber-muted">
            Powered by AI. Built for creators.
          </p>
        </div>
      </div>
    </footer>
  );
}
