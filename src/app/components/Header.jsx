"use client";

import Navbar from "./Navbar";
import { motion } from "framer-motion";

const Header = () => {
  return (
    <div
      className="relative min-h-screen mb-4 bg-cover bg-center flex items-center w-full overflow-hidden"
      style={{ backgroundImage: "url('/painter.png')" }}
      id="Header"
    >
      {/* Dark Overlay */}
      <div
        className="absolute inset-0"
        style={{ backgroundColor: "rgba(0,0,0,0.6)" }} // 60% opacity black
      ></div>

      <Navbar />

      <motion.div
        initial={{ opacity: 0, y: 100 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 1.5 }}
        viewport={{ once: true }}
        className="relative z-10 container text-center mx-auto py-4 px-6 md:px-20 lg:px-32 text-white"
      >
        <h2 className="text-5xl sm:text-6xl md:text-[60px] inline-block max-w-3xl font-semibold pt-20">
          Bringing Local Talent to Global Opportunities.
        </h2>

        <p className="mt-6 text-2xl max-w-2xl mx-auto">
          Showcase your skills, get hired, and grow your career.
        </p>
      </motion.div>
    </div>
  );
};

export default Header;
