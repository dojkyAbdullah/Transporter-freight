import { NextResponse } from "next/server";
import { supabaseServer } from "../../lib/supabaseServer";

export async function GET(req) {
  const transporter_id =
    req.nextUrl.searchParams.get("transporter_id");

  if (!transporter_id) {
    return NextResponse.json([], { status: 400 });
  }

  // Fetch all requests
  const { data: requests } = await supabaseServer
    .from("requests")
    .select("id, formatted_request_text, created_at")
    .order("created_at", { ascending: false });

  // Fetch replies by this transporter
  const { data: replies } = await supabaseServer
    .from("transporter_replies")
    .select("request_id")
    .eq("transporter_id", transporter_id);

  const repliedRequestIds = new Set(
    (replies || []).map((r) => r.request_id)
  );

  return NextResponse.json(
    (requests || []).map((r) => ({
      ...r,
      alreadyReplied: repliedRequestIds.has(r.id),
    }))
  );
}
