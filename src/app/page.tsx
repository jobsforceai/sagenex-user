import Navbar from './components/Navbar';
import HomePage from './components/home-page';
import AboutUs from './components/about-us';
import SagenexAcademy from './components/sagenex-academy';
import LevelsEarnings from './components/level-earning';
import CashCardSection from './components/cash-card';

export default function Home() {
  return (
    <div>
      <Navbar />
      <HomePage />
      <AboutUs />
      <CashCardSection/>
      <SagenexAcademy/>
      <LevelsEarnings/>
    </div>
  );
}
