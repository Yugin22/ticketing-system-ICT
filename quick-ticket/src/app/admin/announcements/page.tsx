"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import {
  LayoutDashboard,
  Ticket,
  Clock,
  LogOut,
  ChevronRight,
  Shield,
  Activity,
  Menu,
  X,
  Megaphone,
  Calendar,
  MessageSquare,
  User as UserIcon,
  Trash2
} from "lucide-react";

type Announcement = {
  id: string;
  ticket_id: string;
  content: string;
  created_at: string;
  status: string;
  tickets: {
    title: string;
    id: string | number;
  };
};

export default function AnnouncementsPage() {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

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
    const { data: profile } = await supabase.from("profiles").select("role").eq("id", data.user.id).maybeSingle();
    if (profile?.role !== 'admin') {
      router.push("/dashboard");
    }
  };

  const fetchAnnouncements = async () => {
    try {
      setLoading(true);
      // Fetch comments that are system updates
      const { data, error } = await supabase
        .from("announcements")
        .select(`
          id,
          ticket_id,
          content,
          status,
          created_at,
          tickets (title, id)
        `)
        .order("created_at", { ascending: false }); // Force recompile

      if (error) throw error;
      setAnnouncements(data as any);
    } catch (err: any) {
      console.error("Error fetching announcements:", err?.message || err, err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAnnouncement = async (id: string) => {
    if (!confirm("Are you sure you want to delete this announcement?")) return;
    const { error } = await supabase.from("announcements").delete().eq("id", id);
    if (!error) fetchAnnouncements();
  };

  return (
    <div className="flex min-h-screen bg-[#f8f9fc] text-[#1a2744] font-sans">
      {/* SIDEBAR */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-[#e8ecf2] transform transition-transform duration-300 ease-in-out ${sidebarOpen ? "translate-x-0" : "-translate-x-full"} lg:relative lg:translate-x-0`}>
        <div className="p-6 flex flex-col h-full bg-gradient-to-b from-white to-[#f8f9fc]">
          <div className="flex items-center gap-3 mb-10">
            <div className="w-10 h-10 rounded-xl bg-[#1a2744] flex items-center justify-center text-white shadow-lg">
              <Shield size={20} />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">ICT Admin</h1>
              <p className="text-[10px] text-[#8c9bba] font-bold uppercase tracking-widest mt-0.5">Control Center</p>
            </div>
          </div>

          <nav className="flex-1 space-y-2">
            <NavItem icon={<LayoutDashboard size={18} />} label="Analytics" onClick={() => router.push("/admin")} />
            <NavItem icon={<Ticket size={18} />} label="All Tickets" onClick={() => router.push("/admin/tickets")} />
            <NavItem icon={<Activity size={18} />} label="Request" onClick={() => router.push("/admin/requests")} />
            <NavItem icon={<Megaphone size={18} />} label="Announcements" active onClick={() => { }} />
            <NavItem icon={<Calendar size={18} />} label="Schedules" onClick={() => { }} />
          </nav>

          <div className="mt-auto pt-6 border-t border-[#e8ecf2]">
            <button
              onClick={() => setShowLogoutModal(true)}
              className="flex items-center gap-3 w-full p-3 rounded-xl text-red-500 font-bold text-sm hover:bg-red-50 transition-all active:scale-95"
            >
              <LogOut size={18} /> Logout
            </button>
          </div>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 overflow-x-hidden relative flex flex-col h-screen">
        <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-[#e8ecf2] px-4 sm:px-8 py-4 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-4">
            <button className="lg:hidden p-2 rounded-lg hover:bg-gray-100" onClick={() => setSidebarOpen(!sidebarOpen)}>
              {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
            <h2 className="text-xl font-bold text-[#1a2744]">Official Announcements</h2>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 sm:p-8 scrollbar-thin scrollbar-thumb-gray-200">
          <div className="max-w-4xl mx-auto flex flex-col gap-6">
            <div>
              <h3 className="text-2xl font-black text-[#1a2744]">System Updates History</h3>
              <p className="text-sm text-[#8c9bba] mt-2 font-medium">All official status notes sent to users across all tickets.</p>
            </div>

            {loading ? (
              <div className="flex flex-col gap-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-32 bg-white rounded-3xl animate-pulse border border-[#e8ecf2]" />
                ))}
              </div>
            ) : announcements.length === 0 ? (
              <div className="bg-white rounded-[3rem] p-20 text-center border border-dashed border-[#e8ecf2] flex flex-col items-center">
                <div className="w-20 h-20 bg-[#f8f9fc] rounded-[2rem] flex items-center justify-center mb-6">
                  <Megaphone size={40} className="text-[#8c9bba] opacity-30" />
                </div>
                <h4 className="text-xl font-bold text-[#1a2744]">No announcements yet</h4>
                <p className="text-sm text-[#8c9bba] mt-2 max-w-xs">When you add notes during status changes, they will appear here as official announcements.</p>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                {announcements.map((ann) => {
                  const status = ann.status || "Update";
                  const note = ann.content;

                  return (
                    <div key={ann.id} className="bg-white p-6 sm:p-8 rounded-[2.5rem] border border-[#e8ecf2] shadow-sm hover:shadow-xl transition-all duration-500 group relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-full -mr-16 -mt-16 blur-3xl opacity-0 group-hover:opacity-100 transition-opacity" />

                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 relative z-10">
                        <div className="flex items-center gap-3">
                          <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${status === "Resolved" ? "bg-[#f0fdf4] text-[#166534] border-[#bbf7d0]" :
                            status === "On Hold" ? "bg-[#f3f4f6] text-[#000000] border-[#000000]" :
                              "bg-[#fef2f2] text-[#7f1d1d] border-[#fecaca]"
                            }`}>
                            {status}
                          </div>
                          <span className="text-xs font-bold text-[#8c9bba]">
                            Ticket ID-{ann.tickets?.id}
                          </span>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className="text-[10px] font-bold text-[#8c9bba] flex items-center gap-1.5 uppercase tracking-tighter">
                            <Clock size={12} />
                            {new Date(ann.created_at).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                          </span>
                          <button
                            onClick={() => handleDeleteAnnouncement(ann.id)}
                            className="p-2 rounded-xl text-red-200 hover:text-red-500 hover:bg-red-50 transition-all"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>

                      <div className="flex gap-4 relative z-10">
                        <div className="w-12 h-12 rounded-2xl bg-[#1a2744] text-white flex items-center justify-center shrink-0 shadow-lg">
                          <MessageSquare size={20} />
                        </div>
                        <div className="flex flex-col gap-2">
                          <p className="text-base font-bold text-[#1a2744] leading-relaxed italic">"{note}"</p>
                          <div className="flex items-center gap-2">
                            <div className="w-5 h-5 rounded-lg bg-indigo-100 flex items-center justify-center text-[8px] font-black text-indigo-700">
                              AD
                            </div>
                            <span className="text-[11px] font-bold text-[#6b7fa3]">
                              Sent by <span className="text-[#1a2744]">ICT Admin</span> for "{ann.tickets?.title}"
                            </span>
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={() => router.push(`/admin/tickets/${ann.ticket_id}`)}
                        className="absolute bottom-6 right-6 p-3 rounded-full bg-indigo-50 text-indigo-600 opacity-0 group-hover:opacity-100 translate-x-4 group-hover:translate-x-0 transition-all hover:bg-indigo-600 hover:text-white"
                      >
                        <ChevronRight size={20} />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* LOGOUT CONFIRMATION MODAL */}
      {showLogoutModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[#1a2744]/40 backdrop-blur-sm animate-fade-in">
          <div className="bg-white p-8 rounded-[2.5rem] shadow-2xl max-w-sm w-full animate-fade-in-up">
            <div className="w-16 h-16 rounded-full bg-red-50 text-red-500 flex items-center justify-center mb-6 mx-auto">
              <LogOut size={32} />
            </div>
            <h3 className="text-2xl font-bold text-center text-[#1a2744] mb-2">Logout</h3>
            <p className="text-sm text-[#8c9bba] text-center font-medium mb-8">Are you sure you want to end your session?</p>
            <div className="flex items-center gap-3">
              <button onClick={() => setShowLogoutModal(false)} className="flex-1 py-4 rounded-2xl bg-[#f0f3f8] text-[#1a2744] font-bold text-sm hover:bg-[#e8ecf2] transition-all active:scale-95">Cancel</button>
              <button onClick={() => { supabase.auth.signOut(); router.push("/login"); }} className="flex-1 py-4 rounded-2xl bg-red-500 text-white font-bold text-sm hover:bg-red-600 transition-all shadow-lg shadow-red-500/30 active:scale-95">Logout</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function NavItem({ icon, label, active, onClick }: { icon: any, label: string, active?: boolean, onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold transition-all duration-300 group ${active
        ? "bg-[#1a2744] text-white shadow-lg shadow-indigo-100 translate-x-2"
        : "text-[#6b7fa3] hover:bg-[#f0f3f8] hover:text-[#1a2744]"
        }`}
    >
      <span className={`${active ? "text-white" : "text-[#8c9bba] group-hover:text-[#1a2744]"} transition-colors`}>
        {icon}
      </span>
      {label}
    </button>
  );
}
