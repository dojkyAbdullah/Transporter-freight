"use client";

import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabaseClient";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

const ROLES = [
  { value: "ADMIN", label: "Admin" },
  { value: "INLAND_EXECUTIVE", label: "Inland Executive" },
  { value: "TRANSPORTER", label: "Transporter" },
];

export default function SignupPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [accessAllowed, setAccessAllowed] = useState(false);

  useEffect(() => {
    let mounted = true;
    async function checkAdmin() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!mounted) return;
      if (!session?.user) {
        router.replace("/auth/login");
        return;
      }
      const { data: user } = await supabase
        .from("users")
        .select("role")
        .eq("id", session.user.id)
        .single();
      if (!mounted) return;
      if (user?.role !== "ADMIN") {
        router.replace("/dashboard");
        return;
      }
      setAccessAllowed(true);
      setChecking(false);
    }
    checkAdmin();
    return () => { mounted = false; };
  }, [router]);

  const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const MIN_PASSWORD_LENGTH = 6;

  async function handleCreateUser(e) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const email = String(form.get("email") ?? "").trim();
    const password = String(form.get("password") ?? "");
    const name = String(form.get("name") ?? "").trim();
    const role = form.get("role");
    const company_name = String(form.get("company_name") ?? "").trim();
    const phone = String(form.get("phone") ?? "").trim();

    if (!name) {
      toast.error("Full name is required");
      return;
    }
    if (!email) {
      toast.error("Email is required");
      return;
    }
    if (!EMAIL_REGEX.test(email)) {
      toast.error("Please enter a valid email address");
      return;
    }
    if (!password) {
      toast.error("Password is required");
      return;
    }
    if (password.length < MIN_PASSWORD_LENGTH) {
      toast.error(`Password must be at least ${MIN_PASSWORD_LENGTH} characters`);
      return;
    }
    if (!role) {
      toast.error("Please select a role");
      return;
    }

    setLoading(true);
    const { data: auth } = await supabase.auth.getUser();
    const res = await fetch("/api/admin/create-user", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        created_by_user_id: auth.user.id,
        email,
        password,
        name,
        role,
        company_name: company_name || undefined,
        phone: phone || undefined,
      }),
    });

    const result = await res.json();
    setLoading(false);

    if (!res.ok) {
      toast.error(result.error || "Failed to create user");
      return;
    }

    e.currentTarget.reset();
    toast.success("User created successfully. They can log in with the email and password you set.");
  }

  if (checking) {
    return (
      <div className="min-h-dvh bg-slate-50 flex items-center justify-center p-4">
        <div className="text-slate-600 font-medium">Checking access...</div>
      </div>
    );
  }

  if (!accessAllowed) return null;

  return (
    <div className="min-h-dvh bg-linear-to-br from-slate-50 via-slate-50 to-blue-50/30 flex items-center justify-center p-4 sm:p-6">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-xl border border-slate-200/80 p-6 sm:p-8 space-y-6">
          <div className="text-center">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              Create new user
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Only admins can create user accounts.
            </p>
          </div>

          <form onSubmit={handleCreateUser} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Full name</label>
              <input
                name="name"
                required
                placeholder="Full name"
                className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-slate-900 bg-white text-base placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Email</label>
              <input
                name="email"
                type="email"
                required
                placeholder="user@company.com"
                className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-slate-900 bg-white text-base placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Password</label>
              <input
                name="password"
                type="password"
                required
                placeholder="Set a password for the user"
                className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-slate-900 bg-white text-base placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Role</label>
              <select name="role" required className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-slate-900 bg-white text-base placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow">
                {ROLES.map((r) => (
                  <option key={r.value} value={r.value}>{r.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Company name (optional)</label>
              <input
                name="company_name"
                placeholder="Company name"
                className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-slate-900 bg-white text-base placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Phone (optional, for WhatsApp alerts)</label>
              <input
                name="phone"
                type="tel"
                placeholder="e.g. 03001234567 or 923001234567"
                className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-slate-900 bg-white text-base placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 active:scale-[0.99] transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? "Creating..." : "Create user"}
            </button>
          </form>

          <div className="pt-2 border-t border-slate-100">
            <a
              href="/admin/dashboard"
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              ← Back to Admin dashboard
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
