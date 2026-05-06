import { NextResponse } from "next/server";
import { supabaseServer } from "../../../../lib/supabaseServer";
import { getUserRole, isAdmin } from "../../../../lib/getUserRole";

/** Normalize to digits only with country code (e.g. 923001234567). */
function normalizePhoneForWhatsApp(phone) {
  const digits = String(phone).replace(/\D/g, "");
  if (digits.length >= 12) return digits;
  if (digits.length === 11 && digits.startsWith("0")) return "92" + digits.slice(1);
  if (digits.length === 10 && digits.startsWith("3")) return "92" + digits;
  if (digits.length === 10) return "92" + digits;
  return digits || null;
}

export async function PATCH(req, { params }) {
  const { id: targetUserId } = await params;

  const body = await req.json();
  const { caller_id, name, role, company_name, phone, password } = body;

  if (!caller_id) {
    return NextResponse.json({ error: "caller_id required" }, { status: 400 });
  }

  if (!targetUserId) {
    return NextResponse.json({ error: "User id required" }, { status: 400 });
  }

  // Only ADMIN can edit users
  const callerRole = await getUserRole(caller_id);
  if (!isAdmin(callerRole)) {
    return NextResponse.json({ error: "Only Admin can edit users" }, { status: 403 });
  }

  const validRoles = ["ADMIN", "INLAND_EXECUTIVE", "TRANSPORTER"];
  if (role && !validRoles.includes(role)) {
    return NextResponse.json(
      { error: "Invalid role. Must be ADMIN, INLAND_EXECUTIVE, or TRANSPORTER" },
      { status: 400 }
    );
  }

  // ── Optional: update auth password ────────────────────────────
  if (password !== undefined && password !== "") {
    if (typeof password !== "string" || password.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters" },
        { status: 400 }
      );
    }
    const { error: pwError } = await supabaseServer.auth.admin.updateUserById(
      targetUserId,
      { password }
    );
    if (pwError) {
      return NextResponse.json({ error: pwError.message }, { status: 400 });
    }
  }

  // ── Update profile fields ───────────────────────────────────────
  // Build update payload — only include provided fields
  const updates = {};
  if (name !== undefined) updates.name = name.trim();
  if (role !== undefined) updates.role = role;
  if (company_name !== undefined) updates.company_name = company_name?.trim() || null;
  if (phone !== undefined) {
    updates.phone = phone ? normalizePhoneForWhatsApp(phone) : null;
  }

  // If only password was changed (no profile fields), return early with success
  if (Object.keys(updates).length === 0) {
    if (password) return NextResponse.json({ success: true, user: null });
    return NextResponse.json({ error: "No fields to update" }, { status: 400 });
  }

  const { data, error } = await supabaseServer
    .from("users")
    .update(updates)
    .eq("id", targetUserId)
    .select("id, name, email, role, company_name, phone, created_at")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, user: data });
}
