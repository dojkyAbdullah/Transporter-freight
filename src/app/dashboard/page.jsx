"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../lib/supabaseClient";

export default function DashboardRedirect() {
  const router = useRouter();

  useEffect(() => {
    async function checkRole() {
      const { data: auth } = await supabase.auth.getUser();

      if (!auth?.user) {
        router.replace("/auth/login");
        return;
      }

      const { data: user } = await supabase
        .from("users")
        .select("role")
        .eq("id", auth.user.id)
        .single();

      if (user?.role === "ADMIN") {
        router.replace("/admin/dashboard");
      } else if (user?.role === "INLAND_EXECUTIVE" || user?.role === "COMPANY") {
        router.replace("/company/dashboard");
      } else if (user?.role === "TRANSPORTER") {
        router.replace("/transporter/dashboard");
      } else {
        router.replace("/auth/login");
      }
    }

    checkRole();
  }, [router]);

  async function handleLogout() {
    await supabase.auth.signOut();
    router.replace("/auth/login");
  }

  return (
    <div className="min-h-dvh bg-slate-50 flex flex-col items-center justify-center p-4 sm:p-6 dashboard-container">
      <div className="flex flex-col sm:flex-row items-center justify-between w-full max-w-md gap-4">
        <p className="text-slate-600 text-base sm:text-lg">Redirecting...</p>
        <button
          type="button"
          onClick={handleLogout}
          className="w-full sm:w-auto px-4 py-2.5 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 font-medium text-sm transition-colors"
        >
          Logout
        </button>
      </div>
    </div>
  );
}
