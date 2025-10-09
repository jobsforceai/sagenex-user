import Navbar from "./components/Navbar";
// prajyot branch
import LandingPage from "./components/LandingPage";
// main branch
import HomePage from "./components/home-page";
import AboutUs from "./components/about-us";
import SagenexAcademy from "./components/sagenex-academy";
import LevelsEarnings from "./components/level-earning";
import CashCardSection from "./components/cash-card";

export default function Home() {
  return (
    <>
      <Navbar />
      {/* From prajyot */}
      <LandingPage />

      {/* From main */}
      <HomePage />
      <AboutUs />
      <CashCardSection />
      <SagenexAcademy />
      <LevelsEarnings />
    </>
  );
}
