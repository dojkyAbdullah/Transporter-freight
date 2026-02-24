"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabaseClient";

const ROLES = [
  { value: "ADMIN", label: "Admin" },
  { value: "INLAND_EXECUTIVE", label: "Inland Executive" },
  { value: "TRANSPORTER", label: "Transporter" },
];

const Input = ({ label, ...props }) => (
  <div className="space-y-1">
    <label className="text-sm font-medium text-slate-700">{label}</label>
    <input
      {...props}
      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
    />
  </div>
);

const Select = ({ label, children, ...props }) => (
  <div className="space-y-1">
    <label className="text-sm font-medium text-slate-700">{label}</label>
    <select
      {...props}
      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
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

  async function fetchUsers() {
    if (!currentUserId) return;
    const res = await fetch(`/api/admin/users?caller_id=${currentUserId}`);
    if (res.ok) setUsers(await res.json());
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    router.replace("/auth/login");
  }

  async function handleCreateUser(e) {
    e.preventDefault();
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
      alert(data.error || "Failed to create user");
      return;
    }
    setForm({ email: "", password: "", name: "", role: "INLAND_EXECUTIVE", company_name: "" });
    fetchUsers();
  }

  if (currentUserId === null) {
    return <p className="p-4">Loading...</p>;
  }

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="flex flex-wrap justify-between items-center gap-4 mb-8">
        <h1 className="text-3xl font-bold text-slate-900">Admin Dashboard</h1>
        <div className="flex items-center gap-4">
          <a
            href="/company/dashboard"
            className="inline-flex items-center px-4 py-2 rounded-xl bg-indigo-600 text-white font-medium hover:bg-indigo-700 transition"
          >
            Create requests (Inland Executive)
          </a>
          <a
            href="/dashboard"
            className="text-slate-600 hover:text-slate-900 font-medium"
          >
            ← Back to app
          </a>
          <button
            type="button"
            onClick={handleLogout}
            className="text-slate-600 hover:text-slate-900 font-medium"
          >
            Logout
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        {/* Create user */}
        <div className="bg-white rounded-2xl shadow p-6 space-y-4">
          <h2 className="text-xl font-semibold text-slate-800">Create User / Role</h2>
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
              className="w-full bg-indigo-600 text-white py-3 rounded-xl hover:bg-indigo-700 transition font-medium disabled:opacity-60"
            >
              {creating ? "Creating..." : "Create User"}
            </button>
          </form>
        </div>

        {/* Users list */}
        <div className="bg-white rounded-2xl shadow p-6 overflow-y-auto max-h-[85vh]">
          <h2 className="text-xl font-semibold text-slate-900 mb-4">Users & Roles</h2>
          {loading ? (
            <p className="text-slate-500">Loading...</p>
          ) : (
            <div className="space-y-3">
              {users.map((u) => (
                <div
                  key={u.id}
                  className="border border-slate-200 rounded-xl p-4 bg-slate-50"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium text-slate-900">{u.name}</p>
                      <p className="text-sm text-slate-600">{u.email}</p>
                      {u.company_name && (
                        <p className="text-xs text-slate-500">{u.company_name}</p>
                      )}
                    </div>
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-semibold
                        ${u.role === "ADMIN" ? "bg-amber-100 text-amber-800" : ""}
                        ${u.role === "INLAND_EXECUTIVE" ? "bg-blue-100 text-blue-800" : ""}
                        ${u.role === "TRANSPORTER" ? "bg-green-100 text-green-800" : ""}`}
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
