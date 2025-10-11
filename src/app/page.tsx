import AboutUs from "@/components/landing/about-us";
import HomePage from "@/components/landing/home-page";
import LevelsEarnings from "@/components/landing/level-earning";
import RanksSection from "@/components/landing/ranks-section";
import SagenexAcademy from "@/components/landing/sagenex-academy";
import CashCardSection from "../components/landing/cash-card";
import Navbar from "./components/Navbar";
import SgCoinPage from "@/components/landing/sagenex-coin";
import ProfitCalculator from "@/components/landing/profit-calculator";
import Footer from "@/components/landing/footer";


export default function Home() {
  return (
    <>
      <Navbar />
      <ProfitCalculator />
      <HomePage />
      <AboutUs />
      <SagenexAcademy/>
      {/* <KYCSection /> */}
      <LevelsEarnings/>
      <RanksSection />
      <CashCardSection/>
      <SgCoinPage />
      <Footer />
    </>
  );
}