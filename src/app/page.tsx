import Navbar from './components/Navbar';
import HomePage from './components/home-page';
import AboutUs from './components/about-us';
import SagenexAcademy from './components/sagenex-academy';
import LevelsEarnings from './components/level-earning';
import CashCardSection from './components/cash-card';
import KYCSection from './components/kyc-section';
import RanksSection from './components/ranks-section';
import Footer from './components/footer';

export default function Home() {
  return (
    <>
      <Navbar />
      <HomePage />
      <AboutUs />
      {/* <KYCSection /> */}
      <SagenexAcademy/>
      <LevelsEarnings/>
      <RanksSection />
      <CashCardSection/>
      <Footer />
    </>
  );
}