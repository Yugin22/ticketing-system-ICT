"use client";

import { useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const emailRef = useRef<HTMLInputElement>(null);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    emailRef.current?.focus();
  }, []);

  const validateEmail = (email: string) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const getFriendlyError = (message: string) => {
    if (message.includes("Invalid login credentials"))
      return "Incorrect email or password.";
    if (message.includes("Email not confirmed"))
      return "Please verify your email first.";
    return message;
  };

  const clearError = () => {
    if (errorMsg) setErrorMsg("");
  };

  const handleLogin = async (e?: React.FormEvent) => {
    e?.preventDefault();

    if (loading) return;
    setErrorMsg("");

    if (!email || !password) {
      setErrorMsg("Please fill in all fields");
      return;
    }

    if (!validateEmail(email)) {
      setErrorMsg("Enter a valid email address");
      return;
    }

    try {
      setLoading(true);

      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setErrorMsg(getFriendlyError(error.message));
        return;
      }

      router.replace("/dashboard");
    } catch {
      setErrorMsg("Unexpected error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${location.origin}/dashboard`,
      },
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-100 via-white to-gray-200 px-4 sm:px-6 lg:px-8">

      {/* background glow */}
      <div className="absolute w-[300px] sm:w-[400px] md:w-[500px] h-[300px] sm:h-[400px] md:h-[500px] bg-black/5 blur-3xl rounded-full -z-10" />

      {/* CARD */}
      <div className="w-full max-w-sm sm:max-w-md md:max-w-lg p-5 sm:p-6 md:p-8 bg-white/70 backdrop-blur-2xl border border-gray-200 rounded-2xl sm:rounded-3xl shadow-xl md:shadow-2xl relative">

        {/* LOADING OVERLAY */}
        {loading && (
          <div className="absolute inset-0 bg-white/40 backdrop-blur-sm flex items-center justify-center rounded-2xl sm:rounded-3xl">
            <div className="text-sm text-gray-600 animate-pulse">
              Signing you in...
            </div>
          </div>
        )}

        {/* HEADER */}
        <div className="text-center mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">
            Welcome back
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-2">
            Sign in to your account
          </p>
        </div>

        {/* FORM */}
        <form onSubmit={handleLogin} className="space-y-4 sm:space-y-5">

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
              ref={emailRef}
              type="email"
              value={email}
              disabled={loading}
              onChange={(e) => {
                setEmail(e.target.value);
                clearError();
              }}
              className="w-full mt-2 p-3 sm:p-3.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-black/40 outline-none transition text-sm sm:text-base"
              placeholder="you@example.com"
              autoComplete="email"
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
                className="w-full p-3 sm:p-3.5 border border-gray-200 rounded-xl pr-12 focus:ring-2 focus:ring-black/40 outline-none transition text-sm sm:text-base"
                placeholder="••••••••"
                autoComplete="current-password"
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

          {/* LOGIN BUTTON */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-black text-white py-3 sm:py-3.5 rounded-xl font-medium text-sm sm:text-base
                       hover:scale-[1.01] active:scale-[0.98]
                       transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>

        {/* DIVIDER */}
        <div className="flex items-center gap-3 my-5 sm:my-6">
          <div className="flex-1 h-px bg-gray-200" />
          <span className="text-xs text-gray-400">OR</span>
          <div className="flex-1 h-px bg-gray-200" />
        </div>

        {/* GOOGLE LOGIN */}
        <button
          onClick={handleGoogleLogin}
          disabled={loading}
          className="w-full border border-gray-200 py-3 sm:py-3.5 rounded-xl text-sm sm:text-base hover:bg-gray-50 transition disabled:opacity-50"
        >
          Continue with Google
        </button>

        {/* FOOTER LINKS */}
        <div className="flex flex-col sm:flex-row sm:justify-between gap-2 sm:gap-0 mt-6 text-sm text-gray-500 text-center sm:text-left">
          <Link href="/register" className="hover:text-black transition">
            Create account
          </Link>
          <Link href="/forgotpassword" className="hover:text-black transition">
            Forgot password?
          </Link>
        </div>
      </div>
    </div>
  );
}