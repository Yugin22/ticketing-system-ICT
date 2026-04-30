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
  PauseCircle,
  ChevronDown,
  UserPlus,
  Activity,
} from "lucide-react";

/* ---------------- TYPES ---------------- */

type CommentType = {
  id: string;
  ticket_id: string;
  user_id: string;
  content: string;
  created_at: string;
  profiles: {
    full_name: string;
    email?: string;
    avatar_url?: string;
    role: string;
  } | null;
};

type Profile = {
  id: string;
  full_name: string;
  email: string;
  role: string;
};

type TicketType = {
  id: string | number;
  title: string;
  description: string;
  status: string;
  priority: string;
  request_type?: string;
  category?: string;
  created_at: string;
  user_id: string;
  assigned_to: string | null;
  unread_admin_reply?: boolean;
  profiles?: Profile;
  assignee?: Profile;
};

/* ---------------- CONSTANTS ---------------- */

const STATUSES = ["Open", "In Progress", "On Hold", "Resolved", "Closed"];
const PRIORITIES = ["Low", "Medium", "High", "Emergency"];

const PRIORITY_STYLES: Record<string, string> = {
  Low: "bg-gray-50 text-gray-600 border-gray-200",
  Medium: "bg-blue-50 text-blue-600 border-blue-200",
  High: "bg-orange-50 text-orange-600 border-orange-200",
  Emergency: "bg-red-50 text-red-600 border-red-200",
};

/* ================================================ */
/*                   ADMIN THREAD                   */
/* ================================================ */

export default function AdminTicketDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: ticketId } = use(params);
  const router = useRouter();

  const [ticket, setTicket] = useState<TicketType | null>(null);
  const [comments, setComments] = useState<CommentType[]>([]);
  const [newComment, setNewComment] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  // Admin-specific
  const [staff, setStaff] = useState<Profile[]>([]);
  const [reporter, setReporter] = useState<Profile | null>(null);
  const [assignee, setAssignee] = useState<Profile | null>(null);

  // Temp states for explicit Save button
  const [tempStatus, setTempStatus] = useState<string>("");
  const [tempPriority, setTempPriority] = useState<string>("");
  const [tempAssignee, setTempAssignee] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  /* ---------- REAL-TIME SUBSCRIPTION ---------- */

  useEffect(() => {
    const uniqueChannelName = `ticket-room-${ticketId}`;
    const channel = supabase
      .channel(uniqueChannelName)
      .on(
        "broadcast",
        { event: "new_comment" },
        () => {
          console.log("Broadcast received! Fetching new comment.");
          fetchComments();
        }
      )
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "ticket_comments",
        },
        async (payload: any) => {
          // Client-side filter to be completely safe against string/int mismatch
          if (String(payload.new.ticket_id) !== String(ticketId)) return;

          console.log("New comment received via real-time:", payload.new);
          // Fetch the new comment basic data to be sure we have the latest and correct types
          const { data: commentData, error: commentError } = await supabase
            .from("ticket_comments")
            .select("id, ticket_id, user_id, content, created_at")
            .eq("id", payload.new.id)
            .maybeSingle();

          if (commentData && !commentError) {
            // Fetch the profile manually
            const { data: profileData } = await supabase
              .from("profiles")
              .select("id, full_name, email, avatar_url, role")
              .eq("id", commentData.user_id)
              .maybeSingle();

            const fullComment = {
              ...commentData,
              profiles: profileData || null
            };

            setComments((prev) => {
              if (prev.some((c) => c.id === fullComment.id)) return prev;
              const newComments = [...prev, fullComment as any];
              // Sort by date ascending
              return newComments.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
            });
          } else if (commentError) {
            console.error("Error fetching new comment payload:", commentError);
          }
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "tickets",
          filter: `id=eq.${ticketId}`,
        },
        (payload: any) => {
          console.log("Ticket updated in real-time:", payload.new);
          setTicket((prev) => prev ? ({ ...prev, ...payload.new }) : null);
          // Also update temp states if not currently being edited? 
          // Usually better to just update the 'source of truth' ticket object.
          setTempStatus(payload.new.status);
          setTempPriority(payload.new.priority);
          setTempAssignee(payload.new.assigned_to);
        }
      )
      .subscribe();

    initPage();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [ticketId]);

  /* ---------- INIT ---------- */

  const initPage = async () => {
    try {
      setLoading(true);
      const { data: authData } = await supabase.auth.getUser();
      if (!authData.user) {
        router.replace("/login");
        return;
      }
      setUser(authData.user);

      // Verify admin role
      const { data: profileData } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", authData.user.id)
        .maybeSingle();

      if (profileData?.role !== "admin") {
        router.replace("/dashboard");
        return;
      }

      // Fetch Ticket
      const { data: ticketData, error: ticketError } = await supabase
        .from("tickets")
        .select("*")
        .eq("id", ticketId)
        .single();

      if (ticketError) throw ticketError;
      setTicket(ticketData);

      // Initialize temp states
      setTempStatus(ticketData.status);
      setTempPriority(ticketData.priority || "Medium");
      setTempAssignee(ticketData.assigned_to);

      // Fetch reporter profile manually
      if (ticketData?.user_id) {
        let { data: rep } = await supabase
          .from("profiles")
          .select("id, full_name, email, role")
          .eq("id", ticketData.user_id)
          .maybeSingle();

        // AUTO-REPAIR: NULL names
        if (rep && !rep.full_name) {
          const derivedName = rep.email?.split("@")[0] || "User";
          const { data: updated } = await supabase
            .from("profiles")
            .update({ full_name: derivedName, updated_at: new Date().toISOString() })
            .eq("id", rep.id)
            .select()
            .single();
          if (updated) rep = updated;
        }
        if (rep) setReporter(rep as any);
      }

      // Fetch assignee profile manually
      if (ticketData?.assigned_to) {
        let { data: asg } = await supabase
          .from("profiles")
          .select("id, full_name, email, role")
          .eq("id", ticketData.assigned_to)
          .maybeSingle();

        // AUTO-REPAIR: NULL names
        if (asg && !asg.full_name) {
          const derivedName = asg.email?.split("@")[0] || "User";
          const { data: updated } = await supabase
            .from("profiles")
            .update({ full_name: derivedName, updated_at: new Date().toISOString() })
            .eq("id", asg.id)
            .select()
            .single();
          if (updated) asg = updated;
        }
        if (asg) setAssignee(asg as any);
      }

      // Fetch staff list
      const { data: staffData } = await supabase
        .from("profiles")
        .select("*")
        .eq("role", "admin");
      if (staffData) setStaff(staffData);

      // Fetch Comments
      await fetchComments();
    } catch (err: any) {
      console.error("Error loading ticket:", err);
      // Detailed logging for standard objects
      if (err.message) console.error("Error message:", err.message);
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
      // 2. Collect unique user IDs from comments
      const uniqueUserIds = Array.from(new Set(commentsData.map(c => c.user_id)));

      // 3. Fetch corresponding profiles in one bulk query
      const { data: profilesData } = await supabase
        .from("profiles")
        .select("id, full_name, email, role, avatar_url")
        .in("id", uniqueUserIds);

      // 4. Manually stitch profiles to comments
      const stitchedComments = commentsData.map(comment => ({
        ...comment,
        profiles: profilesData?.find(p => p.id === comment.user_id) || null
      }));

      setComments(stitchedComments as any);
    }
  };

  /* ---------- ACTIONS ---------- */

  const handlePostComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !user) return;

    try {
      setSubmitting(true);
      const { error } = await supabase
        .from("ticket_comments")
        .insert([
          {
            ticket_id: ticketId,
            user_id: user.id,
            content: newComment.trim(),
          },
        ]);

      if (error) throw error;
      setNewComment("");
      await fetchComments();

      // Send broadcast to instantly notify the user side
      await supabase.channel(`ticket-room-${ticketId}`).send({
        type: "broadcast",
        event: "new_comment",
        payload: { ticketId },
      });

      // Mark unread for user
      await supabase
        .from("tickets")
        .update({ unread_admin_reply: true })
        .eq("id", ticketId);
    } catch (err: any) {
      console.error("Comment error:", err);
      alert(err.message || "Failed to post comment");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSaveChanges = async () => {
    if (!ticket) return;
    try {
      setIsSaving(true);
      let { error, data } = await supabase
        .from("tickets")
        .update({
          status: tempStatus,
          priority: tempPriority,
          assigned_to: tempAssignee
        })
        .eq("id", ticketId)
        .select();

      if (!error && (!data || data.length === 0)) {
        alert("Action blocked: Supabase Row Level Security (RLS) prevented the update. Please update your SQL policies in Supabase.");
        setIsSaving(false);
        return;
      }

      // Gracefully handle missing 'assigned_to' column in Supabase database schema
      if (error && error.code === 'PGRST204' && error.message.includes('assigned_to')) {
        console.warn("Database schema missing 'assigned_to' column. Retrying save without assignment.");
        alert("Warning: The 'assigned_to' column is missing from your Supabase database schema. Ticket status and priority were saved, but technician assignment was skipped. Please add the 'assigned_to' column as a UUID to enable assignment features.");

        const retryResult = await supabase
          .from("tickets")
          .update({
            status: tempStatus,
            priority: tempPriority,
          })
          .eq("id", ticketId);

        error = retryResult.error;
      }

      if (error) {
        console.error("Save changes error:", JSON.stringify(error, null, 2));
        alert(`Failed to save changes: ${error.message}`);
      } else {
        // Success: Update local state and reset 'dirty' state by aligning temp states with the new ticket state
        setTicket(prev => {
          if (!prev) return null;
          return {
            ...prev,
            status: tempStatus,
            priority: tempPriority,
            assigned_to: tempAssignee
          };
        });

        // Update assignee profile state to reflect change immediately in UI summary
        const newAssigneeProfile = staff.find(s => s.id === tempAssignee);
        setAssignee(newAssigneeProfile || null);

        // Feedback
        console.log("Changes saved successfully.");
      }
    } catch (err: any) {
      console.error("Unexpected error during save:", err);
      alert("An unexpected error occurred while saving changes.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetChanges = () => {
    if (!ticket) return;
    setTempStatus(ticket.status);
    setTempPriority(ticket.priority || "Medium");
    setTempAssignee(ticket.assigned_to);
  };

  const isDirty = ticket && (
    tempStatus !== ticket.status ||
    tempPriority !== (ticket.priority || "Medium") ||
    tempAssignee !== ticket.assigned_to
  );

  /* ---------- HELPERS ---------- */

  const getStatusStyle = (status: string) => {
    const map: Record<string, { bg: string; text: string; icon: any }> = {
      Open: { bg: "bg-red-50", text: "text-red-600", icon: <AlertCircle size={14} /> },
      "In Progress": { bg: "bg-blue-50", text: "text-blue-600", icon: <Clock size={14} /> },
      "On Hold": { bg: "bg-gray-100", text: "text-gray-600", icon: <PauseCircle size={14} /> },
      Resolved: { bg: "bg-emerald-50", text: "text-emerald-600", icon: <CheckCircle2 size={14} /> },
      Closed: { bg: "bg-[#1a2744]", text: "text-white", icon: <CircleDot size={14} /> },
    };
    return map[status] || { bg: "bg-gray-100", text: "text-gray-600", icon: <CircleDot size={14} /> };
  };

  const timeSince = (dateStr: string) => {
    const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
    if (seconds < 60) return "just now";
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  /* ---------- LOADING / ERROR STATES ---------- */

  if (loading) return <AdminTicketSkeleton />;

  if (error || !ticket) {
    return (
      <div className="min-h-screen bg-[#f8f9fc] flex items-center justify-center p-6 text-center">
        <div className="max-w-md w-full bg-white p-8 rounded-[2.5rem] shadow-xl border border-[#e8ecf2]">
          <div className="w-16 h-16 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <AlertCircle size={32} />
          </div>
          <h2 className="text-xl font-bold text-[#1a2744] mb-2">Ticket Not Found</h2>
          <p className="text-[#6b7fa3] text-sm mb-8">{error || "This ticket does not exist or you don't have permission."}</p>
          <Link
            href="/admin"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#1a2744] text-white text-sm font-bold transition-all hover:bg-[#0e12ffff] active:scale-95 shadow-lg shadow-indigo-100"
          >
            <ArrowLeft size={18} /> Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  const statusStyle = getStatusStyle(ticket.status);

  /* ========================================= */
  /*                   RENDER                  */
  /* ========================================= */

  return (
    <div className="min-h-screen bg-[#f8f9fc] font-sans pb-20">
      {/* ── HEADER NAV ── */}
      <header className="bg-white/80 backdrop-blur-md px-4 sm:px-10 py-4 flex items-center justify-between border-b border-[#e8ecf2] sticky top-0 z-50">
        <div className="flex items-center gap-4">
          <Link href="/admin" className="p-2 rounded-xl text-[#6b7fa3] hover:bg-[#f0f3f8] hover:text-[#1a2744] transition-all">
            <ArrowLeft size={20} />
          </Link>
          <div className="h-6 w-px bg-[#e8ecf2] hidden sm:block" />
          <div className="flex items-center gap-3">
            <div className="px-3 h-8 rounded-lg bg-[#1a2744] flex items-center justify-center text-white text-xs font-bold tracking-wider">
              ID-{ticket.id}
            </div>
            <div className="flex flex-col justify-center">
              <span className="text-[10px] font-bold text-[#8c9bba] uppercase tracking-wider mb-0.5">Admin Panel</span>
              <h1 className="text-sm sm:text-base font-bold text-[#1a2744] truncate max-w-[200px] sm:max-w-md leading-none">{ticket.title}</h1>
            </div>
          </div>
        </div>

        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border border-opacity-50 ${statusStyle.bg} ${statusStyle.text}`}>
          {statusStyle.icon}
          <span className="text-xs font-bold uppercase tracking-wide">{ticket.status}</span>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 mt-8 grid grid-cols-1 xl:grid-cols-12 gap-8">
        {/* ── LEFT COLUMN: TICKET INFO + CONVERSATION ── */}
        <div className="xl:col-span-8 flex flex-col gap-6">
          {/* TICKET DETAILS CARD */}
          <div className="bg-white rounded-[2.5rem] p-6 sm:p-8 shadow-sm border border-[#e8ecf2] relative overflow-hidden group hover:shadow-xl transition-all duration-500">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#1a2744] via-[#0e12ffff] to-[#e91e1eff]" />

            <div className="flex items-center justify-between mb-8 pb-6 border-b border-[#f0f3f8]">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-[#f8f9fc] flex items-center justify-center border border-[#e8ecf2]">
                  <UserIcon className="text-[#1a2744]" size={24} />
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold text-[#8c9bba] uppercase tracking-widest mb-0.5">Reporter</span>
                  <span className="text-sm font-bold text-[#1a2744]">
                    {reporter?.full_name || (reporter?.email ? reporter.email.split('@')[0] : null) || (ticket.user_id ? `HCDC Associate (${String(ticket.user_id).substring(0, 8)})` : "Guest User")}
                  </span>
                  <span className="text-[10px] text-[#8c9bba]">{reporter?.email || "Email address unavailable"}</span>
                </div>
              </div>

              <div className="hidden sm:flex flex-col items-end gap-2">
                <span className="text-[10px] font-bold text-[#8c9bba] uppercase tracking-widest">Reported</span>
                <div className="flex items-center gap-2 text-sm font-bold text-[#1a2744]">
                  <Calendar size={14} className="text-[#8c9bba]" />
                  {new Date(ticket.created_at).toLocaleDateString(undefined, {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  })}
                </div>
                <span className="text-[10px] text-[#8c9bba]">{timeSince(ticket.created_at)}</span>
              </div>
            </div>

            <div className="prose max-w-none">
              <h2 className="text-lg font-bold text-[#1a2744] mb-4 flex items-center gap-2">
                <Tag size={18} className="text-[#0e12ffff]" />
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
              <span className="text-xs font-medium text-red-500 bg-white px-2 py-0.5 rounded-full border border-red-500">
                {comments.length}
              </span>
            </h3>

            <div className="flex flex-col gap-6">
              {comments.length === 0 ? (
                <div className="bg-white rounded-[2rem] p-12 text-center border border-dashed border-[#8c9bba]/30">
                  <div className="w-16 h-16 bg-[#f8f9fc] rounded-full flex items-center justify-center mx-auto mb-4 text-[#8c9bba]">
                    <MessageSquare size={32} opacity={0.3} />
                  </div>
                  <p className="text-sm font-bold text-[#1a2744]">No replies yet</p>
                  <p className="text-xs text-[#8c9bba] mt-1">Start the conversation by sending a response to the user.</p>
                </div>
              ) : (
                comments.map((comment, index) => {
                  const isCurrentAuthor = comment.user_id === user?.id;
                  const isStaff = comment.profiles?.role === "admin";

                  return (
                    <div
                      key={comment.id}
                      className="flex flex-col gap-2 animate-fade-in-up"
                      style={{ animationDelay: `${index * 50}ms` }}
                    >
                      <div className={`flex items-start gap-4 ${isCurrentAuthor ? "flex-row-reverse" : "flex-row"}`}>
                        <div
                          className={`flex-shrink-0 w-10 h-10 rounded-2xl flex items-center justify-center text-white font-bold text-sm shadow-md transition-transform hover:scale-110 ${isStaff ? "bg-gradient-to-br from-[#1a2744] to-[#0e12ffff]" : "bg-gradient-to-br from-indigo-400 to-indigo-600"
                            }`}
                        >
                          {comment.profiles?.full_name?.charAt(0).toUpperCase() || "U"}
                        </div>

                        <div className={`max-w-[85%] sm:max-w-[70%] flex flex-col ${isCurrentAuthor ? "items-end" : "items-start"}`}>
                          <div className="flex items-center gap-2 mb-1 px-1">
                            <span className="text-[11px] font-bold text-[#1a2744]">
                              {isCurrentAuthor ? "You" : (comment.profiles?.full_name || (comment.profiles?.email ? comment.profiles.email.split('@')[0] : null) || `User (${comment.user_id?.substring(0, 8)})`)}
                            </span>
                            {isStaff && (
                              <span className="text-[9px] font-bold bg-[#1a2744] text-white px-1.5 py-0.5 rounded uppercase tracking-tighter">
                                Staff
                              </span>
                            )}
                            <span className="text-[10px] text-[#8c9bba]">
                              {new Date(comment.created_at).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                          </div>

                          <div
                            className={`px-5 py-4 rounded-[2rem] text-sm leading-relaxed shadow-sm transition-all duration-300 hover:shadow-md ${isCurrentAuthor
                              ? "bg-[#1a2744] text-white rounded-tr-none"
                              : "bg-white text-[#1a2744] border border-[#e8ecf2] rounded-tl-none"
                              }`}
                          >
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
                    placeholder="Reply as admin..."
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

        {/* ── RIGHT COLUMN: ADMIN CONTROLS ── */}
        <div className="xl:col-span-4 flex flex-col gap-6">
          {/* STATUS CONTROL */}
          <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-[#e8ecf2] flex flex-col gap-6 hover:shadow-xl transition-all duration-500">
            <h3 className="text-xs font-bold uppercase tracking-widest text-[#8c9bba] pb-4 border-b border-[#f0f3f8] flex items-center gap-2">
              <Activity size={14} />
              Ticket Controls
            </h3>

            {/* Status Dropdown */}
            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-[#8c9bba]">Status</label>
              <div className="relative">
                <select
                  value={tempStatus}
                  onChange={(e) => setTempStatus(e.target.value)}
                  disabled={isSaving}
                  className="w-full appearance-none px-4 py-3 bg-[#f8f9fc] border border-[#e8ecf2] rounded-2xl text-sm font-bold text-[#1a2744] outline-none focus:bg-white focus:border-[#1a2744] focus:ring-4 focus:ring-indigo-50 transition-all cursor-pointer disabled:opacity-50"
                >
                  {STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
                <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-[#8c9bba] pointer-events-none" />
              </div>
            </div>

            {/* Priority Dropdown */}
            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-[#8c9bba]">Priority</label>
              <div className="relative">
                <select
                  value={tempPriority}
                  onChange={(e) => setTempPriority(e.target.value)}
                  disabled={isSaving}
                  className="w-full appearance-none px-4 py-3 bg-[#f8f9fc] border border-[#e8ecf2] rounded-2xl text-sm font-bold text-[#1a2744] outline-none focus:bg-white focus:border-[#1a2744] focus:ring-4 focus:ring-indigo-50 transition-all cursor-pointer disabled:opacity-50"
                >
                  {PRIORITIES.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
                <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-[#8c9bba] pointer-events-none" />
              </div>
            </div>

            {/* Assign Tech */}
            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-[#8c9bba]">Assigned Technician</label>
              <div className="relative">
                <select
                  value={tempAssignee || ""}
                  onChange={(e) => setTempAssignee(e.target.value || null)}
                  disabled={isSaving}
                  className="w-full appearance-none px-4 py-3 bg-[#f8f9fc] border border-[#e8ecf2] rounded-2xl text-sm font-bold text-[#1a2744] outline-none focus:bg-white focus:border-[#1a2744] focus:ring-4 focus:ring-indigo-50 transition-all cursor-pointer disabled:opacity-50"
                >
                  <option value="">Unassigned</option>
                  {staff.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.full_name || s.email}
                    </option>
                  ))}
                </select>
                <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-[#8c9bba] pointer-events-none" />
              </div>
            </div>

            {/* Save / Discard Changes */}
            {isDirty && (
              <div className="flex flex-col gap-2 mt-2 pt-4 border-t border-[#f0f3f8] animate-fade-in">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse" />
                  <span className="text-[10px] font-bold text-orange-600 uppercase tracking-widest">Unsaved Modifications</span>
                </div>
                <button
                  onClick={handleSaveChanges}
                  disabled={isSaving}
                  className="w-full py-3.5 bg-gradient-to-r from-[#1a2744] to-[#0e12ffff] text-white rounded-2xl text-xs font-bold uppercase tracking-widest shadow-lg shadow-blue-100 hover:shadow-xl hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isSaving ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
                  Save Changes
                </button>
                <button
                  onClick={handleResetChanges}
                  disabled={isSaving}
                  className="w-full py-2.5 bg-white text-[#6b7fa3] border border-[#e8ecf2] rounded-2xl text-[10px] font-bold uppercase tracking-widest hover:bg-gray-50 transition-all"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>

          {/* TICKET DETAILS SIDEBAR */}
          <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-[#e8ecf2] flex flex-col gap-6 hover:shadow-xl transition-all duration-500">
            <h3 className="text-xs font-bold uppercase tracking-widest text-[#8c9bba] pb-4 border-b border-[#f0f3f8]">System Summary</h3>

            <div className="flex flex-col gap-6">
              {/* Reporter */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-500 flex items-center justify-center">
                    <UserIcon size={16} />
                  </div>
                  <span className="text-sm font-medium text-[#6b7fa3]">Reporter</span>
                </div>
                <span className="text-xs font-bold text-[#1a2744]">
                  {reporter?.full_name || (reporter?.email ? reporter.email.split('@')[0] : null) || (ticket.user_id ? `HCDC Associate (${ticket.user_id.substring(0, 8)})` : "Guest User")}
                </span>
              </div>

              {/* Assigned Tech */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-500 flex items-center justify-center">
                    <UserPlus size={16} />
                  </div>
                  <span className="text-sm font-medium text-[#6b7fa3]">Assigned</span>
                </div>
                <span className="text-xs font-bold text-[#1a2744]">{assignee?.full_name || "Not Assigned"}</span>
              </div>

              {/* Request Type */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-red-50 text-red-500 flex items-center justify-center">
                    <Tag size={16} />
                  </div>
                  <span className="text-sm font-medium text-[#6b7fa3]">Request Type</span>
                </div>
                <span className="text-xs font-bold text-[#1a2744]">{ticket.request_type || "Incident"}</span>
              </div>

              {/* Category */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-500 flex items-center justify-center">
                    <Shield size={16} />
                  </div>
                  <span className="text-sm font-medium text-[#6b7fa3]">Category</span>
                </div>
                <span className="text-xs font-bold text-[#1a2744]">{ticket.category || "General"}</span>
              </div>

              {/* Priority Badge */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-orange-50 text-orange-500 flex items-center justify-center">
                    <AlertCircle size={16} />
                  </div>
                  <span className="text-sm font-medium text-[#6b7fa3]">Priority</span>
                </div>
                <span
                  className={`text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full border ${PRIORITY_STYLES[ticket.priority || "Medium"]
                    }`}
                >
                  {ticket.priority || "Medium"}
                </span>
              </div>

              {/* Response Time */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-gray-100 text-[#1a2744] flex items-center justify-center">
                    <Clock size={16} />
                  </div>
                  <span className="text-sm font-medium text-[#6b7fa3]">Age</span>
                </div>
                <span className="text-xs font-bold text-[#1a2744]">{timeSince(ticket.created_at)}</span>
              </div>

              {/* SLA Status */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-500 flex items-center justify-center">
                    <Shield size={16} />
                  </div>
                  <span className="text-sm font-medium text-[#6b7fa3]">SLA Status</span>
                </div>
                {(() => {
                  const diffMs = Date.now() - new Date(ticket.created_at).getTime();
                  const THREE_DAYS = 3 * 24 * 60 * 60 * 1000;
                  const TWO_DAYS = 2 * 24 * 60 * 60 * 1000;
                  const isResolved = ticket.status === "Resolved" || ticket.status === "Closed";

                  if (isResolved) {
                    return <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md uppercase tracking-tight">Compliant</span>;
                  }
                  if (diffMs > THREE_DAYS) {
                    return <span className="text-xs font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded-md uppercase tracking-tight animate-pulse">Violated</span>;
                  }
                  if (diffMs > TWO_DAYS) {
                    return <span className="text-xs font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md uppercase tracking-tight">Approaching</span>;
                  }
                  return <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md uppercase tracking-tight">Active</span>;
                })()}
              </div>
            </div>
          </div>

          {/* QUICK-ACTION CTA */}
          <div className="relative group overflow-hidden rounded-[2.5rem] bg-[#1a2744] p-8 text-white shadow-xl shadow-indigo-100">
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/20 rounded-full -mr-16 -mt-16 blur-2xl group-hover:bg-indigo-500/30 transition-all duration-700" />
            <div className="relative z-10">
              <h4 className="text-lg font-bold mb-2">Admin Tools</h4>
              <p className="text-xs text-indigo-200 leading-relaxed mb-6 italic">
                Use the controls above to update the ticket status, reassign to another technician, or adjust priority level.
              </p>
              <button
                onClick={() => router.push("/admin")}
                className="w-full py-3 rounded-xl bg-white text-[#1a2744] text-xs font-bold transition-all hover:scale-103 active:scale-95 shadow-md"
              >
                Back to Dashboard
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

/* ========================================= */
/*               SKELETON LOADER             */
/* ========================================= */

function AdminTicketSkeleton() {
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

      <main className="max-w-7xl mx-auto px-4 sm:px-6 mt-8 grid grid-cols-1 xl:grid-cols-12 gap-8 pb-20">
        <div className="xl:col-span-8 flex flex-col gap-6">
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
              <div key={i} className={`flex gap-4 ${i % 2 === 0 ? "" : "flex-row-reverse"}`}>
                <div className="w-10 h-10 bg-[#f0f3f8] rounded-2xl flex-shrink-0" />
                <div
                  className={`w-2/3 h-20 bg-white rounded-[2rem] border border-[#e8ecf2] ${i % 2 === 0 ? "rounded-tl-none" : "rounded-tr-none"
                    }`}
                />
              </div>
            ))}
          </div>
        </div>

        <div className="xl:col-span-4 flex flex-col gap-6">
          <div className="bg-white rounded-[2.5rem] p-8 border border-[#e8ecf2]">
            <div className="w-24 h-3 bg-[#f0f3f8] rounded-md mb-8" />
            <div className="flex flex-col gap-6">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="w-full h-12 bg-[#f0f3f8] rounded-2xl" />
              ))}
            </div>
          </div>
          <div className="bg-white rounded-[2.5rem] p-8 border border-[#e8ecf2]">
            <div className="w-24 h-3 bg-[#f0f3f8] rounded-md mb-8" />
            <div className="flex flex-col gap-6">
              {[...Array(5)].map((_, i) => (
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
