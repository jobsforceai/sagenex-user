import HomePage from "@/components/landing/home-page";
import SagenexAcademy from "@/components/landing/sagenex-academy";
import EcosystemSection from "@/components/landing/ecosystem-section";
import AppDownloadSection from "@/components/landing/app-download";
import Navbar from "./components/Navbar";
import FAQSection from "@/components/landing/faq-section";
import Footer from "@/components/landing/footer";
import MarqueeTicker from "@/components/landing/marquee-ticker";

export default function Home() {
  return (
    <div className="bg-white">
      <Navbar />
      <HomePage />
      <MarqueeTicker />
      <EcosystemSection />
      <SagenexAcademy />
      <AppDownloadSection />
      <FAQSection />
      <Footer />
    </div>
  );
}
