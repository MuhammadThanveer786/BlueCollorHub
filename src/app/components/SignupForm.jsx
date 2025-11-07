"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { signIn } from "next-auth/react";
import { toast } from "sonner";

export default function SignupForm({ onSuccess, switchToLogin }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const data = Object.fromEntries(formData.entries());

    try {
      // Call signup API
      await axios.post("/api/auth/signup", data);
      toast.success("Registration successful! Logging you in...");

      // Auto-login after signup
      const result = await signIn("credentials", {
        email: data.email,
        password: data.password,
        redirect: false,
      });

      if (result?.error) {
        toast.error("Login after signup failed.");
      } else {
        if (onSuccess) onSuccess(); // Close modal if passed
        router.push("/dashboard"); // change to "/" if needed
      }
    } catch (error) {
      toast.error(error.response?.data?.error || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-md max-w-sm w-full p-8">
      <h1 className="text-2xl font-semibold text-gray-800 mb-2 text-center">
        Sign Up
      </h1>
      <p className="text-gray-500 text-sm mb-6 text-center">
        Create an account to showcase your skills or hire professionals
      </p>

      <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
        <input
          type="text"
          name="name"
          placeholder="Full Name"
          required
          className="border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition"
        />
        <input
          type="email"
          name="email"
          placeholder="Email"
          required
          className="border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition"
        />
        <input
          type="password"
          name="password"
          placeholder="Password"
          required
          className="border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition"
        />
        <button
          type="submit"
          disabled={loading}
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-md py-2 transition-colors"
        >
          {loading ? "Signing up..." : "Sign Up"}
        </button>
      </form>

      {/* Switch to Login */}
      <p className="text-center text-gray-500 mt-4 text-sm">
        Already have an account?{" "}
        <span
          className="text-indigo-600 cursor-pointer hover:underline"
          onClick={switchToLogin || (() => router.push("/login"))}
        >
          Log In
        </span>
      </p>
    </div>
  );
}
