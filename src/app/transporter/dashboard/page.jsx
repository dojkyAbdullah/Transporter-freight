"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabaseClient";

export default function TransporterDashboard() {
  const [requests, setRequests] = useState([]);
  const [replyText, setReplyText] = useState({});
  const [loadingId, setLoadingId] = useState(null);

  async function fetchRequests() {
    const { data: auth } = await supabase.auth.getUser();

    const res = await fetch(
      `/api/transporter-requests?transporter_id=${auth.user.id}`
    );
    const data = await res.json();
    setRequests(data);
  }

  async function submitReply(requestId) {
    if (!replyText[requestId]?.trim()) return;

    setLoadingId(requestId);

    const { data: auth } = await supabase.auth.getUser();

    await fetch("/api/submit-reply", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        request_id: requestId,
        transporter_id: auth.user.id,
        raw_reply_text: replyText[requestId],
      }),
    });

    setReplyText((prev) => ({ ...prev, [requestId]: "" }));
    setLoadingId(null);
    fetchRequests();
  }

  useEffect(() => {
    fetchRequests();
  }, []);

  return (
    <div className="min-h-screen bg-slate-100 p-6">
      <h1 className="text-2xl font-bold text-slate-900 mb-6">
        Transporter Dashboard
      </h1>

      {requests.length === 0 && (
        <p className="text-slate-500">No requests available.</p>
      )}

      <div className="space-y-6">
        {requests.map((req) => (
          <div
            key={req.id}
            className="bg-white p-6 rounded-xl shadow"
          >
            <p className="text-sm text-slate-600 font-medium">
              Request
            </p>
            <p className="text-slate-900 mb-4">
              {req.formatted_request_text}
            </p>

            {req.alreadyReplied ? (
              <p className="text-green-600 font-medium">
                ✅ You have submitted your rate
              </p>
            ) : (
              <>
                <textarea
                  value={replyText[req.id] || ""}
                  onChange={(e) =>
                    setReplyText({
                      ...replyText,
                      [req.id]: e.target.value,
                    })
                  }
                  placeholder="Enter your rate details here..."
                  rows={4}
                  className="w-full border border-slate-300 rounded p-3
                             text-slate-900 focus:outline-none
                             focus:ring-2 focus:ring-blue-500"
                />

                <button
                  onClick={() => submitReply(req.id)}
                  disabled={loadingId === req.id}
                  className="mt-3 bg-indigo-600 text-white px-4 py-2 rounded
                             hover:bg-indigo-700 disabled:opacity-60"
                >
                  {loadingId === req.id
                    ? "Submitting..."
                    : "Submit Reply"}
                </button>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
