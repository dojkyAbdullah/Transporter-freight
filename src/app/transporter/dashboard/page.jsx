"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabaseClient";

const Input = ({ label, disabled, ...props }) => (
  <div className="space-y-1">
    <label className="text-sm font-medium text-slate-700">{label}</label>
    <input
      disabled={disabled}
      {...props}
      className={`w-full rounded-lg border px-3 py-2
        ${disabled ? "bg-slate-100 text-slate-400" : "bg-white text-slate-900"}
        focus:outline-none focus:ring-2 focus:ring-indigo-500`}
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

    const res = await fetch("/api/submit-reply", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        request_id: requestId,
        transporter_id: auth.user.id,
        ...payload,
      }),
    });

    const result = await res.json();

    if (!res.ok) {
      alert(result.error);
    }

    setLoadingId(null);
    fetchRequests();
  }

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <h1 className="text-3xl font-bold text-slate-900 mb-8">
        Transporter Dashboard
      </h1>

      <div className="space-y-8">
        {requests.map((r) => {
          const isClosed = r.status === "CLOSED";

          return (
            <div
              key={r.id}
              className="bg-white rounded-2xl shadow p-6 space-y-6"
            >
              {/* HEADER */}
              <div className="flex justify-between items-center">
                <span
                  className={`px-3 py-1 rounded-full text-xs font-semibold text-white
                    ${isClosed ? "bg-red-600" : "bg-green-600"}`}
                >
                  {r.status}
                </span>

                <span className="text-xs text-slate-500">
                  {new Date(r.created_at).toLocaleString()}
                </span>
              </div>

              {/* DETAILS */}
              <p className="text-sm text-slate-700 whitespace-pre-line">
                {r.formatted_request_text}
              </p>

              {isClosed && (
                <p className="text-sm text-red-600 font-medium">
                  🚫 This request is closed. Bidding disabled.
                </p>
              )}

              {/* INPUTS */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Input
                  label="Rate (PKR)"
                  type="number"
                  disabled={isClosed}
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
                  disabled={isClosed}
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
                  disabled={isClosed}
                  value={rates[r.id]?.remarks || ""}
                  onChange={(e) =>
                    setRates((p) => ({
                      ...p,
                      [r.id]: { ...p[r.id], remarks: e.target.value },
                    }))
                  }
                />
              </div>

              {/* BUTTON */}
              <div className="flex justify-end">
                <button
                  onClick={() => submitRate(r.id)}
                  disabled={isClosed || loadingId === r.id}
                  className={`px-6 py-2 rounded-xl font-medium transition
                  ${
                    isClosed
                      ? "bg-slate-300 text-slate-500 cursor-not-allowed"
                      : loadingId === r.id
                      ? "bg-slate-300 text-slate-600"
                      : "bg-indigo-600 text-white hover:bg-indigo-700"
                  }`}
                >
                  {loadingId === r.id ? "Saving..." : "Save / Update Rate"}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
