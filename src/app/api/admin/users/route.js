import { NextResponse } from "next/server";
import { supabaseServer } from "../../../lib/supabaseServer";
import { getUserRole, isAdmin } from "../../../lib/getUserRole";

export async function GET(req) {
  const callerId = req.nextUrl.searchParams.get("caller_id");
  if (!callerId) {
    return NextResponse.json(
      { error: "caller_id required" },
      { status: 400 }
    );
  }

  const callerRole = await getUserRole(callerId);
  if (!isAdmin(callerRole)) {
    return NextResponse.json(
      { error: "Only Admin can list users" },
      { status: 403 }
    );
  }

  const { data: users, error } = await supabaseServer
    .from("users")
    .select("id, name, email, role, company_name, phone, created_at")
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json(users || []);
}
