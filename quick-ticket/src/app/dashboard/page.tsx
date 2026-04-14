"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter, usePathname } from "next/navigation";
import {
  LayoutDashboard,
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
} from "lucide-react";

type UserType = {
  email?: string;
};

export default function DashboardPage() {
  const router = useRouter();
  const pathname = usePathname();

  const [user, setUser] = useState<UserType | null>(null);
  const [loading, setLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

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

    setUser({ email: currentUser.email });

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

    // ✅ Compute stats
    const statsData = {
      total: tickets.length,
      open: tickets.filter(t => t.status === "Open").length,
      inProgress: tickets.filter(t => t.status === "In Progress").length,
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
  total: 0,
  open: 0,
  inProgress: 0,
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

      {/* SIDEBAR */}
      <aside className="hidden md:flex w-64 flex-col p-6 bg-white/60 backdrop-blur-xl border-r border-gray-200">

        <h1 className="text-2xl font-semibold mb-8 tracking-tight">
          QuickTicket
        </h1>

        <nav className="flex flex-col gap-2 text-sm">
          <NavItem icon={<LayoutDashboard size={16} />} label="Dashboard" active />
          <NavItem icon={<Ticket size={16} />} label="Tickets" />
          <NavItem icon={<User size={16} />} label="Profile" />
        </nav>
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
              <NavItem icon={<LayoutDashboard size={16} />} label="Dashboard" active />
              <NavItem icon={<Ticket size={16} />} label="Tickets" />
              <NavItem icon={<User size={16} />} label="Profile" />
            </div>
          </div>
        </div>
      )}

      {/* MAIN */}
      <main className="flex-1 p-4 sm:p-6 md:p-8">

        {/* TOP BAR (IMPROVED) */}
        <div className="flex justify-between items-center mb-6">

          <button
            className="md:hidden p-2 rounded-lg bg-white/60 border border-gray-200"
            onClick={() => setMobileMenuOpen(true)}
          >
            <Menu size={18} />
          </button>

          <div>
            <h2 className="text-xl sm:text-2xl font-semibold">
              Dashboard
            </h2>

            <p className="text-xs sm:text-sm text-gray-500">
              Welcome back, {user?.email}
            </p>
          </div>

          {/* CLEAN ACTION BUTTONS */}
          <div className="flex items-center gap-2">

            <button
              onClick={refreshDashboard}
              className="flex items-center gap-2 text-sm px-3 py-2 rounded-xl bg-white/70 border hover:bg-white transition"
            >
              <RefreshCcw
                size={14}
                className={refreshing ? "animate-spin" : ""}
              />
              Refresh
            </button>

            <button
              onClick={handleLogout}
              className="flex items-center gap-2 text-sm px-3 py-2 rounded-xl bg-black text-white hover:opacity-90 transition"
            >
              <LogOut size={14} />
              Logout
            </button>

          </div>
        </div>

        {/* QUICK ACTIONS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">

          <div onClick={() => router.push("/create-ticket")}>
            <ActionCard
              icon={<Plus />}
              title="Create Ticket"
              desc="Submit a new issue"
            />
          </div>
          <ActionCard icon={<Ticket />} title="View Tickets" desc="Check status updates" />

        </div>

        {/* STATS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">

        <StatCard icon={<Ticket />} title="Total" value={stats.total} />
        <StatCard icon={<AlertCircle />} title="Open" value={stats.open} />
        <StatCard icon={<Clock />} title="In Progress" value={stats.inProgress} />
        <StatCard icon={<CheckCircle />} title="Resolved" value={stats.resolved} />

        </div>

        <div className="mt-8 bg-white/60 backdrop-blur-xl border border-gray-200 rounded-2xl p-5">

        {/* HEADER */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="ml-1 font-semibold">Recent Tickets</h3>

          <button
            onClick={() => router.push("/tickets")}
            className="text-xs mr-2.5 text-gray-600 hover:text-black transition"
          >
            View all
          </button>
        </div>

        <div className="space-y-2">

          {tickets.length === 0 ? (
            <div className="text-center py-10">
              <p className="text-sm text-gray-500">No tickets yet</p>
              <p className="text-xs text-gray-400 mt-1">
                Create your first ticket to get started
              </p>
            </div>
          ) : (
            tickets.slice(0, 5).map((t) => {

              const statusStyle =
                t.status === "Open"
                  ? "bg-red-100 text-red-600"
                  : t.status === "In Progress"
                  ? "bg-yellow-100 text-yellow-700"
                  : "bg-green-100 text-green-700";

              const timeAgo = new Date(t.created_at).toLocaleDateString(undefined, {
                month: "short",
                day: "numeric",
              });

              return (
                <div
                  key={t.id}
                  onClick={() => router.push(`/tickets/${t.id}`)}
                  className="group flex items-center justify-between p-4 rounded-xl bg-white/40 hover:bg-white/70 transition cursor-pointer border border-gray-100"
                >

                  {/* LEFT */}
                  <div className="flex flex-col gap-1">

                    <div className="flex items-center gap-2">

                      {/* small status dot */}
                      <span
                        className={`w-2 h-2 rounded-full ${
                          t.status === "Open"
                            ? "bg-red-500"
                            : t.status === "In Progress"
                            ? "bg-yellow-500"
                            : "bg-green-500"
                        }`}
                      />

                      <span className="text-sm font-medium text-gray-800 group-hover:text-black">
                        {t.title}
                      </span>

                    </div>

                    <div className="text-xs text-gray-400 flex items-center gap-2">
                      <span>Created {timeAgo}</span>
                      <span>•</span>
                      <span>ID: #{t.id.slice(0, 6)}</span>
                    </div>

                  </div>

                  {/* RIGHT */}
                  <div className="flex items-center gap-2">

                    <span className={`text-xs font-medium px-3 py-1 rounded-full ${statusStyle}`}>
                      {t.status}
                    </span>

                  </div>

                </div>
              );
            })
          )}

        </div>
      </div>

      </main>
    </div>
  );
}

/* ================= COMPONENTS ================= */

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