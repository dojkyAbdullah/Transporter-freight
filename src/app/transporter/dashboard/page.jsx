"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabaseClient";
import RequestDetails from "../../components/RequestDetails";
import toast from "react-hot-toast";

const Input = ({ label, disabled, ...props }) => (
  <div className="space-y-1.5">
    <label className="text-sm font-medium text-slate-700">{label}</label>
    <input
      disabled={disabled}
      {...props}
      className={`w-full rounded-xl border border-slate-200 px-3 py-2.5 sm:py-2 text-base sm:text-sm
        ${disabled ? "bg-slate-100 text-slate-400" : "bg-white text-slate-900"}
        focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow`}
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

  // Real-time: refetch when requests change (new request, status update, etc.)
  useEffect(() => {
    if (!accessAllowed) return;

    const channel = supabase
      .channel("transporter-requests-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "requests" },
        () => {
          fetchRequests();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [accessAllowed]);

  async function submitRate(requestId) {
    const payload = rates[requestId];
    const ratePkr = payload?.rate_pkr != null && String(payload.rate_pkr).trim() !== "";

    if (!ratePkr) {
      toast.error("Please enter rate (PKR)");
      return;
    }

    if (!payload?.availability_date) {
      toast.error("Please select availability date");
      return;
    }

    const numRate = parseFloat(payload.rate_pkr);
    if (Number.isNaN(numRate) || numRate < 0) {
      toast.error("Please enter a valid rate");
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
    setLoadingId(null);

    if (!res.ok) {
      toast.error(result.error || "Failed to save rate");
      return;
    }

    toast.success("Rate saved successfully");
    fetchRequests();
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    router.replace("/auth/login");
  }

  if (!accessAllowed) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <p className="text-slate-600">Checking access...</p>
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-slate-50 dashboard-container p-4 sm:p-6 lg:p-8 pb-8 sm:pb-12">
      <header className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
          Transporter Dashboard
        </h1>
        <button
          type="button"
          onClick={handleLogout}
          className="inline-flex items-center px-3 py-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 font-medium text-sm sm:text-base transition-colors w-fit"
        >
          Logout
        </button>
      </header>

      <div className="space-y-6 sm:space-y-8 w-full max-w-[90rem]">
        {requests.map((r) => {
          const isClosed = r.status === "CLOSED";

          return (
            <div
              key={r.id}
              className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4 sm:p-6 space-y-5 sm:space-y-6"
            >
              {/* HEADER */}
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
                <span
                  className={`inline-flex w-fit px-3 py-1 rounded-full text-xs font-semibold text-white
                    ${isClosed ? "bg-rose-600" : "bg-blue-600"}`}
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
                <p className="text-sm text-rose-600 font-medium">
                  🚫 This request is closed. Bidding disabled.
                </p>
              )}

              {/* INPUTS */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
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
                  className={`w-full sm:w-auto min-h-11 px-6 py-2.5 sm:py-2 rounded-xl font-medium transition text-base sm:text-sm
                  ${
                    isClosed
                      ? "bg-slate-200 text-slate-500 cursor-not-allowed"
                      : loadingId === r.id
                      ? "bg-slate-200 text-slate-600"
                      : "bg-blue-600 text-white hover:bg-blue-700 active:scale-[0.99]"
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
