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
    <div className="p-4 flex items-center justify-between">
      <p>Redirecting...</p>
      <button
        type="button"
        onClick={handleLogout}
        className="text-slate-600 hover:text-slate-900 font-medium text-sm"
      >
        Logout
      </button>
    </div>
  );
}
