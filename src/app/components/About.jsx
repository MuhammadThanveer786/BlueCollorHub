"use client";

import { motion } from "framer-motion";
import Image from "next/image";

const About = () => {
  return (
    <motion.section
      initial={{ opacity: 0, x: 200 }}
      whileInView={{ opacity: 1, x: 0 }}
      transition={{ duration: 1 }}
      viewport={{ once: true }}
      id="About"
      className="w-full py-16 md:py-24 px-6 md:px-16 lg:px-32 bg-white"
    >
      {/* Heading */}
      <div className="text-center mb-12">
        <h1 className="text-2xl sm:text-4xl font-bold mb-5">
          About{" "}
          <span className="font-light underline underline-offset-4 decoration-2">
            BlueCollorHub
          </span>
        </h1>
        <p className="text-gray-500 max-w-2xl mx-auto mb-20">
          Empowering Skilled Workers, Connecting Them With Opportunities
        </p>
      </div>

      {/* Main Content */}
      <div className="flex flex-col md:flex-row items-center md:items-start gap-12 md:gap-20">
        {/* Image */}
        <div className="w-full md:w-1/2 flex justify-center">
          <Image
            src="/tailor2.jpg"
            alt="BlueCollorHub"
            width={500}
            height={600}
            className="rounded-xl object-cover shadow-lg"
            priority
          />
        </div>

        {/* Stats & Description */}
        <div className="w-full md:w-1/2 flex flex-col items-center md:items-start text-gray-600">
          {/* Stats */}
          <div className="grid grid-cols-2 gap-8 w-full">
            <div>
              <p className="text-4xl font-bold text-gray-900">500+</p>
              <p className="text-sm text-gray-500">Skilled Workers</p>
            </div>
            <div>
              <p className="text-4xl font-bold text-gray-900">1000+</p>
              <p className="text-sm text-gray-500">Projects Posted</p>
            </div>
            <div>
              <p className="text-4xl font-bold text-gray-900">50+</p>
              <p className="text-sm text-gray-500">Cities Covered</p>
            </div>
            <div>
              <p className="text-4xl font-bold text-gray-900">300+</p>
              <p className="text-sm text-gray-500">Clients Served</p>
            </div>
          </div>

          {/* Description */}
          <p className="my-10 max-w-lg text-center md:text-left leading-relaxed">
            BlueCollorHub is a platform that connects skilled workers—like
            electricians, plumbers, weavers, mechanics, and more—with clients
            who need their expertise. Workers can showcase their projects, gain
            recognition, and get hired directly. Clients can browse profiles,
            see past work, and hire the best talent in their area, making every
            project fair, efficient, and reliable.
          </p>

          {/* Call to Action */}
          <button className="bg-black text-white px-6 py-3 rounded-full text-lg font-semibold hover:bg-gray-800 transition">
            Learn More
          </button>
        </div>
      </div>
    </motion.section>
  );
};

export default About;
