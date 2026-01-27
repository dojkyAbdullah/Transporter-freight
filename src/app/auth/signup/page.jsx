"use client";

import { useState } from "react";
import { supabase } from "../../lib/supabaseClient";
import { useRouter } from "next/navigation";

export default function SignupPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleSignup(e) {
    e.preventDefault();
    setLoading(true);

    const form = new FormData(e.currentTarget);

    const email = form.get("email");
    const password = form.get("password");
    const name = form.get("name");
    const role = form.get("role");
    const company_name = form.get("company_name");

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      alert(error.message);
      setLoading(false);
      return;
    }

    await fetch("/api/create-user", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: data.user?.id,
        name,
        email,
        role,
        company_name,
      }),
    });

    router.push("/auth/login");
  }
return (
  <div className="min-h-screen flex items-center justify-center bg-slate-100">
    <form
      onSubmit={handleSignup}
      className="w-full max-w-md bg-white p-8 rounded-xl shadow-lg space-y-5 text-slate-900"
    >
      <h1 className="text-2xl font-bold text-center text-slate-900">
        Create Account
      </h1>

      <input
        name="name"
        placeholder="Full Name"
        required
        className="w-full border border-slate-300 rounded px-3 py-2 text-slate-800
                   placeholder-slate-400 focus:outline-none focus:ring-2
                   focus:ring-blue-500 focus:border-blue-500"
      />

      <input
        name="email"
        type="email"
        placeholder="Email"
        required
        className="w-full border border-slate-300 rounded px-3 py-2 text-slate-800
                   placeholder-slate-400 focus:outline-none focus:ring-2
                   focus:ring-blue-500 focus:border-blue-500"
      />

      <input
        name="password"
        type="password"
        placeholder="Password"
        required
        className="w-full border border-slate-300 rounded px-3 py-2 text-slate-800
                   placeholder-slate-400 focus:outline-none focus:ring-2
                   focus:ring-blue-500 focus:border-blue-500"
      />

      <select
        name="role"
        required
        className="w-full border border-slate-300 rounded px-3 py-2 text-slate-800
                   focus:outline-none focus:ring-2 focus:ring-blue-500
                   focus:border-blue-500 bg-white"
      >
        <option value="">Select Role</option>
        <option value="COMPANY">Company</option>
        <option value="TRANSPORTER">Transporter</option>
      </select>

      <input
        name="company_name"
        placeholder="Company Name (optional)"
        className="w-full border border-slate-300 rounded px-3 py-2 text-slate-800
                   placeholder-slate-400 focus:outline-none focus:ring-2
                   focus:ring-blue-500 focus:border-blue-500"
      />

      <button
        disabled={loading}
        className="w-full bg-indigo-600 cursor-pointer text-white py-2 rounded-md
                   hover:bg-indigo-700 transition disabled:opacity-60"
      >
        {loading ? "Creating account..." : "Sign Up"}
      </button>
    </form>
  </div>
);

}
