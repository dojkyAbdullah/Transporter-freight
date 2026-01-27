import { NextResponse } from "next/server";
import { supabaseServer } from "../../lib/supabaseServer";
import { formatRequestWithGemini } from "../../lib/gemini";
import { sendBroadcastEmail } from "../../lib/email";

export async function POST(req) {
  const { message, company_id } = await req.json();

  if (!company_id || !message) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  // 1️⃣ Format request with Gemini
  const formatted = await formatRequestWithGemini(message);

  // 2️⃣ Get company info
  const { data: company } = await supabaseServer
    .from("users")
    .select("name, company_name")
    .eq("id", company_id)
    .single();

  // 3️⃣ Save request
  const { data: request, error } = await supabaseServer
    .from("requests")
    .insert({
      company_id,
      raw_request_text: message,
      formatted_request_text: formatted,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // 4️⃣ Fetch all transporters
  const { data: transporters } = await supabaseServer
    .from("users")
    .select("email")
    .eq("role", "TRANSPORTER");

  // 5️⃣ Send email to each transporter (fire-and-forget)
  for (const t of transporters || []) {
    if (!t.email) continue;

    sendBroadcastEmail({
      to: t.email,
      companyName: company?.company_name || company?.name,
      requestText: formatted,
    }).catch(console.error);
  }

  return NextResponse.json({ success: true });
}
