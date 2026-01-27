import { NextResponse } from "next/server";
import { supabaseServer } from "../../lib/supabaseServer";

export async function GET(req) {
  const company_id = req.nextUrl.searchParams.get("company_id");

  if (!company_id) {
    return NextResponse.json([], { status: 400 });
  }

  // 1️⃣ Fetch requests with raw replies
  const { data: requests, error } = await supabaseServer
    .from("requests")
    .select(`
      id,
      formatted_request_text,
      created_at,
      transporter_replies (
        id,
        raw_reply_text,
        transporter_id
      )
    `)
    .eq("company_id", company_id)
    .order("created_at", { ascending: false });

  if (error || !requests) {
    return NextResponse.json([], { status: 500 });
  }

  // 2️⃣ Collect unique transporter IDs
  const transporterIds = new Set();
  for (const req of requests) {
    for (const reply of req.transporter_replies || []) {
      transporterIds.add(reply.transporter_id);
    }
  }

  // 3️⃣ Fetch transporter names in ONE query
  let transporterMap = {};
  if (transporterIds.size > 0) {
    const { data: users } = await supabaseServer
      .from("users")
      .select("id, name")
      .in("id", Array.from(transporterIds));

    for (const u of users || []) {
      transporterMap[u.id] = u.name;
    }
  }

  // 4️⃣ Build final response (NO mutation)
  const formattedRequests = requests.map((req) => ({
    id: req.id,
    formatted_request_text: req.formatted_request_text,
    created_at: req.created_at,
    replies: (req.transporter_replies || []).map((r) => ({
      id: r.id,
      raw_reply_text: r.raw_reply_text,
      transporter_id: r.transporter_id,
      transporter_name: transporterMap[r.transporter_id] || "Transporter",
    })),
  }));

  return NextResponse.json(formattedRequests);
}
