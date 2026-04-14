"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import { ArrowLeft, Send } from "lucide-react";

export default function CreateTicketPage() {
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [userId, setUserId] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    getUser();
  }, []);

  const getUser = async () => {
    const { data } = await supabase.auth.getUser();

    if (!data.user) {
      router.replace("/login");
      return;
    }

    setUserId(data.user.id);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title) {
      setErrorMsg("Title is required");
      return;
    }

    if (!userId) {
      setErrorMsg("User not found");
      return;
    }

    try {
      setLoading(true);
      setErrorMsg("");

      const { error } = await supabase.from("tickets").insert({
        title,
        description,
        status: "Open",
        user_id: userId,
      });

      if (error) {
        setErrorMsg(error.message);
        return;
      }

      // ✅ Redirect after success
      router.push("/dashboard");

    } catch (err) {
      console.error(err);
      setErrorMsg("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-100 via-white to-gray-200 px-4">

      {/* CARD */}
      <div className="w-full max-w-lg bg-white/70 backdrop-blur-xl border border-gray-200 rounded-2xl p-6 shadow-xl">

        {/* HEADER */}
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={() => router.back()}
            className="p-2 rounded-lg border hover:bg-gray-100"
          >
            <ArrowLeft size={16} />
          </button>

          <h1 className="text-xl font-semibold">Create Ticket</h1>
        </div>

        {/* FORM */}
        <form onSubmit={handleSubmit} className="space-y-4">

          {/* ERROR */}
          {errorMsg && (
            <div className="text-sm text-red-600 bg-red-50 border border-red-200 p-3 rounded-xl">
              {errorMsg}
            </div>
          )}

          {/* TITLE */}
          <div>
            <label className="text-xs text-gray-500 uppercase">
              Title
            </label>
            <input
              type="text"
              value={title}
              disabled={loading}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter issue title"
              className="w-full mt-2 p-3 border rounded-xl focus:ring-2 focus:ring-black/40 outline-none"
            />
          </div>

          {/* DESCRIPTION */}
          <div>
            <label className="text-xs text-gray-500 uppercase">
              Description
            </label>
            <textarea
              value={description}
              disabled={loading}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the issue..."
              rows={4}
              className="w-full mt-2 p-3 border rounded-xl focus:ring-2 focus:ring-black/40 outline-none"
            />
          </div>

          {/* SUBMIT */}
          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 bg-black text-white py-3 rounded-xl hover:opacity-90 transition disabled:opacity-50"
          >
            <Send size={16} />
            {loading ? "Submitting..." : "Submit Ticket"}
          </button>

        </form>
      </div>
    </div>
  );
}