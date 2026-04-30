"use client";

import { useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff, Ticket } from "lucide-react";

export default function RegisterPage() {
  const router = useRouter();
  const emailRef = useRef<HTMLInputElement>(null);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    emailRef.current?.focus();
  }, []);

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

      router.replace("/login");
    } catch (err) {
      console.error(err);
      setErrorMsg("Unexpected error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignup = async () => {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${location.origin}/dashboard`,
      },
    });
  };

  return (
    <div className="min-h-screen flex bg-white font-sans">

      {/* LEFT SIDE - BRANDING / GRAPHICS (Hidden on mobile) */}
      <div
        className="hidden lg:flex lg:w-[45%] xl:w-[50%] flex-col p-12 relative overflow-hidden text-white"
        style={{
          backgroundImage: "linear-gradient(rgba(15, 23, 42, 0.6), rgba(26, 39, 68, 0.85)), url('/HCDC.jpg')",
          backgroundSize: "cover",
          backgroundPosition: "center"
        }}
      >
        {/* Glow Effects */}
        <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full opacity-20 blur-[120px] pointer-events-none" style={{ background: "#0e12ffff" }} />
        <div className="absolute bottom-[-10%] right-[-10%] w-[400px] h-[400px] rounded-full opacity-20 blur-[100px] pointer-events-none" style={{ background: "#e91e1eff" }} />

        {/* Top Logo */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-lg" style={{ background: "#ffffffff" }}>
            <Ticket size={20} className="text-black" />
          </div>
          <span className="text-xl font-bold tracking-tight">QuickTicket</span>
        </div>

        {/* Center Content */}
        <div className="flex-1 flex flex-col justify-center relative z-10 max-w-lg animate-fade-in-up">
          <h2 className="text-4xl xl:text-5xl font-bold leading-[1.15] tracking-tight mb-6">
            Join the future of support management.
          </h2>
          <p className="text-lg opacity-80 leading-relaxed font-medium" style={{ color: "#c0cce0" }}>
            Create your account today and start resolving requests with speed and precision.
          </p>
        </div>
      </div>

      {/* RIGHT SIDE - REGISTER FORM */}
      <div className="w-full lg:w-[55%] xl:w-[50%] flex items-center justify-center p-6 sm:p-12 relative overflow-hidden" style={{ background: "#f8f9fc" }}>

        {/* Mobile decorative blobs */}
        <div className="lg:hidden absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] rounded-full opacity-[0.04] blur-[80px] z-0 pointer-events-none" style={{ background: "#0e12ffff" }} />
        <div className="lg:hidden absolute bottom-[-10%] right-[-10%] w-[40vw] h-[40vw] rounded-full opacity-[0.03] blur-[60px] z-0 pointer-events-none" style={{ background: "#e91e1eff" }} />

        <div className="w-full max-w-[420px] relative z-10 animate-fade-in-up">

          {/* Mobile Logo */}
          <div className="lg:hidden w-12 h-12 rounded-xl flex items-center justify-center mb-6" style={{ background: "#e91e1eff", boxShadow: "0 8px 16px rgba(233, 30, 30, 0.25)" }}>
            <Ticket size={24} className="text-white" />
          </div>

          <div className="mb-8 lg:mb-10 text-left">
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight" style={{ color: "#1a2744" }}>
              Create account
            </h1>
            <p className="text-sm sm:text-base mt-2" style={{ color: "#6b7fa3" }}>
              Join us and get started with your support journey.
            </p>
          </div>

          {/* CARD CONTAINER */}
          <div className="bg-white lg:bg-transparent lg:shadow-none p-6 sm:p-8 lg:p-0 rounded-3xl lg:rounded-none shadow-[0_20px_40px_-12px_rgba(26,39,68,0.08)] relative">

            {loading && (
              <div className="absolute inset-0 z-50 flex items-center justify-center rounded-3xl lg:rounded-none transition-opacity" style={{ background: "rgba(248, 249, 252, 0.7)", backdropFilter: "blur(4px)" }}>
                <div className="text-sm font-semibold animate-pulse" style={{ color: "#1a2744" }}>
                  Creating your account...
                </div>
              </div>
            )}

            <form onSubmit={handleRegister} className="space-y-4 sm:space-y-5">

              {/* ERROR */}
              {errorMsg && (
                <div className="text-sm p-3.5 rounded-xl flex items-center gap-2 animate-fade-in-up" style={{ color: "#dc2626", background: "rgba(220, 38, 38, 0.08)", border: "1px solid rgba(220, 38, 38, 0.2)" }}>
                  {errorMsg}
                </div>
              )}

              {/* EMAIL */}
              <div>
                <label className="text-[11px] sm:text-xs font-semibold uppercase tracking-wider block mb-1.5" style={{ color: "#8c9bba" }}>
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
                  className="w-full p-3.5 rounded-xl outline-none transition-all text-sm font-medium"
                  style={{ border: "1px solid #e8ecf2", color: "#1a2744", background: "#fff" }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = "#0e12ffff";
                    e.currentTarget.style.boxShadow = "0 0 0 3px rgba(14, 18, 255, 0.1)";
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = "#e8ecf2";
                    e.currentTarget.style.boxShadow = "none";
                  }}
                  placeholder="you@example.com"
                  autoComplete="email"
                />
              </div>

              {/* PASSWORD */}
              <div>
                <label className="text-[11px] sm:text-xs font-semibold uppercase tracking-wider block mb-1.5" style={{ color: "#8c9bba" }}>
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    disabled={loading}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      clearError();
                    }}
                    className="w-full p-3.5 rounded-xl pr-12 outline-none transition-all text-sm font-medium"
                    style={{ border: "1px solid #e8ecf2", color: "#1a2744", background: "#fff" }}
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = "#0e12ffff";
                      e.currentTarget.style.boxShadow = "0 0 0 3px rgba(14, 18, 255, 0.1)";
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = "#e8ecf2";
                      e.currentTarget.style.boxShadow = "none";
                    }}
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors p-1"
                    style={{ color: "#8c9bba" }}
                    onMouseEnter={e => e.currentTarget.style.color = "#1a2744"}
                    onMouseLeave={e => e.currentTarget.style.color = "#8c9bba"}
                    aria-label="Toggle password visibility"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {/* CONFIRM PASSWORD */}
              <div>
                <label className="text-[11px] sm:text-xs font-semibold uppercase tracking-wider block mb-1.5" style={{ color: "#8c9bba" }}>
                  Confirm Password
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    disabled={loading}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value);
                      clearError();
                    }}
                    className="w-full p-3.5 rounded-xl pr-12 outline-none transition-all text-sm font-medium"
                    style={{ border: "1px solid #e8ecf2", color: "#1a2744", background: "#fff" }}
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = "#0e12ffff";
                      e.currentTarget.style.boxShadow = "0 0 0 3px rgba(14, 18, 255, 0.1)";
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = "#e8ecf2";
                      e.currentTarget.style.boxShadow = "none";
                    }}
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors p-1"
                    style={{ color: "#8c9bba" }}
                    onMouseEnter={e => e.currentTarget.style.color = "#1a2744"}
                    onMouseLeave={e => e.currentTarget.style.color = "#8c9bba"}
                    aria-label="Toggle confirm password visibility"
                  >
                    {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {/* REGISTER BUTTON */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 rounded-xl font-semibold text-sm text-white transition-all hover:scale-101 active:scale-99 mt-4 flex items-center justify-center"
                style={{ background: "#0e12ffff", boxShadow: "0 8px 16px -4px rgba(14, 18, 255, 0.3)" }}
              >
                {loading ? "Creating account..." : "Create account"}
              </button>
            </form>

            {/* DIVIDER */}
            <div className="flex items-center gap-3 my-6 lg:my-8 text-center text-[11px] font-semibold tracking-wider uppercase" style={{ color: "#8c9bba" }}>
              <div className="flex-1 h-px" style={{ background: "#e8ecf2" }} />
              Or join with
              <div className="flex-1 h-px" style={{ background: "#e8ecf2" }} />
            </div>

            {/* GOOGLE SIGNUP */}
            <button
              onClick={handleGoogleSignup}
              disabled={loading}
              className="w-full flex items-center justify-center gap-2.5 py-3.5 rounded-xl text-sm font-semibold transition-all hover:scale-101 active:scale-99 active:translate-y-0"
              style={{ background: "#fff", border: "1px solid #e8ecf2", color: "#1a2744", boxShadow: "0 4px 6px -1px rgba(26, 39, 68, 0.05)" }}
              onMouseEnter={e => {
                e.currentTarget.style.borderColor = "#c8d8f0";
                e.currentTarget.style.background = "#f8f9fc";
                e.currentTarget.style.boxShadow = "0 8px 12px -2px rgba(26, 39, 68, 0.08)";
              }}
              onMouseLeave={e => {
                e.currentTarget.style.borderColor = "#e8ecf2";
                e.currentTarget.style.background = "#fff";
                e.currentTarget.style.boxShadow = "0 4px 6px -1px rgba(26, 39, 68, 0.05)";
              }}
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
              </svg>
              Google
            </button>

            {/* FOOTER LINKS */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-8">
              <p className="text-[13px] font-medium" style={{ color: "#6b7fa3" }}>
                Already have an account?{" "}
                <Link href="/login" className="font-semibold transition-colors" style={{ color: "#0e12ffff" }}>
                  Sign in
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}