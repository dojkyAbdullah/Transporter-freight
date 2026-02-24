import { NextResponse } from "next/server";
import { supabaseServer } from "../../lib/supabaseServer";

export async function GET(req) {
  const transporter_id = req.nextUrl.searchParams.get("transporter_id");

  if (!transporter_id) {
    return NextResponse.json([], { status: 400 });
  }

  const { data, error } = await supabaseServer
    .from("requests")
    .select(`
      id,
      movement_type,
      status,
      formatted_request_text,
      form_data,
      target_transporter_ids,
      created_at,
      transporter_replies (
        transporter_id,
        rate_pkr,
        availability_date,
        remarks
      )
    `)
    .order("created_at", { ascending: false });

  if (error) {
    console.error(error);
    return NextResponse.json([], { status: 500 });
  }

  const filtered =
    data == null
      ? []
      : data.filter((r) => {
          const ids = r.target_transporter_ids;
          if (ids == null || !Array.isArray(ids) || ids.length === 0) return true;
          return ids.includes(transporter_id);
        });

  const mapped = filtered.map((r) => {
    const myReply = r.transporter_replies?.find(
      (rep) => rep.transporter_id === transporter_id
    );

    return {
      id: r.id,
      movement_type: r.movement_type,
      status: r.status,
      formatted_request_text: r.formatted_request_text,
      form_data: r.form_data || null,
      created_at: r.created_at,
      my_reply: myReply || null,
    };
  });

  return NextResponse.json(mapped);
}
