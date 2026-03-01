"use client";

import { useEffect } from "react";

export default function OfflinePage() {
  useEffect(() => {
    if (typeof window !== "undefined" && navigator.onLine) {
      window.history.back();
    }
  }, []);

  return (
    <div className="min-h-dvh bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
      <div className="max-w-sm space-y-4">
        <div className="text-6xl">📡</div>
        <h1 className="text-xl font-bold text-slate-900">You’re offline</h1>
        <p className="text-slate-600 text-sm">
          This page isn’t available right now. Check your connection and try again, or go back to use cached content.
        </p>
        <button
          type="button"
          onClick={() => window.history.back()}
          className="w-full py-3 px-4 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700"
        >
          Go back
        </button>
      </div>
    </div>
  );
}
