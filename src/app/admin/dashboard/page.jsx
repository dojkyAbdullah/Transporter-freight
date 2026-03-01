"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabaseClient";
import toast from "react-hot-toast";

const ROLES = [
  { value: "ADMIN", label: "Admin" },
  { value: "INLAND_EXECUTIVE", label: "Inland Executive" },
  { value: "TRANSPORTER", label: "Transporter" },
];

const Input = ({ label, ...props }) => (
  <div className="space-y-1.5">
    <label className="text-sm font-medium text-slate-700">{label}</label>
    <input
      {...props}
      className="w-full rounded-xl border border-slate-200 px-3 py-2.5 sm:py-2 text-slate-900 bg-white text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow"
    />
  </div>
);

const Select = ({ label, children, ...props }) => (
  <div className="space-y-1.5">
    <label className="text-sm font-medium text-slate-700">{label}</label>
    <select
      {...props}
      className="w-full rounded-xl border border-slate-200 px-3 py-2.5 sm:py-2 text-slate-900 bg-white text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow"
    >
      {children}
    </select>
  </div>
);

export default function AdminDashboard() {
  const router = useRouter();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [form, setForm] = useState({
    email: "",
    password: "",
    name: "",
    role: "INLAND_EXECUTIVE",
    company_name: "",
  });

  useEffect(() => {
    async function init() {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth?.user) {
        router.replace("/auth/login");
        return;
      }
      setCurrentUserId(auth.user.id);

      const { data: user } = await supabase
        .from("users")
        .select("role")
        .eq("id", auth.user.id)
        .single();

      if (user?.role !== "ADMIN") {
        router.replace("/dashboard");
        return;
      }

      const res = await fetch(`/api/admin/users?caller_id=${auth.user.id}`);
      if (res.ok) {
        const list = await res.json();
        setUsers(list);
      }
    }
    init();
  }, [router]);

  // Real-time: refetch users when users table changes
  useEffect(() => {
    if (!currentUserId) return;

    const channel = supabase
      .channel("admin-users-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "users" },
        () => {
          fetchUsers();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUserId]);

  async function fetchUsers() {
    if (!currentUserId) return;
    const res = await fetch(`/api/admin/users?caller_id=${currentUserId}`);
    if (res.ok) setUsers(await res.json());
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    router.replace("/auth/login");
  }

  const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const MIN_PASSWORD_LENGTH = 6;

  async function handleCreateUser(e) {
    e.preventDefault();
    const name = String(form.name ?? "").trim();
    const email = String(form.email ?? "").trim();
    const password = String(form.password ?? "");
    const role = form.role;

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

    setCreating(true);
    const { data: auth } = await supabase.auth.getUser();
    const res = await fetch("/api/admin/create-user", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        created_by_user_id: auth.user.id,
        ...form,
      }),
    });
    const data = await res.json();
    setCreating(false);
    if (!res.ok) {
      toast.error(data.error || "Failed to create user");
      return;
    }
    setForm({ email: "", password: "", name: "", role: "INLAND_EXECUTIVE", company_name: "" });
    fetchUsers();
    toast.success("User created successfully");
  }

  if (currentUserId === null) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <p className="text-slate-600">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-slate-50 dashboard-container p-4 sm:p-6 lg:p-8 pb-8 sm:pb-12">
      <header className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">Admin Dashboard</h1>
        <div className="flex flex-wrap items-center gap-2 sm:gap-4">
          <a
            href="/auth/signup"
            className="inline-flex items-center px-3 py-2 rounded-xl border border-blue-600 text-blue-600 hover:bg-blue-50 text-sm sm:text-base font-medium transition-colors"
          >
            Create user
          </a>
          <a
            href="/company/dashboard"
            className="inline-flex items-center px-3 py-2 sm:px-4 rounded-xl bg-blue-600 text-white text-sm sm:text-base font-medium hover:bg-blue-700 transition-colors"
          >
            Create requests (Inland Executive)
          </a>
          <a
            href="/dashboard"
            className="inline-flex items-center px-3 py-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 font-medium text-sm sm:text-base transition-colors"
          >
            ← Back to app
          </a>
          <button
            type="button"
            onClick={handleLogout}
            className="inline-flex items-center px-3 py-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 font-medium text-sm sm:text-base transition-colors"
          >
            Logout
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 lg:gap-8 max-w-[90rem]">
        {/* Create user */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4 sm:p-6 space-y-4">
          <h2 className="text-lg sm:text-xl font-semibold text-slate-800">Create User / Role</h2>
          <form onSubmit={handleCreateUser} className="space-y-4">
            <Input
              label="Full Name"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              required
            />
            <Input
              label="Email"
              type="email"
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              required
            />
            <Input
              label="Password"
              type="password"
              value={form.password}
              onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
              required
            />
            <Select
              label="Role"
              value={form.role}
              onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}
            >
              {ROLES.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </Select>
            <Input
              label="Company Name (optional)"
              value={form.company_name}
              onChange={(e) => setForm((f) => ({ ...f, company_name: e.target.value }))}
            />
            <button
              type="submit"
              disabled={creating}
              className="w-full bg-blue-600 text-white py-3 rounded-xl hover:bg-blue-700 transition font-medium disabled:opacity-60 text-base active:scale-[0.99]"
            >
              {creating ? "Creating..." : "Create User"}
            </button>
          </form>
        </div>

        {/* Users list */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4 sm:p-6 overflow-y-auto max-h-[70vh] sm:max-h-[75vh] lg:max-h-[85vh]">
          <h2 className="text-lg sm:text-xl font-semibold text-slate-900 mb-4">Users & Roles</h2>
          {loading ? (
            <p className="text-slate-500">Loading...</p>
          ) : (
            <div className="space-y-3">
              {users.map((u) => (
                <div
                  key={u.id}
                  className="border border-slate-200 rounded-xl p-4 bg-slate-50/80"
                >
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2">
                    <div className="min-w-0">
                      <p className="font-medium text-slate-900 truncate">{u.name}</p>
                      <p className="text-sm text-slate-600 break-all">{u.email}</p>
                      {u.company_name && (
                        <p className="text-xs text-slate-500">{u.company_name}</p>
                      )}
                    </div>
                    <span
                      className={`shrink-0 w-fit px-2.5 py-1 rounded-full text-xs font-semibold
                        ${u.role === "ADMIN" ? "bg-amber-100 text-amber-800" : ""}
                        ${u.role === "INLAND_EXECUTIVE" ? "bg-sky-100 text-sky-800" : ""}
                        ${u.role === "TRANSPORTER" ? "bg-blue-100 text-blue-800" : ""}`}
                    >
                      {u.role.replace("_", " ")}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">
                    {new Date(u.created_at).toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
