import { NextResponse } from "next/server";
import { supabaseServer } from "../../lib/supabaseServer";
import { getUserRole, canCreateRequests } from "../../lib/getUserRole";

export async function GET(req) {
  const caller_id = req.nextUrl.searchParams.get("caller_id");
  if (!caller_id) {
    return NextResponse.json(
      { error: "caller_id required" },
      { status: 400 }
    );
  }

  const role = await getUserRole(caller_id);
  if (!canCreateRequests(role)) {
    return NextResponse.json(
      { error: "Only Admin or Inland Executive can list transporters" },
      { status: 403 }
    );
  }

  const { data: users, error } = await supabaseServer
    .from("users")
    .select("id, name, email, company_name")
    .eq("role", "TRANSPORTER")
    .order("name");

  if (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json(users || []);
}
