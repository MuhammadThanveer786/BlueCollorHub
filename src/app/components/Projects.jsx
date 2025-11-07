"use client";

import { motion } from "framer-motion";
import Image from "next/image";

const projectsData = [
  { image: "/worker1.jpg", title: "John Doe", skill: "Electrician", location: "New York" },
  { image: "/worker2.webp", title: "Jane Smith", skill: "Plumber", location: "Los Angeles" },
  { image: "/worker3.jpeg", title: "Mike Johnson", skill: "Carpenter", location: "Chicago" },
  { image: "/worker4.jpg", title: "Home Painting", skill: "Painter", location: "Mumbai" },
  { image: "/worker5.jpg", title: "Electrical Works", skill: "Electrician", location: "Andhra" },
  { image: "/worker6.jpg", title: "Tailoring", skill: "Tailor", location: "Chennai" },
];

const loopedData = [...projectsData, ...projectsData];

const Projects = () => {
  return (
    <motion.section
      initial={{ opacity: 0, y: 100 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 1 }}
      viewport={{ once: true }}
      id="Projects"
      className="relative py-16 w-full overflow-hidden"
    >
      {/* Heading */}
      <div className="text-center px-6 md:px-20 lg:px-32">
        <h1 className="font-bold text-2xl sm:text-4xl mb-4">
          Who We Serve{" "}
          <span className="font-light underline underline-offset-4 decoration-2">
            Skilled Workers
          </span>
        </h1>
        <p className="text-gray-600 max-w-xl mx-auto mb-12">
          BlueCollorHub helps skilled workers showcase their projects and get
          hired directly by clients.
        </p>
      </div>

      {/* Centered Slider */}
      <div className="relative w-full overflow-hidden flex justify-center">
        <motion.div
          className="flex gap-6"
          animate={{ x: ["0%", "-50%"] }}
          transition={{
            ease: "linear",
            duration: 25,
            repeat: Infinity,
          }}
        >
          {loopedData.map((worker, index) => (
            <div
              key={index}
              className="flex-shrink-0 w-[calc((100% - 48px)/3)] sm:w-[calc((100% - 32px)/2)] px-2"
            >
              <div className="relative rounded-xl overflow-hidden shadow-lg transition-transform transform hover:scale-105 hover:shadow-2xl">
                <Image
                  src={worker.image}
                  alt={worker.title}
                  width={400}
                  height={400}
                  className="w-full h-72 sm:h-80 lg:h-72 object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent opacity-70 transition"></div>
                <div className="absolute bottom-4 left-4 text-white">
                  <h2 className="text-lg font-semibold">{worker.title}</h2>
                  <p className="text-sm opacity-90">{worker.skill}</p>
                  <p className="text-xs opacity-70">{worker.location}</p>
                </div>
              </div>
            </div>
          ))}
        </motion.div>
      </div>
    </motion.section>
  );
};

export default Projects;
