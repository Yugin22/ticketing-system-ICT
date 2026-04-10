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

  const clearError = () => {
    if (errorMsg) setErrorMsg("");
  };

  const handleRegister = async (e?: React.FormEvent) => {
    e?.preventDefault();

    if (loading) return;
    setErrorMsg("");

    // ---------------- VALIDATION ----------------
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

    try {
      setLoading(true);

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) {
        setErrorMsg(error.message || "Signup failed");
        return;
      }

      const user = data?.user;

      if (user) {
        await supabase.from("profiles").upsert(
          {
            id: user.id,
            email: user.email,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "id" }
        );
      }

      router.replace("/login");
    } catch (err) {
      console.error(err);
      setErrorMsg("Unexpected error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-100 via-white to-gray-200 px-4 sm:px-6 lg:px-8">

      {/* BACKGROUND GLOW */}
      <div className="absolute w-[280px] sm:w-[400px] md:w-[500px] h-[280px] sm:h-[400px] md:h-[500px] bg-black/5 blur-3xl rounded-full -z-10" />

      {/* CARD */}
      <div className="w-full max-w-sm sm:max-w-md md:max-w-lg lg:max-w-xl p-5 sm:p-6 md:p-8 bg-white/70 backdrop-blur-2xl border border-gray-200 rounded-2xl sm:rounded-3xl shadow-xl md:shadow-2xl">

        {/* HEADER */}
        <div className="text-center mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">
            Create account
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-1 sm:mt-2">
            Join us and get started
          </p>
        </div>

        {/* FORM */}
        <form onSubmit={handleRegister} className="space-y-4 sm:space-y-5">

          {/* ERROR */}
          {errorMsg && (
            <div className="text-sm text-red-600 bg-red-50 border border-red-200 p-3 rounded-xl">
              {errorMsg}
            </div>
          )}

          {/* EMAIL */}
          <div>
            <label className="text-xs text-gray-500 uppercase tracking-wide">
              Email
            </label>
            <input
              type="email"
              value={email}
              disabled={loading}
              onChange={(e) => {
                setEmail(e.target.value);
                clearError();
              }}
              placeholder="you@example.com"
              className="w-full mt-2 p-3 sm:p-3.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-black/40 outline-none transition text-sm sm:text-base"
            />
          </div>

          {/* PASSWORD */}
          <div>
            <label className="text-xs text-gray-500 uppercase tracking-wide">
              Password
            </label>

            <div className="relative mt-2">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                disabled={loading}
                onChange={(e) => {
                  setPassword(e.target.value);
                  clearError();
                }}
                placeholder="••••••••"
                className="w-full p-3 sm:p-3.5 border border-gray-200 rounded-xl pr-12 focus:ring-2 focus:ring-black/40 outline-none transition text-sm sm:text-base"
              />

              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-black transition"
                aria-label="Toggle password visibility"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {/* CONFIRM PASSWORD */}
          <div>
            <label className="text-xs text-gray-500 uppercase tracking-wide">
              Confirm Password
            </label>

            <div className="relative mt-2">
              <input
                type={showConfirmPassword ? "text" : "password"}
                value={confirmPassword}
                disabled={loading}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  clearError();
                }}
                placeholder="••••••••"
                className="w-full p-3 sm:p-3.5 border border-gray-200 rounded-xl pr-12 focus:ring-2 focus:ring-black/40 outline-none transition text-sm sm:text-base"
              />

              <button
                type="button"
                onClick={() =>
                  setShowConfirmPassword(!showConfirmPassword)
                }
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-black transition"
                aria-label="Toggle confirm password visibility"
              >
                {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {/* BUTTON */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-black text-white py-3 sm:py-3.5 rounded-xl font-medium text-sm sm:text-base
                       hover:scale-[1.01] active:scale-[0.98]
                       transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Creating account..." : "Create account"}
          </button>
        </form>

        {/* FOOTER */}
        <p className="text-center text-sm text-gray-500 mt-6 sm:mt-8">
          Already have an account?{" "}
          <Link href="/login" className="text-black hover:underline">
            Login
          </Link>
        </p>
      </div>
    </div>
  );
}