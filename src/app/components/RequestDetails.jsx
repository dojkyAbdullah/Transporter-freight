"use client";

/**
 * Renders all request fields consistently for Transporter, Inland Executive, and Admin dashboards.
 * Uses form_data when available so every field (e.g. container size, special instructions) is visible.
 */
function Field({ label, value }) {
  const v = value ?? "";
  return (
    <p className="text-sm text-slate-700 break-words">
      <span className="font-medium text-slate-800">{label}:</span>{" "}
      {String(v).trim() || "—"}
    </p>
  );
}

export default function RequestDetails({ movement_type, form_data, formatted_request_text }) {
  if (form_data && movement_type === "PORT") {
    return (
      <div className="space-y-1.5 text-slate-700">
        <Field label="Movement" value="Port" />
        <Field label="Import / Export" value={form_data.import_export} />
        <Field label="Commodity" value={form_data.port_commodity} />
        <Field label="Container count" value={form_data.container_count} />
        <Field label="Container size" value={form_data.container_size} />
        <Field label="Weight (MT per container)" value={form_data.weight_per_container} />
        <Field label="Lane" value={form_data.port_lane} />
        <Field label="Loading date" value={form_data.loading_date} />
        <Field label="Cut-off date" value={form_data.cutoff_date} />
        <Field label="Special instructions" value={form_data.special_instructions} />
      </div>
    );
  }

  if (form_data && movement_type === "UPCOUNTRY") {
    return (
      <div className="space-y-1.5 text-slate-700">
        <Field label="Movement" value="Upcountry" />
        <Field label="Commodity" value={form_data.upcountry_commodity} />
        <Field label="Truck type" value={form_data.truck_type} />
        <Field label="Bed size" value={form_data.bed_size} />
        <Field label="Total weight (MT)" value={form_data.total_weight} />
        <Field label="Lane" value={form_data.upcountry_lane} />
        <Field label="Customer name" value={form_data.customer_name} />
        <Field label="Loading date" value={form_data.loading_date} />
        <Field label="Special instructions" value={form_data.upcountry_instructions} />
      </div>
    );
  }

  return (
    <p className="text-sm text-slate-700 whitespace-pre-line">
      {formatted_request_text || "—"}
    </p>
  );
}
