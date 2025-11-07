"use client";

import React from "react";

const Footer = () => {
  return (
    <div
      className="pt-10 px-4 md:px-20 lg:px-32 bg-gray-900 w-full overflow-hidden"
      id="Footer"
    >
      <div className="container mx-auto flex flex-col md:flex-row justify-between items-start">
        {/* Project Title */}
        <div className="w-full md:w-1/3 mb-8 md:mb-0">
          <h1 className="text-white text-3xl font-bold cursor-pointer">
            BlueCollorHub
          </h1>
          <p className="text-gray-400 mt-4">
            BlueCollorHub helps skilled workers showcase their projects, connect
            with clients, and find opportunities to grow their careers. Our
            platform bridges the gap between talent and opportunity.
          </p>
        </div>

        {/* Company Links */}
        <div className="w-full md:w-1/5 mb-8 md:mb-0">
          <h3 className="text-white text-lg font-bold mb-4">Company</h3>
          <ul className="flex flex-col gap-2 text-gray-400">
            <a href="#Header" className="hover:text-white">
              Home
            </a>
            <a href="#About" className="hover:text-white">
              About Us
            </a>
            <a href="#Projects" className="hover:text-white">
              Workers
            </a>
            <a href="#Contact" className="hover:text-white">
              Contact Us
            </a>
            <a href="#" className="hover:text-white">
              Privacy Policy
            </a>
          </ul>
        </div>

        {/* Newsletter Subscription */}
        <div className="w-full md:w-1/3">
          <h3 className="text-white text-lg font-bold mb-4">
            Subscribe to our newsletter
          </h3>
          <p className="text-gray-400 mb-4 max-w-80">
            Get the latest updates about skilled workers, projects, and
            opportunities delivered straight to your inbox.
          </p>

          <div className="flex gap-2">
            <input
              type="email"
              placeholder="Enter Your Email"
              className="p-2 rounded bg-gray-800 text-gray-400 border-gray-700 focus:outline-none w-full md:w-auto"
            />
            <button className="bg-blue-500 rounded py-2 px-4 text-white">
              Subscribe
            </button>
          </div>
        </div>
      </div>

      {/* Footer Bottom */}
      <div className="mt-10 border-t border-gray-700 pt-6 text-center text-gray-500 text-sm mb-5">
        Copyright 2025 © BlueCollorHub. All rights reserved.
      </div>
    </div>
  );
};

export default Footer;
