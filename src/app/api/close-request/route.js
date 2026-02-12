import { NextResponse } from "next/server";
import { supabaseServer } from "../../lib/supabaseServer";

export async function POST(req) {
  const { request_id, company_id, reference_number } =
    await req.json();

  if (!request_id || !company_id || !reference_number) {
    return NextResponse.json(
      { error: "Missing required fields" },
      { status: 400 }
    );
  }

  const { error } = await supabaseServer
    .from("requests")
    .update({
      status: "CLOSED",
      reference_number,
    })
    .eq("id", request_id)
    .eq("company_id", company_id);

  if (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true });
}
