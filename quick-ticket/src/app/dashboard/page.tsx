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
    initUser();
  }, []);

  const initUser = async () => {
    setLoading(true);

    const { data } = await supabase.auth.getUser();

    if (!data.user) {
      router.replace("/login");
      return;
    }

    setUser({ email: data.user.email });
    setLoading(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.replace("/login");
  };

  const refreshDashboard = async () => {
    setRefreshing(true);
    await initUser();
    setTimeout(() => setRefreshing(false), 500);
  };

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

          <ActionCard icon={<Plus />} title="Create Ticket" desc="Submit a new issue" />
          <ActionCard icon={<Ticket />} title="View Tickets" desc="Check status updates" />

        </div>

        {/* STATS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">

          <StatCard icon={<Ticket />} title="Total" value="128" />
          <StatCard icon={<AlertCircle />} title="Open" value="32" />
          <StatCard icon={<Clock />} title="In Progress" value="18" />
          <StatCard icon={<CheckCircle />} title="Resolved" value="78" />

        </div>

        {/* RECENT (IMPROVED) */}
        <div className="mt-8 bg-white/60 backdrop-blur-xl border border-gray-200 rounded-2xl p-5">

          <h3 className="font-semibold mb-4">Recent Tickets</h3>

          <div className="space-y-3">

            <TicketRow status="Open" title="WiFi not working in Lab 2" />
            <TicketRow status="In Progress" title="Printer issue in Office" />
            <TicketRow status="Resolved" title="Email access restored" />

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