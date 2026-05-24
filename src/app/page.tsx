import HomePage from "@/components/landing/home-page";
import MarqueeTicker from "@/components/landing/marquee-ticker";
import AboutSection from "@/components/landing/about-section";
import InvestmentPillars from "@/components/landing/investment-pillars";
import FancyIdsSection from "@/components/landing/fancy-ids-section";
import ProfitCalculator from "@/components/landing/profit-calculator";
import EcosystemSection from "@/components/landing/ecosystem-section";
import SagenexAcademy from "@/components/landing/sagenex-academy";
import RoadmapSection from "@/components/landing/roadmap-section";
import AppDownloadSection from "@/components/landing/app-download";
import FAQSection from "@/components/landing/faq-section";
import Footer from "@/components/landing/footer";
import Navbar from "./components/Navbar";

export default function Home() {
  return (
    <main className="bg-[var(--ink)] min-h-screen">
      <Navbar />
      <HomePage />
      <MarqueeTicker />
      <AboutSection />
      <InvestmentPillars />
      <FancyIdsSection />
      <ProfitCalculator />
      <EcosystemSection />
      {/* <SagenexAcademy /> */}
      <RoadmapSection />
      <AppDownloadSection />
      <FAQSection />
      <Footer />
    </main>
  );
}
