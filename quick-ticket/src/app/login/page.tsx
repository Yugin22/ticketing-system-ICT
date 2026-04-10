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

  // Auto-focus email
  useEffect(() => {
    emailRef.current?.focus();
  }, []);

  // Redirect if already logged in
  useEffect(() => {
    const checkSession = async () => {
      const { data } = await supabase.auth.getSession();
      if (data.session) {
        router.replace("/dashboard");
      }
    };

    checkSession();
  }, [router]);

  const validateEmail = (email: string) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const getFriendlyError = (message: string) => {
    if (message.includes("Invalid login credentials"))
      return "Incorrect email or password.";
    if (message.includes("Email not confirmed"))
      return "Please verify your email first.";
    return message;
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

    setLoading(true);

    try {
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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-100 via-white to-gray-200 px-4">

      {/* background glow */}
      <div className="absolute w-[420px] h-[420px] bg-black/5 blur-3xl rounded-full -z-10" />

      <div className="w-full max-w-md p-8 bg-white/70 backdrop-blur-2xl border border-gray-200 rounded-3xl shadow-2xl relative">

        {/* Loading overlay */}
        {loading && (
          <div className="absolute inset-0 bg-white/40 backdrop-blur-sm flex items-center justify-center rounded-3xl">
            <div className="text-sm text-gray-600 animate-pulse">
              Signing you in...
            </div>
          </div>
        )}

        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-semibold tracking-tight">
            Welcome back
          </h1>
          <p className="text-sm text-gray-500 mt-2">
            Sign in to your account
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleLogin} className="space-y-5">

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
              ref={emailRef}
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full mt-2 p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-black/70 outline-none transition"
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
                className="w-full p-3 border border-gray-200 rounded-xl pr-12 focus:ring-2 focus:ring-black/70 outline-none transition appearance-none"
                placeholder="••••••••"
                autoComplete="current-password"
              />

              {/* Eye toggle */}
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-black transition"
                aria-label="Toggle password visibility"
              >
                {showPassword ? (
                  <EyeOff size={18} />
                ) : (
                  <Eye size={18} />
                )}
              </button>
            </div>

            {password.length > 0 && password.length < 6 && (
              <p className="text-xs text-amber-600 mt-1">
                Password is too short
              </p>
            )}
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-black text-white py-3 rounded-xl font-medium
                       hover:scale-[1.01] active:scale-[0.98]
                       transition disabled:opacity-50"
          >
            Login
          </button>
        </form>

        {/* Divider */}
        <div className="flex items-center gap-3 my-6">
          <div className="flex-1 h-px bg-gray-200" />
          <span className="text-xs text-gray-400">OR</span>
          <div className="flex-1 h-px bg-gray-200" />
        </div>

        {/* Google OAuth */}
        <button
          onClick={handleGoogleLogin}
          className="w-full border border-gray-200 py-3 rounded-xl text-sm hover:bg-gray-50 transition"
        >
          Continue with Google
        </button>

        {/* Footer */}
        <div className="flex justify-between mt-6 text-sm text-gray-500">
          <Link href="/register" className="hover:text-black">
            Create account
          </Link>
          <Link href="/forgotpassword" className="hover:text-black">
            Forgot password?
          </Link>
        </div>
      </div>
    </div>
  );
}