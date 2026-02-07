"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabaseClient";

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
  truck_type: "",
  bed_size: "",
  total_weight: "",
  upcountry_lane: "",
  customer_name: "",
  upcountry_instructions: "",
};

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

const Select = ({ label, children, ...props }) => (
  <div className="space-y-1">
    <label className="text-sm font-medium text-slate-700">{label}</label>
    <select
      {...props}
      className="w-full rounded-lg border border-slate-300 px-3 py-2
                 text-slate-900 bg-white
                 focus:outline-none focus:ring-2 focus:ring-indigo-500"
    >
      {children}
    </select>
  </div>
);

const Textarea = ({ label, ...props }) => (
  <div className="space-y-1">
    <label className="text-sm font-medium text-slate-700">{label}</label>
    <textarea
      {...props}
      rows={4}
      className="w-full rounded-lg border border-slate-300 px-3 py-2
                 text-slate-900 bg-white
                 focus:outline-none focus:ring-2 focus:ring-indigo-500
                 resize-none"
    />
  </div>
);

export default function CompanyDashboard() {
  const [loading, setLoading] = useState(false);
  const [requests, setRequests] = useState([]);
  const [form, setForm] = useState(INITIAL_FORM);

  async function fetchRequests() {
    const { data: auth } = await supabase.auth.getUser();
    const res = await fetch(`/api/company-requests?company_id=${auth.user.id}`);
    setRequests(await res.json());
  }

  useEffect(() => {
    fetchRequests();
  }, []);

  async function handleSubmit() {
    setLoading(true);
    const { data: auth } = await supabase.auth.getUser();

    await fetch("/api/create-request", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ company_id: auth.user.id, ...form }),
    });

    setLoading(false);
    setForm(INITIAL_FORM);

    fetchRequests();
  }

  async function handleDelete(id) {
    if (!confirm("Delete this request?")) return;

    const { data: auth } = await supabase.auth.getUser();
    await fetch("/api/delete-request", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ request_id: id, company_id: auth.user.id }),
    });

    fetchRequests();
  }

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <h1 className="text-3xl font-bold text-slate-900 mb-8">
        Company Dashboard
      </h1>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        {/* ================= RFQ FORM ================= */}
        <div className="bg-white rounded-2xl shadow p-6 space-y-6">
          <h2 className="text-xl font-semibold text-slate-800">
            Create Freight RFQ
          </h2>

          <Input
            label="Required Loading Date"
            type="date"
            value={form.loading_date}
            onChange={(e) =>
              setForm((f) => ({ ...f, loading_date: e.target.value }))
            }
          />

          <Select
            label="Movement Type"
            value={form.movement_type}
            onChange={(e) => {
              setForm((f) => ({ ...f, movement_type: e.target.value }));
            }}
          >
            <option value="">Select</option>
            <option value="PORT">Port Movement</option>
            <option value="UPCOUNTRY">Upcountry Dispatch</option>
          </Select>

          {form.movement_type === "PORT" && (
            <div className="border rounded-xl p-4 space-y-4 bg-slate-50">
              <h3 className="font-semibold text-indigo-600">Port Movement</h3>

              <Select
                label="Commodity"
                value={form.port_commodity}
                onChange={(e) =>
                  setForm((f) => ({ ...f, port_commodity: e.target.value }))
                }
              >
                <option>Preform</option>
                <option>Resin</option>
                <option>BOPET Film Roll</option>
                <option>Thermoforming</option>
                <option>Yarn</option>
                <option>Others</option>
              </Select>

              <div className="grid grid-cols-2 gap-4">
                <Select
                  label="Container Size"
                  value={form.container_size}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, container_size: e.target.value }))
                  }
                >
                  <option>20ft</option>
                  <option>40ft</option>
                </Select>

                <Input
                  label="Container Count"
                  value={form.container_count}
                  type="number"
                  onChange={(e) =>
                    setForm((f) => ({ ...f, container_count: e.target.value }))
                  }
                />
              </div>

              <Input
                label="Weight per Container (MT)"
                value={form.weight_per_container}
                type="number"
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    weight_per_container: e.target.value,
                  }))
                }
              />

              <Select
                label="Import / Export"
                value={form.import_export}
                onChange={(e) =>
                  setForm((f) => ({ ...f, import_export: e.target.value }))
                }
              >
                <option>Import</option>
                <option>Export</option>
              </Select>

              <Select
                label="Lane"
                value={form.port_lane}
                onChange={(e) =>
                  setForm((f) => ({ ...f, port_lane: e.target.value }))
                }
              >
                <option value="">Select Lane</option>
                {PORT_LANES.map((lane) => (
                  <option key={lane} value={lane}>
                    {lane}
                  </option>
                ))}
              </Select>

              <Input
                label="Cut-off / Demurrage Date"
                type="date"
                value={form.cutoff_date}
                onChange={(e) =>
                  setForm((f) => ({ ...f, cutoff_date: e.target.value }))
                }
              />

              <Textarea
                label="Special Instructions"
                value={form.special_instructions}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    special_instructions: e.target.value,
                  }))
                }
              />
            </div>
          )}

          {form.movement_type === "UPCOUNTRY" && (
            <div className="border rounded-xl p-4 space-y-4 bg-slate-50">
              <h3 className="font-semibold text-indigo-600">
                Upcountry Dispatch
              </h3>

              <Select
                label="Commodity"
                value={form.upcountry_commodity}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    upcountry_commodity: e.target.value,
                  }))
                }
              >
                <option>Preform</option>
                <option>Resin (25kg)</option>
                <option>BOPET Film Roll</option>
                <option>Thermoforming</option>
                <option>Yarn</option>
              </Select>

              <Select
                label="Truck Type"
                value={form.truck_type}
                onChange={(e) =>
                  setForm((f) => ({ ...f, truck_type: e.target.value }))
                }
              >
                <option>Container</option>
                <option>Flat Bed</option>
              </Select>

              <Select
                label="Bed Size"
                value={form.bed_size}
                onChange={(e) =>
                  setForm((f) => ({ ...f, bed_size: e.target.value }))
                }
              >
                <option>20ft</option>
                <option>40ft</option>
              </Select>

              <Input
                label="Total Weight (MT)"
                value={form.total_weight}
                type="number"
                onChange={(e) =>
                  setForm((f) => ({ ...f, total_weight: e.target.value }))
                }
              />

              <Select
                label="Lane"
                value={form.upcountry_lane}
                onChange={(e) =>
                  setForm((f) => ({ ...f, upcountry_lane: e.target.value }))
                }
              >
                <option value="">Select Lane</option>
                {UPCOUNTRY_LANES.map((lane) => (
                  <option key={lane} value={lane}>
                    {lane}
                  </option>
                ))}
              </Select>

              <Input
                label="Customer Name"
                value={form.customer_name}
                onChange={(e) =>
                  setForm((f) => ({ ...f, customer_name: e.target.value }))
                }
              />

              <Textarea
                label="Special Instructions"
                value={form.upcountry_instructions}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    upcountry_instructions: e.target.value,
                  }))
                }
              />
            </div>
          )}

          <button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full bg-indigo-600 text-white py-3 rounded-xl
                       hover:bg-indigo-700 transition font-medium"
          >
            {loading ? "Submitting RFQ..." : "Submit RFQ"}
          </button>
        </div>

        {/* ================= REQUESTS ================= */}
        <div className="bg-white rounded-2xl shadow p-6 overflow-y-auto max-h-[85vh]">
          <h2 className="text-xl font-semibold text-slate-900 mb-4">
            Submitted Requests
          </h2>

          {requests.length === 0 && (
            <p className="text-sm text-slate-500">No requests submitted yet.</p>
          )}

          {requests.map((r) => (
            <div
              key={r.id}
              className="border border-slate-200 rounded-xl p-4 mb-4 bg-slate-50"
            >
              {/* ===== HEADER ===== */}
              <div className="flex justify-between items-center mb-3">
                <span
                  className={`px-3 py-1 rounded-full text-xs font-semibold text-white
            ${r.movement_type === "PORT" ? "bg-indigo-600" : "bg-emerald-600"}`}
                >
                  {r.movement_type}
                </span>

                <button
                  onClick={() => handleDelete(r.id)}
                  className="text-sm text-red-600 hover:text-red-800 font-medium"
                >
                  Delete
                </button>
              </div>

              {/* ===== DATE ===== */}
              <p className="text-xs text-slate-500 mb-2">
                {new Date(r.created_at).toLocaleString()}
              </p>

              {/* ===== REQUEST TEXT ===== */}
              <p className="text-sm text-slate-900 leading-relaxed mb-4 whitespace-pre-line">
                {r.formatted_request_text || r.raw_request_text}
              </p>

              {/* ===== REPLIES ===== */}
              <p className="text-sm font-semibold text-slate-900 mb-2">
                Transporter Replies
              </p>

              {(!r.replies || r.replies.length === 0) && (
                <p className="text-sm text-slate-500 italic">No replies yet</p>
              )}

              {r.replies?.map((rep) => (
                <div
                  key={rep.id}
                  className="mt-2 bg-white border border-slate-200 rounded-lg p-3 text-sm"
                >
                  <span className="font-semibold text-indigo-700">
                    {rep.transporter_name}:
                  </span>{" "}
                  <span className="text-slate-800">
                    {rep.reply_text || rep.raw_reply_text}
                  </span>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
