import { NextResponse } from "next/server";
import { supabaseServer } from "../../lib/supabaseServer";
import { getUserRole, isAdmin } from "../../lib/getUserRole";

export async function GET(req) {
  const company_id = req.nextUrl.searchParams.get("company_id");
  const caller_id = req.nextUrl.searchParams.get("caller_id");
  const get_all = req.nextUrl.searchParams.get("get_all") === "true";

  const callerRole = caller_id ? await getUserRole(caller_id) : null;
  const adminRequestingAll = get_all && isAdmin(callerRole);

  if (!adminRequestingAll && !company_id) {
    return NextResponse.json([], { status: 400 });
  }

  let query = supabaseServer
    .from("requests")
    .select(
      `
  id,
  movement_type,
  formatted_request_text,
  form_data,
  created_at,
  status,
  reference_number,
  company_id,
  transporter_allocations,
  transporter_replies (
    id,
    rate_pkr,
    availability_date,
    remarks,
    transporter_id
  )
`,
    )
    .order("created_at", { ascending: false });

  if (!adminRequestingAll) {
    query = query.eq("company_id", company_id);
  }

  const { data: requests, error } = await query;

  if (error || !requests) {
    console.error(error);
    return NextResponse.json([], { status: 500 });
  }

  // Fetch transporter names
  const transporterIds = [
    ...new Set(
      requests.flatMap((r) =>
        (r.transporter_replies || []).map((t) => t.transporter_id),
      ),
    ),
  ];

  let transporterMap = {};
  if (transporterIds.length) {
    const { data: users } = await supabaseServer
      .from("users")
      .select("id, name")
      .in("id", transporterIds);

    users?.forEach((u) => {
      transporterMap[u.id] = u.name;
    });
  }

  return NextResponse.json(
    requests.map((r) => ({
      id: r.id,
      company_id: r.company_id,
      movement_type: r.movement_type,
      formatted_request_text: r.formatted_request_text,
      form_data: r.form_data || null,
      created_at: r.created_at,
      status: r.status,
      reference_number: r.reference_number,
      transporter_allocations: r.transporter_allocations || null,
      replies: (r.transporter_replies || []).map((rep) => ({
        id: rep.id,
        transporter_id: rep.transporter_id,
        transporter_name: transporterMap[rep.transporter_id] || "Transporter",
        rate_pkr: rep.rate_pkr,
        availability_date: rep.availability_date,
        remarks: rep.remarks,
        reply_text: [
          rep.rate_pkr ? `Rate: PKR ${rep.rate_pkr}` : null,
          rep.availability_date ? `Available: ${rep.availability_date}` : null,
          rep.remarks ? `Remarks: ${rep.remarks}` : null,
        ]
          .filter(Boolean)
          .join(" | "),
      })),
    })),
  );
}
