import Navbar from "@/components/navbar";
import Hero from "@/components/hero";
import Services from "@/components/services";
import Portfolio from "@/components/portfolio";
import HowItWorks from "@/components/how-it-works";
import Pricing from "@/components/pricing";
import SuccessStories from "@/components/success-stories";
import DashboardTeaser from "@/components/dashboard-teaser";
import BlogPreview from "@/components/blog-preview";
import Footer from "@/components/footer";

export default function Home() {
  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <Services />
        <Portfolio />
        <HowItWorks />
        <Pricing />
        <SuccessStories />
        <DashboardTeaser />
        <BlogPreview />
      </main>
      <Footer />
    </>
  );
}
