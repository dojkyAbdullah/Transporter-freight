import { NextResponse } from "next/server";
import { supabaseServer } from "../../../lib/supabaseServer";
import { getUserRole, isAdmin } from "../../../lib/getUserRole";

/** Normalize to digits only with country code (e.g. 923001234567). Assumes Pakistan 92 if 10 digits. */
function normalizePhoneForWhatsApp(phone) {
  const digits = String(phone).replace(/\D/g, "");
  if (digits.length >= 11) return digits;
  if (digits.length === 10 && digits.startsWith("3")) return "92" + digits;
  if (digits.length === 10) return "92" + digits;
  return digits ? "92" + digits : null;
}

export async function POST(req) {
  const body = await req.json();
  const {
    created_by_user_id,
    email,
    password,
    name,
    role,
    company_name,
    phone,
  } = body;

  if (!created_by_user_id || !email || !password || !name || !role) {
    return NextResponse.json(
      { error: "Missing required fields: created_by_user_id, email, password, name, role" },
      { status: 400 }
    );
  }

  const validRoles = ["ADMIN", "INLAND_EXECUTIVE", "TRANSPORTER"];
  if (!validRoles.includes(role)) {
    return NextResponse.json(
      { error: "Invalid role. Must be ADMIN, INLAND_EXECUTIVE, or TRANSPORTER" },
      { status: 400 }
    );
  }

  const creatorRole = await getUserRole(created_by_user_id);
  if (!isAdmin(creatorRole)) {
    return NextResponse.json(
      { error: "Only Admin can create users" },
      { status: 403 }
    );
  }

  const { data: authData, error: authError } = await supabaseServer.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { name },
  });

  if (authError) {
    return NextResponse.json(
      { error: authError.message },
      { status: 400 }
    );
  }

  const newUserId = authData?.user?.id;
  if (!newUserId) {
    return NextResponse.json(
      { error: "Failed to create auth user" },
      { status: 500 }
    );
  }

  const { error: insertError } = await supabaseServer.from("users").insert({
    id: newUserId,
    name,
    email,
    role,
    company_name: company_name || null,
    phone: phone ? normalizePhoneForWhatsApp(phone) : null,
  });

  if (insertError) {
    return NextResponse.json(
      { error: insertError.message },
      { status: 400 }
    );
  }

  return NextResponse.json({
    success: true,
    user_id: newUserId,
    email,
    role,
  });
}
