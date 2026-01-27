"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabaseClient";

export default function CompanyDashboard() {
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [requests, setRequests] = useState([]);

  async function handleDelete(requestId) {
    const confirmDelete = confirm(
      "Are you sure you want to delete this request? This will remove all replies.",
    );

    if (!confirmDelete) return;

    const { data: auth } = await supabase.auth.getUser();

    await fetch("/api/delete-request", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        request_id: requestId,
        company_id: auth.user.id,
      }),
    });

    fetchRequests(); // refresh list
  }

  async function handleBroadcast() {
    if (!message.trim()) return;

    setLoading(true);

    const { data: auth } = await supabase.auth.getUser();

    await fetch("/api/create-request", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message,
        company_id: auth.user.id,
      }),
    });

    setMessage("");
    setLoading(false);
    fetchRequests();
  }

  async function fetchRequests() {
    const { data: auth } = await supabase.auth.getUser();
    const res = await fetch(`/api/company-requests?company_id=${auth.user.id}`);

    const data = await res.json();
    setRequests(data);
  }

  useEffect(() => {
    fetchRequests();
  }, []);

  return (
    <div className="min-h-screen bg-slate-100 p-6">
      <h1 className="text-2xl font-bold text-slate-900 mb-6">
        Company Dashboard
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* LEFT: CREATE REQUEST */}
        <div className="bg-white p-6 rounded-xl shadow">
          <h2 className="text-lg font-semibold text-slate-800 mb-3">
            Broadcast Freight Rate Request
          </h2>

          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Example: Need rates for Karachi → Lahore, FMCG, 22 tons, available tomorrow..."
            rows={6}
            className="w-full border border-slate-300 rounded-lg p-3
                       text-slate-900 placeholder-slate-400
                       focus:outline-none focus:ring-2 focus:ring-blue-500"
          />

          <button
            onClick={handleBroadcast}
            disabled={loading}
            className="mt-4 w-full bg-indigo-600 text-white py-2 rounded-lg
                       hover:bg-indigo-700 transition disabled:opacity-60"
          >
            {loading ? "Broadcasting..." : "Broadcast Request"}
          </button>
        </div>

        {/* RIGHT: REQUESTS + REPLIES */}
        <div className="bg-white p-6 rounded-xl shadow overflow-y-auto max-h-[70vh]">
          <h2 className="text-lg font-semibold text-slate-800 mb-3">
            Requests & Transporter Replies
          </h2>

          {requests.length === 0 && (
            <p className="text-slate-500 text-sm">No requests yet.</p>
          )}

          <div className="space-y-4">
            {requests.map((req) => (
              <div
                key={req.id}
                className="border border-slate-200 rounded-lg p-4"
              >
                <div className="flex justify-between items-start mb-2">
                  <p className="text-sm text-slate-700 font-medium">Request:</p>

                  <button
                    onClick={() => handleDelete(req.id)}
                    className="text-sm text-red-600 hover:text-red-800 font-medium"
                  >
                    Delete
                  </button>
                </div>

                <p className="text-slate-900 mb-2">
                  {req.formatted_request_text}
                </p>

                <p className="text-sm text-slate-700 font-medium mt-2">
                  Replies:
                </p>

                {req.replies.length === 0 && (
                  <p className="text-slate-400 text-sm">No replies yet</p>
                )}

                {req.replies.map((r) => (
                  <div
                    key={r.id}
                    className="mt-2 bg-slate-50 p-2 rounded text-sm text-slate-800"
                  >
                    <strong>{r.transporter_name}:</strong> {r.raw_reply_text}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
