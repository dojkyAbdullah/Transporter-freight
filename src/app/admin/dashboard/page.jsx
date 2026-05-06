"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabaseClient";
import toast from "react-hot-toast";

const ROLES = [
  { value: "ADMIN", label: "Admin" },
  { value: "INLAND_EXECUTIVE", label: "Inland Executive" },
  { value: "TRANSPORTER", label: "Transporter" },
];

const ROLE_BADGE = {
  ADMIN: "bg-amber-100 text-amber-800",
  INLAND_EXECUTIVE: "bg-sky-100 text-sky-800",
  TRANSPORTER: "bg-blue-100 text-blue-800",
};

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

/* ── Edit User Modal ───────────────────────────────────────────── */
function EditUserModal({ user, currentUserId, onClose, onSaved }) {
  const [form, setForm] = useState({
    name: user.name ?? "",
    role: user.role ?? "TRANSPORTER",
    company_name: user.company_name ?? "",
    phone: user.phone ?? "",
  });
  const [saving, setSaving] = useState(false);

  async function handleSave(e) {
    e.preventDefault();
    if (!form.name.trim()) {
      toast.error("Full name is required");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/users/${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          caller_id: currentUserId,
          name: form.name,
          role: form.role,
          company_name: form.company_name,
          phone: form.phone,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Failed to update user");
        return;
      }
      toast.success("User updated successfully");
      onSaved(data.user);
      onClose();
    } finally {
      setSaving(false);
    }
  }

  return (
    /* Backdrop */
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: "rgba(15,23,42,0.45)", backdropFilter: "blur(4px)" }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      {/* Modal card */}
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Edit User</h2>
            <p className="text-xs text-slate-500 mt-0.5 truncate max-w-[18rem]">{user.email}</p>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors"
            aria-label="Close"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSave} className="px-6 py-5 space-y-4">
          <Input
            label="Full Name"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            required
          />

          {/* Role selector — highlighted as the primary action */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-700">Role</label>
            <div className="flex gap-2 flex-wrap">
              {ROLES.map((r) => (
                <button
                  key={r.value}
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, role: r.value }))}
                  className={`px-4 py-2 rounded-xl text-sm font-medium border transition-all ${
                    form.role === r.value
                      ? r.value === "ADMIN"
                        ? "bg-amber-500 text-white border-amber-500 shadow-sm"
                        : r.value === "INLAND_EXECUTIVE"
                        ? "bg-sky-500 text-white border-sky-500 shadow-sm"
                        : "bg-blue-600 text-white border-blue-600 shadow-sm"
                      : "bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                  }`}
                >
                  {r.label}
                </button>
              ))}
            </div>
          </div>

          <Input
            label="Company Name (optional)"
            value={form.company_name}
            onChange={(e) => setForm((f) => ({ ...f, company_name: e.target.value }))}
          />

          <Input
            label="Phone (optional)"
            type="tel"
            placeholder="e.g. 03001234567"
            value={form.phone}
            onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
          />

          {/* Actions */}
          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-sm font-medium hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-60"
            >
              {saving ? "Saving…" : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ── Main Admin Dashboard ──────────────────────────────────────── */
export default function AdminDashboard() {
  const router = useRouter();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [editingUser, setEditingUser] = useState(null);

  // Search / filter / pagination
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL"); // ALL | ADMIN | INLAND_EXECUTIVE | TRANSPORTER
  const PAGE_SIZE = 10;
  const [page, setPage] = useState(1);

  const [form, setForm] = useState({
    email: "",
    password: "",
    name: "",
    role: "INLAND_EXECUTIVE",
    company_name: "",
    phone: "",
  });

  const fetchUsers = useCallback(async (uid) => {
    const id = uid ?? currentUserId;
    if (!id) return;
    const res = await fetch(`/api/admin/users?caller_id=${id}`);
    if (res.ok) setUsers(await res.json());
  }, [currentUserId]);

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
        () => fetchUsers()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUserId, fetchUsers]);

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

    if (!name) { toast.error("Full name is required"); return; }
    if (!email) { toast.error("Email is required"); return; }
    if (!EMAIL_REGEX.test(email)) { toast.error("Please enter a valid email address"); return; }
    if (!password) { toast.error("Password is required"); return; }
    if (password.length < MIN_PASSWORD_LENGTH) {
      toast.error(`Password must be at least ${MIN_PASSWORD_LENGTH} characters`);
      return;
    }
    if (!role) { toast.error("Please select a role"); return; }

    setCreating(true);
    const { data: auth } = await supabase.auth.getUser();
    const res = await fetch("/api/admin/create-user", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ created_by_user_id: auth.user.id, ...form }),
    });
    const data = await res.json();
    setCreating(false);
    if (!res.ok) {
      toast.error(data.error || "Failed to create user");
      return;
    }
    setForm({ email: "", password: "", name: "", role: "INLAND_EXECUTIVE", company_name: "", phone: "" });
    fetchUsers();
    toast.success("User created successfully");
  }

  /** Called by modal when save succeeds — patch local state immediately */
  function handleUserSaved(updatedUser) {
    setUsers((prev) =>
      prev.map((u) => (u.id === updatedUser.id ? updatedUser : u))
    );
  }

  // Derived: filtered + searched users
  const filteredUsers = useMemo(() => {
    const q = search.trim().toLowerCase();
    return users.filter((u) => {
      const matchesRole = roleFilter === "ALL" || u.role === roleFilter;
      const matchesSearch =
        !q ||
        u.name?.toLowerCase().includes(q) ||
        u.email?.toLowerCase().includes(q) ||
        u.company_name?.toLowerCase().includes(q) ||
        u.phone?.includes(q);
      return matchesRole && matchesSearch;
    });
  }, [users, search, roleFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / PAGE_SIZE));
  const pagedUsers = filteredUsers.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  // Reset to page 1 whenever filter/search changes
  useEffect(() => { setPage(1); }, [search, roleFilter]);

  const FILTER_TABS = [
    { value: "ALL", label: "All" },
    { value: "ADMIN", label: "Admin", color: "amber" },
    { value: "INLAND_EXECUTIVE", label: "Executives", color: "sky" },
    { value: "TRANSPORTER", label: "Transporters", color: "blue" },
  ];

  const TAB_ACTIVE = {
    ALL: "bg-slate-800 text-white",
    ADMIN: "bg-amber-500 text-white",
    INLAND_EXECUTIVE: "bg-sky-500 text-white",
    TRANSPORTER: "bg-blue-600 text-white",
  };

  function roleCounts(role) {
    if (role === "ALL") return users.length;
    return users.filter((u) => u.role === role).length;
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
            <Input
              label="Phone (optional, for WhatsApp alerts)"
              type="tel"
              placeholder="e.g. 03001234567 or 923001234567"
              value={form.phone}
              onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
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
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4 sm:p-6 flex flex-col gap-4 max-h-[90vh]">
          {/* Header */}
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <h2 className="text-lg sm:text-xl font-semibold text-slate-900">
              Users &amp; Roles
              <span className="ml-2 text-sm font-normal text-slate-400">
                ({filteredUsers.length}{filteredUsers.length !== users.length ? ` of ${users.length}` : ""})
              </span>
            </h2>
          </div>

          {/* Search bar */}
          <div className="relative">
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none"
              fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round"
                d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
            </svg>
            <input
              type="search"
              placeholder="Search by name, email, company or phone…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                aria-label="Clear search"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>

          {/* Role filter tabs */}
          <div className="flex gap-1.5 flex-wrap">
            {FILTER_TABS.map((tab) => (
              <button
                key={tab.value}
                type="button"
                onClick={() => setRoleFilter(tab.value)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all border ${
                  roleFilter === tab.value
                    ? TAB_ACTIVE[tab.value] + " border-transparent shadow-sm"
                    : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                }`}
              >
                {tab.label}
                <span className={`ml-1.5 px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                  roleFilter === tab.value ? "bg-white/25 text-white" : "bg-slate-100 text-slate-500"
                }`}>
                  {roleCounts(tab.value)}
                </span>
              </button>
            ))}
          </div>

          {/* List */}
          {loading ? (
            <p className="text-slate-500">Loading...</p>
          ) : pagedUsers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <svg className="w-10 h-10 text-slate-300 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M15 19l-7-7 7-7" />
              </svg>
              <p className="text-slate-500 text-sm">No users match your filters.</p>
              <button onClick={() => { setSearch(""); setRoleFilter("ALL"); }}
                className="mt-2 text-blue-600 text-xs hover:underline">
                Clear filters
              </button>
            </div>
          ) : (
            <div className="space-y-2.5 overflow-y-auto flex-1">
              {pagedUsers.map((u) => (
                <div
                  key={u.id}
                  className="border border-slate-200 rounded-xl p-4 bg-slate-50/80 hover:bg-white transition-colors"
                >
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2">
                    <div className="min-w-0">
                      <p className="font-medium text-slate-900 truncate">{u.name}</p>
                      <p className="text-sm text-slate-600 break-all">{u.email}</p>
                      {u.company_name && (
                        <p className="text-xs text-slate-500">{u.company_name}</p>
                      )}
                      {u.phone && (
                        <p className="text-xs text-slate-500">📱 {u.phone}</p>
                      )}
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span
                        className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                          ROLE_BADGE[u.role] ?? "bg-slate-100 text-slate-700"
                        }`}
                      >
                        {u.role.replace("_", " ")}
                      </span>

                      {/* Edit button */}
                      <button
                        type="button"
                        onClick={() => setEditingUser(u)}
                        title="Edit user"
                        className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round"
                            d="M16.862 3.487a2.25 2.25 0 113.182 3.182L7.5 19.213l-4.5 1.25 1.25-4.5L16.862 3.487z" />
                        </svg>
                      </button>
                    </div>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">
                    {new Date(u.created_at).toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-2 border-t border-slate-100">
              <p className="text-xs text-slate-500">
                Page {page} of {totalPages} &mdash; {filteredUsers.length} user{filteredUsers.length !== 1 ? "s" : ""}
              </p>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setPage(1)}
                  disabled={page === 1}
                  className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 disabled:opacity-30 transition"
                  title="First page"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M11 19l-7-7 7-7M18 19l-7-7 7-7" />
                  </svg>
                </button>
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 disabled:opacity-30 transition"
                  title="Previous"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                  </svg>
                </button>

                {/* Page number pills */}
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter((n) => n === 1 || n === totalPages || Math.abs(n - page) <= 1)
                  .reduce((acc, n, idx, arr) => {
                    if (idx > 0 && n - arr[idx - 1] > 1) acc.push("…");
                    acc.push(n);
                    return acc;
                  }, [])
                  .map((item, i) =>
                    item === "…" ? (
                      <span key={`ellipsis-${i}`} className="px-1 text-slate-400 text-xs">…</span>
                    ) : (
                      <button
                        key={item}
                        onClick={() => setPage(item)}
                        className={`w-7 h-7 rounded-lg text-xs font-medium transition ${
                          page === item
                            ? "bg-blue-600 text-white shadow-sm"
                            : "text-slate-600 hover:bg-slate-100"
                        }`}
                      >
                        {item}
                      </button>
                    )
                  )}

                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 disabled:opacity-30 transition"
                  title="Next"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </button>
                <button
                  onClick={() => setPage(totalPages)}
                  disabled={page === totalPages}
                  className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 disabled:opacity-30 transition"
                  title="Last page"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 5l7 7-7 7M6 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Edit User Modal */}
      {editingUser && (
        <EditUserModal
          user={editingUser}
          currentUserId={currentUserId}
          onClose={() => setEditingUser(null)}
          onSaved={handleUserSaved}
        />
      )}
    </div>
  );
}
