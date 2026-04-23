"use client";

import { motion } from "framer-motion";

export default function AboutSection() {
  return (
    <section id="about" className="section-dark w-full py-24 md:py-32 relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="orb-crimson" style={{ top: '20%', right: '-10%', width: '40vw', height: '40vw' }} />
      </div>
      
      <div className="mx-auto max-w-7xl px-6 sm:px-10 lg:px-16 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <p className="eyebrow mb-6">Our Legacy</p>
            <h2 className="display-headline mb-8">
              Trust is built by <span className="text-[var(--emerald)]">structure.</span>
            </h2>
            <p className="text-[var(--text-muted-dark)] text-lg mb-8 leading-relaxed">
              &quot;Trust is not built by promises. It is built by structure, discipline, and time.&quot; — Monish Adari, Founder & CEO
            </p>
            <p className="text-[var(--text-muted-dark)] leading-relaxed">
              At Sagenex, we prioritize sustainability over shortcuts. Our ecosystem is protected by strict caps, diverse real-world asset backing, and a structured growth model designed to endure market volatility.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="grid grid-cols-2 gap-4"
          >
            <div className="glass-card p-8 flex flex-col justify-center items-center text-center">
              <h3 className="display-headline text-5xl mb-2" style={{ fontSize: '3rem' }}>7000+</h3>
              <p className="text-[var(--emerald)] font-medium text-sm tracking-widest uppercase">Global Investors</p>
            </div>
            
            <div className="glass-card p-8 flex flex-col justify-center items-center text-center">
              <h3 className="display-headline text-5xl mb-2" style={{ fontSize: '3rem' }}>16<span className="text-3xl text-[var(--text-muted-dark)]">yrs</span></h3>
              <p className="text-[var(--emerald)] font-medium text-sm tracking-widest uppercase">Of Legacy</p>
            </div>
            
            <div className="glass-card p-8 flex flex-col justify-center items-center text-center col-span-2 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-[var(--crimson-glow)] to-transparent opacity-20 pointer-events-none" />
              <h3 className="display-headline text-4xl mb-3" style={{ fontSize: '2.5rem' }}>Certified</h3>
              <p className="text-black/80 font-medium text-sm">Physical Gold Bullion Reserves</p>
            </div>
          </motion.div>
          
        </div>
      </div>
    </section>
  );
}
