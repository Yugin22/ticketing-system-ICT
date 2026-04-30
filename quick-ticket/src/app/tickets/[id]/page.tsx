"use client";
import { useEffect, useState, use } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Send,
  Calendar,
  User as UserIcon,
  Clock,
  MessageSquare,
  Tag,
  AlertCircle,
  CheckCircle2,
  CircleDot,
  Loader2,
  Shield,
  Menu,
  X
} from "lucide-react";

type CommentType = {
  id: string;
  ticket_id: string;
  user_id: string;
  content: string;
  created_at: string;
  profiles: {
    full_name: string;
    avatar_url?: string;
    role: string;
  };
};

type TicketType = {
  id: string | number;
  title: string;
  description: string;
  status: string;
  request_type?: string;
  created_at: string;
  user_id: string;
  unread_admin_reply?: boolean;
};

export default function TicketDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: ticketId } = use(params);
  const router = useRouter();

  const [ticket, setTicket] = useState<TicketType | null>(null);
  const [comments, setComments] = useState<CommentType[]>([]);
  const [newComment, setNewComment] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [currentUserProfile, setCurrentUserProfile] = useState<any>(null);
  const [reporterProfile, setReporterProfile] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // 1. Setup subscription synchronously to avoid "after subscribe" race conditions
    const uniqueChannelName = `ticket-room-${ticketId}`;
    const channel = supabase.channel(uniqueChannelName);

    channel.on(
      "broadcast",
      { event: "new_comment" },
      () => {
        console.log("Broadcast received! Fetching new comments...");
        fetchComments();
      }
    ).subscribe();

    // 2. Fetch initial data
    initPage();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [ticketId]);

  const initPage = async () => {
    try {
      setLoading(true);
      const { data: authData } = await supabase.auth.getUser();
      if (!authData.user) {
        router.replace("/login");
        return;
      }
      setUser(authData.user);

      // Fetch Ticket
      const { data: ticketData, error: ticketError } = await supabase
        .from("tickets")
        .select("*")
        .eq("id", ticketId)
        .single();

      if (ticketError) throw ticketError;
      setTicket(ticketData);

      // Fetch user profile for permissions
      const { data: profileData } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", authData.user.id)
        .maybeSingle();
      setCurrentUserProfile(profileData);

      // Fetch reporter profile manually for display
      if (ticketData?.user_id) {
        const { data: rep } = await supabase
          .from("profiles")
          .select("full_name, email")
          .eq("id", ticketData.user_id)
          .maybeSingle();
        if (rep) setReporterProfile(rep);
      }

      // If there's an unread admin reply, clear it
      if (ticketData.unread_admin_reply) {
        await supabase.from("tickets").update({ unread_admin_reply: false }).eq("id", ticketId);
        setTicket({ ...ticketData, unread_admin_reply: false });
      }

      // Fetch Comments
      await fetchComments();

    } catch (err: any) {
      console.error("Error loading ticket:", err);
      setError(err.message || "Could not load ticket details");
    } finally {
      setLoading(false);
    }
  };

  const fetchComments = async () => {
    // 1. Fetch comments first
    const { data: commentsData, error: commentsError } = await supabase
      .from("ticket_comments")
      .select("*")
      .eq("ticket_id", ticketId)
      .order("created_at", { ascending: true });

    if (!commentsError && commentsData) {
      // 2. Extract unique user IDs
      const uniqueIds = Array.from(new Set(commentsData.map(c => c.user_id)));

      // 3. Fetch profiles in bulk
      const { data: profilesData } = await supabase
        .from("profiles")
        .select("id, full_name, avatar_url, role")
        .in("id", uniqueIds);

      // 4. Stitch together
      const stitched = commentsData.map(c => ({
        ...c,
        profiles: profilesData?.find(p => p.id === c.user_id) || null
      }));

      setComments(stitched as any);
    }
  };

  const handlePostComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !user) return;

    try {
      setSubmitting(true);
      const { error } = await supabase
        .from("ticket_comments")
        .insert([{
          ticket_id: ticketId,
          user_id: user.id,
          content: newComment.trim()
        }]);

      if (error) throw error;
      setNewComment("");
      await fetchComments();

      // Send broadcast to instantly notify the admin side
      await supabase.channel(`ticket-room-${ticketId}`).send({
        type: "broadcast",
        event: "new_comment",
        payload: { ticketId },
      });

      // If we (an admin) are replying, mark the ticket as having an unread admin reply for the user
      if (currentUserProfile?.role === 'admin') {
        await supabase
          .from("tickets")
          .update({ unread_admin_reply: true })
          .eq("id", ticketId);
      }
    } catch (err: any) {
      console.error("Comment error:", err);
      alert(err.message || "Failed to post comment");
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusStyle = (status: string) => {
    const map: Record<string, { bg: string, text: string, icon: any }> = {
      "Open": { bg: "bg-gray-100", text: "text-black", icon: <CircleDot size={14} /> },
      "In Progress": { bg: "bg-blue-50", text: "text-blue-600", icon: <Clock size={14} /> },
      "Resolved": { bg: "bg-emerald-50", text: "text-emerald-600", icon: <CheckCircle2 size={14} /> },
      "Closed": { bg: "bg-gray-50", text: "text-gray-500", icon: <CheckCircle2 size={14} /> },
    };
    return map[status] || { bg: "bg-gray-100", text: "text-gray-600", icon: <CircleDot size={14} /> };
  };

  if (loading) {
    return <TicketDetailSkeleton />;
  }

  if (error || !ticket) {
    return (
      <div className="min-h-screen bg-[#f8f9fc] flex items-center justify-center p-6 text-center">
        <div className="max-w-md w-full bg-white p-8 rounded-[2.5rem] shadow-xl border border-[#e8ecf2]">
          <div className="w-16 h-16 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <AlertCircle size={32} />
          </div>
          <h2 className="text-xl font-bold text-[#1a2744] mb-2">Oops! Something went wrong</h2>
          <p className="text-[#6b7fa3] text-sm mb-8">{error || "Ticket not found."}</p>
          <Link href="/dashboard" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#1a2744] text-white text-sm font-bold transition-all hover:bg-[#0e12ffff] active:scale-95 shadow-lg shadow-indigo-100">
            <ArrowLeft size={18} /> Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  const statusStyle = getStatusStyle(ticket.status);

  return (
    <div className="min-h-screen bg-[#f8f9fc] font-sans pb-20">
      {/* ── HEADER NAV ── */}
      <header className="bg-white/80 backdrop-blur-md px-4 sm:px-10 py-4 flex items-center justify-between border-b border-[#e8ecf2] sticky top-0 z-50">
        <div className="flex items-center gap-4">
          <Link href="/dashboard" className="p-2 rounded-xl text-[#6b7fa3] hover:bg-[#f0f3f8] hover:text-[#1a2744] transition-all">
            <ArrowLeft size={20} />
          </Link>
          <div className="h-6 w-px bg-[#e8ecf2] hidden sm:block" />
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold text-[#8c9bba] uppercase tracking-wider">Ticket</span>
              <span className="text-[10px] font-bold text-[#0e12ffff] bg-blue-50 px-2 py-0.5 rounded-lg border border-blue-100">ID- {ticket.id}</span>
            </div>
            <h1 className="text-sm sm:text-base font-bold text-[#1a2744] truncate max-w-[200px] sm:max-w-md">{ticket.title}</h1>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {user && (
            <div className="flex items-center gap-2 pr-3 sm:pr-4 border-r border-[#e8ecf2] mr-1 sm:mr-2">
              <div className="w-8 h-8 rounded-full bg-[#1a2744] text-white flex items-center justify-center text-[10px] font-bold">
                {(user.user_metadata?.full_name || user.email || "U").charAt(0).toUpperCase()}
              </div>
              <div className="flex flex-col hidden sm:flex">
                <span className="text-[10px] font-bold text-[#1a2744] leading-tight">
                  {user.user_metadata?.full_name || user.email?.split("@")[0]}
                </span>
                <span className="text-[9px] text-[#8c9bba] leading-tight">
                  {user.email}
                </span>
              </div>
            </div>
          )}
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border border-opacity-50 ${statusStyle.bg} ${statusStyle.text}`}>
            {statusStyle.icon}
            <span className="text-xs font-bold uppercase tracking-wide">{ticket.status}</span>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 mt-8 grid grid-cols-1 lg:grid-cols-12 gap-8">

        {/* LEFT COLUMN: TICKET INFO */}
        <div className="lg:col-span-12 xl:col-span-8 flex flex-col gap-6">
          <div className="bg-white rounded-[2.5rem] p-6 sm:p-8 shadow-sm border border-[#e8ecf2] relative overflow-hidden group hover:shadow-xl transition-all duration-500">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#ff0000] via-[#c500c4] to-[#000cff]" />

            <div className="flex items-center justify-between mb-8 pb-6 border-b border-[#f0f3f8]">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-[#FDFDFD] flex items-center justify-center border border-[#C6C6C6]">
                  <UserIcon className="text-black" size={24} />
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold text-[#8c9bba] uppercase tracking-widest mb-0.5">Reported By</span>
                  <div className="flex flex-col">
                    <span className="text-sm font-bold text-[#1a2744]">
                      {reporterProfile?.full_name || reporterProfile?.email || (ticket.user_id === user?.id ? "You" : "User")}
                    </span>
                    <div className="flex items-center gap-2 text-[10px] text-[#8c9bba]">
                      <Calendar size={12} />
                      {new Date(ticket.created_at).toLocaleDateString(undefined, {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </div>
                  </div>
                </div>
              </div>

              <div className="hidden sm:flex flex-col items-end">
                <span className="text-[10px] font-bold text-[#8c9bba] uppercase tracking-widest mb-1.5">Request Type</span>
                <div className="px-3 py-1 rounded-lg bg-red-50 text-red-600 text-xs font-bold uppercase border border-red-100">
                  {ticket.request_type || "Incident"}
                </div>
              </div>
            </div>

            <div className="prose max-w-none">
              <h2 className="text-lg font-bold text-[#1a2744] mb-4 flex items-center gap-2">
                <Tag size={18} className="text-red-600" />
                Issue Description
              </h2>
              <div className="p-6 rounded-3xl bg-[#f8f9fc] border border-[#e8ecf2] text-[#1a2744] leading-relaxed whitespace-pre-wrap text-sm sm:text-base">
                {ticket.description}
              </div>
            </div>
          </div>

          {/* ────── CONVERSATION THREAD ────── */}
          <div className="flex flex-col gap-6">
            <h3 className="text-xl font-bold text-[#1a2744] flex items-center gap-3 ml-2">
              <div className="p-2 rounded-xl bg-blue-50 text-[#0e12ffff]">
                <MessageSquare size={20} />
              </div>
              Conversation Thread
              <span className="text-xs font-medium text-red-500 bg-white px-2 py-0.5 rounded-full border border-red-500">{comments.length}</span>
            </h3>

            <div className="flex flex-col gap-6">
              {comments.length === 0 ? (
                <div className="bg-white rounded-[2rem] p-12 text-center border border-dashed border-[#8c9bba]/30">
                  <div className="w-16 h-16 bg-[#f8f9fc] rounded-full flex items-center justify-center mx-auto mb-4 text-[#8c9bba]">
                    <MessageSquare size={32} opacity={0.3} />
                  </div>
                  <p className="text-sm font-bold text-[#1a2744]">No replies yet</p>
                  <p className="text-xs text-[#8c9bba] mt-1">Be the first to leave a message in this conversation.</p>
                </div>
              ) : (
                comments.map((comment, index) => {
                  const isCurrentAuthor = comment.user_id === user?.id;
                  const isStaff = comment.profiles?.role === "admin";

                  return (
                    <div
                      key={comment.id}
                      className={`flex flex-col gap-2 animate-fade-in-up`}
                      style={{ animationDelay: `${index * 50}ms` }}
                    >
                      <div className={`flex items-start gap-4 ${isCurrentAuthor ? 'flex-row-reverse' : 'flex-row'}`}>
                        <div className={`flex-shrink-0 w-10 h-10 rounded-2xl flex items-center justify-center text-white font-bold text-sm shadow-md transition-transform hover:scale-110 ${isStaff ? 'bg-gradient-to-br from-[#1a2744] to-[#0e12ffff]' : 'bg-gradient-to-br from-indigo-400 to-indigo-600'}`}>
                          {comment.profiles?.full_name?.charAt(0).toUpperCase() || 'U'}
                        </div>

                        <div className={`max-w-[85%] sm:max-w-[70%] flex flex-col ${isCurrentAuthor ? 'items-end' : 'items-start'}`}>
                          <div className="flex items-center gap-2 mb-1 px-1">
                            <span className="text-[11px] font-bold text-[#1a2744]">
                              {isCurrentAuthor ? 'You' : comment.profiles?.full_name}
                            </span>
                            {isStaff && (
                              <span className="text-[9px] font-bold bg-[#1a2744] text-white px-1.5 py-0.5 rounded uppercase tracking-tighter">Staff</span>
                            )}
                            <span className="text-[10px] text-[#8c9bba]">
                              {new Date(comment.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>

                          <div className={`px-5 py-4 rounded-[2rem] text-sm leading-relaxed shadow-sm transition-all duration-300 hover:shadow-md ${isCurrentAuthor ? 'bg-[#1a2744] text-white rounded-tr-none' : 'bg-white text-[#1a2744] border border-[#e8ecf2] rounded-tl-none'}`}>
                            {comment.content}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* COMMENT INPUT */}
            <div className="mt-4 sticky bottom-6 z-10">
              <form
                onSubmit={handlePostComment}
                className="bg-white p-2 rounded-[2.5rem] shadow-[0_20px_50px_-15px_rgba(26,39,68,0.2)] border border-[#e8ecf2] flex items-center gap-2 group focus-within:ring-4 focus-within:ring-indigo-100 transition-all"
              >
                <div className="flex-1 px-4">
                  <textarea
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Write a message..."
                    className="w-full mt-5 bg-transparent border-none outline-none text-sm px-2 resize-none max-h-32 min-h-[44px] overflow-hidden"
                    disabled={submitting}
                  />
                </div>
                <button
                  type="submit"
                  disabled={submitting || !newComment.trim()}
                  className="bg-[#1a2744] hover:bg-[#0e12ffff] text-white p-4 rounded-full transition-all active:scale-95 disabled:opacity-50 disabled:bg-gray-400 shadow-lg"
                >
                  {submitting ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: RECAP & INFO */}
        <div className="lg:col-span-12 xl:col-span-4 flex flex-col gap-6">
          <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-[#e8ecf2] flex flex-col gap-6">
            <h3 className="text-xs font-bold uppercase tracking-widest text-[#8c9bba] pb-4 border-b border-[#f0f3f8]">System Summary</h3>

            <div className="flex flex-col gap-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-red-50 text-red-500 flex items-center justify-center">
                    <AlertCircle size={16} />
                  </div>
                  <span className="text-sm font-medium text-[#6b7fa3]">Current Agent</span>
                </div>
                <span className="text-xs font-bold text-[#1a2744]">ICT Technical Support</span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-gray-100 text-black flex items-center justify-center">
                    <Clock size={16} />
                  </div>
                  <span className="text-sm font-medium text-[#6b7fa3]">Response Time</span>
                </div>
                <span className="text-xs font-bold text-[#1a2744]">avg. 2 hours</span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-500 flex items-center justify-center">
                    <Shield size={16} />
                  </div>
                  <span className="text-sm font-medium text-[#6b7fa3]">SLA Status</span>
                </div>
                <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md uppercase tracking-tight">Active</span>
              </div>
            </div>

            <div className="mt-4 p-5 rounded-3xl bg-indigo-50 border border-indigo-100 italic text-[11px] leading-relaxed text-[#2d4470]">
              <span className="inline-block mb-1 font-bold uppercase tracking-wider not-italic text-[#0e12ffff]">Note:</span><br />
              Only ICT Personnel are authorized to modify ticket status. Regular users can contribute to the conversation thread.
            </div>
          </div>

          <div className="relative group overflow-hidden rounded-[2.5rem] bg-[#1a2744] p-8 text-white shadow-xl shadow-indigo-100">
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/20 rounded-full -mr-16 -mt-16 blur-2xl group-hover:bg-indigo-500/30 transition-all duration-700" />
            <div className="relative z-10">
              <h4 className="text-lg font-bold mb-2">Need urgent help?</h4>
              <p className="text-xs text-indigo-200 leading-relaxed mb-6 italic">
                Our team is actively monitoring this ticket. For critical infrastructure emergencies, please dial extension 4400.
              </p>
              <button className="w-full py-3 rounded-xl bg-white text-[#1a2744] text-xs font-bold transition-all hover:scale-103 active:scale-95 shadow-md">
                Contact IT Hotline
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

function TicketDetailSkeleton() {
  return (
    <div className="min-h-screen bg-[#f8f9fc] animate-pulse">
      <header className="bg-white/80 backdrop-blur-md px-4 sm:px-10 py-4 flex items-center justify-between border-b border-[#e8ecf2] sticky top-0 z-50">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-[#f0f3f8] rounded-xl" />
          <div className="hidden sm:block w-px h-6 bg-[#e8ecf2]" />
          <div className="flex flex-col gap-2">
            <div className="w-32 h-3 bg-[#f0f3f8] rounded-md" />
            <div className="w-48 h-5 bg-[#f0f3f8] rounded-md" />
          </div>
        </div>
        <div className="w-28 h-8 bg-[#f0f3f8] rounded-full" />
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 mt-8 grid grid-cols-1 lg:grid-cols-12 gap-8 pb-20">
        <div className="lg:col-span-12 xl:col-span-8 flex flex-col gap-6">
          <div className="bg-white rounded-[2.5rem] p-8 border border-[#e8ecf2]">
            <div className="flex items-center justify-between mb-8 pb-3 border-b border-[#f0f3f8]">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-[#f0f3f8] rounded-2xl" />
                <div className="flex flex-col gap-2">
                  <div className="w-24 h-2 bg-[#f0f3f8] rounded-md" />
                  <div className="w-44 h-4 bg-[#f0f3f8] rounded-md" />
                </div>
              </div>
              <div className="hidden sm:flex flex-col items-end gap-2">
                <div className="w-20 h-2 bg-[#f0f3f8] rounded-md" />
                <div className="w-24 h-5 bg-[#f0f3f8] rounded-lg" />
              </div>
            </div>
            <div className="w-32 h-4 bg-[#f0f3f8] rounded-md mb-4" />
            <div className="w-full h-40 bg-[#f8f9fc] rounded-3xl" />
          </div>

          <div className="flex flex-col gap-6 px-2">
            <div className="w-48 h-6 bg-[#f0f3f8] rounded-md mb-2" />
            {[...Array(3)].map((_, i) => (
              <div key={i} className={`flex gap-4 ${i % 2 === 0 ? '' : 'flex-row-reverse'}`}>
                <div className="w-10 h-10 bg-[#f0f3f8] rounded-2xl flex-shrink-0" />
                <div className={`w-2/3 h-20 bg-white rounded-[2rem] border border-[#e8ecf2] ${i % 2 === 0 ? 'rounded-tl-none' : 'rounded-tr-none'}`} />
              </div>
            ))}
          </div>
        </div>

        <div className="lg:col-span-12 xl:col-span-4 flex flex-col gap-6">
          <div className="bg-white rounded-[2.5rem] p-8 border border-[#e8ecf2]">
            <div className="w-24 h-3 bg-[#f0f3f8] rounded-md mb-8 pb-4 border-b border-[#f0f3f8]" />
            <div className="flex flex-col gap-6">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-[#f0f3f8] rounded-xl" />
                    <div className="w-24 h-3 bg-[#f0f3f8] rounded-md" />
                  </div>
                  <div className="w-16 h-3 bg-[#f0f3f8] rounded-md" />
                </div>
              ))}
            </div>
          </div>
          <div className="w-full h-48 bg-[#1a2744]/10 rounded-[2.5rem]" />
        </div>
      </main>
    </div>
  );
}
