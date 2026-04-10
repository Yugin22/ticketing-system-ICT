"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff } from "lucide-react";

export default function RegisterPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const validateEmail = (email: string) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const handleRegister = async (e?: React.FormEvent) => {
    e?.preventDefault();

    if (loading) return;
    setErrorMsg("");

    if (!email || !password || !confirmPassword) {
      setErrorMsg("Please fill in all fields");
      return;
    }

    if (!validateEmail(email)) {
      setErrorMsg("Enter a valid email address");
      return;
    }

    if (password.length < 6) {
      setErrorMsg("Password must be at least 6 characters");
      return;
    }

    if (password !== confirmPassword) {
      setErrorMsg("Passwords do not match");
      return;
    }

    setLoading(true);

    const { error } = await supabase.auth.signUp({
      email,
      password,
    });

    setLoading(false);

    if (error) {
      setErrorMsg(error.message);
      return;
    }

    router.push("/login");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-100 via-white to-gray-200 px-4">

      {/* background glow */}
      <div className="absolute w-[420px] h-[420px] bg-black/5 blur-3xl rounded-full -z-10" />

      <div className="w-full max-w-md p-8 bg-white/70 backdrop-blur-2xl border border-gray-200 rounded-3xl shadow-2xl">

        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-semibold tracking-tight">
            Create account
          </h1>
          <p className="text-sm text-gray-500 mt-2">
            Sign up to get started
          </p>
        </div>

        <form onSubmit={handleRegister} className="space-y-5">

          {/* Error */}
          {errorMsg && (
            <div className="text-sm text-red-600 bg-red-50 border border-red-200 p-3 rounded-xl">
              {errorMsg}
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

          {/* Password */}
          <div>
            <label className="text-xs text-gray-500 uppercase">
              Password
            </label>

            <div className="relative mt-2">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full p-3 border border-gray-200 rounded-xl pr-12 focus:ring-2 focus:ring-black/70 outline-none"
                placeholder="••••••••"
                autoComplete="new-password"
              />

              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-black"
              >
                {showPassword ? (
                  <EyeOff size={18} />
                ) : (
                  <Eye size={18} />
                )}
              </button>
            </div>
          </div>

          {/* Confirm Password */}
          <div>
            <label className="text-xs text-gray-500 uppercase">
              Confirm Password
            </label>

            <div className="relative mt-2">
              <input
                type={showConfirmPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full p-3 border border-gray-200 rounded-xl pr-12 focus:ring-2 focus:ring-black/70 outline-none"
                placeholder="••••••••"
                autoComplete="new-password"
              />

              <button
                type="button"
                onClick={() =>
                  setShowConfirmPassword(!showConfirmPassword)
                }
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-black"
              >
                {showConfirmPassword ? (
                  <EyeOff size={18} />
                ) : (
                  <Eye size={18} />
                )}
              </button>
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-black text-white py-3 rounded-xl font-medium
                       hover:scale-[1.01] active:scale-[0.98]
                       transition disabled:opacity-50"
          >
            {loading ? "Creating account..." : "Register"}
          </button>
        </form>

        {/* Footer */}
        <p className="text-center text-sm text-gray-500 mt-6">
          Already have an account?{" "}
          <Link href="/login" className="text-black hover:underline">
            Login
          </Link>
        </p>
      </div>
    </div>
  );
}