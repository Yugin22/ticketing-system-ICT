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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-100 via-white to-gray-200 px-4">

      {/* background glow */}
      <div className="absolute w-[420px] h-[420px] bg-black/5 blur-3xl rounded-full -z-10" />

      <div className="w-full max-w-md p-8 bg-white/70 backdrop-blur-2xl border border-gray-200 rounded-3xl shadow-2xl">

        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-semibold tracking-tight">
            Forgot Password
          </h1>
          <p className="text-sm text-gray-500 mt-2">
            We’ll send you a reset link
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleReset} className="space-y-5">

          {/* Error */}
          {errorMsg && (
            <div className="text-sm text-red-600 bg-red-50 border border-red-200 p-3 rounded-xl">
              {errorMsg}
            </div>
          )}

          {/* Success */}
          {message && (
            <div className="text-sm text-green-700 bg-green-50 border border-green-200 p-3 rounded-xl">
              {message}
            </div>
          )}

          {/* Email */}
          <div>
            <label className="text-xs text-gray-500 uppercase">
              Email
            </label>

            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full mt-2 p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-black/70 outline-none"
              placeholder="you@example.com"
              autoComplete="email"
            />
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-black text-white py-3 rounded-xl font-medium
                       hover:scale-[1.01] active:scale-[0.98]
                       transition disabled:opacity-50"
          >
            {loading ? "Sending..." : "Send Reset Link"}
          </button>
        </form>

        {/* Footer */}
        <p className="text-center text-sm text-gray-500 mt-6">
          Remember your password?{" "}
          <Link href="/login" className="text-black hover:underline">
            Go to login
          </Link>
        </p>
      </div>
    </div>
  );
}