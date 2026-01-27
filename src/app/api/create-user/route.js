import { NextResponse } from "next/server";
import { supabaseServer } from "../../lib/supabaseServer";

export async function POST(req) {
  const body = await req.json();

  const { id, name, email, role, company_name } = body;

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
