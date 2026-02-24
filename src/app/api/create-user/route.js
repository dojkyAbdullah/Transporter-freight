import { NextResponse } from "next/server";
import { supabaseServer } from "../../lib/supabaseServer";

export async function POST(req) {
  const body = await req.json();

  const { id, name, email, role, company_name } = body;

  const allowedRoles = ["INLAND_EXECUTIVE", "TRANSPORTER"];
  if (!role || !allowedRoles.includes(role)) {
    return NextResponse.json(
      { error: "Invalid role. Signup only allows Inland Executive or Transporter." },
      { status: 400 }
    );
  }

  const { error } = await supabaseServer.from("users").insert({
    id,
    name,
    email,
    role,
    company_name,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ success: true });
}
