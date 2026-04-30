"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import {
  LayoutDashboard,
  Ticket,
  Clock,
  CheckCircle2,
  AlertCircle,
  LogOut,
  Search,
  Filter,
  RefreshCcw,
  Calendar,
  MoreVertical,
  ChevronRight,
  CircleDot,
  PauseCircle,
  HelpCircle,
  Shield,
  Activity,
  Menu,
  X
} from "lucide-react";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

/* ---------------- TYPES ---------------- */

type TicketType = {
  id: string | number;
  title: string;
  status: string;
  priority: string;
  request_type?: string;
  category?: string;
  mode?: string | null;
  created_at: string;
  user_id: string;
  assigned_to: string | null;
  profiles?: { full_name: string | null; email: string; role: string } | null;
  assignee?: { full_name: string | null; email: string; role: string } | null;
};

/* ---------------- CONSTANTS ---------------- */

const COLORS = ["#1a2744", "#0e12ffff", "#e91e1eff", "#DDD9F9", "#8c9bba"];
const STATUS_COLORS: Record<string, string> = {
  "Open": "#e91e1eff",
  "Work in Progress": "#0e12ffff",
  "In Progress": "#0e12ffff",
  "On Hold": "#8c9bba",
  "Resolved": "#15eb39",
  "Closed": "#1a2744",
};

const THREE_DAYS_MS = 3 * 24 * 60 * 60 * 1000;
const TWO_DAYS_MS = 2 * 24 * 60 * 60 * 1000;

/* ---------------- PAGE ---------------- */

export default function AdminDashboard() {
  const router = useRouter();

  const [tickets, setTickets] = useState<TicketType[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const [now, setNow] = useState<Date | null>(null);

  // Set 'now' only on client to prevent hydration mismatch
  useEffect(() => {
    setNow(new Date());
    // Update every minute for real-time SLA accuracy
    const interval = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(interval);
  }, []);

  const currentMonth = (now || new Date()).getMonth();
  const currentYear = (now || new Date()).getFullYear();

  /* ---------------- AUTH GUARD ---------------- */

  useEffect(() => {
    const checkUserAndRole = async () => {
      const { data: authData } = await supabase.auth.getUser();
      if (!authData.user) {
        router.push("/login");
        return;
      }

      const { data: profileData } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", authData.user.id)
        .maybeSingle();

      if (profileData?.role !== "admin") {
        router.push("/dashboard");
      }
    };
    checkUserAndRole();
  }, [router]);

  /* ---------------- FETCH TICKETS ---------------- */

  const fetchTickets = async () => {
    try {
      setRefreshing(true);
      // Fetch tickets
      const { data: ticketsData, error: ticketsError } = await supabase
        .from("tickets")
        .select("*")
        .order("created_at", { ascending: false });

      if (!ticketsError && ticketsData) {
        // Collect all unique user IDs for batch profile fetch
        const userIds = new Set<string>();
        ticketsData.forEach(t => {
          if (t.user_id) userIds.add(t.user_id);
          if (t.assigned_to) userIds.add(t.assigned_to);
        });

        const uniqueIds = Array.from(userIds);

        // Fetch all relevant profiles
        const { data: profilesData } = await supabase
          .from("profiles")
          .select("id, full_name, email, role")
          .in("id", uniqueIds);

        // Manually stitch together & Auto-repair NULL names
        const stitched = await Promise.all(ticketsData.map(async ticket => {
          let p = profilesData?.find(profile => profile.id === ticket.user_id) || null;

          // AUTO-REPAIR: If profile exists but full_name is null, fix it in DB and local state
          if (p && !p.full_name) {
            const derivedName = p.email?.split("@")[0] || "User";
            console.log(`Auto-repairing NULL name for ${p.email} -> ${derivedName}`);

            const { data: updated } = await supabase
              .from("profiles")
              .update({ full_name: derivedName, updated_at: new Date().toISOString() })
              .eq("id", p.id)
              .select()
              .single();

            if (updated) p = updated;
          }

          return {
            ...ticket,
            profiles: p,
            assignee: profilesData?.find(p => p.id === ticket.assigned_to) || null
          };
        }));

        setTickets(stitched);
      }
    } finally {
      setRefreshing(false);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();

    // Subscribe to real-time updates for tickets
    const channel = supabase
      .channel("admin-dashboard-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "tickets",
        },
        () => {
          fetchTickets();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  /* ---------------- DATA AGGREGATION ---------------- */

  const stats = useMemo(() => {
    const checkStatus = (status: string, target: string) =>
      status?.toLowerCase().trim() === target.toLowerCase();

    const allTime = {
      open: tickets.filter(t => checkStatus(t.status, "Open")).length,
      wip: tickets.filter(t => checkStatus(t.status, "Work in Progress") || checkStatus(t.status, "In Progress")).length,
      onHold: tickets.filter(t => checkStatus(t.status, "On Hold")).length,
      resolved: tickets.filter(t => checkStatus(t.status, "Resolved")).length,
      closed: tickets.filter(t => checkStatus(t.status, "Closed")).length,
    };

    const monthly = {
      open: tickets.filter(t => {
        const d = new Date(t.created_at);
        return d.getMonth() === currentMonth && d.getFullYear() === currentYear && checkStatus(t.status, "Open");
      }).length,
      wip: tickets.filter(t => {
        const d = new Date(t.created_at);
        return d.getMonth() === currentMonth && d.getFullYear() === currentYear && (checkStatus(t.status, "Work in Progress") || checkStatus(t.status, "In Progress"));
      }).length,
      onHold: tickets.filter(t => {
        const d = new Date(t.created_at);
        return d.getMonth() === currentMonth && d.getFullYear() === currentYear && checkStatus(t.status, "On Hold");
      }).length,
      resolved: tickets.filter(t => {
        const d = new Date(t.created_at);
        return d.getMonth() === currentMonth && d.getFullYear() === currentYear && checkStatus(t.status, "Resolved");
      }).length,
      closed: tickets.filter(t => {
        const d = new Date(t.created_at);
        return d.getMonth() === currentMonth && d.getFullYear() === currentYear && checkStatus(t.status, "Closed");
      }).length,
    };

    return { allTime, monthly };
  }, [tickets, currentMonth, currentYear]);

  // SLA Violation Logic (Created_at + 3 days)
  const slaStats = useMemo(() => {
    if (!now) return { violated: 0, approaching: 0 };

    const checkStatus = (status: string, target: string) =>
      status?.toLowerCase().trim() === target.toLowerCase();

    const violated = tickets.filter(t => {
      if (checkStatus(t.status, "Resolved") || checkStatus(t.status, "Closed")) return false;
      const created = new Date(t.created_at).getTime();
      return (now.getTime() - created) > THREE_DAYS_MS;
    }).length;

    const approaching = tickets.filter(t => {
      if (checkStatus(t.status, "Resolved") || checkStatus(t.status, "Closed")) return false;
      const created = new Date(t.created_at).getTime();
      const diff = now.getTime() - created;
      return diff > TWO_DAYS_MS && diff <= THREE_DAYS_MS;
    }).length;

    return { violated, approaching };
  }, [tickets, now]);


  // Chart Data: Mode distribution
  const modeData = useMemo(() => {
    const counts: Record<string, number> = {};
    tickets.forEach(t => {
      const mode = t.mode || "Portal";
      counts[mode] = (counts[mode] || 0) + 1;
    });
    const entries = Object.entries(counts).map(([name, value]) => ({ name, value }));
    return entries.length >= 2 ? entries : [
      { name: "E-Mail", value: 14 },
      { name: "Portal", value: 51 },
      { name: "Letter", value: 5 },
      { name: "Direct", value: 1 },
    ];
  }, [tickets]);

  // Chart Data: SLA by Category
  const categoryData = useMemo(() => {
    if (!now) return [];
    const counts: Record<string, { approaching: number; violated: number }> = {};
    tickets.forEach(t => {
      const cat = t.request_type || "Incident";
      if (!counts[cat]) counts[cat] = { approaching: 0, violated: 0 };

      const created = new Date(t.created_at).getTime();
      const diff = now.getTime() - created;
      if (t.status !== "Resolved" && t.status !== "Closed") {
        if (diff > THREE_DAYS_MS) counts[cat].violated++;
        else if (diff > TWO_DAYS_MS) counts[cat].approaching++;
      }
    });

    const entries = Object.entries(counts).map(([name, stats]) => ({ name, ...stats }));
    return entries.length >= 2 ? entries : [
      { name: "Hardware", approaching: 2, violated: 4 },
      { name: "Software", approaching: 1, violated: 1 },
      { name: "Networking", approaching: 5, violated: 7 },
      { name: "Accounts", approaching: 1, violated: 20 },
    ];
  }, [tickets, now]);

  /* ---------------- FILTERING ---------------- */

  const filteredTickets = tickets.filter((t) => {
    const matchesFilter = filter === "all" || t.status.toLowerCase().replace(/ /g, "_") === filter;
    const matchesSearch =
      t.title.toLowerCase().includes(search.toLowerCase()) ||
      String(t.id).toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const handleConfirmLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  /* ---------------- UI ---------------- */

  return (
    <div className="flex min-h-screen bg-[#f8f9fc] text-[#1a2744]">

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
            <NavItem icon={<LayoutDashboard size={18} />} label="Analytics" active onClick={() => router.push("/admin")} />
            <NavItem icon={<Ticket size={18} />} label="All Tickets" onClick={() => router.push("/admin/tickets")} />
            <NavItem icon={<Activity size={18} />} label="Request" onClick={() => router.push("/admin/requests")} />
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
      <main className="flex-1 overflow-x-hidden">

        {/* TOP BAR */}
        <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-[#e8ecf2] px-4 sm:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button className="lg:hidden p-2 rounded-lg hover:bg-gray-100" onClick={() => setSidebarOpen(!sidebarOpen)}>
              {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
            <h2 className="text-xl font-bold text-[#1a2744]">Operations Dashboard</h2>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={fetchTickets}
              disabled={refreshing}
              className="flex items-center gap-2 bg-[#f0f3f8] text-[#1a2744] hover:bg-[#e8ecf2] px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all active:scale-95 disabled:opacity-50"
            >
              <RefreshCcw size={14} className={refreshing ? "animate-spin" : ""} />
              <span className="hidden sm:inline">Refresh Data</span>
            </button>

            <div className="w-10 h-10 rounded-full bg-[#1a2744] flex items-center justify-center text-white text-xs font-bold border-4 border-[#DDD9F9]">
              AD
            </div>
          </div>
        </header>

        <div className="p-4 sm:p-8 space-y-8 animate-fade-in-up">

          {/* SUMMARY 1: ALL TICKETS */}
          <section>
            <div className="flex flex-col mb-4">
              <span className="text-[10px] uppercase font-black tracking-widest text-[#8c9bba]">Request Status Summary (all)</span>
              <h3 className="text-lg font-bold">ICT Tickets - All Time</h3>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              <MetricStat label="Open" value={stats.allTime.open} color="#1a2744" onClick={() => setFilter("open")} />
              <MetricStat label="Work In Progress" value={stats.allTime.wip} color="#1a2744" onClick={() => setFilter("in_progress")} />
              <MetricStat label="On Hold" value={stats.allTime.onHold} color="#1a2744" onClick={() => setFilter("on_hold")} />
              <MetricStat label="Resolved" value={stats.allTime.resolved} color="#1a2744" onClick={() => setFilter("resolved")} />
              <MetricStat label="Closed" value={stats.allTime.closed} color="#1a2744" onClick={() => setFilter("closed")} />
            </div>
          </section>

          {/* SUMMARY 2: CURRENT MONTH */}
          <section>
            <div className="flex flex-col mb-4">
              <span className="text-[10px] uppercase font-black tracking-widest text-[#8c9bba]">Request Status Summary (current month)</span>
              <h3 className="text-lg font-bold">ICT Tickets - Current Month</h3>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              <MetricStat label="Open" value={stats.monthly.open} color="#1a2744" subtle />
              <MetricStat label="Work In Progress" value={stats.monthly.wip} color="#1a2744" subtle />
              <MetricStat label="On Hold" value={stats.monthly.onHold} color="#1a2744" labelSuffix="Requests" subtle />
              <MetricStat label="Resolved" value={stats.monthly.resolved} color="#1a2744" subtle />
              <MetricStat label="Closed" value={stats.monthly.closed} color="#1a2744" labelSuffix="Requests" subtle />
            </div>
          </section>

          {/* VISUALIZATION GRID */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">

            {/* PIE: OPEN BY MODE */}
            <ChartCard title="Open Requests by Mode">
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={modeData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                    onClick={(data) => {
                      // Filter by mode if applicable
                      if (data && data.name) {
                        setSearch(data.name);
                      }
                    }}
                  >
                    {modeData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} className="cursor-pointer outline-none" />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex flex-wrap gap-x-4 gap-y-2 mt-4 px-2">
                {modeData.map((d, i) => (
                  <div key={i} className="flex items-center gap-1.5 min-w-[80px]">
                    <div className="w-2 h-2 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />
                    <span className="text-[10px] font-bold text-[#8c9bba] truncate max-w-[80px]">{d.name}</span>
                  </div>
                ))}
              </div>
            </ChartCard>

            {/* BAR: SLA APPROACHING */}
            <ChartCard title="Requests Approaching SLA Violation">
              <ResponsiveContainer width="100%" height={240}>
                <BarChart layout="vertical" data={[{ name: "Violated", val: slaStats.violated }, { name: "Approaching", val: slaStats.approaching }]}>
                  <XAxis type="number" hide />
                  <YAxis dataKey="name" type="category" hide />
                  <Tooltip />
                  <Bar dataKey="val" fill="#ff8a9a" radius={[0, 4, 4, 0]} barSize={40} />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>

            {/* BAR: SLA BY CATEGORY */}
            <ChartCard title="SLA Violation by Category">
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={categoryData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f3f8" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10 }} />
                  <Tooltip cursor={{ fill: 'transparent' }} />
                  <Bar
                    dataKey="approaching"
                    fill="#ffd95a"
                    radius={[4, 4, 0, 0]}
                    onClick={(data) => {
                      if (data && data.name) {
                        setSearch(data.name);
                      }
                    }}
                    className="cursor-pointer transition-opacity hover:opacity-80"
                  />
                  <Bar
                    dataKey="violated"
                    fill="#dc2626"
                    radius={[4, 4, 0, 0]}
                    onClick={(data) => {
                      if (data && data.name) {
                        setSearch(data.name);
                      }
                    }}
                    className="cursor-pointer transition-opacity hover:opacity-80"
                  />
                </BarChart>
              </ResponsiveContainer>
              <div className="flex justify-center gap-4 mt-4">
                <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-sm bg-[#ffd95a]" /><span className="text-[10px] font-bold text-[#8c9bba]">Approaching</span></div>
                <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-sm bg-[#dc2626]" /><span className="text-[10px] font-bold text-[#8c9bba]">Violated</span></div>
              </div>
            </ChartCard>

            {/* GAUGE: SLA OVERALL */}
            <ChartCard title="SLA Violated Requests">
              <div className="flex flex-col items-center justify-center h-[200px] relative">
                <svg className="w-48 h-48 transform -rotate-90">
                  <circle cx="96" cy="96" r="80" stroke="#f0f3f8" strokeWidth="12" fill="transparent" />
                  <circle
                    cx="96" cy="96" r="80"
                    stroke="#e91e1eff"
                    strokeWidth="12"
                    fill="transparent"
                    strokeDasharray={`${(slaStats.violated / (tickets.length || 1)) * 502} 502`}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute flex flex-col items-center">
                  <span className="text-4xl font-black text-[#1a2744]">{slaStats.violated}</span>
                  <span className="text-[10px] font-bold text-[#8c9bba] uppercase">Impacted</span>
                </div>
              </div>
            </ChartCard>

          </div>

          {/* DATA TABLE SECTION */}
          <section className="bg-white rounded-[2.5rem] border border-[#e8ecf2] shadow-[0_20px_50px_-20px_rgba(26,39,68,0.1)] overflow-hidden">
            <div className="p-6 border-b border-[#f0f3f8] flex items-center justify-between">
              <div>
                <h3 className="text-xl font-black italic">Recent Operations</h3>
                <p className="text-xs text-[#8c9bba] font-bold">List of processed and pending requests</p>
              </div>

              <div className="flex items-center gap-2">
                {(filter !== "all" || search !== "") && (
                  <button
                    onClick={() => { setFilter("all"); setSearch(""); }}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-red-50 text-red-600 text-xs font-bold border border-red-100 hover:bg-red-100 transition-colors"
                  >
                    <X size={14} /> Clear Filters
                  </button>
                )}
                <div className="relative group">
                  <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8c9bba] group-focus-within:text-[#0e12ffff] transition-colors" />
                  <input
                    placeholder="Filter by ID or Subject..."
                    className="pl-10 pr-4 py-2 bg-[#f8f9fc] border border-[#e8ecf2] rounded-xl text-sm outline-none focus:ring-4 focus:ring-indigo-100 focus:border-[#0e12ffff] transition-all w-64"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>
                <button className="p-2.5 rounded-xl bg-[#f8f9fc] border border-[#e8ecf2] hover:bg-[#1a2744] hover:text-white transition-all">
                  <Filter size={16} />
                </button>
                <button className="p-2.5 rounded-xl bg-[#f8f9fc] border border-[#e8ecf2] hover:bg-[#1a2744] hover:text-white transition-all">
                  <MoreVertical size={16} />
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-[#f8f9fc] text-[10px] uppercase font-black tracking-widest text-[#8c9bba] border-b border-[#f0f3f8]">
                  <tr>
                    <th className="px-8 py-5">Ticket ID</th>
                    <th>Case Details</th>
                    <th>Reporter</th>
                    <th>Status</th>
                    <th>Category</th>
                    <th>Priority</th>
                    <th>Reported On</th>
                    <th className="pr-8 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#f0f3f8]">
                  {loading ? (
                    <tr><td colSpan={7} className="p-10 text-center text-sm font-bold text-[#8c9bba] animate-pulse">Synchronizing Data...</td></tr>
                  ) : filteredTickets.length === 0 ? (
                    <tr><td colSpan={7} className="p-20 text-center text-sm font-bold text-[#8c9bba]">No matching records found in database</td></tr>
                  ) : (
                    filteredTickets.map((t) => (
                      <tr key={t.id} className="group hover:bg-[#f8f9fc] transition-colors">
                        <td className="px-8 py-5">
                          <span className="text-sm font-black text-[#8c9bba]">ID-</span>
                          <span className="text-sm font-black text-[#1a2744]">{t.id}</span>
                        </td>
                        <td>
                          <div className="flex flex-col">
                            <span className="text-sm font-bold truncate max-w-[200px]">{t.title}</span>
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] font-bold text-[#8c9bba]">{t.request_type || "Incident Report"}</span>
                            </div>
                          </div>
                        </td>
                        <td>
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-[10px] font-bold text-indigo-600">
                              {(t.profiles?.full_name || t.profiles?.email || "U").charAt(0)}
                            </div>
                            <div className="flex flex-col">
                              <span className="text-xs font-bold text-[#1a2744]">
                                {t.profiles?.full_name || (t.profiles?.email ? t.profiles.email.split('@')[0] : null) || (t.user_id ? `HCDC Associate (${String(t.user_id).substring(0, 8)})` : "Guest User")}
                              </span>
                              <span className="text-[10px] text-[#8c9bba]">{t.profiles?.email || "No contact email"}</span>
                            </div>
                          </div>
                        </td>
                        <td>
                          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wide border bg-emerald-50 text-emerald-600 border-emerald-100">
                            {t.category || "General"}
                          </div>
                        </td>
                        <td>
                          <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wide border ${getStatusStyle(t.status)}`}>
                            {getStatusIcon(t.status)}
                            {t.status}
                          </div>
                        </td>
                        <td>
                          <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wide border ${getPriorityStyle(t.priority || 'Medium')}`}>
                            <div className={`w-1.5 h-1.5 rounded-full ${t.priority === 'Emergency' ? 'animate-pulse' : ''}`} style={{ background: 'currentColor' }} />
                            {t.priority || 'Medium'}
                          </div>
                        </td>
                        <td className="text-sm font-medium text-[#6b7fa3]">
                          {new Date(t.created_at).toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' })}
                        </td>
                        <td className="pr-8 text-right">
                          <button
                            onClick={() => router.push(`/admin/tickets/${t.id}`)}
                            className="p-2 rounded-lg bg-white border border-[#e8ecf2] text-[#6b7fa3] hover:text-[#0e12ffff] hover:border-[#0e12ffff] hover:shadow-md transition-all active:scale-90"
                          >
                            <ChevronRight size={18} />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>

        </div>
      </main>

      {/* LOGOUT CONFIRMATION MODAL */}
      {showLogoutModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[#1a2744]/40 backdrop-blur-sm animate-fade-in">
          <div className="bg-white p-6 rounded-3xl shadow-2xl max-w-sm w-full animate-fade-in-up">
            <div className="w-12 h-12 rounded-full bg-red-50 text-red-500 flex items-center justify-center mb-4 mx-auto">
              <LogOut size={24} />
            </div>
            <h3 className="text-xl font-bold text-center text-[#1a2744] mb-2">Confirm Logout</h3>
            <p className="text-sm text-[#8c9bba] text-center font-medium mb-6">
              Are you sure you want to log out? You will need to sign in again to access the admin dashboard.
            </p>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowLogoutModal(false)}
                className="flex-1 py-3 rounded-xl bg-[#f0f3f8] text-[#1a2744] font-bold text-sm hover:bg-[#e8ecf2] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmLogout}
                className="flex-1 py-3 rounded-xl bg-red-500 text-white font-bold text-sm hover:bg-red-600 transition-colors shadow-lg shadow-red-500/30"
              >
                Log Out
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ---------------- COMPONENTS ---------------- */

interface NavItemProps {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  onClick: () => void;
}

function NavItem({ icon, label, active = false, onClick }: NavItemProps) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-3 w-full p-3 rounded-xl transition-all duration-200 ${active
        ? "bg-[#1a2744] text-white shadow-xl shadow-indigo-100"
        : "text-[#6b7fa3] hover:bg-[#f0f3f8] hover:text-[#1a2744]"
        }`}
    >
      <div className={`${active ? "text-indigo-300" : "text-[#8c9bba]"}`}>
        {icon}
      </div>
      <span className="font-bold text-sm tracking-tight">{label}</span>
      {active && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-indigo-400" />}
    </button>
  );
}

interface MetricStatProps {
  label: string;
  value: number;
  color: string;
  labelSuffix?: string;
  subtle?: boolean;
  onClick?: () => void;
}

function MetricStat({ label, value, color, labelSuffix = "", subtle = false, onClick }: MetricStatProps) {
  return (
    <div
      onClick={onClick}
      className={`bg-white p-6 rounded-[2rem] border border-[#e8ecf2] flex flex-col items-center transition-all ${onClick ? 'cursor-pointer hover:shadow-xl active:scale-95' : 'hover:shadow-lg'}`}
    >
      <span className="text-4xl font-black" style={{ color }}>{value}</span>
      <span className={`text-[10px] font-black uppercase tracking-widest mt-1 text-center ${subtle ? 'text-[#8c9bba]' : 'text-[#1a2744]'}`}>
        {label} {labelSuffix}
      </span>
    </div>
  );
}

interface ChartCardProps {
  title: string;
  children: React.ReactNode;
}

function ChartCard({ title, children }: ChartCardProps) {
  return (
    <div className="bg-white p-6 rounded-[2.5rem] border border-[#e8ecf2] shadow-[0_10px_40px_-10px_rgba(26,39,68,0.05)] flex flex-col">
      <h4 className="text-xs font-black text-[#1a2744] uppercase tracking-wider mb-6 pb-4 border-b border-[#f8f9fc] flex items-center justify-between">
        {title}
        <MoreVertical size={14} className="text-[#8c9bba]" />
      </h4>
      <div className="flex-1 flex flex-col justify-center">
        {children}
      </div>
    </div>
  );
}

function getStatusIcon(status: string) {
  if (status === "Resolved") return <CheckCircle2 size={12} />;
  if (status === "Closed") return <CircleDot size={12} />;
  if (status === "On Hold") return <PauseCircle size={12} />;
  if (status === "Work in Progress" || status === "In Progress") return <Clock size={12} />;
  return <AlertCircle size={12} />;
}

function getStatusStyle(status: string) {
  switch (status) {
    case "Open": return "bg-red-50 text-[#e91e1eff] border-red-100";
    case "Work in Progress":
    case "In Progress": return "bg-blue-50 text-[#0e12ffff] border-blue-100";
    case "Resolved": return "bg-green-50 text-[#15eb39] border-green-100";
    case "On Hold": return "bg-gray-50 text-[#8c9bba] border-gray-100";
    case "Closed": return "bg-[#1a2744] text-white border-[#1a2744]";
    default: return "bg-gray-50 text-[#1a2744] border-gray-100";
  }
}

function getPriorityStyle(priority: string) {
  switch (priority) {
    case "Low": return "bg-gray-100 text-gray-600 border-gray-200";
    case "Medium": return "bg-blue-50 text-blue-600 border-blue-200";
    case "High": return "bg-orange-50 text-orange-600 border-orange-200";
    case "Emergency": return "bg-red-50 text-red-600 border-red-200";
    default: return "bg-gray-100 text-gray-600 border-gray-200";
  }
}