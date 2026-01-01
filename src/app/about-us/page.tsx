import Navbar from "@/app/components/Navbar";
import { Footer } from "@/app/components/LandingPage";
import AboutUs from "@/components/landing/about-us";
import LevelsEarnings from "@/components/landing/level-earning";
import RanksSection from "@/components/landing/ranks-section";

export default function AboutPage() {
  return (
    <>
      <Navbar />
      <AboutUs />
      <LevelsEarnings/>
      <RanksSection />
      <Footer />
    </>
  );
}
