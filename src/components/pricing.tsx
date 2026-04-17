"use client";

import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Check, Sparkles, Zap, Crown } from "lucide-react";
import { useApp } from "@/lib/context";

const plans = [
  {
    name: "Starter",
    description: "Perfect for testing the waters",
    price: 497,
    period: "/month",
    icon: Zap,
    color: "from-electric-blue to-electric-blue-light",
    features: [
      "4 long-form videos/month",
      "20 short-form clips",
      "Basic captions & overlays",
      "2 platform exports",
      "48-hour turnaround",
      "Email support",
    ],
    cta: "Get Started",
    popular: false,
    priceId: "starter",
  },
  {
    name: "Creator Pro",
    description: "For serious content creators",
    price: 997,
    period: "/month",
    icon: Sparkles,
    color: "from-neon-purple to-neon-purple-light",
    features: [
      "8 long-form videos/month",
      "40+ short-form clips",
      "AI voiceover & music",
      "All platform exports",
      "Carousel & newsletter",
      "24-hour turnaround",
      "Client dashboard access",
      "Dedicated Slack channel",
    ],
    cta: "Start Creating",
    popular: true,
    priceId: "creatorPro",
  },
  {
    name: "Agency",
    description: "For brands & agencies at scale",
    price: 2497,
    period: "/month",
    icon: Crown,
    color: "from-amber-500 to-amber-600",
    features: [
      "Unlimited videos",
      "100+ short-form clips",
      "Custom branding & templates",
      "All platform exports",
      "Full content suite",
      "Same-day turnaround",
      "White-label dashboard",
      "Zapier automation",
      "Dedicated account manager",
      "API access",
    ],
    cta: "Contact Sales",
    popular: false,
    priceId: "agency",
  },
];

const oneOffs = [
  { name: "Single Video Package", price: 199, items: "1 video → 8 assets" },
  { name: "Launch Bundle", price: 799, items: "5 videos → 50+ assets" },
  { name: "Course Repurpose", price: 1499, items: "Full course → 100+ assets" },
];

export default function Pricing() {
  const router = useRouter();
  const { user, addToast } = useApp();

  function handlePlanClick(plan: typeof plans[0]) {
    if (plan.priceId === "agency") {
      router.push("/contact");
      return;
    }
    if (!user) {
      addToast("Please sign up first to select a plan", "info");
      router.push("/signup");
      return;
    }
    addToast(`${plan.name} plan selected! Redirecting to checkout...`);
    setTimeout(() => {
      addToast("Demo mode: Stripe checkout would open here with your selected plan.", "info");
    }, 1500);
  }

  function handleOneOffClick(pkg: typeof oneOffs[0]) {
    if (!user) {
      addToast("Please sign up first", "info");
      router.push("/signup");
      return;
    }
    addToast(`${pkg.name} selected — $${pkg.price}`);
    setTimeout(() => {
      addToast("Demo mode: One-time Stripe payment would process here.", "info");
    }, 1500);
  }

  return (
    <section id="pricing" className="py-24 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            Simple, <span className="gradient-text">Scalable Pricing</span>
          </h2>
          <p className="text-cyber-muted max-w-2xl mx-auto">
            Monthly retainers for consistent growth, or one-off packages for specific projects.
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-6 mb-16">
          {plans.map((plan, i) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className={`relative bg-cyber-card border rounded-2xl p-8 ${
                plan.popular
                  ? "border-neon-purple glow-purple"
                  : "border-cyber-border card-hover"
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-gradient-to-r from-neon-purple to-electric-blue text-xs font-medium text-white">
                  Most Popular
                </div>
              )}
              <div
                className={`w-12 h-12 rounded-xl bg-gradient-to-br ${plan.color} flex items-center justify-center mb-4`}
              >
                <plan.icon className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-bold text-foreground">{plan.name}</h3>
              <p className="text-sm text-cyber-muted mb-4">{plan.description}</p>
              <div className="mb-6">
                <span className="text-4xl font-bold text-foreground">${plan.price}</span>
                <span className="text-cyber-muted">{plan.period}</span>
              </div>
              <button
                onClick={() => handlePlanClick(plan)}
                className={`w-full py-3 rounded-full font-medium text-sm transition-opacity hover:opacity-90 mb-8 cursor-pointer ${
                  plan.popular
                    ? "bg-gradient-to-r from-neon-purple to-electric-blue text-white"
                    : "bg-cyber-dark border border-cyber-border text-foreground hover:border-neon-purple/50"
                }`}
              >
                {plan.cta}
              </button>
              <ul className="space-y-3">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-3 text-sm">
                    <Check className="w-4 h-4 text-success mt-0.5 shrink-0" />
                    <span className="text-cyber-muted">{feature}</span>
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <h3 className="text-xl font-bold text-center mb-8">
            One-Off Packages
          </h3>
          <div className="grid sm:grid-cols-3 gap-4">
            {oneOffs.map((pkg) => (
              <button
                key={pkg.name}
                onClick={() => handleOneOffClick(pkg)}
                className="bg-cyber-card border border-cyber-border rounded-xl p-6 text-center card-hover cursor-pointer"
              >
                <p className="font-medium text-foreground mb-1">{pkg.name}</p>
                <p className="text-2xl font-bold gradient-text mb-1">${pkg.price}</p>
                <p className="text-sm text-cyber-muted">{pkg.items}</p>
              </button>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
