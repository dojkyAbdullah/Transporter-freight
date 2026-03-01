import { NextResponse } from "next/server";
import { supabaseServer } from "../../lib/supabaseServer";
import { getUserRole, canCreateRequests } from "../../lib/getUserRole";
import { sendPushToUsers } from "../../lib/push";

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

  // Push: notify selected transporters (or all transporters if none selected)
  let transporterUserIds = targetIds;
  if (!transporterUserIds?.length) {
    const { data: transporters } = await supabaseServer
      .from("users")
      .select("id")
      .eq("role", "TRANSPORTER");
    transporterUserIds = (transporters || []).map((u) => u.id);
  }
  if (transporterUserIds.length > 0) {
    const movementLabel = movement_type === "PORT" ? "Port" : "Upcountry";
    const commodity = movement_type === "PORT" ? body.port_commodity : body.upcountry_commodity;
    sendPushToUsers(transporterUserIds, {
      title: "New freight request",
      body: `${movementLabel} – ${commodity || "New request"}. Open the app to view and submit your rate.`,
      url: "/transporter/dashboard",
      tag: "new-request",
    }).catch(() => {});
  }

  return NextResponse.json({ success: true });
}
