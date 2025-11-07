"use client";

import React from "react";
import Header from "./components/Header";
import About from "./components/About";
import Projects from "./components/Projects";
import Testimonials from "./components/Testimonials";
// import Contact from "../components/Contact";
import Footer from "./components/Footer";

export default function HomePage() {
  return (
    <div className="w-full overflow-hidden">
      {/* Toast notifications */}

      {/* Landing Page Sections */}
      <Header />
      <About />
      <Projects />
      <Testimonials />
      {/* <Contact /> */}
      <Footer />
    </div>
  );
}
