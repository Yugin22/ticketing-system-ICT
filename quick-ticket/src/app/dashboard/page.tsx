"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
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
} from "lucide-react";

type UserType = {
  email?: string;
  avatar_url?: string;
};

type StatsType = {
  closed: number;
  open: number;
  inProgress: number;
  onHold: number;
  resolved: number;
};

type TicketType = {
  id: string;
  title: string;
  description?: string;
  status: string;
  priority?: "Low" | "Medium" | "High" | "Urgent";
  created_at: string;
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
      const avatar = currentUser.user_metadata?.avatar_url || null;
      setUser({ email: currentUser.email, avatar_url: avatar });

      const { data: ticketData, error: ticketError } = await supabase
        .from("tickets")
        .select("id, title, status, created_at, description")
        .eq("user_id", currentUser.id)
        .order("created_at", { ascending: false });

      if (ticketError) { console.error("Ticket fetch error:", ticketError); return; }
      const tix = ticketData || [];
      setTickets(tix);
      setStats({
        closed: tix.length,
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

        {/* Bottom: Avatar + Logout */}
        <div className="flex flex-col items-center gap-5">
          <button
            className="relative w-10 h-10 rounded-full cursor-pointer transition"
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
              className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full"
              style={{ background: "#15eb39ff", border: "2px solid #1a2744" }}
            />
          </button>

          <button
            onClick={() => setShowLogoutConfirm(true)}
            title="Logout"
            className="p-3 rounded-xl transition-all duration-200"
            style={{ color: "#6b7fa3" }}
            onMouseEnter={e => { e.currentTarget.style.color = "#dc2626"; e.currentTarget.style.background = "rgba(220,38,38,0.1)"; }}
            onMouseLeave={e => { e.currentTarget.style.color = "#6b7fa3"; e.currentTarget.style.background = "transparent"; }}
          >
            <LogOut size={16} />
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

            <button className="relative p-2 rounded-xl transition" style={{ color: "#1a2744" }}>
              <Bell size={16} />
              {stats.open > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full" style={{ background: "#dc2626" }} />
              )}
            </button>

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
          </div>
        </header>

        {/* ── PAGE CONTENT — scrollable area within remaining height ── */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8" style={{ background: "#f8f9fc" }}>
          {view === "home" && <DashboardHome user={user} stats={stats} tickets={tickets} />}
          {view === "requests" && <RequestsPage tickets={tickets} />}
          {view === "tickets" && <TicketsPage tickets={tickets} />}
          {view === "profile" && <ProfilePage user={user ?? undefined} />}
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
    "Open": { bg: "#fef2f2", text: "#dc2626", border: "#fecaca" },
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
function TicketRow({ title, status, date }: { title: string; status: string; date?: string }) {
  return (
    <div
      className="flex items-center justify-between gap-2 sm:gap-4 px-3 sm:px-4 py-2.5 sm:py-3.5 rounded-xl transition-colors duration-150"
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
    </div>
  );
}

/* ──────────────────────────────────────────── */
/*  DASHBOARD HOME VIEW                         */
/* ──────────────────────────────────────────── */
function DashboardHome({ user, stats, tickets }: { user: UserType | null; stats: StatsType; tickets: TicketType[] }) {
  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 18) return "Good afternoon";
    return "Good evening";
  };
  const firstName = user?.email?.split("@")[0] ?? "there";

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
          <h1 className="text-lg sm:text-xl lg:text-2xl font-bold capitalize" style={{ color: "#1a2744" }}>{firstName} </h1>
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
          {tickets.length === 0 ? (
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
              <TicketRow key={t.id} title={t.title} status={t.status} date={t.created_at} />
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
function RequestsPage({ tickets }: { tickets: TicketType[] }) {
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
            {currentRequests.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 gap-3">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: "#f0f3f8" }}>
                  <ClipboardList size={22} style={{ color: "#8c9bba" }} />
                </div>
                <p className="text-sm font-medium" style={{ color: "#1a2744" }}>No current requests</p>
                <p className="text-xs text-center" style={{ color: "#8c9bba" }}>You don&apos;t have any active open tickets.</p>
              </div>
            ) : (
              currentRequests.map(t => (
                <TicketRow key={t.id} title={t.title} status={t.status} date={t.created_at} />
              ))
            )}
          </div>
        </section>

        {/* PAST REQUESTS */}
        <section className="bg-white rounded-2xl overflow-hidden flex flex-col" style={{ border: "1px solid #e8ecf2" }}>
          <div className="px-4 sm:px-5 py-3 sm:py-4 flex-shrink-0" style={{ borderBottom: "1px solid #f8f0f0ff", background: "#fbfcfd" }}>
            <h2 className="text-sm sm:text-base font-semibold" style={{ color: "#1a2744" }}>Past Requests</h2>
            <p className="text-[10px] sm:text-xs mt-0.5" style={{ color: "#8c9bba" }}>{pastRequests.length} resolved request(s)</p>
          </div>
          <div className="flex-col px-1 sm:px-2 py-1 max-h-[350px] overflow-y-auto">
            {pastRequests.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 gap-3">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: "#f0f3f8" }}>
                  <CheckCircle2 size={22} style={{ color: "#8c9bba" }} />
                </div>
                <p className="text-sm font-medium" style={{ color: "#6b7fa3" }}>No past requests</p>
              </div>
            ) : (
              pastRequests.map(t => (
                <div key={t.id} className="opacity-80">
                  <TicketRow title={t.title} status={t.status} date={t.created_at} />
                </div>
              ))
            )}
          </div>
        </section>

      </div>
    </div>
  );
}




function TicketsPage({ tickets }: { tickets: TicketType[] }) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [priorityFilter, setPriorityFilter] = useState("All");
  const [dateFilter, setDateFilter] = useState("All Time");

  const filteredTickets = tickets.filter(t => {
    const matchesSearch = t.title.toLowerCase().includes(search.toLowerCase()) ||
      (t.description?.toLowerCase() || "").includes(search.toLowerCase());

    const matchesStatus = statusFilter === "All" || t.status === statusFilter;

    // Fallback for priority if it's undefined
    const priority = t.priority || "Medium";
    const matchesPriority = priorityFilter === "All" || priority === priorityFilter;

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

    return matchesSearch && matchesStatus && matchesPriority && matchesDate;
  });

  return (
    <div className="animate-fade-in-up flex flex-col gap-4 sm:gap-6 h-full pb-10">
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 flex-shrink-0">
        <div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold" style={{ color: "#1a2744" }}>My Tickets</h1>
          <p className="text-sm sm:text-base mt-1" style={{ color: "#8c9bba" }}>
            Viewing {filteredTickets.length} of {tickets.length} total tickets
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
            <AlertTriangle size={14} className="text-[#8c9bba]" />
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="bg-[#f8f9fc] border border-[#e8ecf2] rounded-xl px-3 py-2 text-xs font-semibold text-[#1a2744] focus:outline-none"
            >
              <option value="All">All Priority</option>
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
              <option value="Urgent">Urgent</option>
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

          {(search || statusFilter !== "All" || priorityFilter !== "All" || dateFilter !== "All Time") && (
            <button
              onClick={() => { setSearch(""); setStatusFilter("All"); setPriorityFilter("All"); setDateFilter("All Time"); }}
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
              onClick={() => { setSearch(""); setStatusFilter("All"); setPriorityFilter("All"); setDateFilter("All Time"); }}
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
              <div className="col-span-2">Priority</div>
              <div className="col-span-3">Created Date</div>
            </div>
            <div className="flex flex-col gap-3">
              {filteredTickets.map(t => (
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
  const priorityColors = {
    "Low": { bg: "#f0fdf4", text: "#16a34a" },
    "Medium": { bg: "#fefce8", text: "#ca8a04" },
    "High": { bg: "#fff7ed", text: "#ea580c" },
    "Urgent": { bg: "#fef2f2", text: "#dc2626" },
  };

  const priority = ticket.priority || "Medium";
  const colors = priorityColors[priority];

  return (
    <div className="group bg-white border border-[#e8ecf2] rounded-2xl p-4 lg:px-6 lg:py-4 hover:border-[#0e12ffff] hover:shadow-md transition-all duration-300">
      <div className="grid grid-cols-1 lg:grid-cols-12 items-center gap-4">
        <div className="lg:col-span-5 flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-[#1a2744] group-hover:text-[#0e12ffff] transition-colors line-clamp-1">
              {ticket.title}
            </h3>
            <span className="text-[10px] font-medium text-[#8c9bba] bg-[#f8f9fc] px-2 py-0.5 rounded-md">
              #{ticket.id.slice(0, 6)}
            </span>
          </div>
          {ticket.description && (
            <p className="text-xs text-[#6b7fa3] line-clamp-1">
              {ticket.description}
            </p>
          )}
        </div>

        <div className="lg:col-span-2 flex items-center">
          <StatusBadge status={ticket.status} />
        </div>

        <div className="lg:col-span-2 flex items-center gap-2">
          <span className="lg:hidden text-[10px] font-bold text-[#8c9bba] uppercase">Priority:</span>
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wide" style={{ background: colors.bg, color: colors.text }}>
            <div className="w-1.5 h-1.5 rounded-full" style={{ background: colors.text }} />
            {priority}
          </div>
        </div>

        <div className="lg:col-span-3 flex items-center gap-2">
          <Calendar size={14} className="text-[#8c9bba]" />
          <span className="text-xs font-medium text-[#6b7fa3]">
            {new Date(ticket.created_at).toLocaleDateString(undefined, {
              year: 'numeric',
              month: 'short',
              day: 'numeric'
            })}
          </span>
        </div>
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────── */
/*  PROFILE PAGE                                */
/* ──────────────────────────────────────────── */
function ProfilePage({ user }: { user?: UserType }) {
  const initials = user?.email?.charAt(0).toUpperCase() ?? "?";
  return (
    <div className="animate-fade-in-up flex flex-col gap-4 sm:gap-6 h-full max-w-xl">
      <div className="flex-shrink-0">
        <h1 className="text-lg sm:text-xl lg:text-2xl font-bold" style={{ color: "#1a2744" }}>Profile</h1>
        <p className="text-xs sm:text-sm mt-1" style={{ color: "#8c9bba" }}>Your account information.</p>
      </div>

      <div className="bg-white rounded-2xl overflow-hidden" style={{ border: "1px solid #e8ecf2" }}>
        {/* Banner */}
        <div className="h-20 sm:h-24" style={{ background: "linear-gradient(135deg, #1a2744 0%, #2d4470 100%)" }} />

        {/* Avatar */}
        <div className="-mt-8 sm:-mt-10 px-4 sm:px-6 pb-4 sm:pb-6">
          <div
            className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl flex items-center justify-center"
            style={{ background: "#dc2626", border: "4px solid #ffffff", boxShadow: "0 2px 8px rgba(0,0,0,0.1)" }}
          >
            <span className="text-xl sm:text-2xl font-bold text-white">{initials}</span>
          </div>

          <h2 className="mt-2 sm:mt-3 text-base sm:text-lg font-bold capitalize" style={{ color: "#1a2744" }}>{user?.email?.split("@")[0]}</h2>
          <p className="text-xs sm:text-sm" style={{ color: "#6b7fa3" }}>{user?.email}</p>

          <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 grid grid-cols-2 gap-3 sm:gap-4" style={{ borderTop: "1px solid #e8ecf2" }}>
            <div>
              <p className="text-[10px] sm:text-xs uppercase tracking-wide font-medium" style={{ color: "#8c9bba" }}>Email</p>
              <p className="text-xs sm:text-sm font-medium mt-1 break-all" style={{ color: "#1a2744" }}>{user?.email ?? "—"}</p>
            </div>
            <div>
              <p className="text-[10px] sm:text-xs uppercase tracking-wide font-medium" style={{ color: "#8c9bba" }}>Role</p>
              <p className="text-xs sm:text-sm font-medium mt-1" style={{ color: "#1a2744" }}>User</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}