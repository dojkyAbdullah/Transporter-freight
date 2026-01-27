import { NextResponse } from "next/server";
import { supabaseServer } from "../../lib/supabaseServer";
import { structureTransporterReply } from "../../lib/gemini";
import { appendRatesToSheet } from "../../lib/googleSheets";

export async function POST(req) {
  const { request_id, transporter_id, raw_reply_text } =
    await req.json();

  if (!request_id || !transporter_id || !raw_reply_text) {
    return NextResponse.json(
      { error: "Invalid payload" },
      { status: 400 }
    );
  }

  // 1️⃣ Save RAW reply
  const { data: reply, error } = await supabaseServer
    .from("transporter_replies")
    .insert({
      request_id,
      transporter_id,
      raw_reply_text,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }

  // 2️⃣ Get transporter name
  const { data: transporter } = await supabaseServer
    .from("users")
    .select("name")
    .eq("id", transporter_id)
    .single();

  const transporter_name = transporter?.name || "Transporter";



  // 3️⃣ AI structure reply
  const structuredRows =
    await structureTransporterReply(raw_reply_text);

  if (!structuredRows.length) {
    return NextResponse.json({ success: true });
  }

  // 4️⃣ Save structured rows in DB
  const rowsForDb = structuredRows.map((r) => ({
    transporter_response_id: reply.id,
    transporter_name,
    origin_city: r.origin_city,
    destination_city: r.destination_city,
    vehicle_type: r.vehicle_type,
    weight_tons: r.weight_tons,
    rate_pkr: r.rate_pkr,
    availability_date: r.availability_date,
    remarks: r.remarks,
  }));

  await supabaseServer.from("structured_rates").insert(rowsForDb);



  // 5️⃣ Push to Google Sheets
  await appendRatesToSheet(rowsForDb);

  return NextResponse.json({ success: true });
}
