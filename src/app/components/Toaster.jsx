"use client";

import { Toaster as HotToaster } from "react-hot-toast";

export default function Toaster() {
  return (
    <HotToaster
      position="top-center"
      toastOptions={{
        duration: 4000,
        style: {
          background: "#1e293b",
          color: "#f8fafc",
          borderRadius: "12px",
        },
        success: {
          iconTheme: { primary: "#22c55e", secondary: "#f8fafc" },
        },
        error: {
          iconTheme: { primary: "#ef4444", secondary: "#f8fafc" },
        },
      }}
    />
  );
}
