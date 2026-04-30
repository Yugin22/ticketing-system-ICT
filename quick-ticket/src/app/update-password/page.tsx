"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import Link from "next/link";
import { Ticket, ArrowLeft, Lock } from "lucide-react";
import { useRouter } from "next/navigation";

export default function UpdatePasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [hasSession, setHasSession] = useState(false);
  const [debugInfo, setDebugInfo] = useState("");

  useEffect(() => {
    // Initial sync logging
    setDebugInfo(`URL Search: ${window.location.search}\nURL Hash: ${window.location.hash}\n`);

    const handleAuthTokens = async () => {
      // 1. Check for PKCE flow (?code=...)
      const urlParams = new URLSearchParams(window.location.search);
      const code = urlParams.get('code');

      // 2. Check for Implicit flow (#access_token=...)
      const hash = window.location.hash.substring(1);
      const hashParams = new URLSearchParams(hash);
      const accessToken = hashParams.get('access_token');
      const refreshToken = hashParams.get('refresh_token');

      if (code) {
        setDebugInfo(prev => prev + "Found code in URL. Exchanging...\n");
        // Exchange the code for an active session
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (error) {
          setDebugInfo(prev => prev + "Exchange error: " + error.message + "\n");
          if (error.message.includes("PKCE")) {
            setErrorMsg(
              "Security Check Failed: You must open this reset link in the EXACT SAME browser you used to request it. " +
              "(e.g., if you requested it in Chrome, copy and paste the link into Chrome). " +
              "Please request a new link and try again in the same browser."
            );
          } else {
            setErrorMsg("Reset link expired or invalid: " + error.message);
          }
        } else {
          setDebugInfo(prev => prev + "Exchange success. Session established.\n");
          setHasSession(true);
          window.history.replaceState({}, document.title, window.location.pathname);
        }
      } else if (accessToken && refreshToken) {
        setDebugInfo(prev => prev + "Found implicit tokens in hash. Setting session...\n");
        // Manually set session from hash just in case Supabase SDK missed it due to Next.js routing
        const { error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken
        });
        if (error) {
          setDebugInfo(prev => prev + "Set session error: " + error.message + "\n");
          setErrorMsg("Reset link expired or invalid: " + error.message);
        } else {
          setDebugInfo(prev => prev + "Set session success.\n");
          setHasSession(true);
          window.history.replaceState({}, document.title, window.location.pathname);
        }
      } else {
        setDebugInfo(prev => prev + "No tokens found in URL upon load.\n");
      }
    };

    handleAuthTokens();

    // Subscribe to auth state changes to catch delayed syncing
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      setDebugInfo(prev => prev + `Auth Event: ${event} | Session exists: ${!!session}\n`);
      if (session) {
        setHasSession(true);
      }
    });

    // Initial fallback check
    supabase.auth.getSession().then(({ data }) => {
      setDebugInfo(prev => prev + `Initial getSession check: ${!!data.session}\n`);
      if (data.session) setHasSession(true);
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const handleUpdate = async (e?: React.FormEvent) => {
    e?.preventDefault();

    setMessage("");
    setErrorMsg("");

    if (loading) return;

    if (!password || !confirmPassword) {
      setErrorMsg("Please fill in both fields.");
      return;
    }

    if (password !== confirmPassword) {
      setErrorMsg("Passwords do not match.");
      return;
    }

    if (password.length < 6) {
      setErrorMsg("Password must be at least 6 characters.");
      return;
    }

    if (!hasSession) {
      setErrorMsg("Invalid or expired reset link. Please request a new one.");
      return;
    }

    try {
      setLoading(true);

      const { error } = await supabase.auth.updateUser({
        password: password,
      });

      if (error) {
        setErrorMsg(error.message);
        return;
      }

      setMessage("Password successfully updated. You can now login with your new password.");
      setTimeout(() => {
        router.push("/login");
      }, 3000);
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
            Secure your account.
          </h2>
          <p className="text-lg opacity-80 leading-relaxed font-medium" style={{ color: "#c0cce0" }}>
            Create a new strong password to protect your account and continue managing your support requests securely.
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
              Update Password
            </h1>
            <p className="text-sm sm:text-base mt-2" style={{ color: "#6b7fa3" }}>
              Please enter your new password below.
            </p>
          </div>

          {/* CARD CONTAINER */}
          <div className="bg-white lg:bg-transparent lg:shadow-none p-6 sm:p-8 lg:p-0 rounded-3xl lg:rounded-none shadow-[0_20px_40px_-12px_rgba(26,39,68,0.08)] relative">
            {loading && (
              <div className="absolute inset-0 z-50 flex items-center justify-center rounded-3xl lg:rounded-none transition-opacity" style={{ background: "rgba(248, 249, 252, 0.7)", backdropFilter: "blur(4px)" }}>
                <div className="text-sm font-semibold animate-pulse" style={{ color: "#1a2744" }}>
                  Updating password...
                </div>
              </div>
            )}

            <form onSubmit={handleUpdate} className="space-y-4 sm:space-y-5">
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

              {/* NEW PASSWORD */}
              <div>
                <label className="text-[11px] sm:text-xs font-semibold uppercase tracking-wider block mb-1.5" style={{ color: "#8c9bba" }}>
                  New Password
                </label>
                <div className="relative">
                  <input
                    type="password"
                    value={password}
                    disabled={loading}
                    onChange={(e) => {
                      setPassword(e.target.value);
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
                    placeholder="Enter new password"
                    autoComplete="new-password"
                  />
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[#8c9bba]">
                    <Lock size={18} />
                  </div>
                </div>
              </div>

              {/* CONFIRM NEW PASSWORD */}
              <div>
                <label className="text-[11px] sm:text-xs font-semibold uppercase tracking-wider block mb-1.5" style={{ color: "#8c9bba" }}>
                  Confirm Password
                </label>
                <div className="relative">
                  <input
                    type="password"
                    value={confirmPassword}
                    disabled={loading}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value);
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
                    placeholder="Confirm new password"
                    autoComplete="new-password"
                  />
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[#8c9bba]">
                    <Lock size={18} />
                  </div>
                </div>
              </div>

              {/* UPDATE BUTTON */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 rounded-xl font-semibold text-sm text-white transition-all hover:scale-101 active:scale-99 mt-4 flex items-center justify-center"
                style={{ background: "#0e12ffff", boxShadow: "0 8px 16px -4px rgba(14, 18, 255, 0.3)" }}
              >
                {loading ? "Updating..." : "Update Password"}
              </button>
            </form>

            {/* DEBUG INFO */}
            {debugInfo && (
              <div className="mt-6 p-4 bg-gray-100 rounded-xl overflow-hidden text-left">
                <p className="text-[10px] font-bold text-gray-500 uppercase mb-2">Diagnostic Data (For AI)</p>
                <pre className="text-[10px] text-gray-700 whitespace-pre-wrap break-all font-mono">
                  {debugInfo}
                </pre>
              </div>
            )}

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
