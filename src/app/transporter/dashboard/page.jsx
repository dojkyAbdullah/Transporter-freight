"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabaseClient";

const Input = ({ label, ...props }) => (
  <div className="space-y-1">
    <label className="text-sm font-medium text-slate-700">{label}</label>
    <input
      {...props}
      className="w-full rounded-lg border border-slate-300 px-3 py-2
                 text-slate-900 bg-white
                 focus:outline-none focus:ring-2 focus:ring-indigo-500"
    />
  </div>
);

export default function TransporterDashboard() {
  const [requests, setRequests] = useState([]);
  const [rates, setRates] = useState({});
  const [loadingId, setLoadingId] = useState(null);

  async function fetchRequests() {
    const { data: auth } = await supabase.auth.getUser();

    const res = await fetch(
      `/api/transporter-requests?transporter_id=${auth.user.id}`
    );
    const data = await res.json();

    setRequests(data);

    // 🔥 Prefill previously submitted rates
    const initialRates = {};
    data.forEach((r) => {
      if (r.my_reply) {
        initialRates[r.id] = {
          rate_pkr: r.my_reply.rate_pkr || "",
          availability_date: r.my_reply.availability_date || "",
          remarks: r.my_reply.remarks || "",
        };
      }
    });

    setRates(initialRates);
  }

  useEffect(() => {
    fetchRequests();
  }, []);

  async function submitRate(requestId) {
    const payload = rates[requestId];
    if (!payload?.rate_pkr) return alert("Enter rate");

    setLoadingId(requestId);
    const { data: auth } = await supabase.auth.getUser();

    await fetch("/api/submit-reply", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        request_id: requestId,
        transporter_id: auth.user.id,
        ...payload,
      }),
    });

    setLoadingId(null);
    fetchRequests();
  }

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <h1 className="text-3xl font-bold text-slate-900 mb-8">
        Transporter Dashboard
      </h1>

      <div className="space-y-8">
        {requests.map((r) => (
          <div key={r.id} className="bg-white rounded-2xl shadow p-6 space-y-6">
            {/* RFQ DETAILS */}
            <div className="space-y-3">
              <span
                className="inline-block px-3 py-1 rounded-full text-xs font-semibold
                           bg-indigo-100 text-indigo-700"
              >
                {r.movement_type}
              </span>

              <p className="text-sm text-slate-700 whitespace-pre-line">
                {r.formatted_request_text}
              </p>

              {r.my_reply && (
                <p className="text-xs text-green-600 font-medium">
                  ✔ You have already submitted a rate
                </p>
              )}
            </div>

            {/* RATE INPUTS */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Input
                label="Rate (PKR)"
                type="number"
                value={rates[r.id]?.rate_pkr || ""}
                onChange={(e) =>
                  setRates((p) => ({
                    ...p,
                    [r.id]: { ...p[r.id], rate_pkr: e.target.value },
                  }))
                }
              />

              <Input
                label="Availability Date"
                type="date"
                value={rates[r.id]?.availability_date || ""}
                onChange={(e) =>
                  setRates((p) => ({
                    ...p,
                    [r.id]: {
                      ...p[r.id],
                      availability_date: e.target.value,
                    },
                  }))
                }
              />

              <Input
                label="Remarks"
                value={rates[r.id]?.remarks || ""}
                onChange={(e) =>
                  setRates((p) => ({
                    ...p,
                    [r.id]: { ...p[r.id], remarks: e.target.value },
                  }))
                }
              />
            </div>

            {/* ACTION */}
            <div className="flex justify-end">
              <button
                onClick={() => submitRate(r.id)}
                disabled={loadingId === r.id}
                className={`px-6 py-2 rounded-xl font-medium transition
                ${
                  loadingId === r.id
                    ? "bg-slate-300 text-slate-600 cursor-not-allowed"
                    : "bg-indigo-600 text-white hover:bg-indigo-700"
                }`}
              >
                {loadingId === r.id ? "Saving..." : "Save / Update Rate"}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
