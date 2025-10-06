"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import HeroButton from "./HeroButton";
import Image from "next/image";

const navbarVariants = {
  hidden: { opacity: 0, y: "-100%" },
  show: {
    opacity: 1,
    y: "0%",
    transition: {
      duration: 0.5,
    },
  },
};

export default function Navbar() {
  return (
    <motion.nav
      className="fixed top-0 left-1/2 -translate-x-1/2 max-w-7xl text-white z-50"
      variants={navbarVariants}
      initial="hidden"
      animate="show"
    >
      <div className="container mx-auto py-4 px-6 flex items-center justify-center">
        {/* Sagenex Logo */}
        <Link href="/" className="flex items-center justify-center">
          <Image height={200} width={200} src="/icon.png" alt="logo" className="h-10 w-full"/>
          <h1 className="text-2xl font-bold">Sagenex</h1>
        </Link>

        {/* Navigation Links */}
        <div className="space-x-6">
          <Link href="/about-us">About Us</Link>
          <Link href="/timeline">Timeline</Link>
          <Link href="/levels">Levels</Link>
          <Link href="/package">Package</Link>
        </div>

        {/* Join Us Button */}
        <HeroButton href="/join-us">Login</HeroButton>
      </div>
    </motion.nav>
  );
}
