"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import Link from "next/link";
import {
  Ticket,
  ArrowLeft,
  Megaphone,
  Clock,
  MessageSquare,
  Shield,
  Search,
  CheckCircle2,
  AlertCircle
} from "lucide-react";

type Announcement = {
  id: string;
  ticket_id: string;
  content: string;
  created_at: string;
  tickets: {
    title: string;
    id: string | number;
  };
  profiles: {
    full_name: string;
  };
};

export default function UserAnnouncementsPage() {
  const router = useRouter();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [myTicketIds, setMyTicketIds] = useState<Set<string | number>>(new Set());

  useEffect(() => {
    checkUser();
    fetchAnnouncements();
  }, []);

  const checkUser = async () => {
    const { data } = await supabase.auth.getUser();
    if (!data.user) {
      router.push("/login");
      return;
    }
    setUser(data.user);

    // Fetch user's ticket IDs for highlighting
    const { data: tickets } = await supabase
      .from("tickets")
      .select("id")
      .eq("user_id", data.user.id);
    
    if (tickets) {
      setMyTicketIds(new Set(tickets.map(t => t.id)));
    }
  };

  const fetchAnnouncements = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("ticket_comments")
        .select(`
          id,
          ticket_id,
          content,
          created_at,
          tickets (title, id),
          profiles (full_name)
        `)
        .like("content", "[System Update%")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setAnnouncements(data as any);
    } catch (err) {
      console.error("Error fetching announcements:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8f9fc] font-sans pb-12 overflow-x-hidden">
      {/* HEADER */}
      <header className="bg-white px-4 sm:px-10 py-4 sm:py-5 flex items-center justify-between shadow-[0_4px_12px_rgba(0,0,0,0.02)] border-b border-[#e8ecf2] sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-[#1a2744] flex items-center justify-center text-white">
            <Megaphone size={18} />
          </div>
          <span className="text-lg sm:text-xl font-bold tracking-tight text-[#1a2744]">Official Updates</span>
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

      {/* MAIN CONTENT */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 mt-12 animate-fade-in-up">
        <div className="mb-10 text-center sm:text-left">
          <h1 className="text-3xl font-black text-[#1a2744]">ICT System Announcements</h1>
          <p className="text-sm sm:text-base text-[#8c9bba] mt-2 font-medium">
            Stay informed with the latest updates on resolved issues and system status notifications.
          </p>
        </div>

        {loading ? (
          <div className="flex flex-col gap-6">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-32 bg-white rounded-[2.5rem] animate-pulse border border-[#e8ecf2]" />
            ))}
          </div>
        ) : announcements.length === 0 ? (
          <div className="bg-white rounded-[3rem] p-20 text-center border border-dashed border-[#e8ecf2] flex flex-col items-center">
            <div className="w-20 h-20 bg-[#f8f9fc] rounded-[2.5rem] flex items-center justify-center mb-6">
              <Megaphone size={40} className="text-[#8c9bba] opacity-30" />
            </div>
            <h4 className="text-xl font-bold text-[#1a2744]">No announcements yet</h4>
            <p className="text-sm text-[#8c9bba] mt-2 max-w-xs">All official ICT updates will be listed here once they are released.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-6">
            {announcements.map((ann) => {
              const statusMatch = ann.content.match(/Ticket (.*?)]/);
              const status = statusMatch ? statusMatch[1] : "Update";
              const note = ann.content.split('] ')[1] || ann.content;

              return (
                <div key={ann.id} className="bg-white p-6 sm:p-8 rounded-[2.5rem] border border-[#e8ecf2] shadow-sm hover:shadow-xl transition-all duration-500 relative overflow-hidden group">
                  <div className="absolute top-0 left-0 w-1.5 h-full bg-[#1a2744] opacity-50" />
                  
                  <div className="flex justify-between items-start mb-6 relative z-10">
                    <div className="flex items-center gap-2">
                      {myTicketIds.has(ann.ticket_id) && (
                        <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-[#1a2744] text-white border border-[#1a2744]">
                          Your Ticket
                        </span>
                      )}
                    </div>
                    <div className="flex flex-col items-end">
                      <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border mb-1 ${
                        status === "Resolved" ? "bg-[#f0fdf4] text-[#166534] border-[#bbf7d0]" : 
                        status === "On Hold" ? "bg-[#f3f4f6] text-[#000000] border-[#000000]" :
                        "bg-[#fef2f2] text-[#7f1d1d] border-[#fecaca]"
                      }`}>
                        {status}
                      </div>
                      <span className="text-[10px] font-bold text-[#8c9bba] flex items-center gap-1.5 uppercase tracking-tighter">
                        <Clock size={12} />
                        {new Date(ann.created_at).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>

                  <div className="flex gap-5">
                    <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-500 flex items-center justify-center shrink-0 border border-indigo-100">
                      <Shield size={22} />
                    </div>
                    <div className="flex flex-col gap-3">
                      <p className="text-base sm:text-lg font-bold text-[#1a2744] leading-relaxed italic">
                        "{note}"
                      </p>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                        <span className="text-xs font-medium text-[#6b7fa3]">
                          Regarding: <span className="text-[#1a2744] font-bold">{ann.tickets?.title}</span>
                        </span>
                        <div className="w-1 h-1 rounded-full bg-[#e8ecf2]" />
                        <span className="text-xs font-medium text-[#6b7fa3]">
                          Sent by <span className="text-[#1a2744] font-bold">{ann.profiles?.full_name}</span>
                        </span>
                      </div>
                    </div>
                  </div>

                  <Link 
                    href={`/tickets/${ann.ticket_id}`}
                    className="mt-6 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-[#1a2744] hover:text-[#0e12ffff] transition-colors"
                  >
                    View Ticket Details <ArrowLeft size={12} className="rotate-180" />
                  </Link>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
