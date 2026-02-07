import { NextResponse } from "next/server";
import { supabaseServer } from "../../lib/supabaseServer";

export async function GET(req) {
  const company_id = req.nextUrl.searchParams.get("company_id");

  if (!company_id) {
    return NextResponse.json([], { status: 400 });
  }

  const { data: requests, error } = await supabaseServer
    .from("requests")
    .select(`
      id,
      movement_type,
      formatted_request_text,
      created_at,
      transporter_replies (
        id,
        rate_pkr,
        availability_date,
        remarks,
        transporter_id
      )
    `)
    .eq("company_id", company_id)
    .order("created_at", { ascending: false });

  if (error || !requests) {
    console.error(error);
    return NextResponse.json([], { status: 500 });
  }

  // Fetch transporter names
  const transporterIds = [
    ...new Set(
      requests.flatMap(r =>
        (r.transporter_replies || []).map(t => t.transporter_id)
      )
    ),
  ];

  let transporterMap = {};
  if (transporterIds.length) {
    const { data: users } = await supabaseServer
      .from("users")
      .select("id, name")
      .in("id", transporterIds);

    users?.forEach(u => {
      transporterMap[u.id] = u.name;
    });
  }

  return NextResponse.json(
    requests.map(r => ({
      id: r.id,
      movement_type: r.movement_type,
      formatted_request_text: r.formatted_request_text,
      created_at: r.created_at,
      replies: (r.transporter_replies || []).map(rep => ({
        id: rep.id,
        transporter_name:
          transporterMap[rep.transporter_id] || "Transporter",

        // 👇 Generated display text
        reply_text: [
          rep.rate_pkr ? `Rate: PKR ${rep.rate_pkr}` : null,
          rep.availability_date
            ? `Available: ${rep.availability_date}`
            : null,
          rep.remarks ? `Remarks: ${rep.remarks}` : null,
        ]
          .filter(Boolean)
          .join(" | "),
      })),
    }))
  );
}
