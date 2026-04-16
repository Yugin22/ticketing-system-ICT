"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import Link from "next/link";
import { Ticket, ArrowLeft, Mail } from "lucide-react";

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

    try {
      setLoading(true);

      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/update-password`,
      });

      if (error) {
        setErrorMsg(error.message);
        return;
      }

      setMessage("Password reset link sent! Check your email.");
    } catch {
      setErrorMsg("Unexpected error. Please try again.");
    } finally {
      setLoading(false);
    }
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
            Get back to your support operations.
          </h2>
          <p className="text-lg opacity-80 leading-relaxed font-medium" style={{ color: "#c0cce0" }}>
            Enter your email and we&apos;ll help you recover your account so you can continue managing your requests.
          </p>
        </div>
      </div>

      {/* RIGHT SIDE - FORM */}
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
              Reset Password
            </h1>
            <p className="text-sm sm:text-base mt-2" style={{ color: "#6b7fa3" }}>
              Enter your email address to receive a password reset link.
            </p>
          </div>

          {/* CARD CONTAINER */}
          <div className="bg-white lg:bg-transparent lg:shadow-none p-6 sm:p-8 lg:p-0 rounded-3xl lg:rounded-none shadow-[0_20px_40px_-12px_rgba(26,39,68,0.08)] relative">

            {loading && (
              <div className="absolute inset-0 z-50 flex items-center justify-center rounded-3xl lg:rounded-none transition-opacity" style={{ background: "rgba(248, 249, 252, 0.7)", backdropFilter: "blur(4px)" }}>
                <div className="text-sm font-semibold animate-pulse" style={{ color: "#1a2744" }}>
                  Sending reset link...
                </div>
              </div>
            )}

            <form onSubmit={handleReset} className="space-y-4 sm:space-y-5">

              {/* ERROR */}
              {errorMsg && (
                <div className="text-sm p-3.5 rounded-xl flex items-center gap-2 animate-fade-in-up" style={{ color: "#dc2626", background: "rgba(220, 38, 38, 0.08)", border: "1px solid rgba(220, 38, 38, 0.2)" }}>
                  {errorMsg}
                </div>
              )}

              {/* SUCCESS */}
              {message && (
                <div className="text-sm p-3.5 rounded-xl flex items-center gap-2 animate-fade-in-up" style={{ color: "#059669", background: "rgba(5, 150, 105, 0.08)", border: "1px solid rgba(5, 150, 105, 0.2)" }}>
                  {message}
                </div>
              )}

              {/* EMAIL */}
              <div>
                <label className="text-[11px] sm:text-xs font-semibold uppercase tracking-wider block mb-1.5" style={{ color: "#8c9bba" }}>
                  Email Address
                </label>
                <div className="relative">
                  <input
                    type="email"
                    value={email}
                    disabled={loading}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (errorMsg) setErrorMsg("");
                    }}
                    className="w-full p-3.5 rounded-xl outline-none transition-all text-sm font-medium pl-11"
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
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[#8c9bba]">
                    <Mail size={18} />
                  </div>
                </div>
              </div>

              {/* RESET BUTTON */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 rounded-xl font-semibold text-sm text-white transition-all hover:scale-101 active:scale-99 mt-4 flex items-center justify-center"
                style={{ background: "#0e12ffff", boxShadow: "0 8px 16px -4px rgba(14, 18, 255, 0.3)" }}
              >
                {loading ? "Sending link..." : "Send Reset Link"}
              </button>
            </form>

            {/* FOOTER LINKS */}
            <div className="flex items-center justify-center mt-8">
              <Link href="/login" className="flex items-center gap-2 text-[13px] font-semibold transition-colors" style={{ color: "#6b7fa3" }} onMouseEnter={e => e.currentTarget.style.color = "#1a2744"} onMouseLeave={e => e.currentTarget.style.color = "#6b7fa3"}>
                <ArrowLeft size={16} />
                Back to Login
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
