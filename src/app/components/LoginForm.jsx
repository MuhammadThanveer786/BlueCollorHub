"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { toast } from "sonner";
import Image from "next/image";

export default function LoginForm({ switchToSignup }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const email = e.target.email.value;
    const password = e.target.password.value;

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        toast.error("Login failed. Please check your credentials.");
      } else {
        toast.success("Logged in successfully!");
        router.push("/dashboard"); // change to "/" if needed
      }
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSocialLogin = async (provider) => {
    setLoading(true);
    try {
      await signIn(provider, { callbackUrl: "/dashboard" });
    } catch {
      toast.error(`Failed to sign in with ${provider}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-md max-w-md w-full p-8">
      <h1 className="text-2xl font-semibold text-gray-800 mb-2 text-center">
        Login
      </h1>
      <p className="text-gray-500 text-sm mb-6 text-center">
        Sign in to your account
      </p>

      {/* Social Login */}
      <div className="flex flex-col gap-3 mb-5">
        <button
          onClick={() => handleSocialLogin("google")}
          disabled={loading}
          className={`flex items-center justify-center gap-2 w-full py-2 rounded-md border border-gray-300 hover:bg-gray-100 transition ${
            loading ? "opacity-50 cursor-not-allowed" : ""
          }`}
        >
          <Image src="/Google-icon.webp" alt="Google Logo" width={20} height={20} />
          Sign in with Google
        </button>
      </div>

      <p className="text-gray-400 text-sm text-center mb-4">or login with email</p>

      {/* Email Login */}
      <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
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
          {loading ? "Signing in..." : "Sign In"}
        </button>
      </form>

      {/* Switch to Signup */}
      <p className="text-center text-gray-500 text-sm mt-5">
        Don&apos;t have an account?{" "}
        <span
          className="text-indigo-600 font-medium hover:underline cursor-pointer"
          onClick={switchToSignup || (() => router.push("/signup"))}
        >
          Sign Up
        </span>
      </p>
    </div>
  );
}
