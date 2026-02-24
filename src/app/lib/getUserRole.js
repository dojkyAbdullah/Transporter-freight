import { supabaseServer } from "./supabaseServer";

/**
 * Get role for a user id. Returns null if user not found.
 * @param {string} userId - auth user id
 * @returns {Promise<string|null>} - 'ADMIN' | 'INLAND_EXECUTIVE' | 'TRANSPORTER' | null
 */
export async function getUserRole(userId) {
  if (!userId) return null;
  const { data } = await supabaseServer
    .from("users")
    .select("role")
    .eq("id", userId)
    .single();
  return data?.role ?? null;
}

export function isAdmin(role) {
  return role === "ADMIN";
}

export function canCreateRequests(role) {
  return role === "ADMIN" || role === "INLAND_EXECUTIVE";
}

export function canGiveQuotes(role) {
  return role === "TRANSPORTER";
}
