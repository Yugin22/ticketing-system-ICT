"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  House,
  Ticket,
  CheckCircle2,
  AlertCircle,
  ClipboardList,
  Menu,
  X,
  LogOut,
  User,
  RefreshCcw,
  Clock,
  CircleDot,
  PauseCircle,
  ChevronRight,
  Plus,
  BarChart3,
  TrendingUp,
  Bell,
  Search,
  Filter,
  Calendar,
  AlertTriangle,
  Shield,
  Settings,
  Mail,
  CalendarDays,
  UserCircle2,
  Lock,
  Globe,
  Smartphone,
} from "lucide-react";

type UserType = {
  id: string;
  email?: string;
  avatar_url?: string;
  full_name?: string;
  created_at?: string;
  last_login?: string;
  role?: string;
  is_verified?: boolean;
};

type StatsType = {
  closed: number;
  open: number;
  inProgress: number;
  onHold: number;
  resolved: number;
};

type TicketType = {
  id: string | number;
  title: string;
  description?: string;
  status: string;
  request_type?: string;
  created_at: string;
  unread_admin_reply?: boolean;
};

export default function DashboardPage() {
  const router = useRouter();

  const [user, setUser] = useState<UserType | null>(null);
  const [loading, setLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [view, setView] = useState("home");
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const [stats, setStats] = useState<StatsType>({
    closed: 0,
    open: 0,
    inProgress: 0,
    onHold: 0,
    resolved: 0,
  });

  const [tickets, setTickets] = useState<TicketType[]>([]);

  useEffect(() => {
    let channel: ReturnType<typeof supabase.channel> | null = null;

    const setup = async () => {
      const { data } = await supabase.auth.getUser();
      if (!data.user) { router.replace("/login"); return; }
      await initUser();
      supabase.removeChannel(supabase.channel("tickets-changes"));
      channel = supabase
        .channel("tickets-changes")
        .on("postgres_changes", { event: "*", schema: "public", table: "tickets" }, () => {
          initUser();
        })
        .subscribe();
    };

    setup();
    return () => { if (channel) supabase.removeChannel(channel); };
  }, []);

  const initUser = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.auth.getUser();
      if (error || !data.user) { router.replace("/login"); return; }
      const currentUser = data.user;

      // Fetch from public.profiles table
      let { data: dbProfile, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", currentUser.id)
        .single();

      if (profileError) {
        if (profileError.code === "PGRST116") {
          // Profile doesn't exist, create it (Upsert)
          const { data: newProfile, error: insertError } = await supabase
            .from("profiles")
            .insert([{ id: currentUser.id, email: currentUser.email, role: "user" }])
            .select()
            .single();

          if (!insertError) dbProfile = newProfile;
        } else {
          console.error("Profile fetch error:", profileError);
        }
      }

      const avatar = dbProfile?.avatar_url || currentUser.user_metadata?.avatar_url || null;
      const fullName = dbProfile?.full_name || currentUser.user_metadata?.full_name || currentUser.email?.split("@")[0] || "User";

      setUser({
        id: currentUser.id,
        email: currentUser.email,
        avatar_url: avatar,
        full_name: fullName,
        created_at: currentUser.created_at,
        last_login: currentUser.last_sign_in_at,
        role: dbProfile?.role || "User",
        is_verified: !!currentUser.email_confirmed_at
      });

      const { data: ticketData, error: ticketError } = await supabase
        .from("tickets")
        .select("id, title, status, created_at, description, unread_admin_reply")

        .eq("user_id", currentUser.id)
        .order("created_at", { ascending: false });

      if (ticketError) { console.error("Ticket fetch error:", JSON.stringify(ticketError, null, 2)); return; }
      const tix = ticketData || [];
      console.log("Supabase Data Debug - Tickets fetched for user:", currentUser.id, "Count:", tix.length, "Tickets:", tix);
      setTickets(tix);
      setStats({
        closed: tix.filter(t => t.status === "Closed").length,
        open: tix.filter(t => t.status === "Open").length,
        inProgress: tix.filter(t => t.status === "Work in Progress" || t.status === "In Progress").length,
        onHold: tix.filter(t => t.status === "On Hold").length,
        resolved: tix.filter(t => t.status === "Resolved").length,
      });
    } catch (err) {
      console.error("Dashboard error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.replace("/login");
  };

  const refreshDashboard = async () => {
    setRefreshing(true);
    await initUser();
    setRefreshing(false);
  };

  const firstName = user?.email?.split("@")[0] ?? "User";
  const initials = firstName.charAt(0).toUpperCase();

  /* ── LOADING SKELETON ── */
  if (loading) {
    return (
      <div className="h-screen flex bg-white overflow-hidden">
        <aside className="hidden md:flex w-[72px] flex-col items-center py-8 gap-6 flex-shrink-0" style={{ background: "#1a2744" }}>
          {[...Array(5)].map((_, i) => (
            <div key={i} className="w-10 h-10 rounded-xl animate-pulse" style={{ background: "#2a3d5e" }} />
          ))}
        </aside>
        <main className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6 overflow-hidden">
          <div className="h-8 w-56 rounded-lg animate-pulse" style={{ background: "#e8ecf2" }} />
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-24 sm:h-28 rounded-2xl animate-pulse" style={{ background: "#e8ecf2" }} />
            ))}
          </div>
          <div className="flex-1 rounded-2xl animate-pulse" style={{ background: "#e8ecf2", minHeight: "200px" }} />
        </main>
      </div>
    );
  }

  /* ── NAV ITEMS ── */
  const navItems = [
    { id: "home", icon: <House size={18} />, label: "Home" },
    { id: "requests", icon: <ClipboardList size={18} />, label: "Requests" },
    { id: "tickets", icon: <Ticket size={18} />, label: "Tickets" },
  ];

  return (
    <div className="h-screen flex bg-white overflow-hidden">

      {/* ── LOGOUT CONFIRMATION MODAL ── */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 transition-opacity" style={{ background: "rgba(26, 39, 68, 0.4)", backdropFilter: "blur(2px)" }} onClick={() => setShowLogoutConfirm(false)} />
          <div
            className="relative bg-white rounded-2xl p-6 sm:p-8 w-full max-w-sm flex flex-col gap-4 shadow-2xl animate-fade-in-up"
            style={{ border: "1px solid #e8ecf2" }}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: "rgba(220, 38, 38, 0.1)", color: "#dc2626" }}>
                <LogOut size={20} />
              </div>
              <h2 className="text-lg font-bold" style={{ color: "#1a2744" }}>Confirm Logout</h2>
            </div>
            <p className="text-sm" style={{ color: "#6b7fa3" }}>Are you sure on logging out? You will need to login again to access your account</p>
            <div className="flex items-center justify-end gap-2.5 mt-2">
              <button
                className="px-4 py-2.5 rounded-xl text-sm font-semibold transition-all hover:bg-opacity-80 hover:scale-103 active:scale-95"
                style={{ background: "#f0f3f8", color: "#6b7fa3" }}
                onClick={() => setShowLogoutConfirm(false)}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90 hover:scale-103 active:scale-95"
                style={{ background: "#dc2626", boxShadow: "0 4px 12px rgba(220, 38, 38, 0.25)" }}
                onClick={handleLogout}
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── SIDEBAR — desktop only ── */}
      <aside
        className="hidden md:flex w-[88px] flex-col items-center justify-between py-8 flex-shrink-0"
        style={{ background: "#1a2744", borderRight: "1px solid #253555" }}
      >
        <div className="flex flex-col items-center gap-3">
          {/* Logo */}
          <div
            className="mb-8 w-11 h-11 rounded-xl flex items-center justify-center"
            style={{ background: "#e91e1eff" }}
          >
            <Ticket size={18} className="text-white" />
          </div>

          {navItems.map(item => (
            <SideIcon
              key={item.id}
              icon={item.icon}
              label={item.label}
              active={view === item.id}
              onClick={() => setView(item.id)}
            />
          ))}
        </div>


        {/* Bottom: Avatar */}
        <div className="flex flex-col items-center pb-4">
          <button
            className="relative w-10 h-10 rounded-full cursor-pointer transition hover:scale-105 active:scale-95"
            title={user?.email}
            onClick={() => setView("profile")}
            style={{ border: "2px solid #3b5280" }}
          >
            {user?.avatar_url ? (
              <img src={user.avatar_url} className="w-full h-full rounded-full object-cover" />
            ) : (
              <div
                className="w-full h-full flex items-center justify-center rounded-full text-white text-sm font-bold"
                style={{ background: "#2d4470" }}
              >
                {initials}
              </div>
            )}
            <span
              className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full animate-pulse"
              style={{ background: "#15eb39ff", border: "2px solid #1a2744" }}
            />
          </button>
        </div>
      </aside>

      {/* ── MOBILE OVERLAY MENU ── */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden" onClick={() => setMobileMenuOpen(false)}>
          <div className="absolute inset-0" style={{ background: "rgba(26,39,68,0.6)", backdropFilter: "blur(4px)" }} />
          <div
            className="absolute left-0 top-0 h-full w-64 sm:w-72 p-5 sm:p-6 shadow-2xl"
            style={{ background: "#1a2744", color: "#c0cce0" }}
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: "#dc2626" }}>
                  <Ticket size={14} className="text-white" />
                </div>
                <span className="font-semibold text-white text-sm">QuickTicket</span>
              </div>
              <button onClick={() => setMobileMenuOpen(false)} style={{ color: "#6b7fa3" }} className="hover:text-white transition">
                <X size={18} />
              </button>
            </div>

            <div className="flex flex-col gap-1">
              {navItems.map(item => (
                <button
                  key={item.id}
                  onClick={() => { setView(item.id); setMobileMenuOpen(false); }}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-200"
                  style={{
                    color: view === item.id ? "#ffffff" : "#6b7fa3",
                    fontWeight: view === item.id ? 600 : 400,
                    background: view === item.id ? "rgba(38, 220, 68, 0.15)" : "transparent",
                  }}
                >
                  {item.icon}
                  {item.label}
                </button>
              ))}
            </div>

            <div className="absolute bottom-8 left-5 right-5 sm:left-6 sm:right-6">
              <button
                onClick={() => { setMobileMenuOpen(false); setShowLogoutConfirm(true); }}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition w-full"
                style={{ color: "#dc2626" }}
              >
                <LogOut size={16} />
                Logout
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MAIN CONTENT — fills remaining screen ── */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">

        {/* ── TOP BAR ── */}
        <header
          className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 flex-shrink-0 bg-white"
          style={{ borderBottom: "1px solid #e8ecf2" }}
        >
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              className="md:hidden p-2 rounded-lg transition"
              onClick={() => setMobileMenuOpen(true)}
              style={{ color: "#1a2744" }}
            >
              <Menu size={18} />
            </button>
            <span className="text-sm font-semibold capitalize" style={{ color: "#1a2744" }}>
              {view === "home" ? "Dashboard" : view}
            </span>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={refreshDashboard}
              disabled={refreshing}
              className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-medium transition disabled:opacity-50"
              style={{ color: "#1a2744", background: "#f0f3f8" }}
            >
              <RefreshCcw size={13} className={refreshing ? "animate-spin" : ""} />
              <span className="hidden sm:inline">Refresh</span>
            </button>

            {(() => {
              const latestUnreadId = tickets.find(t => t.unread_admin_reply)?.id;

              if (latestUnreadId) {
                return (
                  <Link
                    href={`/tickets/${latestUnreadId}`}
                    className="relative p-2 rounded-xl transition hover:bg-[#f0f3f8] group"
                    style={{ color: "#1a2744" }}
                  >
                    <Bell size={16} className="group-hover:scale-110 transition-transform" />
                    <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full animate-pulse" style={{ background: "#dc2626" }} />
                  </Link>
                );
              }

              return (
                <button className="relative p-2 rounded-xl transition opacity-60 cursor-default" style={{ color: "#1a2744" }}>
                  <Bell size={16} />
                </button>
              );
            })()}

            <div
              className="flex items-center gap-2 pl-1 pr-2 sm:pr-3 py-1 rounded-full cursor-pointer transition"
              onClick={() => setView("profile")}
              style={{ background: "#f0f3f8" }}
            >
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                style={{ background: "#1a2744" }}
              >
                {initials}
              </div>
              <span className="text-xs font-medium hidden sm:block max-w-[100px] lg:max-w-[120px] truncate" style={{ color: "#1a2744" }}>
                {user?.email}
              </span>
            </div>

            <div className="w-px h-6 bg-[#e8ecf2] mx-1 hidden sm:block" />

            <button
              onClick={() => setShowLogoutConfirm(true)}
              title="Logout"
              className="p-2 sm:p-2.5 rounded-xl transition-all duration-200 group flex items-center justify-center"
              style={{ color: "#6b7fa3" }}
              onMouseEnter={e => { e.currentTarget.style.color = "#dc2626"; e.currentTarget.style.background = "rgba(220,38,38,0.1)"; }}
              onMouseLeave={e => { e.currentTarget.style.color = "#6b7fa3"; e.currentTarget.style.background = "transparent"; }}
            >
              <LogOut size={18} className="group-hover:rotate-12 transition-transform" />
            </button>
          </div>
        </header>

        {/* ── PAGE CONTENT — scrollable area within remaining height ── */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8" style={{ background: "#f8f9fc" }}>
          {view === "home" && <DashboardHome user={user} stats={stats} tickets={tickets} refreshing={refreshing} />}
          {view === "requests" && <RequestsPage tickets={tickets} refreshing={refreshing} />}
          {view === "tickets" && <TicketsPage tickets={tickets} refreshing={refreshing} />}
          {view === "profile" && <ProfilePage user={user ?? undefined} stats={stats} onUpdate={initUser} />}
        </main>

        {/* ── MOBILE BOTTOM NAV ── */}
        <nav
          className="md:hidden flex items-center justify-around flex-shrink-0 py-2 bg-white"
          style={{ borderTop: "1px solid #e8ecf2" }}
        >
          {navItems.slice(0, 4).map(item => (
            <button
              key={item.id}
              onClick={() => setView(item.id)}
              className="flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all"
              style={{
                color: view === item.id ? "#dc2626" : "#6b7fa3",
              }}
            >
              {item.icon}
              <span className="text-[10px] font-medium">{item.label}</span>
            </button>
          ))}
        </nav>
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────── */
/*  SIDEBAR ICON                                */
/* ──────────────────────────────────────────── */
function SideIcon({ icon, label, active, onClick }: { icon: React.ReactNode; label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      title={label}
      className="relative flex flex-col items-center gap-1.5 p-3.5 rounded-xl transition-all duration-200 group w-14"
      style={{
        color: active ? "#ffffff" : "#6b7fa3",
        background: active ? "rgba(220,38,38,0.15)" : "transparent",
      }}
      onMouseEnter={e => {
        if (!active) {
          e.currentTarget.style.color = "#ffffff";
          e.currentTarget.style.background = "rgba(255,255,255,0.07)";
        }
      }}
      onMouseLeave={e => {
        if (!active) {
          e.currentTarget.style.color = "#6b7fa3";
          e.currentTarget.style.background = "transparent";
        }
      }}
    >
      {active && (
        <span
          className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-8 rounded-r-full"
          style={{ background: "#dc2626" }}
        />
      )}
      {icon}
      <span className="text-[10px] font-medium leading-none">{label}</span>
    </button>
  );
}

/* ──────────────────────────────────────────── */
/*  STAT CARD                                   */
/* ──────────────────────────────────────────── */
function StatCard({
  icon,
  title,
  value,
  iconBg,
  iconColor,
}: {
  icon: React.ReactNode;
  title: string;
  value: number;
  iconBg: string;
  iconColor: string;
}) {
  return (
    <div
      className="bg-white rounded-2xl p-3 sm:p-4 lg:p-5 hover:-translate-y-0.5 hover:shadow-lg transition-all duration-300 cursor-default"
      style={{ border: "1px solid #e8ecf2" }}
    >
      <div
        className="w-8 h-8 sm:w-9 sm:h-9 lg:w-10 lg:h-10 rounded-lg sm:rounded-xl flex items-center justify-center mb-2 sm:mb-3"
        style={{ background: iconBg, color: iconColor }}
      >
        {icon}
      </div>
      <p className="text-[10px] sm:text-xs font-medium uppercase tracking-wide" style={{ color: "#6b7fa3" }}>{title}</p>
      <p className="text-xl sm:text-2xl lg:text-3xl font-bold mt-0.5" style={{ color: "#1a2744" }}>{value}</p>
    </div>
  );
}

/* ──────────────────────────────────────────── */
/*  STATUS BADGE                                */
/* ──────────────────────────────────────────── */
function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { bg: string; text: string; border: string }> = {
    "Open": { bg: "#f5f5f5ff", text: "#1a2744", border: "#afafafff" },
    "In Progress": { bg: "#eff3ff", text: "#2d4470", border: "#d0daf0" },
    "Work in Progress": { bg: "#eff3ff", text: "#2d4470", border: "#d0daf0" },
    "On Hold": { bg: "#f0f3f8", text: "#6b7fa3", border: "#dde3ef" },
    "Resolved": { bg: "#eef4ff", text: "#1a2744", border: "#c8d8f0" },
    "Closed": { bg: "#f8f9fc", text: "#6b7fa3", border: "#e0e5ef" },
  };
  const colors = map[status] ?? { bg: "#f0f3f8", text: "#6b7fa3", border: "#dde3ef" };

  return (
    <span
      className="text-[10px] sm:text-[11px] font-semibold px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full whitespace-nowrap"
      style={{ background: colors.bg, color: colors.text, border: `1px solid ${colors.border}` }}
    >
      {status}
    </span>
  );
}

/* ──────────────────────────────────────────── */
/*  TICKET ROW                                  */
/* ──────────────────────────────────────────── */
function TicketRow({ id, title, status, date }: { id: string | number; title: string; status: string; date?: string }) {
  return (
    <Link
      href={`/tickets/${id}`}
      className="flex items-center justify-between gap-2 sm:gap-4 px-3 sm:px-4 py-2.5 sm:py-3.5 rounded-xl transition-all duration-150 hover:bg-[#f0f3ff] hover:translate-x-1 group"
      style={{ borderBottom: "1px solid #f0f3f8" }}
    >
      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
        <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full flex-shrink-0" style={{ background: "#2d4470" }} />
        <p className="text-xs sm:text-sm truncate font-medium" style={{ color: "#1a2744" }}>{title}</p>
      </div>
      <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
        {date && <span className="text-[10px] sm:text-xs hidden md:block" style={{ color: "#6b7fa3" }}>{new Date(date).toLocaleDateString()}</span>}
        <StatusBadge status={status} />
      </div>
    </Link>
  );
}

/* ──────────────────────────────────────────── */
/*  SKELETON COMPONENTS                         */
/* ──────────────────────────────────────────── */
function SkeletonRow() {
  return (
    <div className="flex items-center justify-between gap-4 px-4 py-4 rounded-xl border-b border-[#f0f3f8]">
      <div className="flex items-center gap-3 w-1/2">
        <div className="w-2 h-2 rounded-full bg-[#e8ecf2] animate-pulse" />
        <div className="h-4 w-full max-w-[150px] rounded bg-[#e8ecf2] animate-pulse" />
      </div>
      <div className="w-16 h-5 rounded-full bg-[#e8ecf2] animate-pulse" />
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className="bg-white border border-[#e8ecf2] rounded-2xl p-5 flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <div className="w-10 h-4 rounded bg-[#e8ecf2] animate-pulse" />
        <div className="w-1/2 h-5 rounded bg-[#e8ecf2] animate-pulse" />
      </div>
      <div className="w-full h-3 rounded bg-[#e8ecf2] animate-pulse" />
      <div className="flex items-center justify-between mt-2">
        <div className="w-20 h-5 rounded-full bg-[#e8ecf2] animate-pulse" />
        <div className="w-24 h-4 rounded bg-[#e8ecf2] animate-pulse" />
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────── */
/*  DASHBOARD HOME VIEW                         */
/* ──────────────────────────────────────────── */
function DashboardHome({ user, stats, tickets, refreshing }: { user: UserType | null; stats: StatsType; tickets: TicketType[]; refreshing: boolean }) {
  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 18) return "Good afternoon";
    return "Good evening";
  };
  const firstName = user?.full_name || user?.email?.split("@")[0] || "there";

  const statCards = [
    { icon: <CircleDot size={16} />, title: "Open", value: stats.open, iconBg: "#f1f1f1ff", iconColor: "#1f42e0ff" },
    { icon: <Clock size={16} />, title: "In Progress", value: stats.inProgress, iconBg: "#f1f1f1ff", iconColor: "#1f42e0ff" },
    { icon: <PauseCircle size={16} />, title: "On Hold", value: stats.onHold, iconBg: "#f1f1f1ff", iconColor: "#1f42e0ff" },
    { icon: <CheckCircle2 size={16} />, title: "Resolved", value: stats.resolved, iconBg: "#f1f1f1ff", iconColor: "#1f42e0ff" },
  ];

  return (
    <div className="animate-fade-in-up flex flex-col gap-4 sm:gap-6 lg:gap-8 h-full">

      {/* ── HEADER ── */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 sm:gap-4 flex-shrink-0">
        <div>
          <p className="text-xs sm:text-sm font-medium" style={{ color: "#6b7fa3" }}>{greeting()},</p>
          <h1 className="text-lg sm:text-xl lg:text-2xl font-bold capitalize" style={{ color: "#1a2744" }}>{firstName}</h1>
          <p className="text-xs sm:text-sm mt-0.5 hidden sm:block" style={{ color: "#8c9bba" }}>
            Here&apos;s an overview of your support tickets.
          </p>
        </div>

        <a
          href="/tickets"
          className="inline-flex items-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl text-white text-xs sm:text-sm font-semibold transition-all duration-200 hover:scale-102 self-start sm:self-auto active:scale-95"
          style={{ background: "#0e12ffff", boxShadow: "0 4px 12px rgba(19, 34, 255, 0.25)" }}
        >
          <Plus size={14} />
          New Ticket
        </a>
      </div>

      {/* ── STAT CARDS ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 lg:gap-4 flex-shrink-0 stagger-children">
        {statCards.map(card => (
          <StatCard key={card.title} {...card} />
        ))}
      </div>

      {/* ── RECENT TICKETS — fills remaining space ── */}
      <div
        className="bg-white rounded-2xl overflow-hidden flex flex-col min-h-0 flex-1"
        style={{ border: "1px solid #e8ecf2" }}
      >
        <div className="flex items-center justify-between px-4 sm:px-5 py-3 sm:py-4 flex-shrink-0" style={{ borderBottom: "1px solid #f0f3f8" }}>
          <div>
            <h2 className="text-sm sm:text-base font-semibold" style={{ color: "#1a2744" }}>Recent Tickets</h2>
            <p className="text-[10px] sm:text-xs mt-0.5" style={{ color: "#8c9bba" }}>
              {tickets.length} total ticket{tickets.length !== 1 ? "s" : ""}
            </p>
          </div>
          <button
            className="flex items-center gap-1 text-[10px] sm:text-xs font-medium transition"
            style={{ color: "#2d4470" }}
            onClick={() => { }}
          >
            View all <ChevronRight size={12} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-1 sm:px-2 py-1">
          {refreshing ? (
            [...Array(3)].map((_, i) => <SkeletonRow key={i} />)
          ) : tickets.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-2 sm:gap-3">
              <div
                className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl flex items-center justify-center"
                style={{ background: "#f0f3f8" }}
              >
                <Ticket size={20} style={{ color: "#8c9bba" }} />
              </div>
              <p className="text-xs sm:text-sm font-medium" style={{ color: "#6b7fa3" }}>No tickets yet</p>
              <p className="text-[10px] sm:text-xs" style={{ color: "#8c9bba" }}>Create your first ticket to get started</p>
            </div>
          ) : (
            tickets.slice(0, 5).map(t => (
              <TicketRow key={t.id} id={t.id} title={t.title} status={t.status} date={t.created_at} />
            ))
          )}
        </div>
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────── */
/*  REQUESTS PAGE                               */
/* ──────────────────────────────────────────── */
function RequestsPage({ tickets, refreshing }: { tickets: TicketType[]; refreshing: boolean }) {
  const todayDate = new Date();

  const isCreatedToday = (dateString: string) => {
    const d = new Date(dateString);
    return (
      d.getDate() === todayDate.getDate() &&
      d.getMonth() === todayDate.getMonth() &&
      d.getFullYear() === todayDate.getFullYear()
    );
  };

  const currentRequests = tickets.filter(t => isCreatedToday(t.created_at));
  const pastRequests = tickets.filter(t => !isCreatedToday(t.created_at));

  return (
    <div className="animate-fade-in-up flex flex-col gap-4 sm:gap-6 h-full pb-8">
      <div className="flex-shrink-0">
        <h1 className="text-lg sm:text-xl lg:text-2xl font-bold" style={{ color: "#1a2744" }}>Requests</h1>
        <p className="text-xs sm:text-sm mt-1" style={{ color: "#8c9bba" }}>Manage and track your submitted service requests.</p>
      </div>

      <div className="flex-1 overflow-y-auto flex flex-col gap-6 pr-1">

        {/* CURRENT REQUESTS */}
        <section className="bg-white rounded-2xl overflow-hidden flex flex-col" style={{ border: "1px solid #e8ecf2" }}>
          <div className="px-4 sm:px-5 py-3 sm:py-4 flex-shrink-0" style={{ borderBottom: "1px solid #f0f3f8" }}>
            <h2 className="text-sm sm:text-base font-semibold" style={{ color: "#1a2744" }}>Current Requests</h2>
            <p className="text-[10px] sm:text-xs mt-0.5" style={{ color: "#8c9bba" }}>{currentRequests.length} active request(s)</p>
          </div>
          <div className="flex-col px-1 sm:px-2 py-1 max-h-[350px] overflow-y-auto">
            {refreshing ? (
              [...Array(2)].map((_, i) => <SkeletonRow key={i} />)
            ) : currentRequests.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 gap-3">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: "#f0f3f8" }}>
                  <ClipboardList size={22} style={{ color: "#8c9bba" }} />
                </div>
                <p className="text-sm font-medium" style={{ color: "#1a2744" }}>No current requests</p>
                <p className="text-xs text-center" style={{ color: "#8c9bba" }}>You don&apos;t have any active open tickets.</p>
              </div>
            ) : (
              currentRequests.map(t => (
                <TicketRow key={t.id} id={t.id} title={t.title} status={t.status} date={t.created_at} />
              ))
            )}
          </div>
        </section>

        {/* PAST REQUESTS */}
        <section className="bg-white rounded-2xl overflow-hidden flex flex-col" style={{ border: "1px solid #e8ecf2" }}>
          <div className="px-4 sm:px-5 py-3 sm:py-4 flex-shrink-0" style={{ borderBottom: "1px solid #f8f0f0ff", background: "#fbfcfd" }}>
            <h2 className="text-sm sm:text-base font-semibold" style={{ color: "#1a2744" }}>Past Requests</h2>
            <p className="text-[10px] sm:text-xs mt-0.5" style={{ color: "#8c9bba" }}>{pastRequests.length} past request(s)</p>
          </div>
          <div className="flex-col px-1 sm:px-2 py-1 max-h-[350px] overflow-y-auto">
            {refreshing ? (
              [...Array(2)].map((_, i) => <SkeletonRow key={i} />)
            ) : pastRequests.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 gap-3">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: "#f0f3f8" }}>
                  <CheckCircle2 size={22} style={{ color: "#8c9bba" }} />
                </div>
                <p className="text-sm font-medium" style={{ color: "#6b7fa3" }}>No past requests</p>
              </div>
            ) : (
              pastRequests.map(t => (
                <div key={t.id} className="opacity-80">
                  <TicketRow key={t.id} id={t.id} title={t.title} status={t.status} date={t.created_at} />
                </div>
              ))
            )}
          </div>
        </section>

      </div>
    </div>
  );
}




function TicketsPage({ tickets, refreshing }: { tickets: TicketType[]; refreshing: boolean }) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [dateFilter, setDateFilter] = useState("All Time");

  const filteredTickets = tickets.filter(t => {
    const matchesSearch = t.title.toLowerCase().includes(search.toLowerCase()) ||
      (t.description?.toLowerCase() || "").includes(search.toLowerCase());

    const matchesStatus = statusFilter === "All" || t.status === statusFilter;

    let matchesDate = true;
    const ticketDate = new Date(t.created_at);
    const now = new Date();

    if (dateFilter === "Today") {
      matchesDate = ticketDate.toDateString() === now.toDateString();
    } else if (dateFilter === "This Week") {
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      matchesDate = ticketDate >= weekAgo;
    } else if (dateFilter === "This Month") {
      matchesDate = ticketDate.getMonth() === now.getMonth() && ticketDate.getFullYear() === now.getFullYear();
    }

    return matchesSearch && matchesStatus && matchesDate;
  });

  return (
    <div className="animate-fade-in-up flex flex-col gap-4 sm:gap-6 h-full pb-10">
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 flex-shrink-0">
        <div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold" style={{ color: "#1a2744" }}>My Tickets</h1>
          <p className="text-sm sm:text-base mt-1" style={{ color: "#8c9bba" }}>
            Total Tickets: {tickets.length}
          </p>
        </div>

        <a
          href="/tickets"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-white text-sm font-semibold transition-all duration-200 hover:scale-102 active:scale-95 bg-[#0e12ffff] shadow-[0_4px_12px_rgba(19,34,255,0.25)]"
        >
          <Plus size={16} />
          New Ticket
        </a>
      </div>

      {/* SEARCH AND FILTERS BAR */}
      <div className="bg-white p-4 rounded-2xl border border-[#e8ecf2] shadow-sm flex flex-col lg:flex-row gap-4">
        {/* SEARCH */}
        <div className="relative flex-1">
          <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8c9bba]" />
          <input
            type="text"
            placeholder="Search by title or description..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-11 pr-4 py-2.5 bg-[#f8f9fc] border border-[#e8ecf2] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0e12ffff]/20 focus:bg-white transition-all"
          />
        </div>

        {/* FILTERS */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <Filter size={14} className="text-[#8c9bba]" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-[#f8f9fc] border border-[#e8ecf2] rounded-xl px-3 py-2 text-xs font-semibold text-[#1a2744] focus:outline-none"
            >
              <option value="All">All Status</option>
              <option value="Open">Open</option>
              <option value="In Progress">In Progress</option>
              <option value="Resolved">Resolved</option>
              <option value="Closed">Closed</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <Calendar size={14} className="text-[#8c9bba]" />
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="bg-[#f8f9fc] border border-[#e8ecf2] rounded-xl px-3 py-2 text-xs font-semibold text-[#1a2744] focus:outline-none"
            >
              <option value="All Time">All Time</option>
              <option value="Today">Today</option>
              <option value="This Week">This Week</option>
              <option value="This Month">This Month</option>
            </select>
          </div>

          {(search || statusFilter !== "All" || dateFilter !== "All Time") && (
            <button
              onClick={() => { setSearch(""); setStatusFilter("All"); setDateFilter("All Time"); }}
              className="text-xs font-bold text-[#e91e1eff] hover:underline"
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {/* TICKETS LIST */}
      <div
        className="bg-white rounded-[2rem] overflow-hidden flex flex-col min-h-[400px] flex-1 shadow-[0_10px_40px_-10px_rgba(26,39,68,0.05)] border border-[#e8ecf2]"
      >
        {filteredTickets.length === 0 ? (
          <div className="flex flex-col items-center justify-center flex-1 gap-4 p-10 text-center">
            <div className="w-20 h-20 rounded-3xl bg-[#f8f9fc] flex items-center justify-center">
              <Ticket size={40} className="text-[#8c9bba] opacity-50" />
            </div>
            <div>
              <p className="text-lg font-bold" style={{ color: "#1a2744" }}>No matches found</p>
              <p className="text-sm mt-1" style={{ color: "#6b7fa3" }}>Try adjusting your search or filters to find what you&apos;re looking for.</p>
            </div>
            <button
              onClick={() => { setSearch(""); setStatusFilter("All"); setDateFilter("All Time"); }}
              className="px-6 py-2 bg-[#f0f3f8] text-[#1a2744] rounded-xl text-sm font-bold hover:bg-[#e8ecf2] transition-all"
            >
              Clear all filters
            </button>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto p-4 lg:p-6 flex flex-col gap-4">
            <div className="hidden lg:grid grid-cols-12 px-6 py-3 text-[10px] font-bold uppercase tracking-wider text-[#8c9bba] border-b border-[#f0f3f8]">
              <div className="col-span-5">Ticket Info</div>
              <div className="col-span-2">Status</div>
              <div className="col-span-2 text-center">Request Type</div>
              <div className="col-span-3 text-right">Date Created</div>
            </div>
            <div className="flex flex-col gap-3">
              {refreshing ? (
                [...Array(4)].map((_, i) => <SkeletonCard key={i} />)
              ) : filteredTickets.map(t => (
                <TicketCard key={t.id} ticket={t} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function TicketCard({ ticket }: { ticket: TicketType }) {
  return (
    <Link
      href={`/tickets/${ticket.id}`}
      className="group block bg-white border border-[#e8ecf2] rounded-2xl p-4 lg:px-6 lg:py-4 hover:border-[#0e12ffff] hover:shadow-md transition-all duration-300 active:scale-[0.99]"
    >
      <div className="grid grid-cols-1 lg:grid-cols-12 items-center gap-4">
        <div className="lg:col-span-5 flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold text-[#8c9bba] bg-[#f8f9fc] px-2 py-0.5 rounded-md border border-[#e8ecf2]">
              ID- {ticket.id}
            </span>
            <h3 className="text-sm font-bold text-[#1a2744] group-hover:text-[#0e12ffff] transition-colors line-clamp-1">
              {ticket.title}
            </h3>
          </div>
          {ticket.description && (
            <p className="text-xs text-[#6b7fa3] line-clamp-1">
              Description: {ticket.description}
            </p>
          )}
        </div>

        <div className="lg:col-span-2 flex items-center -ml-3">
          <StatusBadge status={ticket.status} />
        </div>

        <div className="lg:col-span-2 flex items-center justify-center">
          <div className="flex items-center gap-2">
            <span className="lg:hidden text-[10px] font-bold text-[#8c9bba] uppercase">Type:</span>
            <span className="px-2.5 -ml-2 py-1 rounded-lg text-[10px] sm:text-[11px] font-bold uppercase tracking-wide bg-red-100 text-[#dc2626] border border-[#e8ecf2]">
              {ticket.request_type || "Incident"}
            </span>
          </div>
        </div>

        <div className="lg:col-span-3 flex items-center justify-end">
          <div className="flex flex-col items-end gap-1">
            <div className="flex items-center gap-2">
              <Calendar size={13} className="text-[#8c9bba]" />
              <span className="text-[11px] sm:text-xs font-semibold text-[#1a2744]">
                {new Date(ticket.created_at).toLocaleDateString(undefined, {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric'
                })}
              </span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}

/* ──────────────────────────────────────────── */
/*  PROFILE PAGE                                */
/* ──────────────────────────────────────────── */
function ProfilePage({ user, stats, onUpdate }: { user?: UserType; stats: StatsType; onUpdate: () => void }) {
  const [isEditing, setIsEditing] = useState(false);
  const [fullName, setFullName] = useState(user?.full_name || "");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const initials = user?.email?.charAt(0).toUpperCase() ?? "?";
  const joinedDate = user?.created_at ? new Date(user.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' }) : "Recently";

  // Sync state if user prop changes
  useEffect(() => {
    if (user?.full_name) setFullName(user.full_name);
  }, [user]);

  const handleUpdateProfile = async () => {
    try {
      setIsSubmitting(true);
      setStatusMsg(null);

      const { error: authError } = await supabase.auth.updateUser({
        data: { full_name: fullName }
      });

      if (authError) throw authError;

      // Update public.profiles table
      const { error: dbError } = await supabase
        .from("profiles")
        .update({ full_name: fullName })
        .eq("id", user?.id);

      if (dbError) throw dbError;

      await onUpdate();
      setStatusMsg({ type: "success", text: "Profile updated successfully!" });
      setIsEditing(false);
    } catch (err: any) {
      console.error("Update error:", err);
      setStatusMsg({ type: "error", text: err.message || "Failed to update profile" });
    } finally {
      setIsSubmitting(false);
      setTimeout(() => setStatusMsg(null), 3000);
    }
  };

  const handleResetPassword = async () => {
    if (!user?.email) return;
    try {
      setIsSubmitting(true);
      setStatusMsg(null);

      const { error } = await supabase.auth.resetPasswordForEmail(user.email);
      if (error) throw error;

      setStatusMsg({ type: "success", text: "Password reset link sent to your email!" });
    } catch (err: any) {
      console.error("Reset error:", err);
      setStatusMsg({ type: "error", text: err.message || "Failed to send reset link" });
    } finally {
      setIsSubmitting(false);
      setTimeout(() => setStatusMsg(null), 5000);
    }
  };

  const handleSignOutOthers = async () => {
    try {
      setIsSubmitting(true);
      setStatusMsg(null);

      const { error } = await supabase.auth.signOut({ scope: 'others' });
      if (error) throw error;

      setStatusMsg({ type: "success", text: "Successfully signed out of all other devices!" });
    } catch (err: any) {
      console.error("Sign out others error:", err);
      setStatusMsg({ type: "error", text: err.message || "Failed to sign out other devices" });
    } finally {
      setIsSubmitting(false);
      setTimeout(() => setStatusMsg(null), 5000);
    }
  };

  return (
    <div className="animate-fade-in-up flex flex-col gap-6 lg:gap-8 h-full pb-12">
      <div className="flex-shrink-0 flex items-center justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold" style={{ color: "#1a2744" }}>Profile Settings</h1>
          <p className="text-sm sm:text-base mt-2" style={{ color: "#8c9bba" }}>Manage your account identity and security.</p>
        </div>
        {statusMsg && (
          <div
            className={`px-4 py-2 rounded-xl text-xs font-bold animate-fade-in ${statusMsg.type === "success" ? "bg-emerald-50 text-emerald-600 border border-emerald-100" : "bg-red-50 text-red-600 border border-red-100"}`}
          >
            {statusMsg.text}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 lg:gap-8 items-start">

        {/* LEFT COLUMN: HERO + STATS */}
        <div className="xl:col-span-4 flex flex-col gap-6">
          <div className="bg-white rounded-[2.5rem] overflow-hidden shadow-[0_10px_40px_-10px_rgba(26,39,68,0.08)] border border-[#e8ecf2]">
            <div
              className="h-28 relative"
              style={{ backgroundImage: "linear-gradient(to bottom, #ff0000, #ff3d66, #ff75ad, #ffa6e0, #f8d1fc, #edcefd, #e1cbfe, #d3c8ff, #b39fff, #9175ff, #6949ff, #2c00ff)" }}
            >
              <div className="absolute inset-0 opacity-20" style={{ backgroundImage: "radial-gradient(circle at 2px 2px, white 1px, transparent 0)", backgroundSize: "20px 20px" }} />
            </div>

            <div className="px-6 pb-8 flex flex-col items-center text-center">
              <div className="-mt-14 relative group">
                <div className="absolute inset-0 rounded-[2rem] bg-gradient-to-tr from-[#dc2626] to-[#0e12ffff] animate-pulse blur-sm opacity-50 group-hover:opacity-80 transition-opacity" />
                <div
                  className="relative w-28 h-28 rounded-[2rem] bg-white p-1.5 shadow-xl"
                  style={{ border: "1px solid #e8ecf2" }}
                >
                  <div className="w-full h-full rounded-[1.6rem] bg-[#1a2744] flex items-center justify-center text-white text-3xl font-bold shadow-inner">
                    {initials}
                  </div>
                </div>
                <div className="absolute bottom-1 right-1 w-6 h-6 rounded-lg border-4 border-white shadow-lg bg-[#15eb39ff]" />
              </div>

              <div className="mt-5">
                <h2 className="text-xl font-bold capitalize" style={{ color: "#1a2744" }}>{fullName}</h2>
                <div className="flex items-center justify-center gap-1.5 mt-1.5">
                  <span className="text-xs font-bold text-white px-2 py-0.5 rounded-md bg-[#1a2744] uppercase tracking-wider">{user?.role || "USER"}</span>
                  <span className="text-xs font-medium text-[#8c9bba]">• Joined {joinedDate}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 w-full mt-8 p-1.5 bg-[#f8f9fc] rounded-[1.8rem]">
                <div className="bg-white p-4 rounded-[1.5rem] shadow-sm border border-[#eef1f6]">
                  <p className="text-[10px] font-bold text-[#8c9bba] uppercase tracking-widest">Tickets</p>
                  <p className="text-xl font-bold mt-1" style={{ color: "#1a2744" }}>{stats.closed + stats.open}</p>
                </div>
                <div className="bg-white p-4 rounded-[1.5rem] shadow-sm border border-[#eef1f6]">
                  <p className="text-[10px] font-bold text-[#8c9bba] uppercase tracking-widest">Active</p>
                  <p className="text-xl font-bold mt-1" style={{ color: "#dc2626" }}>{stats.open}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-[#e8ecf2] flex flex-col gap-4">
            <h3 className="text-xs font-bold uppercase tracking-widest text-[#8c9bba]">Quick Status</h3>
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-[#6b7fa3]">Email Verified</span>
                {user?.is_verified ? (
                  <CheckCircle2 size={16} className="text-emerald-500" />
                ) : (
                  <AlertCircle size={16} className="text-amber-500" />
                )}
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-[#6b7fa3]">Two-Factor Auth</span>
                <Lock size={16} className="text-[#8c9bba] opacity-40" />
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: DETAILS & SETTINGS */}
        <div className="xl:col-span-8 flex flex-col gap-6">

          <section className="bg-white rounded-[2.5rem] p-6 sm:p-8 shadow-sm border border-[#e8ecf2]">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-red-100 flex items-center justify-center text-red-600">
                  <UserCircle2 size={22} />
                </div>
                <h3 className="text-lg font-bold" style={{ color: "#1a2744" }}>Personal Information</h3>
              </div>
              {!isEditing ? (
                <button
                  onClick={() => setIsEditing(true)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-[#1a2744] hover:bg-red-100 border border-transparent hover:border-[#e8ecf2] transition-all"
                >
                  Edit Profile
                </button>
              ) : (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setIsEditing(false)}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-[#6b7fa3] hover:bg-gray-100 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleUpdateProfile}
                    disabled={isSubmitting}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-[#0e12ffff] active:scale-95 transition-all shadow-md disabled:opacity-50"
                  >
                    {isSubmitting ? "Saving..." : "Save Changes"}
                  </button>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 lg:gap-8">
              <ProfileItem icon={<Mail size={16} />} label="Email Address" value={user?.email} />
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2 text-[#8c9bba]">
                  <Settings size={16} />
                  <p className="text-[10px] font-bold uppercase tracking-widest">Full Name</p>
                </div>
                {isEditing ? (
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full text-sm font-semibold bg-white px-4 py-3 rounded-2xl border border-[#0e12ffff] outline-none shadow-sm focus:ring-4 focus:ring-[#0e12ffff]/5 transition-all"
                    style={{ color: "#1a2744" }}
                    placeholder="Enter your name"
                  />
                ) : (
                  <p className="text-sm font-semibold truncate bg-[#f8f9fc] px-4 py-3 rounded-2xl border border-[#eef1f6]" style={{ color: "#1a2744" }}>
                    {fullName || "Not Set"}
                  </p>
                )}
              </div>
              <ProfileItem icon={<CalendarDays size={16} />} label="Joined Date" value={joinedDate} />
              <ProfileItem icon={<Globe size={16} />} label="Country" value="Philippines" />
            </div>
          </section>

          <section className="bg-white rounded-[2.5rem] p-6 sm:p-8 shadow-sm border border-[#e8ecf2]">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-10 h-10 rounded-2xl bg-blue-100 flex items-center justify-center text-blue-600">
                <Shield size={22} />
              </div>
              <h3 className="text-lg font-bold" style={{ color: "#1a2744" }}>Account Security</h3>
            </div>

            <div className="flex flex-col gap-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-3xl bg-[#f8f9fc] border border-[#eef1f6]">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-[#1a2744] shadow-sm">
                    <Lock size={18} />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold" style={{ color: "#1a2744" }}>Change Password</h4>
                    <p className="text-xs text-[#8c9bba] mt-0.5">Keep your account secure with a strong password.</p>
                  </div>
                </div>
                <button
                  onClick={handleResetPassword}
                  disabled={isSubmitting}
                  className="px-5 py-2.5 rounded-xl bg-white text-xs font-bold text-[#1a2744] shadow-sm border border-[#eef1f6] transition-all hover:bg-gray-50 active:scale-95 disabled:opacity-50"
                >
                  {isSubmitting ? "Processing..." : "Reset Password"}
                </button>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-3xl bg-[#f8f9fc] border border-[#eef1f6]">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-[#1a2744] shadow-sm">
                    <Smartphone size={18} />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold" style={{ color: "#1a2744" }}>Sessions Management</h4>
                    <p className="text-xs text-[#8c9bba] mt-0.5">Control where you are logged in.</p>
                  </div>
                </div>
                <button
                  onClick={handleSignOutOthers}
                  disabled={isSubmitting}
                  className="px-5 py-2.5 rounded-xl bg-white text-xs font-bold text-[#1a2744] shadow-sm border border-[#eef1f6] transition-all hover:bg-gray-50 active:scale-95 disabled:opacity-50"
                >
                  {isSubmitting ? "Processing..." : "Sign Out Other Devices"}
                </button>
              </div>
            </div>
          </section>

        </div>
      </div>
    </div>
  );
}

function ProfileItem({ icon, label, value }: { icon: React.ReactNode; label: string; value?: string }) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2 text-[#8c9bba]">
        {icon}
        <p className="text-[10px] font-bold uppercase tracking-widest">{label}</p>
      </div>
      <p className="text-sm font-semibold truncate bg-[#f8f9fc] px-4 py-3 rounded-2xl border border-[#eef1f6]" style={{ color: "#1a2744" }}>
        {value || "Not Set"}
      </p>
    </div>
  );
}