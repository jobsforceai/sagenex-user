import HomePage from "@/components/landing/home-page";
import SagenexAcademy from "@/components/landing/sagenex-academy";
// import CashCardSection from "../components/landing/cash-card";
import EcosystemSection from "@/components/landing/ecosystem-section";
import AppDownloadSection from "../components/landing/app-download";
import Navbar from "./components/Navbar";
// import SgCoinPage from "@/components/landing/sagenex-coin";
import ProfitCalculator from "@/components/landing/profit-calculator";
import FAQSection from "@/components/landing/faq-section";
import Footer from "@/components/landing/footer";


export default function Home() {
  return (
    <>
      <Navbar />
      <ProfitCalculator />
      <HomePage />
      <SagenexAcademy/>
      <EcosystemSection />
      {/* <KYCSection /> */}
      {/* <CashCardSection/> */}
      <AppDownloadSection />
      {/* <SgCoinPage /> */}
      <FAQSection />
      <Footer />
    </>
  );
}