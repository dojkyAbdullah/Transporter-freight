"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "./lib/supabaseClient";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    async function checkAuth() {
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

    checkAuth();
  }, [router]);

  return (
    <div className="min-h-dvh bg-slate-50 flex flex-col items-center justify-center p-4 sm:p-6 dashboard-container">
      <p className="text-slate-600 text-base sm:text-lg">Redirecting...</p>
    </div>
  );
}
