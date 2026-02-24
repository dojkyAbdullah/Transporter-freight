"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabaseClient";
import RequestDetails from "../../components/RequestDetails";

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
  const router = useRouter();
  const [accessAllowed, setAccessAllowed] = useState(false);
  const [requests, setRequests] = useState([]);
  const [rates, setRates] = useState({});
  const [loadingId, setLoadingId] = useState(null);

  async function fetchRequests() {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return;
    const res = await fetch(
      `/api/transporter-requests?transporter_id=${session.user.id}`
    );
    const data = await res.json();

    setRequests(Array.isArray(data) ? data : []);

    const initialRates = {};
    (Array.isArray(data) ? data : []).forEach((r) => {
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
    let mounted = true;
    async function checkAccess() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!mounted) return;
      if (!session?.user) {
        router.replace("/auth/login");
        return;
      }
      const { data: user } = await supabase
        .from("users")
        .select("role")
        .eq("id", session.user.id)
        .single();
      if (!mounted) return;
      if (user?.role !== "TRANSPORTER") {
        router.replace("/dashboard");
        return;
      }
      setAccessAllowed(true);
      fetchRequests();
    }
    checkAccess();
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      if (mounted) checkAccess();
    });
    return () => {
      mounted = false;
      subscription?.unsubscribe();
    };
  }, [router]);

 async function submitRate(requestId) {
  const payload = rates[requestId];

  if (!payload?.rate_pkr) {
    alert("Please enter rate");
    return;
  }

  if (!payload?.availability_date) {
    alert("Please select availability date");
    return;
  }

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

  async function handleLogout() {
    await supabase.auth.signOut();
    router.replace("/auth/login");
  }

  if (!accessAllowed) {
    return <p className="p-4">Checking access...</p>;
  }

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-slate-900">
          Transporter Dashboard
        </h1>
        <button
          type="button"
          onClick={handleLogout}
          className="text-slate-600 hover:text-slate-900 font-medium"
        >
          Logout
        </button>
      </div>

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

              {/* DETAILS - all fields (container size, special instructions, etc.) */}
              <div className="text-sm">
                <RequestDetails
                  movement_type={r.movement_type}
                  form_data={r.form_data}
                  formatted_request_text={r.formatted_request_text}
                />
              </div>

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
                  required
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
