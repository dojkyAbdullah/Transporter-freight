import { NextResponse } from "next/server";
import { supabaseServer } from "../../lib/supabaseServer";
import { getUserRole, isAdmin, canCreateRequests } from "../../lib/getUserRole";

function getRequestedTotal(request) {
  if (!request?.form_data) return 1;
  const fd = request.form_data;
  if (request.movement_type === "PORT") {
    const n = parseInt(fd.container_count, 10);
    return Number.isFinite(n) && n > 0 ? n : 1;
  }
  if (request.movement_type === "UPCOUNTRY") {
    return Infinity; // Open allocation: no fixed count
  }
  return 1;
}

export async function POST(req) {
  const { request_id, company_id, reference_number, caller_id, transporter_allocations } =
    await req.json();

  if (!request_id || !reference_number) {
    return NextResponse.json(
      { error: "Missing required fields: request_id, reference_number" },
      { status: 400 }
    );
  }

  const role = caller_id ? await getUserRole(caller_id) : null;
  const canAct = isAdmin(role) || (canCreateRequests(role) && company_id === caller_id);
  if (!canAct) {
    return NextResponse.json(
      { error: "Not allowed to close this request" },
      { status: 403 }
    );
  }

  const { data: request, error: fetchErr } = await supabaseServer
    .from("requests")
    .select("id, movement_type, form_data")
    .eq("id", request_id)
    .single();

  if (fetchErr || !request) {
    return NextResponse.json(
      { error: "Request not found" },
      { status: 404 }
    );
  }

  const requestedTotal = getRequestedTotal(request);
  const allocations = Array.isArray(transporter_allocations)
    ? transporter_allocations.filter(
        (a) => a && a.transporter_id && Number(a.allocated_count) > 0
      )
    : [];

  const totalAllocated = allocations.reduce(
    (sum, a) => sum + (Number(a.allocated_count) || 0),
    0
  );

  if (request.movement_type === "PORT" && totalAllocated > requestedTotal) {
    return NextResponse.json(
      {
        error: `Total allocated (${totalAllocated}) cannot exceed requested count (${requestedTotal}).`,
      },
      { status: 400 }
    );
  }

  const normalizedAllocations = allocations.map((a) => ({
    transporter_id: a.transporter_id,
    allocated_count: Number(a.allocated_count) || 0,
  }));

  let query = supabaseServer
    .from("requests")
    .update({
      status: "CLOSED",
      reference_number,
      transporter_allocations: normalizedAllocations,
    })
    .eq("id", request_id);
  if (!isAdmin(role)) {
    query = query.eq("company_id", company_id);
  }
  const { error } = await query;

  if (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true });
}
