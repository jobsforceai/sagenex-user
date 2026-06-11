import Navbar from "@/app/components/Navbar";
import RoadmapSection from "@/components/landing/roadmap-section";
import Footer from "@/components/landing/footer";

export default function Timeline() {
  return (
    <main className="min-h-screen bg-black text-white">
      <Navbar theme="dark" />
      <section className="mx-auto max-w-7xl px-6 pb-10 pt-36 sm:px-10 lg:px-16">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-emerald-300">
          Strategic Vision
        </p>
        <h1 className="mt-4 max-w-3xl text-4xl font-black leading-tight text-white md:text-6xl">
          Sagenex Roadmap
        </h1>
        <p className="mt-5 max-w-2xl text-base leading-7 text-white/70 md:text-lg">
          The phased plan for platform launches, market expansion, real-world asset infrastructure, and long-term global scale.
        </p>
      </section>
      <RoadmapSection />
      <Footer />
    </main>
  );
}
