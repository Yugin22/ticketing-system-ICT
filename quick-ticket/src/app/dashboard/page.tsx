"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter, usePathname } from "next/navigation";
import {
  House,
  Ticket,
  Clock,
  CheckCircle,
  AlertCircle,
  Menu,
  X,
  LogOut,
  User,
  Plus,
  RefreshCcw,
  ClipboardList
} from "lucide-react";

type UserType = {
  email?: string;
  avatar_url?: string;
};

export default function DashboardPage() {
  const router = useRouter();
  const pathname = usePathname();

  const [user, setUser] = useState<UserType | null>(null);
  const [loading, setLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [view, setView] = useState("home");

  useEffect(() => {
    let channel: any;

    const setup = async () => {
      const { data } = await supabase.auth.getUser();

      if (!data.user) {
        router.replace("/login");
        return; 
      }

      await initUser();

      // ✅ prevent duplicate subscription in React Strict Mode
      supabase.removeChannel(supabase.channel("tickets-changes"));

      channel = supabase
        .channel("tickets-changes")
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "tickets",
          },
          (payload) => {
            console.log("Realtime update:", payload);
            initUser();
          }
        )
        .subscribe();
    };

    setup();

    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, []);

const initUser = async () => {
  try {
    setLoading(true);

    const { data, error } = await supabase.auth.getUser();

    if (error || !data.user) {
      router.replace("/login");
      return;
    }

    const currentUser = data.user;

    // OPTIONAL: if you store avatar in user_metadata
    const avatar = currentUser.user_metadata?.avatar_url || null;

    setUser({
      email: currentUser.email,
      avatar_url: avatar,
    });

    // ✅ Fetch tickets (ONLY what you need)
    const { data: ticketData, error: ticketError } = await supabase
      .from("tickets")
      .select("id, title, status, created_at")
      .eq("user_id", currentUser.id)
      .order("created_at", { ascending: false });

    if (ticketError) {
      console.error("Ticket fetch error:", ticketError);
      return;
    }

    const tickets = ticketData || [];

    setTickets(tickets);

    const statsData = {
      closed: tickets.length, // ALL tickets in system
      open: tickets.filter(t => t.status === "Open").length,
      inProgress: tickets.filter(t => t.status === "Work in Progress" || t.status === "In Progress").length,
      onHold: tickets.filter(t => t.status === "On Hold").length,
      resolved: tickets.filter(t => t.status === "Resolved").length,
    };

    setStats(statsData);

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

  const [stats, setStats] = useState({
    closed: 0,
    open: 0,
    inProgress: 0,
    onHold: 0,
    resolved: 0,
  });

  const [tickets, setTickets] = useState<any[]>([]);

  /* ================= LOADING SKELETON ================= */
  if (loading) {
    return (
      <div className="min-h-screen flex bg-gradient-to-br from-gray-100 via-white to-gray-200 p-4 sm:p-6 md:p-8">
        <aside className="hidden md:flex w-64 flex-col p-6 space-y-4">
          <div className="h-6 w-40 bg-gray-200 rounded animate-pulse" />
          <div className="space-y-3 mt-6">
            <div className="h-10 bg-gray-200 rounded-xl animate-pulse" />
            <div className="h-10 bg-gray-200 rounded-xl animate-pulse" />
            <div className="h-10 bg-gray-200 rounded-xl animate-pulse" />
          </div>
        </aside>

        <main className="flex-1 space-y-6">
          <div className="flex justify-between items-center mb-6">
            <div className="space-y-2">
              <div className="h-6 w-40 bg-gray-200 rounded animate-pulse" />
              <div className="h-4 w-60 bg-gray-200 rounded animate-pulse" />
            </div>

            <div className="hidden md:flex gap-2">
              <div className="h-9 w-24 bg-gray-200 rounded-lg animate-pulse" />
              <div className="h-9 w-24 bg-gray-200 rounded-lg animate-pulse" />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="h-24 bg-gray-200 rounded-2xl animate-pulse" />
            <div className="h-24 bg-gray-200 rounded-2xl animate-pulse" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="h-24 bg-gray-200 rounded-2xl animate-pulse" />
            <div className="h-24 bg-gray-200 rounded-2xl animate-pulse" />
            <div className="h-24 bg-gray-200 rounded-2xl animate-pulse" />
            <div className="h-24 bg-gray-200 rounded-2xl animate-pulse" />
          </div>

          <div className="mt-8 p-5 bg-gray-200 rounded-2xl animate-pulse space-y-4">
            <div className="h-5 w-40 bg-gray-300 rounded" />
            <div className="h-4 w-full bg-gray-300 rounded" />
            <div className="h-4 w-full bg-gray-300 rounded" />
          </div>
        </main>
      </div>
    );
  }

  /* ================= MAIN ================= */
  return (
    <div className="min-h-screen flex bg-gradient-to-br from-gray-100 via-white to-gray-200">

      {/* GLOW */}
      <div className="absolute w-[500px] h-[500px] bg-black/5 blur-3xl rounded-full -z-10 top-10 left-10" />

      <aside className="hidden md:flex w-20 flex-col justify-between py-6 bg-[#0f172a] text-gray-300 border-r border-gray-800">

      {/* TOP SECTION */}
      <div className="flex flex-col items-center">

        {/* AVATAR */}
        <div className="mb-10 relative group cursor-pointer" title={user?.email}>
          {user?.avatar_url ? (
            <div className="relative">
              <img
                src={user.avatar_url}
                className="w-11 h-11 rounded-full object-cover border border-gray-600 group-hover:scale-105 transition"
              />
              <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border border-gray-900" />
            </div>
          ) : (
            <div className="relative w-11 h-11">
              <div className="w-full h-full flex items-center justify-center rounded-full bg-gray-600 text-white text-sm font-semibold">
                {user?.email?.charAt(0).toUpperCase()}
              </div>
              <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border border-gray-900" />
            </div>
          )}
        </div>

        {/* NAV */}
        <nav className="flex flex-col items-center gap-6">

          <SideIcon icon={<House size={18} />} label="Home" active={view === "home"} onClick={() => setView("home")} />

          <SideIcon icon={<ClipboardList size={18} />} label="Requests" active={view === "requests"} onClick={() => setView("requests")} />

          <SideIcon icon={<AlertCircle size={18} />} label="Reports" active={view === "reports"} onClick={() => setView("reports")} />

          <SideIcon icon={<Ticket size={18} />} label="Tickets" active={view === "tickets"} onClick={() => setView("tickets")} />

          <SideIcon icon={<User size={18} />} label="Profile" active={view === "profile"} onClick={() => setView("profile")} />
          
        </nav>
      </div>

      {/* BOTTOM SECTION */}
      <div className="flex flex-col items-center gap-2">
        <button
          onClick={handleLogout}
          className="p-3 rounded-xl text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition"
        >
          <LogOut size={18} />
        </button>
        <span className="text-[10px] text-gray-500">Logout</span>
      </div>

    </aside>

      {/* MOBILE MENU */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 bg-black/40 z-50 md:hidden">
          <div className="w-72 h-full bg-white p-6 animate-in slide-in-from-left">

            <div className="flex justify-between items-center mb-6">
              <h2 className="font-semibold">Menu</h2>
              <button onClick={() => setMobileMenuOpen(false)}>
                <X />
              </button>
            </div>

            <div className="flex flex-col gap-2 text-sm">

              <NavItem icon={<House size={16} />} label="Dashboard" active={view === "home"} onClick={() => setView("home")} />

              <NavItem icon={<Ticket size={16} />} label="Tickets" active={view === "tickets"} onClick={() => setView("tickets")} />

              <NavItem icon={<User size={16} />} label="Profile" active={view === "profile"} onClick={() => setView("profile")} />
              
            </div>
          </div>
        </div>
      )}

<main className="flex-1 p-6 sm:p-6 md:p-10 relative">
  
  {view === "home" && (
    <DashboardHome
      user={user}
      stats={stats}
      tickets={tickets}
    />
  )}

  {view === "requests" && <RequestsPage />}

  {view === "reports" && <ReportsPage tickets={tickets ?? []} />}

  {view === "tickets" && <TicketsPage tickets={tickets ?? []} />}

  {view === "profile" && <ProfilePage user={user ?? undefined} />}

</main>
    </div>
  );
}

/* ================= COMPONENTS ================= */

function SideIcon({ icon, label, active, onClick }: any) {
  return (
    <button
      onClick={onClick}
      className="relative flex flex-col items-center gap-1 group"
    >
      {/* ACTIVE LEFT BAR */}
      {active && (
        <span className="absolute -left-3 w-0.5 h-11 bg-white rounded-r-full" />
      )}

      {/* ICON */}
      <div
        className={`p-3 rounded-xl transition-all duration-200
        ${
          active
            ? "bg-white text-black shadow-md scale-105"
            : "text-gray-400 group-hover:text-white group-hover:bg-gray-700/60 group-hover:shadow-lg"
        }`}
      >
        {icon}
      </div>

      {/* LABEL */}
      <span
        className={`text-[10px] transition-all
        ${
          active
            ? "text-white font-medium"
            : "text-gray-500 group-hover:text-gray-200"
        }`}
      >
        {label}
      </span>
    </button>
  );
}

function NavItem({ icon, label, active }: any) {
  return (
    <button
      className={`flex items-center gap-2 p-2 rounded-lg transition text-sm
      ${active ? "bg-black text-white" : "hover:bg-gray-100 text-gray-700"}`}
    >
      {icon}
      {label}
    </button>
  );
}

function StatCard({ icon, title, value }: any) {
  return (
    <div className="bg-white/60 backdrop-blur-xl border border-gray-200 rounded-2xl p-5 hover:shadow-md transition">
      <div className="flex items-center gap-2 text-gray-500 text-sm">
        {icon}
        {title}
      </div>
      <div className="text-2xl font-semibold mt-2">{value}</div>
    </div>
  );
}

function ActionCard({ icon, title, desc }: any) {
  return (
    <div className="bg-white/60 backdrop-blur-xl border border-gray-200 rounded-2xl p-5 hover:scale-[1.02] transition cursor-pointer">
      <div className="flex items-center gap-2 font-medium">
        {icon}
        {title}
      </div>
      <p className="text-xs text-gray-500 mt-1">{desc}</p>
    </div>
  );
}

/* ================= IMPROVED RECENT TICKETS ================= */
function TicketRow({ title, status }: any) {
  const color =
    status === "Open"
      ? "bg-red-100 text-red-600"
      : status === "In Progress"
      ? "bg-yellow-100 text-yellow-700"
      : "bg-green-100 text-green-700";

  return (
    <div className="flex justify-between items-center p-4 rounded-xl bg-white/40 hover:bg-white/60 transition border border-gray-100">

      <span className="text-sm">{title}</span>

      <span className={`text-xs font-medium px-2 py-1 rounded-full ${color}`}>
        {status}
      </span>

    </div>
  );
}

/* ================= PAGE COMPONENTS ================= */

function DashboardHome({ user, stats, tickets }: any) {
  const safeStats = stats ?? {
    closed: 0,
    open: 0,
    inProgress: 0,
    onHold: 0,
    resolved: 0,
  };

  const safeTickets = tickets ?? [];

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">
        Welcome, {user?.email}
      </h1>

      {/* STATS */}
      <div className="grid grid-cols-5 gap-4 mb-6">
        <StatCard title="Open" value={safeStats.open} />
        <StatCard title="Work in Progress" value={safeStats.inProgress} />
        <StatCard title="On Hold" value={safeStats.onHold} />
        <StatCard title="Resolved" value={safeStats.resolved} />
        <StatCard title="Closed" value={safeStats.closed} />
      </div>

      {/* RECENT TICKETS */}
      <div className="bg-white/60 p-4 rounded-xl border">
        <h2 className="font-semibold mb-3">Recent Tickets</h2>

        {safeTickets.length === 0 ? (
          <p className="text-gray-500 text-sm">No tickets yet</p>
        ) : (
          safeTickets.slice(0, 5).map((t: any) => (
            <TicketRow
              key={t.id}
              title={t.title}
              status={t.status}
            />
          ))
        )}
      </div>
    </div>
  );
}

function RequestsPage() {
  return (
    <div>
      <h1 className="text-xl font-bold">Requests</h1>
      <p className="text-gray-500 text-sm mt-2">
        This is where user requests will appear.
      </p>
    </div>
  );
}

function ReportsPage({ tickets }: any) {
  return (
    <div>
      <h1 className="text-xl font-bold">Reports</h1>

      <p className="text-gray-500 text-sm mt-2">
        Total tickets: {tickets.length}
      </p>
    </div>
  );
}

function TicketsPage({ tickets }: any) {
  return (
    <div>
      <h1 className="text-xl font-bold mb-3">All Tickets</h1>

      <div className="space-y-2">
        {tickets.map((t: any) => (
          <TicketRow
            key={t.id}
            title={t.title}
            status={t.status}
          />
        ))}
      </div>
    </div>
  );
}

function ProfilePage({ user }: any) {
  return (
    <div>
      <h1 className="text-xl font-bold">Profile</h1>

      <div className="mt-3 bg-white p-4 rounded-xl">
        <p>Email: {user?.email}</p>
      </div>
    </div>
  );
}