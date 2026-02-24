import { NextResponse } from "next/server";
import { supabaseServer } from "../../lib/supabaseServer";
import { getUserRole, isAdmin, canCreateRequests } from "../../lib/getUserRole";

export async function POST(req) {
  const { request_id, company_id, caller_id } = await req.json();

  if (!request_id) {
    return NextResponse.json(
      { error: "Missing request_id" },
      { status: 400 }
    );
  }

  const role = caller_id ? await getUserRole(caller_id) : null;
  const canAct = isAdmin(role) || (canCreateRequests(role) && company_id === caller_id);
  if (!canAct) {
    return NextResponse.json(
      { error: "Not allowed to reopen this request" },
      { status: 403 }
    );
  }

  let query = supabaseServer
    .from("requests")
    .update({
      status: "OPEN",
      reference_number: null,
      transporter_allocations: null,
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
