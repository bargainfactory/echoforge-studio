import Navbar from "@/components/navbar";
import Hero from "@/components/hero";
import HowItWorks from "@/components/how-it-works";
import Portfolio from "@/components/portfolio";
import Services from "@/components/services";
import SuccessStories from "@/components/success-stories";
import Pricing from "@/components/pricing";
import DashboardTeaser from "@/components/dashboard-teaser";
import TrustPillars from "@/components/trust-pillars";
import FinalCta from "@/components/final-cta";
import BlogPreview from "@/components/blog-preview";
import Footer from "@/components/footer";

export default function Home() {
  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <HowItWorks />
        <Portfolio />
        <Services />
        <SuccessStories />
        <TrustPillars />
        <Pricing />
        <DashboardTeaser />
        <FinalCta />
        <BlogPreview />
      </main>
      <Footer />
    </>
  );
}
