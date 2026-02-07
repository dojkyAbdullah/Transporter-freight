import { NextResponse } from "next/server";
import { supabaseServer } from "../../lib/supabaseServer";
import { appendRatesToSheet } from "../../lib/googleSheets";

export async function POST(req) {
  const { request_id, transporter_id, rate_pkr, availability_date, remarks } =
    await req.json();

  const { data: transporter } = await supabaseServer
    .from("users")
    .select("name")
    .eq("id", transporter_id)
    .single();

  const { data: request, error: requestError } = await supabaseServer
    .from("requests")
    .select("*")
    .eq("id", request_id)
    .single();

  if (requestError || !request) {
    console.error("REQUEST NOT FOUND", request_id, requestError);
    return NextResponse.json({ error: "Request not found" }, { status: 400 });
  }

const form = request.form_data || {};

const lane =
  request.movement_type === "PORT"
    ? form.port_lane
    : form.upcountry_lane;

const commodity =
  request.movement_type === "PORT"
    ? form.port_commodity
    : form.upcountry_commodity;

const vehicle_type =
  request.movement_type === "PORT"
    ? form.container_size
      ? `Container ${form.container_size}`
      : "Container"
    : `${form.truck_type}${form.bed_size ? ` ${form.bed_size}` : ""}`;

const weight =
  request.movement_type === "PORT"
    ? form.weight_per_container
    : form.total_weight;


  // =========================

  // UPSERT transporter reply
await supabaseServer
  .from("transporter_replies")
  .upsert(
    {
      request_id,
      transporter_id,
      rate_pkr,
      availability_date,
      remarks,
    },
    {
      onConflict: "request_id,transporter_id",
    }
  );


  // PUSH TO GOOGLE SHEETS
  await appendRatesToSheet([
    {
      request_id: request.id,
      company_id: request.company_id,
      movement_type: request.movement_type,

      lane,
      commodity,
      vehicle_type,
      weight,

      transporter_id,
      transporter_name: transporter.name,
      rate_pkr,
      availability_date,
      remarks,

      updated_at: new Date().toISOString(),
    },
  ]);

  return NextResponse.json({ success: true });
}
