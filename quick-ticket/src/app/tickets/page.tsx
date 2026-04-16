"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Ticket, Send, ArrowLeft, Loader2, CheckCircle2, Clock, CircleDot, ChevronDown, AlertTriangle } from "lucide-react";

type TicketType = {
    id: string | number;
    title: string;
    description: string;
    status: string;
    request_type?: string;
    created_at: string;
};

export default function TicketsFormPage() {
    const router = useRouter();

    // Lifecycle & Auth
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [errorMsg, setErrorMsg] = useState("");
    const [successMsg, setSuccessMsg] = useState("");
    const [userId, setUserId] = useState<string | null>(null);

    // User Tickets array
    const [tickets, setTickets] = useState<TicketType[]>([]);

    // ── FORM STATE ──
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const status = "Open"; // Automatically open and not editable
    const requestType = "Incident"; // Automatically Incident and not editable

    useEffect(() => {
        initPage();
    }, []);

    const initPage = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase.auth.getUser();
            if (error || !data.user) {
                router.replace("/login");
                return;
            }

            setUserId(data.user.id);
            await fetchUserTickets(data.user.id);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const fetchUserTickets = async (uid: string) => {
        const { data, error } = await supabase
            .from("tickets")
            .select("id, title, description, status, created_at")
            .eq("user_id", uid)
            .order("created_at", { ascending: false });

        if (!error && data) {
            setTickets(data);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!title.trim() || !description.trim()) {
            setErrorMsg("Subject and Description are required.");
            window.scrollTo({ top: 0, behavior: "smooth" });
            return;
        }

        if (!userId) return;

        try {
            setSubmitting(true);
            setErrorMsg("");
            setSuccessMsg("");

            // Assemble payload matching table columns
            const newTicket = {
                title,
                description,
                status,
                user_id: userId,
            };

            const { error } = await supabase.from("tickets").insert([newTicket]);

            if (error) {
                console.error("Supabase Insertion Error:", error);
                setErrorMsg(error.message);
                window.scrollTo({ top: 0, behavior: "smooth" });
            } else {
                setSuccessMsg("Ticket submitted successfully!");
                window.scrollTo({ top: 0, behavior: "smooth" });

                setTitle(""); setDescription("");

                await fetchUserTickets(userId);
                setTimeout(() => setSuccessMsg(""), 5000);
            }
        } catch (err: any) {
            setErrorMsg(err?.message || "An unexpected error occurred.");
            window.scrollTo({ top: 0, behavior: "smooth" });
        } finally {
            setSubmitting(false);
        }
    };

    const getStatusIcon = (status: string) => {
        if (status === "Resolved" || status === "Closed") return <CheckCircle2 size={14} className="text-[#15eb39ff]" />;
        if (status === "In Progress" || status === "Work in Progress") return <Clock size={14} className="text-[#0e12ffff]" />;
        return <CircleDot size={14} className="text-[#e91e1eff]" />;
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-[#f8f9fc] font-sans pb-12 overflow-x-hidden">
                <header className="bg-white px-4 sm:px-10 py-4 sm:py-5 flex items-center justify-between border-b border-[#e8ecf2]">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-[#e8ecf2] animate-pulse" />
                        <div className="w-32 h-6 rounded-md bg-[#e8ecf2] animate-pulse" />
                    </div>
                    <div className="w-36 h-9 rounded-xl bg-[#e8ecf2] animate-pulse hidden sm:block" />
                </header>

                <main className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 mt-6 sm:mt-8 lg:mt-12 flex flex-col xl:flex-row gap-8 lg:gap-10">
                    <div className="w-full xl:w-7/12 flex flex-col gap-6">
                        <div>
                            <div className="w-48 sm:w-64 h-8 sm:h-10 rounded-lg bg-[#e8ecf2] animate-pulse" />
                            <div className="w-full max-w-sm h-4 sm:h-5 rounded-md bg-[#e8ecf2] animate-pulse mt-3" />
                        </div>
                        <div className="bg-white rounded-[2rem] p-6 sm:p-8 border border-[#e8ecf2] flex flex-col gap-5">
                            <div className="w-28 h-4 rounded-md bg-[#e8ecf2] animate-pulse" />
                            <div className="w-full h-14 rounded-2xl bg-[#f0f3f8] animate-pulse" />
                            <div className="w-32 h-4 rounded-md bg-[#e8ecf2] animate-pulse mt-2" />
                            <div className="w-full h-14 rounded-2xl bg-[#f0f3f8] animate-pulse" />
                            <div className="w-36 h-4 rounded-md bg-[#e8ecf2] animate-pulse mt-2" />
                            <div className="w-full h-36 rounded-2xl bg-[#f0f3f8] animate-pulse" />
                            <div className="flex flex-col sm:flex-row items-center gap-4 justify-end mt-4 pt-6 border-t border-[#f0f3f8]">
                                <div className="w-full sm:w-24 h-12 rounded-2xl bg-[#e8ecf2] animate-pulse" />
                                <div className="w-full sm:w-40 h-12 rounded-2xl bg-[#e8ecf2] animate-pulse" />
                            </div>
                        </div>
                    </div>

                    <div className="w-full xl:w-5/12 flex flex-col gap-6 hidden md:flex">
                        <div>
                            <div className="w-48 h-8 sm:h-10 rounded-lg bg-[#e8ecf2] animate-pulse" />
                            <div className="w-56 h-4 sm:h-5 rounded-md bg-[#e8ecf2] animate-pulse mt-3" />
                        </div>
                        <div className="bg-white rounded-[2rem] border border-[#e8ecf2] h-[550px] overflow-hidden">
                            <div className="p-5 sm:p-6 border-b border-[#f0f3f8] flex justify-between items-center">
                                <div className="w-32 h-5 rounded-md bg-[#e8ecf2] animate-pulse" />
                                <div className="w-8 h-6 rounded-lg bg-[#e8ecf2] animate-pulse" />
                            </div>
                            <div className="p-4 flex flex-col gap-3">
                                {[...Array(3)].map((_, i) => (
                                    <div key={i} className="w-full h-28 rounded-2xl bg-[#f0f3f8] animate-pulse" />
                                ))}
                            </div>
                        </div>
                    </div>
                </main>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#f8f9fc] font-sans pb-12 overflow-x-hidden">
            {/* ── TOP NAV HEADER ── */}
            <header className="bg-white px-4 sm:px-10 py-4 sm:py-5 flex items-center justify-between shadow-[0_4px_12px_rgba(0,0,0,0.02)] border-b border-[#e8ecf2] sticky top-0 z-50">
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-[#e91e1eff] flex items-center justify-center">
                        <Ticket size={18} className="text-white" />
                    </div>
                    <span className="text-lg sm:text-xl font-bold tracking-tight text-[#1a2744]">QuickTicket</span>
                </div>
                <Link
                    href="/dashboard"
                    className="flex items-center gap-2 px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-colors text-[#6b7fa3] hover:bg-[#f0f3f8] hover:text-[#1a2744]"
                >
                    <ArrowLeft size={16} />
                    <span className="hidden sm:inline">Back to Dashboard</span>
                    <span className="sm:hidden">Back</span>
                </Link>
            </header>

            {/* ── MAIN CONTENT GRID ── */}
            <main className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 mt-6 sm:mt-8 lg:mt-12 flex flex-col xl:flex-row gap-8 lg:gap-10">

                {/* LEFT MAIN COLUMN: CREATE TICKET FORM */}
                <div className="w-full xl:w-7/12 flex flex-col gap-6 animate-fade-in-up">
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-bold text-[#1a2744]">Create a New Ticket</h1>
                        <p className="text-sm sm:text-base text-[#6b7fa3] mt-2 max-w-xl">
                            Fill out the details below to submit a new service request. We will review it shortly.
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="bg-white rounded-[2rem] p-6 sm:p-8 xl:p-10 shadow-[0_10px_40px_-10px_rgba(26,39,68,0.1)] border border-[#e8ecf2] flex flex-col relative overflow-hidden group">
                        <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-[#e91e1eff] via-[#1a2744] to-[#0e12ffff] opacity-80" />

                        {errorMsg && (
                            <div className="mb-6 text-sm p-4 rounded-xl bg-red-50 text-red-600 border border-red-200 animate-fade-in-up flex items-center gap-2">
                                <CircleDot size={18} />
                                {errorMsg}
                            </div>
                        )}

                        {successMsg && (
                            <div className="mb-6 text-sm p-4 rounded-xl bg-green-50 text-emerald-700 border border-emerald-200 animate-fade-in-up flex items-center gap-2">
                                <CheckCircle2 size={18} />
                                {successMsg}
                            </div>
                        )}

                        <div className="flex flex-col gap-6">

                            <div className="flex flex-col">
                                <label className="text-[11px] sm:text-xs font-semibold uppercase tracking-wider mb-2 text-[#8c9bba]">
                                    Ticket Title <span className="text-[#e91e1eff]">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={title}
                                    disabled={submitting}
                                    onChange={(e) => setTitle(e.target.value)}
                                    placeholder="Summarize the issue briefly"
                                    required
                                    className="w-full p-4 rounded-2xl outline-none transition-all text-sm font-medium bg-[#f8f9fc] text-[#1a2744] border border-[#e8ecf2] focus:border-[#0e12ffff] focus:bg-white focus:shadow-[0_0_0_4px_rgba(14,18,255,0.1)]"
                                />
                            </div>

                            <div className="flex flex-col">
                                <label className="text-[11px] sm:text-xs font-semibold uppercase tracking-wider mb-2 text-[#8c9bba]">
                                    Request Type
                                </label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        value={requestType}
                                        disabled
                                        className="w-full p-4 appearance-none rounded-2xl outline-none transition-all text-black text-sm font-medium bg-[#DDD9F9] border border-[#e8ecf2] cursor-not-allowed"
                                    />
                                    <AlertTriangle size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-black opacity-60 pointer-events-none" />
                                </div>
                            </div>

                            <div className="flex flex-col">
                                <label className="text-[11px] sm:text-xs font-semibold uppercase tracking-wider mb-2 text-[#8c9bba]">
                                    Current Status
                                </label>
                                <div className="relative">
                                    <select
                                        value={status}
                                        disabled
                                        className="w-full p-4 appearance-none rounded-2xl outline-none transition-all text-black text-sm font-medium bg-[#DDD9F9] border border-[#e8ecf2] cursor-not-allowed"
                                    >
                                        <option value="Open">Open</option>
                                    </select>
                                    <CircleDot size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-black opacity-60 pointer-events-none" />
                                </div>
                            </div>

                            <div className="flex flex-col">
                                <label className="text-[11px] sm:text-xs font-semibold uppercase tracking-wider mb-2 text-[#8c9bba]">
                                    Detailed Description <span className="text-[#e91e1eff]">*</span>
                                </label>
                                <textarea
                                    value={description}
                                    disabled={submitting}
                                    onChange={(e) => setDescription(e.target.value)}
                                    rows={6}
                                    required
                                    placeholder="Provide any additional context or steps to reproduce..."
                                    className="w-full p-4 rounded-2xl outline-none transition-all text-sm font-medium bg-[#f8f9fc] text-[#1a2744] border border-[#e8ecf2] focus:bg-white focus:border-[#0e12ffff] focus:shadow-[0_0_0_4px_rgba(14,18,255,0.1)] resize-none"
                                />
                            </div>

                        </div>

                        <div className="pt-8 mt-4 border-t border-[#f0f3f8] flex flex-col sm:flex-row items-center gap-4 justify-end">
                            <button
                                type="button"
                                disabled={submitting}
                                className="w-full sm:w-auto px-6 py-3.5 rounded-2xl font-semibold text-sm text-[#6b7fa3] bg-[#f0f3f8] transition-all hover:bg-[#e8ecf2] active:scale-95 disabled:opacity-50"
                                onClick={() => {
                                    setTitle(""); setDescription("");
                                }}
                            >
                                Clear
                            </button>
                            <button
                                type="submit"
                                disabled={submitting}
                                className="w-full sm:w-auto px-8 py-3.5 rounded-2xl font-semibold text-sm text-white transition-all active:scale-95 flex items-center justify-center gap-2 bg-[#1a2744] shadow-[0_8px_20px_-6px_rgba(26,39,68,0.5)] disabled:opacity-70 disabled:hover:scale-100 hover:bg-[#0e12ffff]"
                            >
                                {submitting ? (
                                    <>
                                        <Loader2 size={18} className="animate-spin" /> Processing...
                                    </>
                                ) : (
                                    <>
                                        <Send size={18} /> Submit Ticket
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                </div>

                {/* RIGHT SIDE COLUMN: PREVIOUS TICKETS */}
                <div className="w-full xl:w-5/12 flex flex-col gap-6 animate-fade-in-up" style={{ animationDelay: "100ms" }}>
                    <div>
                        <h2 className="text-xl sm:text-2xl font-bold text-[#1a2744]">Recent History</h2>
                        <p className="text-sm text-[#6b7fa3] mt-2">
                            A quick glance at your previously submitted requests.
                        </p>
                    </div>

                    <div className="bg-white rounded-[2rem] border border-[#e8ecf2] flex flex-col overflow-hidden max-h-[700px] shadow-[0_10px_40px_-10px_rgba(26,39,68,0.05)] sticky top-24">
                        <div className="p-5 sm:p-6 border-b border-[#f0f3f8] bg-[#f8f9fc] flex items-center justify-between z-10">
                            <span className="text-sm font-bold text-[#1a2744] uppercase tracking-wide">Your Tickets</span>
                            <span className="text-xs font-bold px-2.5 py-1 bg-[#1a2744] text-white rounded-lg shadow-sm">
                                {tickets.length}
                            </span>
                        </div>

                        <div className="flex-1 overflow-y-auto p-3 scrollbar-thin">
                            {tickets.length === 0 ? (
                                <div className="flex flex-col items-center justify-center gap-3 py-20 px-6 text-center">
                                    <div className="w-14 h-14 rounded-2xl bg-[#f0f3f8] flex items-center justify-center">
                                        <Ticket size={28} className="text-[#8c9bba]" />
                                    </div>
                                    <div>
                                        <p className="text-base font-bold text-[#1a2744]">No tickets yet</p>
                                        <p className="text-sm text-[#6b7fa3] mt-1.5">Your submitted tickets will appear here.</p>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex flex-col gap-2">
                                    {tickets.map(t => (
                                        <Link href={`/tickets/${t.id}`} key={t.id} className="block p-4 sm:p-5 rounded-2xl hover:bg-[#f8f9fc] transition-all border border-transparent hover:border-[#e8ecf2] hover:shadow-sm group">
                                            <div className="flex flex-col gap-2.5">
                                                <div className="flex items-start justify-between gap-3">
                                                    <h3 className="text-sm font-bold text-[#1a2744] truncate group-hover:text-[#0e12ffff] transition-colors">
                                                        {t.title}
                                                    </h3>
                                                    <div className="flex items-center gap-1.5 bg-white border border-[#e8ecf2] px-2.5 py-1 rounded-lg shadow-sm flex-shrink-0">
                                                        {getStatusIcon(t.status)}
                                                        <span className="text-[10px] font-bold text-[#1a2744] uppercase tracking-wide">
                                                            {t.status}
                                                        </span>
                                                    </div>
                                                </div>
                                                <p className="text-xs text-[#6b7fa3] leading-relaxed line-clamp-2">
                                                    {t.description}
                                                </p>
                                                <span className="text-[10px] font-semibold text-[#8c9bba] flex items-center gap-1.5 mt-1">
                                                    <Clock size={12} />
                                                    {new Date(t.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

            </main>
        </div>
    );
}
