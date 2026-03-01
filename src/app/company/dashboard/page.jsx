"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabaseClient";
import RequestDetails from "../../components/RequestDetails";
import toast from "react-hot-toast";

const UPCOUNTRY_LANES = [
  "Novatex Landhi to Hyderabad",
  "Novatex Landhi to Sukkur",
  "Novatex Landhi to Rahim Yar Khan",
  "Novatex Landhi to Multan",
  "Novatex Landhi to Gujranwala",
  "Novatex Landhi to Lahore",
  "Novatex Landhi to Faisalabad",
  "Novatex Landhi to Hattar",
  "Novatex Landhi to Islamabad",
  "Novatex Landhi to Peshawar",
  "Novatex Landhi to Quetta",
  "Novatex Landhi to Sheikhupura",
  "Gujranwala to Novatex FSD",
  "Faisalabad to Novatex FSD",
  "Multan to Novatex FSD",
  "Lahore to Novatex FSD",
  "Hattar to Novatex FSD",
  "Peshawar to Novatex FSD",
  "Islamabad to Novatex FSD",
  "Hyderabad to Novatex Landhi",
  "Sukkur to Novatex Landhi",
  "Rahim Yar Khan to Novatex Landhi",
  "Multan to Novatex Landhi",
  "Gujranwala to Novatex Landhi",
  "Lahore to Novatex Landhi",
  "Hattar to Novatex Landhi",
  "Islamabad to Novatex Landhi",
  "Peshawar to Novatex Landhi",
  "Quetta to Novatex Landhi",
  "Nestle Sheikhupura to Novatex Landhi",
  "Gatron Hub to Hyderabad",
  "Gatron Hub to Sukkur",
  "Gatron Hub to Rahim Yar Khan",
  "Gatron Hub to Multan",
  "Gatron Hub to Gujranwala",
  "Gatron Hub to Lahore",
  "Gatron Hub to Faisalabad",
  "Gatron Hub to Hattar",
  "Gatron Hub to Islamabad",
  "Gatron Hub to Peshawar",
  "Gatron Hub to Quetta",
  "Gatron Hub to Sheikhupura",
  "Gatron Hub to Faisalabad Warehouse (Yarn)",
  "BOPET SKP to Multan",
  "BOPET SKP to Karachi",
  "Novatex Landhi to LHR Warehouse (In city) 25 KG BAGS",
  "BOPET SKP to Lahore",
  "BOPET SKP to Faisalabad",
  "BOPET KHI to Multan",
  "BOPET KHI to Multan + Faisalabad",
  "BOPET KHI to Multan + Lahore",
  "BOPET KHI to Sahiwal",
  "BOPET KHI to Sahiwal + Lahore",
  "BOPET KHI to Faisalabad",
  "BOPET KHI to Lahore",
  "BOPET KHI to Lahore + Faisalabad + Gujranwala",
  "BOPET KHI to Lahore + Faisalabad",
  "BOPET KHI to Gujranwala + Gujar Mandi",
  "BOPET KHI to Gujrat",
  "BOPET KHI to Rawalpindi",
  "BOPET KHI to Islamabad",
  "BOPET KHI to Gadon + Peshawar",
  "BOPET SKP to Gadon + Peshawar",
  "Krystallite SITE to Lahore",
];

const PORT_LANES = [
  "KHI-LAN-KHI",
  "KHI-LAN-PQ",
  "PQ-LAN-KHI",
  "PQ-LAN-PQ",
  "KHI-HUB-KHI",
  "KHI-HUB-PQ",
  "PQ-HUB-PQ",
  "KHI-SITE-KHI",
  "KHI-SITE-PQ",
  "PQ-SITE-KHI",
  "PQ-SITE-PQ",
  "LHR-SKP-KHI/PQ",
];

// Fixed commodities: Port Movement
const PORT_COMMODITIES = [
  "Preform",
  "Resin",
  "BOPET Film Roll",
  "Thermoforming",
  "Yarn",
  "Others",
];

// Fixed commodities: Upcountry Dispatch
const UPCOUNTRY_COMMODITIES = [
  "Preform",
  "Resin (25kg Bags)",
  "BOPET Film Roll",
  "Thermoforming",
  "Yarn",
  "Others",
];

const INITIAL_FORM = {
  loading_date: "",
  movement_type: "",

  port_commodity: "",
  container_size: "",
  container_count: "",
  weight_per_container: "",
  import_export: "",
  port_lane: "",
  cutoff_date: "",
  special_instructions: "",

  upcountry_commodity: "",
  upcountry_container_count: "",
  truck_type: "",
  bed_size: "",
  total_weight: "",
  upcountry_lane: "",
  customer_name: "",
  upcountry_instructions: "",
};

const Input = ({ label, ...props }) => (
  <div className="space-y-1.5">
    <label className="text-sm font-medium text-slate-700">{label}</label>
    <input
      {...props}
      className="w-full rounded-xl border border-slate-200 px-3 py-2.5 sm:py-2
                 text-slate-900 bg-white text-base sm:text-sm
                 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                 transition-shadow"
    />
  </div>
);

const Select = ({ label, children, ...props }) => (
  <div className="space-y-1.5">
    <label className="text-sm font-medium text-slate-700">{label}</label>
    <select
      {...props}
      className="w-full rounded-xl border border-slate-200 px-3 py-2.5 sm:py-2
                 text-slate-900 bg-white text-base sm:text-sm
                 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                 transition-shadow"
    >
      {children}
    </select>
  </div>
);

const Textarea = ({ label, ...props }) => (
  <div className="space-y-1.5">
    <label className="text-sm font-medium text-slate-700">{label}</label>
    <textarea
      {...props}
      rows={4}
      className="w-full rounded-xl border border-slate-200 px-3 py-2.5 sm:py-2
                 text-slate-900 bg-white text-base sm:text-sm
                 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                 resize-none transition-shadow"
    />
  </div>
);
function getRequestedTotal(r) {
  if (!r?.form_data) return 1;
  const fd = r.form_data;
  if (r.movement_type === "PORT") {
    const n = parseInt(fd.container_count, 10);
    return Number.isFinite(n) && n > 0 ? n : 1;
  }
  if (r.movement_type === "UPCOUNTRY") {
    return Infinity; // Open allocation: no fixed count
  }
  return 1;
}

function isOpenAllocation(r) {
  return r?.movement_type === "UPCOUNTRY";
}

const ALLOWED_COMPANY_ROLES = ["ADMIN", "INLAND_EXECUTIVE", "COMPANY"];

export default function CompanyDashboard() {
  const router = useRouter();
  const [accessAllowed, setAccessAllowed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [requests, setRequests] = useState([]);
  const [form, setForm] = useState(INITIAL_FORM);
  const [transporters, setTransporters] = useState([]);
  const [selectedTransporterIds, setSelectedTransporterIds] = useState([]);
  const [closingId, setClosingId] = useState(null);
  const [referenceNumber, setReferenceNumber] = useState("");
  const [closeAllocationQuantities, setCloseAllocationQuantities] = useState({});
  const [userRole, setUserRole] = useState(null);

  async function fetchRequests() {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return;
    const { data: user } = await supabase
      .from("users")
      .select("role")
      .eq("id", session.user.id)
      .single();
    setUserRole(user?.role ?? null);
    const isAdmin = user?.role === "ADMIN";
    const url = isAdmin
      ? `/api/company-requests?caller_id=${session.user.id}&get_all=true`
      : `/api/company-requests?company_id=${session.user.id}&caller_id=${session.user.id}`;
    const res = await fetch(url);
    const data = await res.json();
    if (res.ok && Array.isArray(data)) {
      setRequests(data);
    } else if (!res.ok) {
      setRequests([]);
    }
  }

  async function fetchTransporters() {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return;
    const res = await fetch(`/api/transporters?caller_id=${session.user.id}`);
    const data = await res.json();
    if (res.ok && Array.isArray(data)) {
      setTransporters(data);
    }
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
      const role = user?.role ?? null;
      if (!ALLOWED_COMPANY_ROLES.includes(role)) {
        router.replace("/dashboard");
        return;
      }
      setUserRole(role);
      setAccessAllowed(true);
      fetchRequests();
      fetchTransporters();
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

  // Real-time: refetch when our requests or replies change
  const realtimeChannelsRef = useRef([]);
  useEffect(() => {
    if (!accessAllowed) return;

    let cancelled = false;
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user || cancelled) return;

      const isAdmin = userRole === "ADMIN";
      const opts = {
        event: "*",
        schema: "public",
        table: "requests",
      };
      if (!isAdmin) {
        opts.filter = `company_id=eq.${session.user.id}`;
      }

      const ch1 = supabase
        .channel("company-requests-realtime")
        .on("postgres_changes", opts, () => {
          fetchRequests();
        })
        .subscribe();

      const ch2 = supabase
        .channel("company-replies-realtime")
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "transporter_replies" },
          () => {
            fetchRequests();
          }
        )
        .subscribe();

      const ch3 = supabase
        .channel("company-transporters-realtime")
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "users" },
          () => {
            fetchTransporters();
          }
        )
        .subscribe();

      if (cancelled) {
        supabase.removeChannel(ch1);
        supabase.removeChannel(ch2);
        supabase.removeChannel(ch3);
        return;
      }
      realtimeChannelsRef.current = [ch1, ch2, ch3];
    })();

    return () => {
      cancelled = true;
      realtimeChannelsRef.current.forEach((ch) => {
        if (ch) supabase.removeChannel(ch);
      });
      realtimeChannelsRef.current = [];
    };
  }, [accessAllowed, userRole]);

  async function handleSubmit() {
    if (!form.movement_type) {
      toast.error("Please select a movement type");
      return;
    }
    if (!form.loading_date?.trim()) {
      toast.error("Please select a loading date");
      return;
    }
    if (form.movement_type === "PORT") {
      if (!form.port_commodity?.trim()) {
        toast.error("Please select a commodity for Port Movement");
        return;
      }
      if (form.container_count == null || String(form.container_count).trim() === "") {
        toast.error("Please enter container count");
        return;
      }
      if (!form.container_size?.trim()) {
        toast.error("Please select container size");
        return;
      }
      if (form.weight_per_container == null || String(form.weight_per_container).trim() === "") {
        toast.error("Please enter weight per container (MT)");
        return;
      }
      if (!form.import_export?.trim()) {
        toast.error("Please select Import or Export");
        return;
      }
      if (!form.port_lane?.trim()) {
        toast.error("Please select a port lane");
        return;
      }
      if (!form.cutoff_date?.trim()) {
        toast.error("Please enter cut-off date");
        return;
      }
      // special_instructions is optional (remarks)
    }
    if (form.movement_type === "UPCOUNTRY") {
      if (!form.upcountry_commodity?.trim()) {
        toast.error("Please select a commodity for Upcountry Dispatch");
        return;
      }
      if (!form.truck_type?.trim()) {
        toast.error("Please select truck type");
        return;
      }
      if (!form.bed_size?.trim()) {
        toast.error("Please select bed size");
        return;
      }
      if (form.total_weight == null || String(form.total_weight).trim() === "") {
        toast.error("Please enter total weight (MT)");
        return;
      }
      if (!form.upcountry_lane?.trim()) {
        toast.error("Please select an upcountry lane");
        return;
      }
      if (!form.customer_name?.trim()) {
        toast.error("Please enter customer name");
        return;
      }
      // upcountry_instructions is optional (remarks)
    }

    if (typeof navigator !== "undefined" && !navigator.onLine) {
      toast.error("You're offline. Please connect to the internet to create a request.");
      return;
    }

    setLoading(true);
    try {
      const { data: auth } = await supabase.auth.getUser();
      const res = await fetch("/api/create-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          company_id: auth.user.id,
          caller_id: auth.user.id,
          ...form,
          target_transporter_ids:
            selectedTransporterIds.length > 0 ? selectedTransporterIds : null,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        toast.error(data.error || "Failed to submit RFQ");
        return;
      }

      setForm(INITIAL_FORM);
      setSelectedTransporterIds([]);
      fetchRequests();
      toast.success("RFQ submitted successfully");
    } catch (err) {
      toast.error("Network error. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }

  function toggleTransporter(id) {
    setSelectedTransporterIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  async function handleDelete(id, companyId) {
    if (!confirm("Delete this request?")) return;

    const { data: auth } = await supabase.auth.getUser();
    const res = await fetch("/api/delete-request", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        request_id: id,
        company_id: companyId ?? auth.user.id,
        caller_id: auth.user.id,
      }),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      toast.error(data.error || "Failed to delete request");
      return;
    }
    fetchRequests();
    toast.success("Request deleted");
  }

  function setAllocationQty(requestId, transporterId, value) {
    setCloseAllocationQuantities((prev) => ({
      ...prev,
      [requestId]: {
        ...(prev[requestId] || {}),
        [transporterId]: value,
      },
    }));
  }

  async function handleCloseRequest(id, companyId, request) {
    if (!referenceNumber.trim()) {
      toast.error("SAP Reference number is required to close request");
      return;
    }

    const requestedTotal = getRequestedTotal(request);
    const allocations = (request.replies || []).map((rep) => ({
      transporter_id: rep.transporter_id,
      allocated_count: parseInt(closeAllocationQuantities[id]?.[rep.transporter_id], 10) || 0,
    }));
    const totalAllocated = allocations
      .filter((a) => a.allocated_count > 0)
      .reduce((sum, a) => sum + a.allocated_count, 0);

    if (request.movement_type === "PORT" && totalAllocated > requestedTotal) {
      toast.error(
        `Total allocated (${totalAllocated}) cannot exceed requested count (${requestedTotal})`
      );
      return;
    }

    const { data: auth } = await supabase.auth.getUser();

    const res = await fetch("/api/close-request", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        request_id: id,
        company_id: companyId ?? auth.user.id,
        caller_id: auth.user.id,
        reference_number: referenceNumber,
        transporter_allocations: allocations.filter((a) => a.allocated_count > 0),
      }),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      toast.error(data.error || "Failed to close request");
      return;
    }

    setClosingId(null);
    setReferenceNumber("");
    setCloseAllocationQuantities((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
    fetchRequests();
    toast.success("Request closed successfully");
  }

  async function handleReopen(id, companyId) {
    const { data: auth } = await supabase.auth.getUser();

    const res = await fetch("/api/reopen-request", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        request_id: id,
        company_id: companyId ?? auth.user.id,
        caller_id: auth.user.id,
      }),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      toast.error(data.error || "Failed to reopen request");
      return;
    }
    fetchRequests();
    toast.success("Request reopened");
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
      {/* Header: stacks on mobile */}
      <header className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
          Inland Executive Dashboard
        </h1>
        <div className="flex flex-wrap items-center gap-3 sm:gap-4">
          {userRole === "ADMIN" && (
            <a
              href="/admin/dashboard"
              className="inline-flex items-center px-3 py-2 rounded-xl text-blue-600 hover:text-blue-700 hover:bg-blue-50 font-medium text-sm sm:text-base transition-colors"
            >
              Admin →
            </a>
          )}
          <button
            type="button"
            onClick={handleLogout}
            className="inline-flex items-center px-3 py-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 font-medium text-sm sm:text-base transition-colors"
          >
            Logout
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 lg:gap-8 max-w-[90rem]">

        {/* ================= RFQ FORM ================= */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4 sm:p-6 space-y-5 sm:space-y-6">
          <h2 className="text-lg sm:text-xl font-semibold text-slate-800">
            Create Freight RFQ
          </h2>

          <Input
            label="Loading Date *"
            type="date"
            value={form.loading_date}
            onChange={(e) =>
              setForm((f) => ({ ...f, loading_date: e.target.value }))
            }
          />

          <Select
            label="Movement Type *"
            value={form.movement_type}
            onChange={(e) =>
              setForm((f) => ({ ...f, movement_type: e.target.value }))
            }
          >
            <option value="">Select</option>
            <option value="PORT">Port Movement</option>
            <option value="UPCOUNTRY">Upcountry Dispatch</option>
          </Select>

          <div className="space-y-2">
            <p className="text-sm font-medium text-slate-700">
              Send request to transporters
            </p>

            {transporters.length === 0 ? (
              <p className="text-xs text-slate-400 italic">Loading transporters…</p>
            ) : (
              <>
                <div className="flex flex-wrap gap-2 mb-2">
                  <button
                    type="button"
                    onClick={() => setSelectedTransporterIds(transporters.map((t) => t.id))}
                    className="text-xs sm:text-sm px-3 py-2 sm:py-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 transition-colors"
                  >
                    Select all
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedTransporterIds([])}
                    className="text-xs sm:text-sm px-3 py-2 sm:py-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 transition-colors"
                  >
                    Deselect all
                  </button>
                </div>
                <div className="max-h-32 sm:max-h-36 overflow-y-auto rounded-xl border border-slate-200 bg-slate-50/50 p-3 space-y-2">
                {transporters.map((t) => (
                  <label
                    key={t.id}
                    className="flex items-center gap-2 cursor-pointer text-sm text-slate-800 py-0.5 min-h-11 sm:min-h-0 flex-wrap"
                  >
                    <input
                      type="checkbox"
                      checked={selectedTransporterIds.includes(t.id)}
                      onChange={() => toggleTransporter(t.id)}
                      className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 size-4 shrink-0"
                    />
                    <span>{t.name}</span>
                    {t.company_name && (
                      <span className="text-slate-500 text-xs">({t.company_name})</span>
                    )}
                  </label>
                ))}
                </div>
              </>
            )}
          </div>

          {/* Port Movement fields */}
          {form.movement_type === "PORT" && (
            <div className="space-y-4 pt-2 border-t border-slate-200">
              <h3 className="text-sm font-semibold text-slate-800">Port details</h3>
              <Select
                label="Commodity *"
                value={form.port_commodity}
                onChange={(e) =>
                  setForm((f) => ({ ...f, port_commodity: e.target.value }))
                }
              >
                <option value="">Choose</option>
                {PORT_COMMODITIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </Select>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Container count *"
                  type="number"
                  value={form.container_count}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, container_count: e.target.value }))
                  }
                />
                <Select
                  label="Container size *"
                  value={form.container_size}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, container_size: e.target.value }))
                  }
                >
                  <option value="">Select</option>
                  <option value="20ft">20ft</option>
                  <option value="40ft">40ft</option>
                </Select>
              </div>
              <Input
                label="Weight per container (MT) *"
                type="number"
                step="0.01"
                value={form.weight_per_container}
                onChange={(e) =>
                  setForm((f) => ({ ...f, weight_per_container: e.target.value }))
                }
              />
              <Select
                label="Import / Export *"
                value={form.import_export}
                onChange={(e) =>
                  setForm((f) => ({ ...f, import_export: e.target.value }))
                }
              >
                <option value="">Select</option>
                <option value="Import">Import</option>
                <option value="Export">Export</option>
              </Select>
              <Select
                label="Port lane *"
                value={form.port_lane}
                onChange={(e) =>
                  setForm((f) => ({ ...f, port_lane: e.target.value }))
                }
              >
                <option value="">Select lane</option>
                {PORT_LANES.map((lane) => (
                  <option key={lane} value={lane}>{lane}</option>
                ))}
              </Select>
              <Input
                label="Cut-off date *"
                type="date"
                value={form.cutoff_date}
                onChange={(e) =>
                  setForm((f) => ({ ...f, cutoff_date: e.target.value }))
                }
              />
              <Textarea
                label="Special instructions"
                value={form.special_instructions}
                onChange={(e) =>
                  setForm((f) => ({ ...f, special_instructions: e.target.value }))
                }
              />
            </div>
          )}

          {/* Upcountry Dispatch fields */}
          {form.movement_type === "UPCOUNTRY" && (
            <div className="space-y-4 pt-2 border-t border-slate-200">
              <h3 className="text-sm font-semibold text-slate-800">Upcountry details</h3>
              <Select
                label="Commodity *"
                value={form.upcountry_commodity}
                onChange={(e) =>
                  setForm((f) => ({ ...f, upcountry_commodity: e.target.value }))
                }
              >
                <option value="">Choose</option>
                {UPCOUNTRY_COMMODITIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </Select>
              <Select
                label="Truck type *"
                value={form.truck_type}
                onChange={(e) =>
                  setForm((f) => ({ ...f, truck_type: e.target.value }))
                }
              >
                <option value="">Select</option>
                <option value="Container">Container</option>
                <option value="Flatbed">Flatbed</option>
              </Select>
              <Select
                label="Bed size *"
                value={form.bed_size}
                onChange={(e) =>
                  setForm((f) => ({ ...f, bed_size: e.target.value }))
                }
              >
                <option value="">Select</option>
                <option value="20ft">20ft</option>
                <option value="40ft">40ft</option>
              </Select>
              <Input
                label="Total weight (MT) *"
                type="number"
                step="0.01"
                value={form.total_weight}
                onChange={(e) =>
                  setForm((f) => ({ ...f, total_weight: e.target.value }))
                }
              />
              <Select
                label="Upcountry lane *"
                value={form.upcountry_lane}
                onChange={(e) =>
                  setForm((f) => ({ ...f, upcountry_lane: e.target.value }))
                }
              >
                <option value="">Select lane</option>
                {UPCOUNTRY_LANES.map((lane) => (
                  <option key={lane} value={lane}>{lane}</option>
                ))}
              </Select>
              <Input
                label="Customer name *"
                value={form.customer_name}
                onChange={(e) =>
                  setForm((f) => ({ ...f, customer_name: e.target.value }))
                }
              />
              <Textarea
                label="Special instructions"
                value={form.upcountry_instructions}
                onChange={(e) =>
                  setForm((f) => ({ ...f, upcountry_instructions: e.target.value }))
                }
              />
            </div>
          )}

          <button
            onClick={handleSubmit}
            disabled={loading || !form.movement_type}
            className="w-full bg-blue-600 text-white py-3 sm:py-3 rounded-xl
                       hover:bg-blue-700 transition font-medium text-base
                       disabled:opacity-50 disabled:cursor-not-allowed
                       active:scale-[0.99]"
          >
            {loading ? "Submitting..." : "Submit RFQ"}
          </button>
        </div>

        {/* ================= REQUESTS ================= */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4 sm:p-6 overflow-y-auto max-h-[70vh] sm:max-h-[75vh] lg:max-h-[85vh]">
          <h2 className="text-lg sm:text-xl font-semibold text-slate-900 mb-4">
            Submitted Requests
          </h2>

          {requests.map((r) => (
            <div
              key={r.id}
              className="border border-slate-200 rounded-xl p-4 mb-4 bg-slate-50/80"
            >
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 mb-2">
                <span
                  className={`inline-flex w-fit px-3 py-1 rounded-full text-xs font-semibold text-white
                  ${r.status === "CLOSED" ? "bg-rose-600" : "bg-blue-600"}`}
                >
                  {r.status}
                </span>

                <div className="flex flex-wrap gap-2 sm:gap-3">
                  {r.status === "OPEN" && (
                    <button
                      onClick={() => setClosingId(r.id)}
                      className="text-sm text-amber-600 hover:text-amber-700 font-medium py-1"
                    >
                      Close
                    </button>
                  )}

                  {r.status === "CLOSED" && (
                    <button
                      onClick={() => handleReopen(r.id, r.company_id)}
                      className="text-sm text-blue-600 hover:text-blue-700 font-medium py-1"
                    >
                      Reopen
                    </button>
                  )}

                  <button
                    onClick={() => handleDelete(r.id, r.company_id)}
                    className="text-sm text-rose-600 hover:text-rose-700 font-medium py-1"
                  >
                    Delete
                  </button>
                </div>
              </div>

              {r.reference_number && (
                <p className="text-xs text-blue-700 font-medium">
                  Ref: {r.reference_number}
                </p>
              )}
              {r.status === "CLOSED" &&
                r.transporter_allocations?.length > 0 && (
                  <p className="text-xs text-slate-600 mt-1">
                    Allocations:{" "}
                    {r.transporter_allocations
                      .map(
                        (a) =>
                          `${r.replies?.find((x) => x.transporter_id === a.transporter_id)?.transporter_name ?? "Transporter"}: ${a.allocated_count}`
                      )
                      .join(", ")}
                  </p>
                )}

              <p className="text-xs text-slate-500 mb-2">
                {new Date(r.created_at).toLocaleString()}
              </p>

              <div className="text-sm text-slate-900 mb-4">
                <RequestDetails
                  movement_type={r.movement_type}
                  form_data={r.form_data}
                  formatted_request_text={r.formatted_request_text}
                />
              </div>

              {/* Close form: Reference + Transporter allocation */}
              {closingId === r.id && (
                <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-4">
                  <Input
                    label="SAP Reference Number *"
                    value={referenceNumber}
                    onChange={(e) => setReferenceNumber(e.target.value)}
                  />

                  <div>
                    <p className="text-sm font-semibold text-slate-800 mb-2">
                      Transporter allocation *
                    </p>
                    <p className="text-xs text-slate-500 mb-2">
                      {isOpenAllocation(r)
                        ? "Open allocation — allocate as many containers/trucks as needed to transporters who submitted rates."
                        : `Requested total: ${getRequestedTotal(r)} — Allocate containers/trucks to bidders (total must not exceed requested).`}
                    </p>
                    {r.replies?.length === 0 ? (
                      <p className="text-sm text-slate-500 italic">
                        No bids yet. You can still close with reference number only.
                      </p>
                    ) : (
                      <>
                        <div className="space-y-2 mb-2">
                          {r.replies.map((rep) => {
                            const qty =
                              closeAllocationQuantities[r.id]?.[rep.transporter_id] ?? "";
                            return (
                              <div
                                key={rep.id}
                                className="flex flex-wrap items-center gap-2"
                              >
                                <span className="text-sm text-slate-700 min-w-30">
                                  {rep.transporter_name}
                                  {rep.rate_pkr != null && (
                                    <span className="text-slate-500 ml-1">
                                      (PKR {rep.rate_pkr})
                                    </span>
                                  )}
                                </span>
                                <input
                                  type="number"
                                  min="0"
                                  {...(isOpenAllocation(r) ? {} : { max: getRequestedTotal(r) })}
                                  placeholder="0"
                                  value={qty}
                                  onChange={(e) =>
                                    setAllocationQty(r.id, rep.transporter_id, e.target.value)
                                  }
                                  className="w-16 rounded-lg border border-slate-200 px-2 py-1.5 text-sm text-slate-900 focus:ring-2 focus:ring-blue-500"
                                />
                                <span className="text-xs text-slate-400">qty</span>
                              </div>
                            );
                          })}
                        </div>
                        {!isOpenAllocation(r) && (
                          <p className="text-xs text-slate-600">
                            Allocated:{" "}
                            {r.replies.reduce(
                              (sum, rep) =>
                                sum +
                                (parseInt(
                                  closeAllocationQuantities[r.id]?.[rep.transporter_id],
                                  10
                                ) || 0),
                              0
                            )}{" "}
                            / {getRequestedTotal(r)} — Remaining:{" "}
                            {getRequestedTotal(r) -
                              r.replies.reduce(
                                (sum, rep) =>
                                  sum +
                                  (parseInt(
                                    closeAllocationQuantities[r.id]?.[rep.transporter_id],
                                    10
                                  ) || 0),
                                0
                              )}
                          </p>
                        )}
                        {isOpenAllocation(r) && (
                          <p className="text-xs text-slate-600">
                            Total allocated:{" "}
                            {r.replies.reduce(
                              (sum, rep) =>
                                sum +
                                (parseInt(
                                  closeAllocationQuantities[r.id]?.[rep.transporter_id],
                                  10
                                ) || 0),
                              0
                            )}
                          </p>
                        )}
                      </>
                    )}
                  </div>

                  <button
                    onClick={() => handleCloseRequest(r.id, r.company_id, r)}
                    className="w-full bg-rose-600 text-white py-2.5 rounded-xl hover:bg-rose-700 font-medium transition-colors"
                  >
                    Confirm Close
                  </button>
                </div>
              )}

              {/* Replies */}
              <p className="text-sm font-semibold text-slate-900 mb-2">
                Transporter Rates
              </p>

              {r.replies?.length === 0 && (
                <p className="text-sm text-slate-500 italic">
                  No rates submitted yet
                </p>
              )}

              {r.replies?.map((rep) => (
                <div
                  key={rep.id}
                  className="mt-2 bg-white border border-slate-200 rounded-xl p-3 text-sm"
                >
                  <b className="text-blue-700">
                    {rep.transporter_name}
                  </b>
                  <div className="text-slate-800 mt-1">
                    {rep.reply_text}
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
