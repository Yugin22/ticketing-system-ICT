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
  Shield,
  Activity,
  Menu,
  X,
  User as UserIcon,
  UserPlus,
  Trash2,
  CheckSquare
} from "lucide-react";

/* ---------------- TYPES ---------------- */

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
  created_at: string;
  user_id: string;
  request_type?: string;
  category?: string;
  priority: string;
  mode?: string | null;
  assigned_to: string | null;
  profiles: Profile | null; // The reporter
  assignee?: Profile | null; // The assigned staff
};

/* ---------------- CONSTANTS ---------------- */

const PRIORITIES = ["Low", "Medium", "High", "Emergency"];
const STATUSES = ["Open", "In Progress", "Resolved", "On Hold", "Closed"];

const PRIORITY_COLORS: Record<string, string> = {
  "Low": "bg-gray-100 text-gray-600 border-gray-200",
  "Medium": "bg-blue-50 text-blue-600 border-blue-200",
  "High": "bg-orange-50 text-orange-600 border-orange-200",
  "Emergency": "bg-red-50 text-red-600 border-red-200",
};

/* ---------------- PAGE ---------------- */

export default function AllTicketsAdmin() {
  const router = useRouter();

  const [tickets, setTickets] = useState<TicketType[]>([]);
  const [staff, setStaff] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Filters
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterPriority, setFilterPriority] = useState("all");
  const [filterStaff, setFilterStaff] = useState("all");

  // Multi-select
  const [selectedTickets, setSelectedTickets] = useState<Set<string | number>>(new Set());

  /* ---------------- AUTH GUARD ---------------- */

  useEffect(() => {
    const checkUser = async () => {
      const { data } = await supabase.auth.getUser();
      if (!data.user) {
        router.push("/login");
        return;
      }
      // Optional: Check if user is actually an admin
      const { data: profile } = await supabase.from("profiles").select("role").eq("id", data.user.id).maybeSingle();
      if (profile?.role !== 'admin') {
        router.push("/dashboard");
      }
    };
    checkUser();
    fetchTickets();
    fetchStaff();

    // Subscribe to real-time updates for tickets
    const channel = supabase
      .channel("admin-tickets-inventory-changes")
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
  }, [router]);

  /* ---------------- DATA FETCHING ---------------- */

  const fetchTickets = async () => {
    try {
      setRefreshing(true);
      // 1. Fetch tickets basic data
      const { data: ticketsData, error: ticketsError } = await supabase
        .from("tickets")
        .select("*")
        .order("created_at", { ascending: false });

      if (!ticketsError && ticketsData) {
        // 2. Collect unique user IDs (reporters and assignees)
        const userIds = new Set<string>();
        ticketsData.forEach(t => {
          if (t.user_id) userIds.add(t.user_id);
          if (t.assigned_to) userIds.add(t.assigned_to);
        });

        const uniqueIds = Array.from(userIds);

        // 3. Fetch all profiles in one bulk query
        const { data: profilesData } = await supabase
          .from("profiles")
          .select("id, full_name, email, role, avatar_url")
          .in("id", uniqueIds);

        // 4. Manually stitch profiles to tickets & Auto-repair NULL names
        const stitchedTickets = await Promise.all(ticketsData.map(async ticket => {
          let p = profilesData?.find(profile => profile.id === ticket.user_id) || null;

          // AUTO-REPAIR: If profile exists but full_name is null/empty, fix it in DB and local state
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

        setTickets(stitchedTickets as any);
      }
    } finally {
      setRefreshing(false);
      setLoading(false);
    }
  };

  const fetchStaff = async () => {
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("role", "admin");
    if (data) setStaff(data);
  };

  /* ---------------- CALCULATIONS ---------------- */

  const stats = useMemo(() => {
    const checkStatus = (status: string, target: string) =>
      status?.toLowerCase().trim() === target.toLowerCase().trim();

    return {
      open: tickets.filter(t => checkStatus(t.status, "Open")).length,
      inProgress: tickets.filter(t => checkStatus(t.status, "In Progress") || checkStatus(t.status, "Work in Progress")).length,
      onHold: tickets.filter(t => checkStatus(t.status, "On Hold")).length,
      resolved: tickets.filter(t => checkStatus(t.status, "Resolved")).length,
      closed: tickets.filter(t => checkStatus(t.status, "Closed")).length,
    };
  }, [tickets]);

  /* ---------------- FILTERING ---------------- */

  const filteredTickets = useMemo(() => {
    return tickets.filter(t => {
      const matchesSearch = t.title.toLowerCase().includes(search.toLowerCase()) || String(t.id).includes(search);
      const matchesStatus = filterStatus === "all" || t.status === filterStatus;
      const matchesPriority = filterPriority === "all" || t.priority === filterPriority;
      const matchesStaff = filterStaff === "all" || t.assigned_to === filterStaff;
      return matchesSearch && matchesStatus && matchesPriority && matchesStaff;
    });
  }, [tickets, search, filterStatus, filterPriority, filterStaff]);

  /* ---------------- BULK ACTIONS ---------------- */

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedTickets(new Set(filteredTickets.map(t => String(t.id))));
    } else {
      setSelectedTickets(new Set());
    }
  };

  const toggleSelect = (id: string | number) => {
    const newSelected = new Set(selectedTickets);
    if (newSelected.has(String(id))) {
      newSelected.delete(String(id));
    } else {
      newSelected.add(String(id));
    }
    setSelectedTickets(newSelected);
  };

  const bulkAssign = async (staffId: string) => {
    if (selectedTickets.size === 0) return;
    try {
      setRefreshing(true);
      const { error } = await supabase
        .from("tickets")
        .update({ assigned_to: staffId })
        .in("id", Array.from(selectedTickets));

      if (error && error.code === 'PGRST204' && error.message.includes('assigned_to')) {
        alert("Warning: The 'assigned_to' column is missing from your Supabase database schema. Ticket assignment was skipped. Please add the 'assigned_to' column as a UUID type to enable this feature.");
      } else if (error) {
        console.error("Bulk assign error:", error);
        alert(`Failed to assign tickets: ${error.message}`);
      } else {
        await fetchTickets();
        setSelectedTickets(new Set());
      }
    } finally {
      setRefreshing(false);
    }
  };

  const bulkClose = async () => {
    if (selectedTickets.size === 0) return;
    try {
      setRefreshing(true);
      const { error } = await supabase
        .from("tickets")
        .update({ status: "Closed" })
        .in("id", Array.from(selectedTickets));

      if (!error) {
        await fetchTickets();
        setSelectedTickets(new Set());
      }
    } finally {
      setRefreshing(false);
    }
  };

  const handleAssignTicket = async (ticketId: string | number, staffId: string) => {
    try {
      setRefreshing(true);
      const { error } = await supabase
        .from("tickets")
        .update({ assigned_to: staffId, status: "In Progress" })
        .eq("id", ticketId);

      if (error && error.code === 'PGRST204' && error.message.includes('assigned_to')) {
        console.warn("Database schema missing 'assigned_to' column. Retrying save without assignment.");
        alert("Warning: The 'assigned_to' column is missing from your Supabase database schema. Ticket status was updated to 'In Progress', but technician assignment was skipped. Please add the 'assigned_to' column as a UUID type to enable this feature.");

        const { error: retryError } = await supabase
          .from("tickets")
          .update({ status: "In Progress" })
          .eq("id", ticketId);

        if (!retryError) await fetchTickets();
      } else if (error) {
        console.error("Assign ticket error:", error);
        alert(`Failed to assign ticket: ${error.message}`);
      } else {
        await fetchTickets();
      }
    } finally {
      setRefreshing(false);
    }
  };

  const handleUpdateStatus = async (ticketId: string | number, newStatus: string) => {
    try {
      setRefreshing(true);
      const { error } = await supabase
        .from("tickets")
        .update({ status: newStatus })
        .eq("id", ticketId);

      if (!error) {
        await fetchTickets();
      }
    } finally {
      setRefreshing(false);
    }
  };

  const handleUpdatePriority = async (ticketId: string | number, newPriority: string) => {
    try {
      setRefreshing(true);
      const { error } = await supabase
        .from("tickets")
        .update({ priority: newPriority })
        .eq("id", ticketId);

      if (!error) {
        await fetchTickets();
      }
    } finally {
      setRefreshing(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  /* ---------------- UI ---------------- */

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
            <NavItem icon={<Ticket size={18} />} label="All Tickets" active onClick={() => { }} />
            <NavItem icon={<Activity size={18} />} label="Service Health" onClick={() => { }} />
            <NavItem icon={<Calendar size={18} />} label="Schedules" onClick={() => { }} />
          </nav>

          <div className="mt-auto pt-6 border-t border-[#e8ecf2]">
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 w-full p-3 rounded-xl text-red-500 font-bold text-sm hover:bg-red-50 transition-all active:scale-95"
            >
              <LogOut size={18} /> Logout
            </button>
          </div>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 overflow-x-hidden relative flex flex-col h-screen">

        {/* TOP BAR */}
        <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-[#e8ecf2] px-4 sm:px-8 py-4 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-4">
            <button className="lg:hidden p-2 rounded-lg hover:bg-gray-100" onClick={() => setSidebarOpen(!sidebarOpen)}>
              {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
            <h2 className="text-xl font-bold text-[#1a2744]">Ticket Inventory</h2>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={fetchTickets}
              disabled={refreshing}
              className="flex items-center gap-2 bg-[#f0f3f8] text-[#1a2744] hover:bg-[#e8ecf2] px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all active:scale-95 disabled:opacity-50"
            >
              <RefreshCcw size={14} className={refreshing ? "animate-spin" : ""} />
              <span className="hidden sm:inline">Sync All</span>
            </button>

            <div className="w-10 h-10 rounded-full bg-[#1a2744] flex items-center justify-center text-white text-xs font-bold border-4 border-[#DDD9F9]">
              AD
            </div>
          </div>
        </header>

        {/* SUMMARY STATS */}
        <div className="p-4 sm:p-8 grid grid-cols-2 lg:grid-cols-5 gap-4 animate-fade-in-up">
          <MetricStat label="Open" value={stats.open} color="#1a2744" onClick={() => setFilterStatus("Open")} />
          <MetricStat label="In Progress" value={stats.inProgress} color="#1a2744" onClick={() => setFilterStatus("In Progress")} />
          <MetricStat label="On Hold" value={stats.onHold} color="#1a2744" onClick={() => setFilterStatus("On Hold")} />
          <MetricStat label="Resolved" value={stats.resolved} color="#1a2744" onClick={() => setFilterStatus("Resolved")} />
          <MetricStat label="Closed" value={stats.closed} color="#1a2744" onClick={() => setFilterStatus("Closed")} />
        </div>

        {/* FILTERS & SEARCH */}
        <div className="p-4 sm:p-8 bg-white border-b border-[#e8ecf2] flex-shrink-0 animate-fade-in-up">
          <div className="flex flex-col xl:flex-row gap-4 xl:items-center justify-between">
            <div className="flex flex-wrap gap-3">
              <FilterDropdown
                label="Status'"
                value={filterStatus}
                onChange={setFilterStatus}
                options={STATUSES}
                icon={<Activity size={14} />}
              />
              <FilterDropdown
                label="Priority'"
                value={filterPriority}
                onChange={setFilterPriority}
                options={PRIORITIES}
                icon={<AlertCircle size={14} />}
              />
              <FilterDropdown
                label="Assigned To"
                value={filterStaff}
                onChange={setFilterStaff}
                options={staff.map(s => ({ value: s.id, label: s.full_name }))}
                icon={<UserIcon size={14} />}
              />
            </div>

            <div className="relative w-full xl:w-96 group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#8c9bba] group-focus-within:text-[#1a2744] transition-colors" size={18} />
              <input
                type="text"
                placeholder="Search ticket ID or subjective title..."
                className="w-full pl-12 pr-4 py-3 bg-[#f8f9fc] border border-[#e8ecf2] rounded-2xl outline-none text-sm font-medium focus:bg-white focus:border-[#1a2744] focus:ring-4 focus:ring-indigo-100 transition-all shadow-sm"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* DATA TABLE */}
        <div className="flex-1 overflow-auto p-4 sm:p-8 scrollbar-thin animate-fade-in-up" style={{ animationDelay: "100ms" }}>
          <div className="bg-white rounded-[2.5rem] border border-[#e8ecf2] shadow-sm overflow-hidden min-w-[1000px] transition-all hover:shadow-xl hover:shadow-indigo-50/50">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-[#f8f9fc] border-b border-[#f0f3f8]">
                  <th className="pl-8 py-5 w-12">
                    <input
                      type="checkbox"
                      className="w-5 h-5 rounded-lg border-2 border-[#e8ecf2] bg-white checked:bg-[#1a2744] checked:border-[#1a2744] transition-all cursor-pointer accent-[#1a2744]"
                      onChange={handleSelectAll}
                      checked={selectedTickets.size === filteredTickets.length && filteredTickets.length > 0}
                    />
                  </th>
                  <th className="px-4 py-5 text-[11px] font-black uppercase tracking-widest text-[#8c9bba]">Ticket ID</th>
                  <th className="px-4 py-5 text-[11px] font-black uppercase tracking-widest text-[#8c9bba]">Subject & Detail</th>
                  <th className="px-4 py-5 text-[11px] font-black uppercase tracking-widest text-[#8c9bba]">Status</th>
                  <th className="px-4 py-5 text-[11px] font-black uppercase tracking-widest text-[#8c9bba]">Category</th>
                  <th className="px-4 py-5 text-[11px] font-black uppercase tracking-widest text-[#8c9bba]">Priority</th>
                  <th className="px-4 py-5 text-[11px] font-black uppercase tracking-widest text-[#8c9bba]">Reporter</th>
                  <th className="px-4 py-5 text-[11px] font-black uppercase tracking-widest text-[#8c9bba]">Assigned Tech</th>
                  <th className="pr-8 py-5 text-[11px] font-black uppercase tracking-widest text-[#8c9bba] text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f0f3f8]">
                {loading ? (
                  <tr><td colSpan={8} className="p-20 text-center font-bold text-[#8c9bba] animate-pulse">Synchronizing records...</td></tr>
                ) : filteredTickets.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-32 text-center">
                      <div className="flex flex-col items-center justify-center gap-4 animate-fade-in-up">
                        <div className="w-20 h-20 rounded-[2rem] bg-[#f8f9fc] flex items-center justify-center text-[#8c9bba]">
                          <Search size={40} strokeWidth={1.5} opacity={0.3} />
                        </div>
                        <div>
                          <p className="text-lg font-bold text-[#1a2744]">No records found</p>
                          <p className="text-sm text-[#8c9bba] mt-1 max-w-xs mx-auto font-medium">We couldn't find any tickets matching your current search or filter criteria.</p>
                        </div>
                        <button
                          onClick={() => { setSearch(""); setFilterStatus("all"); setFilterPriority("all"); setFilterStaff("all"); }}
                          className="mt-2 px-6 py-2 rounded-xl bg-[#1a2744] text-white text-xs font-bold hover:bg-[#0e12ffff] transition-all active:scale-95 shadow-lg"
                        >
                          Clear all filters
                        </button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredTickets.map(t => (
                    <tr key={t.id} className={`group hover:bg-[#f8f9fc]/80 transition-all ${selectedTickets.has(String(t.id)) ? 'bg-indigo-50/30' : ''}`}>
                      <td className="pl-8 py-5">
                        <input
                          type="checkbox"
                          className="w-5 h-5 rounded-lg border-2 border-[#e8ecf2] bg-white checked:bg-[#1a2744] checked:border-[#1a2744] transition-all cursor-pointer accent-[#1a2744]"
                          checked={selectedTickets.has(String(t.id))}
                          onChange={() => toggleSelect(t.id)}
                        />
                      </td>
                      <td className="px-4 py-5">
                        <span className="text-xs font-black text-[#8c9bba]">ID-</span>
                        <span className="text-xs font-black" style={{ color: "#1a2744" }}>{t.id}</span>
                      </td>
                      <td className="px-4 py-5">
                        <div className="flex flex-col max-w-[240px]">
                          <p className="text-sm font-bold text-[#1a2744] truncate">{t.title}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <p className="text-[10px] font-bold text-[#8c9bba]">{t.request_type || "Incident"}</p>
                            <span className="w-1 h-1 rounded-full bg-[#e8ecf2]" />
                            <p className="text-[10px] font-bold text-[#1a2744] opacity-80">by {t.profiles?.full_name || t.profiles?.email?.split('@')[0] || (t.user_id ? `HCDC Associate (${String(t.user_id).substring(0, 8)})` : "Guest User")}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-5">
                        <div className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wider inline-flex items-center gap-1.5 border ${getStatusStyle(t.status)}`}>
                          {getStatusIcon(t.status)}
                          {t.status}
                        </div>
                      </td>
                      <td className="px-4 py-5">
                        <div className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wider inline-flex items-center gap-1.5 border bg-emerald-50 text-emerald-600 border-emerald-100`}>
                          {t.category || "General"}
                        </div>
                      </td>
                      <td className="px-4 py-5">
                        <div className="relative group/priority">
                          <button className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wider inline-flex items-center gap-1.5 border transition-all hover:shadow-md active:scale-95 ${PRIORITY_COLORS[t.priority || "Medium"]}`}>
                            <div className={`w-1.5 h-1.5 rounded-full ${t.priority === 'Emergency' ? 'animate-pulse' : ''}`} style={{ background: "currentColor" }} />
                            {t.priority || "Medium"}
                          </button>
                          <div className="absolute top-full left-0 mt-1 w-32 bg-white rounded-xl shadow-xl p-1.5 hidden group-hover/priority:block z-50 border border-[#e8ecf2] animate-fade-in-up">
                            {PRIORITIES.map(p => (
                              <button
                                key={p}
                                onClick={() => handleUpdatePriority(t.id, p)}
                                className={`w-full text-left px-3 py-1.5 rounded-lg text-[10px] font-bold transition-colors ${t.priority === p ? 'bg-[#f0f3f8] text-[#1a2744]' : 'text-[#6b7fa3] hover:bg-[#f8f9fc] hover:text-[#1a2744]'}`}
                              >
                                {p}
                              </button>
                            ))}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-5">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-[10px] font-bold text-indigo-600">
                            {(t.profiles?.full_name || t.profiles?.email || "U").charAt(0)}
                          </div>
                          <div className="flex flex-col">
                            <p className="text-[11px] font-bold text-[#1a2744]">
                              {t.profiles?.full_name || (t.profiles?.email ? t.profiles.email.split('@')[0] : null) || (t.user_id ? `HCDC Associate (${String(t.user_id).substring(0, 8)})` : "Guest User")}
                            </p>
                            <p className="text-[9px] font-medium text-[#8c9bba]">{t.profiles?.email || "No contact info"}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-5">
                        {t.assignee ? (
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-lg bg-[#1a2744] text-white flex items-center justify-center text-[10px] font-bold">
                              {t.assignee.full_name?.charAt(0)}
                            </div>
                            <p className="text-[11px] font-bold text-[#1a2744]">{t.assignee.full_name}</p>
                          </div>
                        ) : (
                          <span className="text-[10px] font-bold text-[#8c9bba] italic">Not Assigned</span>
                        )}
                      </td>
                      <td className="pr-8 py-5 text-right flex items-center justify-end gap-2">
                        <div className="relative group/menu">
                          <button className="p-2 rounded-xl bg-[#f0f3f8] text-[#1a2744] hover:bg-[#1a2744] hover:text-white transition-all">
                            <UserPlus size={16} />
                          </button>
                          <div className="absolute top-1/2 right-full mr-2 -translate-y-1/2 w-48 bg-white rounded-2xl shadow-2xl p-2 hidden group-hover/menu:block z-50 animate-fade-in-up border border-[#e8ecf2]">
                            <p className="px-3 py-1.5 text-[9px] uppercase font-black tracking-widest text-[#8c9bba] border-b border-[#f0f3f8] mb-1">Quick Assign</p>
                            {staff.map(s => (
                              <button
                                key={s.id}
                                onClick={() => handleAssignTicket(t.id, s.id)}
                                className="w-full text-left px-3 py-1.5 rounded-lg text-xs font-bold text-[#1a2744] hover:bg-[#f8f9fc] transition-colors"
                              >
                                {s.full_name}
                              </button>
                            ))}
                          </div>
                        </div>

                        <button
                          onClick={() => handleUpdateStatus(t.id, t.status === "Resolved" ? "Open" : "Resolved")}
                          className={`p-2 rounded-xl transition-all ${t.status === "Resolved" ? "bg-emerald-50 text-emerald-600 border border-emerald-100" : "bg-gray-100 text-gray-400 hover:text-emerald-500 hover:bg-emerald-50"}`}
                          title={t.status === "Resolved" ? "Undo Resolve" : "Mark as Resolved"}
                        >
                          <CheckSquare size={16} />
                        </button>

                        <button
                          onClick={() => router.push(`/admin/tickets/${t.id}`)}
                          className="p-2 rounded-xl bg-white border border-[#e8ecf2] text-[#6b7fa3] hover:text-[#1a2744] hover:shadow-md transition-all active:scale-90"
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
        </div>

        {/* BULK ACTION BAR */}
        {selectedTickets.size > 0 && (
          <div className="fixed bottom-10 left-1/2 -translate-x-1/2 lg:left-[calc(50%+128px)] z-50 animate-fade-in-up">
            <div className="bg-[#1a2744] text-white px-6 py-4 rounded-[2.5rem] shadow-2xl flex items-center gap-6 border border-white/10 backdrop-blur-md">
              <div className="flex items-center gap-3 pr-6 border-r border-white/10">
                <div className="w-8 h-8 rounded-full bg-white text-[#1a2744] flex items-center justify-center text-sm font-black">
                  {selectedTickets.size}
                </div>
                <span className="text-sm font-bold uppercase tracking-widest text-indigo-200">Selected</span>
              </div>

              <div className="flex items-center gap-4">
                <div className="relative group">
                  <button className="flex items-center gap-2 px-6 py-2 rounded-xl bg-white/10 hover:bg-white text-xs font-bold transition-all hover:text-[#1a2744]">
                    <UserPlus size={16} />
                    Assign to...
                  </button>
                  <div className="absolute bottom-full left-0 mb-2 w-56 bg-white rounded-2xl shadow-2xl p-2 hidden group-hover:block animate-fade-in-up">
                    <p className="px-4 py-2 text-[10px] uppercase font-black tracking-widest text-[#8c9bba] border-b border-[#f0f3f8] mb-1">Select Technician</p>
                    {staff.map(s => (
                      <button
                        key={s.id}
                        onClick={() => bulkAssign(s.id)}
                        className="w-full text-left px-4 py-2 rounded-xl text-xs font-bold text-[#1a2744] hover:bg-[#f8f9fc] transition-colors"
                      >
                        {s.full_name}
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  onClick={bulkClose}
                  className="flex items-center gap-2 px-6 py-2 rounded-xl bg-indigo-500 hover:bg-indigo-400 text-xs font-bold transition-all"
                >
                  <CheckSquare size={16} />
                  Close Selected
                </button>

                <button
                  onClick={() => setSelectedTickets(new Set())}
                  className="p-2 text-white/60 hover:text-white transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

/* ---------------- COMPONENTS ---------------- */

function NavItem({ icon, label, active = false, onClick }: { icon: any, label: string, active?: boolean, onClick: () => void }) {
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

function FilterDropdown({ label, value, onChange, options, icon }: { label: string, value: string, onChange: (v: string) => void, options: any[], icon: any }) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-[10px] font-black uppercase tracking-widest text-[#8c9bba] ml-4">{label}</span>
      <div className="relative group">
        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[#8c9bba] group-hover:text-[#1a2744] transition-colors">
          {icon}
        </div>
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="appearance-none pl-10 pr-10 py-2.5 bg-[#f8f9fc] border border-[#e8ecf2] rounded-xl text-xs font-bold text-[#1a2744] outline-none focus:bg-white focus:border-[#1a2744] focus:ring-4 focus:ring-indigo-50 transition-all cursor-pointer shadow-sm w-44"
        >
          <option value="all">All {label}s</option>
          {options.map((opt, i) => (
            <option key={i} value={typeof opt === 'string' ? opt : opt.value}>
              {typeof opt === 'string' ? opt : opt.label}
            </option>
          ))}
        </select>
        <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 text-[#8c9bba] rotate-90" size={12} />
      </div>
    </div>
  );
}

function getStatusIcon(status: string) {
  if (status === "Resolved") return <CheckCircle2 size={10} />;
  if (status === "Closed") return <CheckSquare size={10} />;
  if (status === "On Hold") return <PauseCircle size={10} />;
  if (status === "Work in Progress" || status === "In Progress") return <Clock size={10} />;
  return <AlertCircle size={10} />;
}

function getStatusStyle(status: string) {
  switch (status) {
    case "Open": return "bg-red-50 text-red-600 border-red-100";
    case "Work in Progress":
    case "In Progress": return "bg-blue-50 text-blue-600 border-blue-100";
    case "Resolved": return "bg-emerald-50 text-emerald-600 border-emerald-100";
    case "On Hold": return "bg-gray-50 text-[#8c9bba] border-gray-100";
    case "Closed": return "bg-[#1a2744] text-white border-white/20";
    default: return "bg-gray-50 text-[#1a2744] border-gray-100";
  }
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
      className={`bg-white p-6 rounded-[2rem] border border-[#e8ecf2] flex flex-col items-center justify-center transition-all ${onClick ? 'cursor-pointer hover:shadow-xl active:scale-95' : 'hover:shadow-lg'}`}
    >
      <span className="text-4xl font-black" style={{ color }}>{value}</span>
      <span className={`text-[10px] font-black uppercase tracking-widest mt-1 text-center ${subtle ? 'text-[#8c9bba]' : 'text-[#1a2744]'}`}>
        {label} {labelSuffix}
      </span>
    </div>
  );
}
