"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import LoginForm from "./LoginForm";
import SignupForm from "./SignupForm";

const Navbar = () => {
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  // Single state to control modal type: "login" | "signup" | null
  const [modalType, setModalType] = useState(null);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const openModal = (type) => setModalType(type);
  const closeModal = () => setModalType(null);

  return (
    <>
      <nav
        className={`fixed top-0 left-0 w-full z-50 transition-all duration-300 ${
          scrolled ? "bg-black/70 backdrop-blur-md shadow-md" : "bg-transparent"
        }`}
      >
        <div className="flex items-center justify-between w-full px-6 md:px-12 lg:px-20 py-4">
          {/* Logo */}
          <Link
            href="/"
            className="text-white text-3xl md:text-4xl font-extrabold tracking-wide"
          >
            BlueCollorHub
          </Link>

          {/* Desktop Links */}
          <div className="hidden md:flex flex-1 justify-center">
            <div className="flex gap-8 text-white font-medium text-lg">
              <Link href="#Home" className="hover:text-blue-400 transition">
                Home
              </Link>
              <Link href="#About" className="hover:text-blue-400 transition">
                About
              </Link>
              <Link href="#Projects" className="hover:text-blue-400 transition">
                Projects
              </Link>
              <Link
                href="#Testimonials"
                className="hover:text-blue-400 transition"
              >
                Testimonials
              </Link>
            </div>
          </div>

          {/* Desktop Auth Buttons */}
          <div className="hidden md:flex items-center gap-4">
            <button
              onClick={() => openModal("signup")}
              className="px-6 py-2 rounded-full bg-white text-black font-semibold hover:bg-transparent hover:border hover:border-white hover:text-white transition cursor-pointer"
            >
              Sign Up
            </button>
            <button
              onClick={() => openModal("login")}
              className="px-6 py-2 rounded-full border border-white text-white font-semibold hover:bg-white hover:text-black transition cursor-pointer"
            >
              Sign In
            </button>
          </div>

          {/* Mobile Menu Icon */}
          <button onClick={() => setShowMobileMenu(true)} className="md:hidden">
            <Image src="/menu.svg" width={30} height={30} alt="Menu" />
          </button>
        </div>

        {/* Mobile Menu Drawer */}
        {showMobileMenu && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex flex-col">
            <div className="flex justify-end p-6">
              <button onClick={() => setShowMobileMenu(false)}>
                <Image src="/close.svg" width={30} height={30} alt="Close" />
              </button>
            </div>
            <div className="flex flex-col items-center gap-6 mt-10 text-white text-xl font-medium">
              {["Home", "About", "Projects", "Testimonials"].map((link) => (
                <Link
                  key={link}
                  href={`#${link}`}
                  onClick={() => setShowMobileMenu(false)}
                  className="hover:text-blue-400 transition"
                >
                  {link}
                </Link>
              ))}

              <button
                onClick={() => {
                  openModal("signup");
                  setShowMobileMenu(false);
                }}
                className="w-3/4 px-6 py-3 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 text-white font-semibold hover:opacity-90 transition"
              >
                Sign Up
              </button>
              <button
                onClick={() => {
                  openModal("login");
                  setShowMobileMenu(false);
                }}
                className="w-3/4 px-6 py-3 rounded-full border border-white text-white hover:bg-white hover:text-black transition font-semibold"
              >
                Sign In
              </button>
            </div>
          </div>
        )}
      </nav>

      {/* Modal */}
      {modalType && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div
            className={`relative w-full mx-auto ${
              modalType === "login" ? "max-w-xl sm:max-w-lg" : "max-w-md"
            }`}
          >
            <button
              onClick={closeModal}
              className="absolute top-2 right-2 text-gray-500 hover:text-gray-800 text-2xl font-bold"
            >
              ✕
            </button>

            {modalType === "login" && (
              <LoginForm switchToSignup={() => setModalType("signup")} />
            )}
            {modalType === "signup" && (
              <SignupForm switchToLogin={() => setModalType("login")} />
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default Navbar;
