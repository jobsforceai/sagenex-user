import AboutUs from "@/components/landing/about-us";
import HomePage from "@/components/landing/home-page";
import LevelsEarnings from "@/components/landing/level-earning";
import RanksSection from "@/components/landing/ranks-section";
import SagenexAcademy from "@/components/landing/sagenex-academy";
import CashCardSection from "./components/cash-card";
import { Footer } from "./components/LandingPage";
import Navbar from "./components/Navbar";
import SgCoinPage from "@/components/landing/sagenex-coin";


export default function Home() {
  return (
    <>
      <Navbar />
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