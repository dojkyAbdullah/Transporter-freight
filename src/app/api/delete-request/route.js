import { NextResponse } from "next/server";
import { supabaseServer } from "../../lib/supabaseServer";

export async function DELETE(req) {
  const { request_id, company_id } = await req.json();

  if (!request_id || !company_id) {
    return NextResponse.json(
      { error: "Missing request_id or company_id" },
      { status: 400 }
    );
  }

  // ✅ Ensure company owns the request
  const { error } = await supabaseServer
    .from("requests")
    .delete()
    .eq("id", request_id)
    .eq("company_id", company_id);

 if (error) {
  console.error("Delete request error:", error);
  return NextResponse.json(
    { error: error.message },
    { status: 500 }
  );
}

  return NextResponse.json({ success: true });
}
