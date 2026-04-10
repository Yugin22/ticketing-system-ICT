"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import Link from "next/link";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const validateEmail = (email: string) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const handleReset = async (e?: React.FormEvent) => {
    e?.preventDefault();

    setMessage("");
    setErrorMsg("");

    if (loading) return;

    if (!email) {
      setErrorMsg("Please enter your email");
      return;
    }

    if (!validateEmail(email)) {
      setErrorMsg("Enter a valid email address");
      return;
    }

    setLoading(true);

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/update-password`,
    });

    setLoading(false);

    if (error) {
      setErrorMsg(error.message);
      return;
    }

    setMessage("Password reset link sent! Check your email.");
  };

  return (
    <div className="min-h-screen flex items-center justify-center
                    bg-gradient-to-br from-gray-100 via-white to-gray-200
                    px-4 sm:px-6 lg:px-8">

      {/* background glow */}
      <div className="absolute w-[250px] sm:w-[350px] lg:w-[450px]
                      h-[250px] sm:h-[350px] lg:h-[450px]
                      bg-black/5 blur-3xl rounded-full -z-10" />

      {/* CARD */}
      <div className="w-full
                      max-w-sm sm:max-w-md md:max-w-lg
                      p-5 sm:p-6 md:p-8
                      bg-white/70 backdrop-blur-2xl
                      border border-gray-200
                      rounded-2xl sm:rounded-3xl
                      shadow-lg sm:shadow-xl md:shadow-2xl">

        {/* HEADER */}
        <div className="text-center mb-6 sm:mb-7 md:mb-8">
          <h1 className="text-xl sm:text-2xl md:text-3xl font-semibold tracking-tight">
            Forgot Password
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-2">
            We’ll send you a reset link
          </p>
        </div>

        {/* FORM */}
        <form onSubmit={handleReset} className="space-y-4 sm:space-y-5">

          {/* ERROR */}
          {errorMsg && (
            <div className="text-xs sm:text-sm text-red-600
                            bg-red-50 border border-red-200
                            p-2.5 sm:p-3 rounded-xl">
              {errorMsg}
            </div>
          )}

          {/* SUCCESS */}
          {message && (
            <div className="text-xs sm:text-sm text-green-700
                            bg-green-50 border border-green-200
                            p-2.5 sm:p-3 rounded-xl">
              {message}
            </div>
          )}

          {/* EMAIL */}
          <div>
            <label className="text-[11px] sm:text-xs text-gray-500 uppercase">
              Email
            </label>

            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full mt-1.5 sm:mt-2
                         p-3 sm:p-3.5
                         border border-gray-200
                         rounded-xl
                         focus:ring-2 focus:ring-black/70
                         outline-none text-sm sm:text-base"
              placeholder="you@example.com"
              autoComplete="email"
            />
          </div>

          {/* BUTTON */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-black text-white
                       py-3 sm:py-3.5
                       rounded-xl font-medium text-sm sm:text-base
                       hover:scale-[1.01] active:scale-[0.98]
                       transition disabled:opacity-50"
          >
            {loading ? "Sending..." : "Send Reset Link"}
          </button>
        </form>

        {/* FOOTER */}
        <p className="text-center text-xs sm:text-sm text-gray-500 mt-6 sm:mt-7">
          Remember your password?{" "}
          <Link href="/login" className="text-black hover:underline">
            Go to login
          </Link>
        </p>
      </div>
    </div>
  );
}