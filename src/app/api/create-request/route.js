import { NextResponse } from "next/server";
import { supabaseServer } from "../../lib/supabaseServer";
import { getUserRole, canCreateRequests } from "../../lib/getUserRole";

export async function POST(req) {
  const body = await req.json();
  const { company_id, movement_type, caller_id } = body;

  if (!company_id || !movement_type) {
    return NextResponse.json(
      { error: "Invalid payload" },
      { status: 400 }
    );
  }

  const role = caller_id ? await getUserRole(caller_id) : null;
  if (!canCreateRequests(role)) {
    return NextResponse.json(
      { error: "Only Admin or Inland Executive can create inquiries" },
      { status: 403 }
    );
  }

  // 🧠 Create human-readable summary with all fields (NO AI)
  let formatted = "";

  if (movement_type === "PORT") {
    formatted = `
Port Movement | ${body.import_export || ""}
Commodity: ${body.port_commodity || ""}
Container count: ${body.container_count ?? ""}
Container size: ${body.container_size || ""}
Weight: ${body.weight_per_container ?? ""} MT / container
Lane: ${body.port_lane || ""}
Loading: ${body.loading_date || ""}
Cut-off: ${body.cutoff_date || ""}
Special instructions: ${body.special_instructions || "—"}
    `.trim();
  }

  if (movement_type === "UPCOUNTRY") {
    formatted = `
Upcountry Dispatch
Commodity: ${body.upcountry_commodity || ""}
Truck type: ${body.truck_type || ""}
Bed size: ${body.bed_size || ""}
Weight: ${body.total_weight ?? ""} MT
Lane: ${body.upcountry_lane || ""}
Customer: ${body.customer_name || ""}
Loading: ${body.loading_date || ""}
Special instructions: ${body.upcountry_instructions || "—"}
    `.trim();
  }

  const target_transporter_ids = body.target_transporter_ids;
  const targetIds =
    Array.isArray(target_transporter_ids) && target_transporter_ids.length > 0
      ? target_transporter_ids
      : null;

  const { data: inserted, error } = await supabaseServer
    .from("requests")
    .insert({
      company_id,
      movement_type,
      raw_request_text: JSON.stringify(body),
      formatted_request_text: formatted,
      form_data: body,
      target_transporter_ids: targetIds,
    })
    .select("id")
    .single();

  if (error) {
    console.error(error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true });
}
