import { NextResponse } from "next/server";
import { supabaseServer } from "../../lib/supabaseServer";

export async function POST(req) {
  const body = await req.json();
  const { company_id, movement_type } = body;

  if (!company_id || !movement_type) {
    return NextResponse.json(
      { error: "Invalid payload" },
      { status: 400 }
    );
  }

  // 🧠 Create human-readable summary (NO AI)
  let formatted = "";

  if (movement_type === "PORT") {
    formatted = `
Port Movement | ${body.import_export}
Commodity: ${body.port_commodity}
Container: ${body.container_count} x ${body.container_size}
Weight: ${body.weight_per_container} MT / container
Lane: ${body.port_lane}
Loading: ${body.loading_date}
Cut-off: ${body.cutoff_date}
    `.trim();
  }

  if (movement_type === "UPCOUNTRY") {
    formatted = `
Upcountry Dispatch
Commodity: ${body.upcountry_commodity}
Truck: ${body.truck_type} (${body.bed_size})
Weight: ${body.total_weight} MT
Lane: ${body.upcountry_lane}
Customer: ${body.customer_name}
Loading: ${body.loading_date}
    `.trim();
  }

  const { error } = await supabaseServer
    .from("requests")
    .insert({
      company_id,
      movement_type,
      raw_request_text: JSON.stringify(body),
      formatted_request_text: formatted,
      form_data: body, // ✅ full structured data
    });

  if (error) {
    console.error(error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true });
}
