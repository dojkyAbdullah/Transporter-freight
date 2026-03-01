"use client";

import { useState, useEffect } from "react";

export default function OfflineBanner() {
  const [isOnline, setIsOnline] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setIsOnline(typeof navigator !== "undefined" ? navigator.onLine : true);

    function setOnline() {
      setIsOnline(true);
    }
    function setOffline() {
      setIsOnline(false);
    }

    window.addEventListener("online", setOnline);
    window.addEventListener("offline", setOffline);
    return () => {
      window.removeEventListener("online", setOnline);
      window.removeEventListener("offline", setOffline);
    };
  }, []);

  if (!mounted || isOnline) return null;

  return (
    <>
      <div
        className="fixed top-0 left-0 right-0 z-[9999] bg-amber-500 text-slate-900 text-center py-2 px-4 text-sm font-medium shadow-md"
        role="status"
        aria-live="polite"
      >
        You’re offline. Some features may be limited. Data will sync when you’re back online.
      </div>
      <div className="h-10 shrink-0" aria-hidden />
    </>
  );
}
