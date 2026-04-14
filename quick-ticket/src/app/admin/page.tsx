"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import {
  LayoutDashboard,
  Ticket,
  Clock,
  CheckCircle,
  AlertCircle,
  LogOut,
  Search,
  Filter,
  RefreshCcw,
} from "lucide-react";

/* ---------------- TYPES ---------------- */

type TicketType = {
  id: string;
  title: string;
  status: "open" | "in_progress" | "resolved";
  created_at: string;
  user_id: string;
  assigned_to: string | null;
};

/* ---------------- PAGE ---------------- */

export default function AdminDashboard() {
  const router = useRouter();

  const [tickets, setTickets] = useState<TicketType[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");

  /* ---------------- AUTH GUARD ---------------- */

  useEffect(() => {
    const checkUser = async () => {
      const { data } = await supabase.auth.getUser();

      if (!data.user) {
        router.push("/login");
      }
    };

    checkUser();
  }, []);

  /* ---------------- FETCH TICKETS ---------------- */

  const fetchTickets = async () => {
    setLoading(true);

    const { data, error } = await supabase
      .from("tickets")
      .select("*")
      .order("created_at", { ascending: false });

    if (!error && data) {
      setTickets(data);
    }

    setLoading(false);
  };

  useEffect(() => {
    fetchTickets();
  }, []);

  /* ---------------- FILTERED DATA ---------------- */

  const filteredTickets = tickets.filter((t) => {
    const matchesFilter = filter === "all" || t.status === filter;

    const matchesSearch =
      t.title.toLowerCase().includes(search.toLowerCase()) ||
      t.id.toLowerCase().includes(search.toLowerCase());

    return matchesFilter && matchesSearch;
  });

  /* ---------------- LOGOUT ---------------- */

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  /* ---------------- UI ---------------- */

  return (
    <div className="flex min-h-screen bg-gray-50">

      {/* SIDEBAR */}
      <aside className="w-64 bg-white border-r p-6 flex flex-col justify-between">
        <div>
          <h1 className="text-xl font-bold mb-8">ICT SaaS Admin</h1>

          <nav className="space-y-4 text-gray-600">
            <button className="flex items-center gap-2 font-medium text-black">
              <LayoutDashboard size={18} /> Dashboard
            </button>
            <button className="flex items-center gap-2 hover:text-black">
              <Ticket size={18} /> Tickets
            </button>
          </nav>
        </div>

        <button
          onClick={handleLogout}
          className="flex items-center gap-2 text-red-500 hover:text-red-600"
        >
          <LogOut size={18} /> Logout
        </button>
      </aside>

      {/* MAIN */}
      <main className="flex-1 p-8">

        {/* HEADER */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-semibold">Dashboard</h2>

          <button
            onClick={fetchTickets}
            className="flex items-center gap-2 bg-black text-white px-4 py-2 rounded-lg"
          >
            <RefreshCcw size={16} /> Refresh
          </button>
        </div>

        {/* STATS */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">

          <StatCard
            title="Total Tickets"
            value={tickets.length}
            icon={<Ticket />}
          />

          <StatCard
            title="Open"
            value={tickets.filter(t => t.status === "open").length}
            icon={<AlertCircle />}
          />

          <StatCard
            title="In Progress"
            value={tickets.filter(t => t.status === "in_progress").length}
            icon={<Clock />}
          />

          <StatCard
            title="Resolved"
            value={tickets.filter(t => t.status === "resolved").length}
            icon={<CheckCircle />}
          />

        </div>

        {/* FILTER + SEARCH */}
        <div className="flex flex-col md:flex-row gap-4 mb-4">

          <div className="flex items-center gap-2 bg-white border px-3 py-2 rounded-lg w-full md:w-96">
            <Search size={16} />
            <input
              placeholder="Search tickets..."
              className="w-full outline-none"
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <select
            className="border px-3 py-2 rounded-lg"
            onChange={(e) => setFilter(e.target.value)}
          >
            <option value="all">All</option>
            <option value="open">Open</option>
            <option value="in_progress">In Progress</option>
            <option value="resolved">Resolved</option>
          </select>

          <button className="flex items-center gap-2 border px-3 py-2 rounded-lg">
            <Filter size={16} /> Filter
          </button>

        </div>

        {/* TABLE */}
        <div className="bg-white border rounded-xl overflow-hidden">

          <table className="w-full text-left">
            <thead className="bg-gray-100 text-sm">
              <tr>
                <th className="p-4">ID</th>
                <th>Title</th>
                <th>Status</th>
                <th>Created</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td className="p-4" colSpan={4}>Loading...</td>
                </tr>
              ) : filteredTickets.length === 0 ? (
                <tr>
                  <td className="p-4" colSpan={4}>No tickets found</td>
                </tr>
              ) : (
                filteredTickets.map((t) => (
                  <tr key={t.id} className="border-t">
                    <td className="p-4 text-sm">{t.id.slice(0, 6)}</td>
                    <td>{t.title}</td>
                    <td>
                      <StatusBadge status={t.status} />
                    </td>
                    <td className="text-sm text-gray-500">
                      {new Date(t.created_at).toLocaleString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>

        </div>

      </main>
    </div>
  );
}

/* ---------------- COMPONENTS ---------------- */

function StatCard({
  title,
  value,
  icon,
}: {
  title: string;
  value: number;
  icon: React.ReactNode;
}) {
  return (
    <div className="bg-white border rounded-xl p-4 flex items-center justify-between">
      <div>
        <p className="text-sm text-gray-500">{title}</p>
        <h3 className="text-2xl font-bold">{value}</h3>
      </div>
      <div className="text-gray-400">{icon}</div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    open: "bg-red-100 text-red-600",
    in_progress: "bg-yellow-100 text-yellow-600",
    resolved: "bg-green-100 text-green-600",
  };

  return (
    <span className={`px-2 py-1 rounded text-xs ${colors[status]}`}>
      {status}
    </span>
  );
}