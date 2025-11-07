"use client";

import React from "react";
import Image from "next/image";
import { motion } from "framer-motion";

const testimonialsData = [
  {
    image: "/testimonial1.png",
    alt: "Customer 1",
    name: "John Doe",
    title: "Electrician",
    rating: 5,
    text: "BlueCollorHub helped me get my first big client. Highly recommended!",
  },
  {
    image: "/testimonial2.png",
    alt: "Customer 2",
    name: "Jane Smith",
    title: "Plumber",
    rating: 4,
    text: "Great platform for skilled workers. My projects keep increasing.",
  },
  {
    image: "/testimonial3.png",
    alt: "Customer 3",
    name: "Mike Johnson",
    title: "Carpenter",
    rating: 5,
    text: "I love the user-friendly interface and instant client feedback.",
  },
];

const starIcon = "/star_icon.svg"; // Place your star icon in public folder

const Testimonials = () => {
  return (
    <motion.section
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 1 }}
      viewport={{ once: true }}
      className="py-16 w-full bg-gray-50"
      id="Testimonials"
    >
      {/* Section Heading */}
      <div className="text-center px-6 md:px-20 lg:px-32">
        <h1 className="text-3xl sm:text-4xl font-bold mb-4">
          Customer{" "}
          <span className="font-light underline underline-offset-4 decoration-2">
            Testimonials
          </span>
        </h1>
        <p className="text-gray-600 max-w-2xl mx-auto mb-12">
          Real Stories from Those Who Found Home With Us
        </p>
      </div>

      {/* Testimonials Row */}
      <div className="flex justify-center gap-8 flex-wrap px-4 md:px-0">
        {testimonialsData.map((testimonial, index) => (
          <div
            key={index}
            className="w-80 bg-white rounded-2xl shadow-lg p-8 text-center hover:shadow-2xl transition-shadow duration-300"
          >
            <Image
              className="w-20 h-20 rounded-full mx-auto mb-4"
              src={testimonial.image}
              alt={testimonial.alt}
              width={80}
              height={80}
            />
            <h2 className="text-xl font-semibold text-gray-800">{testimonial.name}</h2>
            <p className="text-gray-500 text-sm mb-4">{testimonial.title}</p>

            <div className="flex justify-center gap-1 mb-4">
              {Array.from({ length: testimonial.rating }).map((_, i) => (
                <Image key={i} src={starIcon} alt="star" width={16} height={16} />
              ))}
            </div>

            <p className="text-gray-600 text-sm">{testimonial.text}</p>
          </div>
        ))}
      </div>
    </motion.section>
  );
};

export default Testimonials;
